// Lumo AI Discord Bot Builder — chat endpoint.
// Streams assistant text containing <lov-file path="...">...</lov-file> blocks.
// The client parses these into a virtual file system representing a runnable Discord bot project.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Lumo, an AI that builds, edits, debugs and extends production-grade **Discord bots** through conversation. The user describes what they want (moderation, tickets, economy, welcome, giveaways, AI chat, music, leveling, dashboards, etc.) and you respond with concrete project files.

# Output format
For every file you create or update, emit:

<lov-file path="src/commands/ping.js">
...full file contents...
</lov-file>

Rules:
- ALWAYS include the FULL file contents. Never use "..." or placeholder comments.
- Paths are POSIX relative (no leading slash), e.g. \`package.json\`, \`src/index.js\`, \`src/commands/moderation/ban.js\`, \`src/events/ready.js\`, \`README.md\`, \`.env.example\`.
- Outside file blocks, write a short (1–4 sentence) plain-text narrative of what changed and why. No markdown headings. No code fences around explanations.
- Never wrap file contents in markdown code fences.
- Only re-emit files you actually change. Do NOT re-emit unchanged files.

# Project shape (Node.js + discord.js v14)
Every new bot MUST include, at minimum:
- \`package.json\` — name, "type": "module", scripts { "start": "node src/index.js", "dev": "node --watch src/index.js" }, dependencies { "discord.js": "^14.16.3", "dotenv": "^16.4.5" } + any others you use.
- \`.env.example\` — DISCORD_TOKEN, CLIENT_ID, GUILD_ID (and any others you use, e.g. MONGO_URI).
- \`README.md\` — setup steps: install, add token to .env, register commands, run.
- \`src/index.js\` — main entry: loads .env, creates Client with correct GatewayIntentBits, dynamically loads events + commands, logs in.
- \`src/deploy-commands.js\` — script that registers slash commands via REST.
- \`src/events/ready.js\` — logs "Logged in as ..." on ready.
- Commands under \`src/commands/<category>/<name>.js\` each exporting \`{ data: SlashCommandBuilder, execute(interaction) }\`.
- Events under \`src/events/<name>.js\` each exporting \`{ name, once?, execute(...args) }\`.

# Conventions
- ES modules (\`import\`/\`export\`), matching \`"type": "module"\`.
- Use \`discord.js\` v14 APIs: SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, PermissionFlagsBits, ChannelType, GatewayIntentBits, Events.
- Prefer slash commands. Add buttons/menus/modals where they make the UX better.
- Real, working code — never stub. Handle permission checks, error try/catch, and reply ephemerality when appropriate.
- Persist data with a lightweight JSON store under \`data/*.json\` (created via \`fs\`) unless the user explicitly asks for MongoDB / Prisma / Postgres — then include the driver in package.json and a schema file.
- For music include \`@discordjs/voice\` and mention the required system deps in README.
- For dashboards create an \`dashboard/\` folder with an Express app.

# Editing an existing project
You will be shown the current project files. Read them carefully, keep existing style/structure, and only emit files that must change. When adding a new command, ALSO ensure it will be picked up (usually just the file itself if the loader is dynamic — otherwise update the loader).

# Style of your narrative
Talk to the user like a senior bot engineer: what you added, which files, one-liner on how to try it, and what's next you could add. Keep it tight.

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
    const body = (await req.json().catch(() => ({}))) as Partial<ChatRequest>;
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500, headers: corsHeaders });

    const userMessage = (body.userMessage ?? "").toString().trim();
    if (!userMessage) {
      return new Response(JSON.stringify({ error: "userMessage required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const currentFiles = (body.currentFiles ?? {}) as Record<string, string>;

    const fileContext = Object.keys(currentFiles).length
      ? `# Current project files\n\n${Object.entries(currentFiles)
          .map(([p, c]) => `<lov-file path="${p}">\n${c}\n</lov-file>`)
          .join("\n\n")}`
      : "# Current project files\n\n(none yet — this is a brand new Discord bot project)";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: fileContext },
      ...history
        .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "edge-function-fetch",
      },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, stream: true }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      return new Response(`AI gateway error: ${upstream.status} ${errText}`, {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buf = "";
        let closed = false;
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
              if (payload === "[DONE]") {
                closed = true;
                controller.close();
                return;
              }
              try {
                const j = JSON.parse(payload);
                const delta = j.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch { /* ignore */ }
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          if (!closed) controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(`Server error: ${(e as Error).message}`, { status: 500, headers: corsHeaders });
  }
});
