import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

type Attachment = { kind: "image"; dataUrl: string; name?: string } | { kind: "text"; text: string; name?: string };
type InMsg = { role: "user" | "assistant" | "system"; content: string; attachments?: Attachment[] };

// ---------- Web search (DuckDuckGo HTML, no API key) ----------
async function webSearch(query: string, limit = 6): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const r = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FluxaAI/1.0)" },
    });
    const html = await r.text();
    const results: { title: string; url: string; snippet: string }[] = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && results.length < limit) {
      let url = decodeURIComponent(m[1].replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, "").split("&")[0]);
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      const snippet = m[3].replace(/<[^>]+>/g, "").trim();
      if (url.startsWith("http")) results.push({ title, url, snippet });
    }
    return results;
  } catch (e) {
    console.error("search err", e);
    return [];
  }
}

// ---------- Image generation ----------
async function generateImage(prompt: string, key: string): Promise<string> {
  const attempts: Array<{ model: string; body: any; endpoint: string }> = [
    {
      model: "openai/gpt-image-2",
      endpoint: `${GATEWAY}/images/generations`,
      body: { model: "openai/gpt-image-2", prompt, size: "1024x1024", quality: "low", n: 1 },
    },
    {
      model: "google/gemini-3.1-flash-image-preview",
      endpoint: `${GATEWAY}/chat/completions`,
      body: {
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      },
    },
    {
      model: "google/gemini-2.5-flash-image",
      endpoint: `${GATEWAY}/chat/completions`,
      body: {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      },
    },
  ];

  let lastErr = "";
  for (const a of attempts) {
    try {
      const r = await fetch(a.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(a.body),
      });
      if (!r.ok) {
        lastErr = `${a.model}: ${r.status} ${(await r.text()).slice(0, 200)}`;
        console.error(lastErr);
        continue;
      }
      const j = await r.json();
      const b64 = j?.data?.[0]?.b64_json;
      if (b64) return `data:image/png;base64,${b64}`;
      const imgs = j?.choices?.[0]?.message?.images;
      const url = imgs?.[0]?.image_url?.url ?? imgs?.[0]?.url;
      if (typeof url === "string" && (url.startsWith("data:image") || url.startsWith("http"))) return url;
      lastErr = `${a.model}: no image in response`;
      console.error(lastErr, JSON.stringify(j).slice(0, 300));
    } catch (e) {
      lastErr = `${a.model}: ${e instanceof Error ? e.message : String(e)}`;
      console.error(lastErr);
    }
  }
  throw new Error(lastErr || "Image generation failed");
}

// ---------- Build multimodal message ----------
function buildContent(m: InMsg): any {
  if (!m.attachments || m.attachments.length === 0) return m.content;
  const parts: any[] = [];
  if (m.content) parts.push({ type: "text", text: m.content });
  for (const a of m.attachments) {
    if (a.kind === "image") parts.push({ type: "image_url", image_url: { url: a.dataUrl } });
    else if (a.kind === "text") parts.push({ type: "text", text: `\n\n[Attached file: ${a.name ?? "file"}]\n${a.text}` });
  }
  return parts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages: InMsg[] = body.messages ?? [];
    const mode: "chat" | "image" | "search" | "deep" = body.mode ?? "chat";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUser?.content ?? "";

    // ---------- IMAGE MODE: return single JSON with image ----------
    if (mode === "image") {
      try {
        const url = await generateImage(userText, LOVABLE_API_KEY);
        const md = `![generated image](${url})\n\n*Generated with Fluxa AI — prompt: "${userText}"*`;
        // Stream this as a single SSE chunk so client logic is uniform
        const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: md } }] })}\n\ndata: [DONE]\n\n`;
        return new Response(sse, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "image gen failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ---------- SEARCH / DEEP RESEARCH: enrich system with live results ----------
    let researchContext = "";
    if (mode === "search" || mode === "deep") {
      const queries = mode === "deep"
        ? [userText, `${userText} latest news 2026`, `${userText} detailed analysis`]
        : [userText];
      const all: { title: string; url: string; snippet: string }[] = [];
      for (const q of queries) {
        const r = await webSearch(q, mode === "deep" ? 6 : 8);
        all.push(...r);
      }
      const seen = new Set<string>();
      const dedup = all.filter((r) => (seen.has(r.url) ? false : (seen.add(r.url), true))).slice(0, mode === "deep" ? 15 : 8);
      researchContext = dedup.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n");
    }

    const systemBase = "You are Fluxa AI — a friendly, expert multilingual assistant. Format code in fenced markdown blocks with the language. Use clear headings, bullet lists, tables, and bold for structure. Answer in the user's language (English, Hindi, Hinglish).";
    const systemExtra = mode === "deep"
      ? `\n\nDEEP RESEARCH MODE. Synthesize the web sources below into a detailed, well-structured report with sections, key insights, and a "Sources" list using [n] markers.\n\nSOURCES:\n${researchContext}`
      : mode === "search"
        ? `\n\nWEB SEARCH MODE. Use the live web results below to answer accurately and cite with [n] markers. End with a "Sources" list.\n\nLIVE RESULTS:\n${researchContext}`
        : "";

    const upstreamMessages = [
      { role: "system", content: systemBase + systemExtra },
      ...messages.map((m) => ({ role: m.role, content: buildContent(m) })),
    ];

    const model = mode === "deep" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";

    const response = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: upstreamMessages, stream: true }),
    });

    if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!response.ok) {
      const t = await response.text();
      console.error("gateway err", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
