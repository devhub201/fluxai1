import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SYSTEM = `You are Fluxa Admin Copilot — an AI assistant for the platform admin/staff panel.
You help the admin run the Fluxa AI app: review users, draft announcements, plan new tools, write marketing copy, summarize moderation flags, suggest credit promos, and answer product questions.
Always respond in concise markdown. When the admin asks for a draft (email, announcement, changelog), output ready-to-publish copy.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: ud } = await userClient.auth.getUser();
    if (!ud?.user) return json({ error: "Please sign in" }, 401);

    const { data: isAdmin } = await userClient.rpc("is_admin");
    const { data: isStaff } = await userClient.rpc("is_staff");
    if (!isAdmin && !isStaff) return json({ error: "Admins or staff only" }, 403);

    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const prompt = String(body.prompt ?? "").slice(0, 4000);
    if (!prompt && messages.length === 0) return json({ error: "prompt required" }, 400);

    const chatMessages = [
      { role: "system", content: SYSTEM },
      ...messages.slice(-12),
      ...(prompt ? [{ role: "user", content: prompt }] : []),
    ];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: chatMessages }),
    });

    if (!r.ok) {
      if (r.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
      if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
      const t = await r.text();
      console.error("admin-ai gateway error", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return json({ text });
  } catch (e) {
    console.error("admin-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
