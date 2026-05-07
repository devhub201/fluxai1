import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `tool-${Date.now()}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { prompt, answers } = await req.json();
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !LOVABLE_API_KEY) throw new Error("Backend is not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user?.id) return json({ error: "Please sign in again" }, 401);
    const { data: allowed } = await userClient.rpc("is_admin");
    if (allowed !== true) return json({ error: "Admin access required" }, 403);

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Create one AI tool spec as JSON only with fields: name, description, category, credits, placeholder, suggestions array, system_prompt. If info is missing, infer sensible defaults." },
          { role: "user", content: `Tool idea: ${prompt}\nAdmin answers: ${answers || "none"}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!ai.ok) return json({ error: "AI tool creator failed" }, 500);
    const parsed = JSON.parse((await ai.json())?.choices?.[0]?.message?.content ?? "{}");
    const name = String(parsed.name || prompt || "New AI Tool").slice(0, 80);
    const row = {
      tool_id: slugify(name),
      name,
      description: String(parsed.description || "Custom AI tool").slice(0, 220),
      category: String(parsed.category || "AI").slice(0, 60),
      credits: Math.max(1, Math.min(9999, Number(parsed.credits || 199))),
      icon: "Sparkles",
      placeholder: String(parsed.placeholder || "Describe what you want this tool to create...").slice(0, 180),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [],
      system_prompt: String(parsed.system_prompt || `You are ${name}. Help the user with high quality output.`),
      created_by: userData.user.id,
      is_active: true,
    };
    const { data, error } = await adminClient.from("custom_tools").upsert(row, { onConflict: "tool_id" }).select().single();
    if (error) throw error;
    return json({ tool: data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});