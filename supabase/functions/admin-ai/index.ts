import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const ALLOWED_MODELS = new Set([
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "openai/gpt-5.4",
  "openai/gpt-5.4-mini",
  "openai/gpt-5",
]);

const BASE_SYSTEM = `You are Fluxa Admin Copilot — the in-app AI for the platform admin & staff panel of Fluxa AI.

You can:
- Draft announcements, changelogs, marketing emails, push notifications, and tweets in ready-to-publish form.
- Brainstorm new AI tools with name, 1-line pitch, system prompt, and credit pricing.
- Plan credit promotions, retention campaigns, and onboarding flows.
- Summarize moderation flags, message activity, and user growth.
- Write SQL for the Postgres database when asked (read-only by default, mark destructive queries clearly).
- Explain product, billing, and policy questions to staff.
- Translate copy, rewrite for tone (friendly / professional / Hinglish), and proofread.
- Generate concise meeting notes, OKRs, and roadmaps.

Style rules:
- Always respond in clean markdown with short paragraphs, bullet lists, and code blocks where useful.
- When the admin asks for a draft, output ONLY the final copy (no preamble).
- When numbers are provided in the context block below, ground answers in those numbers.
- Never invent user emails, IDs, or private data. If unknown, say so.`;

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

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const prompt = String(body.prompt ?? "").slice(0, 8000);
    const context = String(body.context ?? "").slice(0, 6000);
    const mode = String(body.mode ?? "").slice(0, 80);
    const requested = String(body.model ?? "google/gemini-3-flash-preview");
    const model = ALLOWED_MODELS.has(requested) ? requested : "google/gemini-3-flash-preview";

    if (!prompt && messages.length === 0) return json({ error: "prompt required" }, 400);

    const system = [
      BASE_SYSTEM,
      mode ? `\nCurrent task mode: **${mode}**.` : "",
      context ? `\n--- Live platform context (use as ground truth) ---\n${context}\n--- end context ---` : "",
    ].join("");

    const chatMessages = [
      { role: "system", content: system },
      ...messages.slice(-16),
      ...(prompt ? [{ role: "user", content: prompt }] : []),
    ];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: chatMessages }),
    });

    if (!r.ok) {
      if (r.status === 429) return json({ error: "Rate limited. Try again soon." }, 429);
      if (r.status === 402) return json({ error: "AI credits exhausted. Add credits in Lovable Cloud." }, 402);
      const t = await r.text();
      console.error("admin-ai gateway error", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    return json({ text, model });
  } catch (e) {
    console.error("admin-ai error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
