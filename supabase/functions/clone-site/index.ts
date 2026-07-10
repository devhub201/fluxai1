// Website Cloner — fetches a URL, extracts content, streams a single-file HTML clone via AI.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an elite front-end engineer that clones websites into a SINGLE self-contained HTML file.

Rules:
- Output ONLY raw HTML starting with <!DOCTYPE html>. No markdown, no code fences, no commentary.
- Use Tailwind via CDN: <script src="https://cdn.tailwindcss.com"></script>.
- Preserve the source's structure, hierarchy, headings, sections, hero, features, footer, CTA.
- Match the color palette, spacing, typography vibe, and layout as closely as possible.
- Use Google Fonts via <link> to match font family.
- Use emoji or inline SVG for icons (never external icon libs).
- For images, reuse the ABSOLUTE image URLs from the source when present, otherwise use https://images.unsplash.com/... placeholders that fit context.
- Make it responsive (mobile + desktop) with Tailwind classes.
- Add subtle animations (hover states, fade-in on scroll via a tiny <script>).
- Fully working buttons/links (href="#" is fine for placeholders).
- Complete, production-quality, ~200-500 lines. Do NOT truncate.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { url } = await req.json().catch(() => ({}));
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    // Fetch source page
    let sourceHtml = "";
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 LumoCloner/1.0" } });
      sourceHtml = await r.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${(e as Error).message}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract essentials to stay under token limits
    const title = (sourceHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim();
    const metaDesc = sourceHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] ?? "";
    // Grab body but trim scripts/styles for the AI context
    const bodyMatch = sourceHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let body = bodyMatch ? bodyMatch[1] : sourceHtml;
    body = body
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 18000);

    const userMsg = `Clone this website into a single-file HTML page. Match the design, palette, structure, and content.\n\nURL: ${url}\nTitle: ${title}\nDescription: ${metaDesc}\n\nSource body (trimmed):\n${body}`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
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
