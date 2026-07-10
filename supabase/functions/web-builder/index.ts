// Web Builder — Lovable-style AI site builder.
// Streams: <thought>...</thought> blocks (visible thinking) + <html>...</html> final code.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Lumo Web — an elite AI website builder like Lovable. You build and edit COMPLETE single-file HTML websites through natural conversation.

OUTPUT PROTOCOL (STRICT):
You MUST respond in this exact structure, in order:

1. One or more <thought>...</thought> blocks describing what you're planning, analyzing, or deciding. Be specific, human, a bit playful. 1-2 short sentences each. Multiple thoughts allowed — they simulate live reasoning.
   Examples:
   <thought>Analyzing the current hero — the CTA is too weak, needs bigger typography.</thought>
   <thought>Adding a testimonials grid with 3 cards using glass morphism.</thought>
   <thought>Picking Inter + a subtle indigo→pink gradient for the accent.</thought>

2. Exactly ONE <html>...</html> block containing the FULL updated website as a single self-contained HTML document starting with <!DOCTYPE html>. No partial diffs — always full file.

3. A short <summary>...</summary> block (1-2 sentences) telling the user what you changed.

WEBSITE RULES:
- Single self-contained HTML file. Tailwind via <script src="https://cdn.tailwindcss.com"></script>.
- Google Fonts via <link>. Use tasteful modern pairings (Inter, Space Grotesk, DM Sans, Sora, Syne, Plus Jakarta Sans, JetBrains Mono).
- Beautiful, 2026-modern design: gradients, glass, soft shadows, generous spacing, responsive.
- Use inline SVG or emoji for icons. Never external icon libraries.
- Use https://images.unsplash.com/... for imagery (with real photo IDs like https://images.unsplash.com/photo-1518770660439-4636190af475).
- Include micro-animations (hover, fade-in on scroll via a tiny script).
- Fully responsive (mobile + desktop). Real content, not lorem ipsum.
- Complete, production-quality. Never truncate. Never write "..." placeholders.
- When the user asks to EDIT, preserve everything not being changed and rewrite the full file.

If the user asks something conversational (no build change), still use <thought> + <summary> and repeat the current HTML unchanged inside <html>.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { messages, currentHtml } = await req.json().catch(() => ({}));
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const contextMsg = currentHtml
      ? `CURRENT WEBSITE (edit this — output the full updated file):\n\n${String(currentHtml).slice(0, 60000)}`
      : `No website yet — build from scratch based on the user's request.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMsg },
          ...messages,
        ],
      }),
    });

    if (!upstream.ok) {
      const t = await upstream.text();
      return new Response(`AI gateway error: ${upstream.status} ${t}`, { status: upstream.status, headers: corsHeaders });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buf = "";
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith("data:")) continue;
              const payload = t.slice(5).trim();
              if (payload === "[DONE]") { controller.close(); return; }
              try {
                const j = JSON.parse(payload);
                const delta = j.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch { /* ignore */ }
            }
          }
        } catch (e) { controller.error(e); }
        finally { try { controller.close(); } catch {} }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(`Server error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
