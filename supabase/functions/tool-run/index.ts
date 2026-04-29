import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  "code-generator":
    "You are an expert code generator. Return ONLY clean, production-ready code in a single fenced markdown code block with the correct language tag. Add brief comments inline. No prose outside the code block.",
  "website-builder":
    "You generate a single self-contained HTML5 page using TailwindCSS via CDN (<script src='https://cdn.tailwindcss.com'></script>). Dark, modern, responsive design. Return ONLY the full HTML inside a single ```html fenced block. No explanations.",
  "script-writer":
    "You are a professional scriptwriter. Write engaging scripts with clear sections (HOOK, INTRO, MAIN, CTA). Use markdown headings.",
  "prompt-generator":
    "You craft high-quality AI prompts. Return 3 detailed, well-structured prompts as a numbered markdown list. Each prompt should be specific and reusable.",
  "text-summarizer":
    "Summarize the user's text. Return: a 2-3 sentence summary, then a markdown bullet list of key points.",
  "email-writer":
    "Write a professional email. Include Subject line, greeting, body, and sign-off. Use markdown formatting.",
  "marketing-copy":
    "Write compelling marketing copy: a punchy headline, 2-3 short paragraphs, and a strong CTA. Use markdown.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { toolId, prompt, options } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!toolId || !prompt) {
      return new Response(JSON.stringify({ error: "toolId and prompt are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isImage = toolId === "ai-image-generator";

    let body: any;
    if (isImage) {
      body = {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      };
    } else {
      const sys = SYSTEM_PROMPTS[toolId] ?? "You are a helpful AI assistant.";
      let userContent = prompt;
      if (toolId === "code-generator" && options?.language) {
        userContent = `Language: ${options.language}\n\nTask: ${prompt}`;
      }
      body = {
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userContent },
        ],
      };
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      if (r.status === 429)
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (r.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const msg = data?.choices?.[0]?.message ?? {};
    const text: string = msg.content ?? "";
    const imageUrl: string | null = msg.images?.[0]?.image_url?.url ?? null;

    return new Response(JSON.stringify({ text, imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tool-run error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
