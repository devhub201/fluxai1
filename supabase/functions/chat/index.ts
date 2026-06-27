// AI Builder chat endpoint. Streams assistant text containing <lov-file path="...">...</lov-file>
// blocks. The client parses these blocks and writes them to its virtual file system.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Lovable Builder, an AI that creates and edits single-page React apps. The user describes what they want; you respond with file blocks.

# Output format
For each file you create or update, emit:

<lov-file path="/src/SomeFile.tsx">
...full file contents...
</lov-file>

Rules:
- Always include the FULL file contents — never use placeholders or "..." comments.
- Always include at least /src/App.tsx as the root component (default export).
- Path must start with /src/ and end in .tsx, .ts, .jsx, or .js.
- Outside the file blocks, write a short (1-3 sentence) plain-text summary of what changed. No markdown headings, no code fences.
- Never wrap file contents in markdown code fences.

# Runtime environment
The app runs in a sandboxed iframe with:
- React 18 + react-dom (auto JSX runtime, no need to import React)
- react-router-dom v6 (use MemoryRouter if you need routing)
- lucide-react icons
- Tailwind CSS via the Play CDN (use Tailwind classes freely)
- NO other npm packages, NO shadcn/ui, NO @/ aliases — use relative imports only
- NO backend, NO fetch to real APIs, NO env vars
- localStorage is available for persistence

# Style guidelines
- Modern, polished UI using Tailwind. Use rounded corners, subtle shadows, a coherent color palette.
- Mobile-first responsive layouts.
- Build the WHOLE feature the user asked for — don't stub things out.
- Prefer small focused components in separate files (/src/components/Foo.tsx).

# Editing existing apps
When the user asks for a change, you'll see the current files. Re-emit only the files you change (full contents). Do not re-emit unchanged files.

Begin.`;

interface ChatRequest {
  projectId: string;
  userMessage: string;
  history: { role: "user" | "assistant"; content: string }[];
  currentFiles: Record<string, string>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as ChatRequest;
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const fileContext = Object.keys(body.currentFiles ?? {}).length
      ? `# Current project files\n\n${Object.entries(body.currentFiles)
          .map(([p, c]) => `<lov-file path="${p}">\n${c}\n</lov-file>`)
          .join("\n\n")}`
      : "# Current project files\n\n(none yet — this is a new project)";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: fileContext },
      ...body.history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: body.userMessage },
    ];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(`AI gateway error: ${upstream.status} ${errText}`, {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    // Re-stream as plain text deltas (one chunk per token).
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
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
                if (delta) controller.enqueue(new TextEncoder().encode(delta));
              } catch { /* ignore */ }
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    return new Response(`Server error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
