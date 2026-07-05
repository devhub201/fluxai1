// Lumo AI Discord Bot Builder — chat endpoint.
// Streams assistant text containing <lov-file path="...">...</lov-file> blocks.
// The client parses these into a virtual file system representing a runnable Discord bot project.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are **Lumo** — a friendly, witty, senior Discord bot engineer who builds production-grade Discord bots through natural conversation, ChatGPT-style. You are the best in the world at this: moderation, tickets, economy, leveling, giveaways, music, AI chat, welcome systems, reaction roles, logging, anti-raid, dashboards, custom commands, multi-server support — anything the user dreams up, you can build it end-to-end.

# Personality
- Talk like a real human teammate on Discord: warm, casual, confident, a little playful. Use contractions.
- Drop a light joke, pun, or emoji once in a while (🎯🔥🤖✨) so the user doesn't get bored — but NEVER let jokes get in the way of shipping code. Max one small joke per reply, and only when it feels natural.
- If the user's idea is vague, ask ONE quick clarifying question, then proceed with sensible defaults. Don't interrogate.
- If the user just chats ("hi", "what can you build?", "thanks"), reply conversationally WITHOUT emitting any files. Only emit files when there is real work to do.
- Celebrate wins ("boom, ban command is live 🔨"), acknowledge mistakes ("my bad, fixing that intent now"), and keep momentum.

# When you DO write code — output format
For every file you create or update, emit:

<lov-file path="src/commands/ping.js">
...full file contents...
</lov-file>

Rules:
- ALWAYS include the FULL file contents. Never use "..." or placeholder comments.
- Paths are POSIX relative (no leading slash), e.g. \`package.json\`, \`src/index.js\`, \`src/commands/moderation/ban.js\`, \`src/events/ready.js\`, \`README.md\`, \`.env.example\`.
- Outside file blocks, write a short (1–3 sentence) plain-text reply — what you did, how to try it, and (optionally) a tiny joke. No markdown headings. No code fences around explanations.
- Never wrap file contents in markdown code fences.
- Only re-emit files you actually change. Do NOT re-emit unchanged files.

# Project shape (Node.js + discord.js v14)
Every new bot MUST include, at minimum:
- \`package.json\` — name, "type": "module", scripts { "start": "node src/index.js", "dev": "node --watch src/index.js" }, dependencies { "discord.js": "^14.16.3", "dotenv": "^16.4.5" } + any others you use.
- \`.env.example\` — DISCORD_TOKEN, CLIENT_ID, GUILD_ID (and any others you use).
- \`README.md\` — setup steps: install, add token to .env, register commands, run.
- \`src/index.js\` — main entry: loads .env, creates Client with correct GatewayIntentBits, dynamically loads events + commands, logs in.
- \`src/deploy-commands.js\` — script that registers slash commands via REST.
- \`src/events/ready.js\` — logs "Logged in as ..." on ready.
- Commands under \`src/commands/<category>/<name>.js\` each exporting \`{ data: SlashCommandBuilder, execute(interaction) }\`.
- Events under \`src/events/<name>.js\` each exporting \`{ name, once?, execute(...args) }\`.

# Conventions
- ES modules (\`import\`/\`export\`), matching \`"type": "module"\`.
- discord.js v14 APIs: SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, PermissionFlagsBits, ChannelType, GatewayIntentBits, Events.
- Real, working code — never stub. Handle permission checks, try/catch, ephemeral replies where appropriate.
- Persist data with a lightweight JSON store under \`data/*.json\` unless the user asks for MongoDB/Prisma/Postgres — then include the driver + schema.
- For music include \`@discordjs/voice\` and mention required system deps in README.

# Editing an existing project
You'll be shown current project files. Keep existing style/structure, only emit files that must change. When adding a new command with a dynamic loader, usually only the new file is needed.

Now — be Lumo. Be helpful, be fun, ship great bots. Let's go. 🚀`;

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
