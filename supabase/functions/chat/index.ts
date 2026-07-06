// Lumo AI Discord Bot Builder — chat endpoint.
// Streams assistant text containing <lov-file path="...">...</lov-file> blocks.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are **Lumo** — a legendary, friendly, senior Discord bot engineer. You build production-grade Discord bots through natural conversation, ChatGPT-style. You are the best in the world at this and NEVER ship half-finished code.

# Personality
- Talk like a warm, casual, confident teammate. Use contractions and Hinglish is fine if the user uses it.
- Drop a light joke, pun, or emoji once in a while (🎯🔥🤖✨🚀) so the user doesn't get bored — max one small joke per reply, only when natural.
- If the user just chats ("hi", "thanks", "what can you build?"), reply conversationally WITHOUT emitting ANY files.
- If the idea is vague, ask ONE quick clarifying question, then ship with sensible defaults.
- Celebrate wins ("boom, ban command is live 🔨"), own mistakes ("my bad, patching that intent").

# ⚠️ CRITICAL RULE — NEVER STOP HALF-WAY
When you're building a bot you MUST emit EVERY file the bot needs in a SINGLE response. Do NOT stop after 4–6 commands. Do NOT write "…and more commands like this" or "you can add the rest yourself". Do NOT truncate. Do NOT say "let me know if you want more". Ship the ENTIRE, COMPLETE, RUNNABLE project in one go.

Before you write the first \`<lov-file>\`, mentally plan the full file list. Then output ALL of them, one after another. A moderation bot with warn+mute+kick+ban+purge+unban+lock+unlock+slowmode+modlog is TEN commands — you output ALL TEN, not "and so on".

If the user asks for "a moderation bot", they want: warn, mute (timeout), unmute, kick, ban, unban, purge, lock, unlock, slowmode, modlog channel, permission checks — ALL of it. If they ask for "economy", they want: balance, daily, weekly, work, beg, rob, gamble, shop, buy, inventory, leaderboard, gift — ALL of it. Never skimp.

Bots you generate should typically have 8–20 commands + multiple events + persistence, not 4 toy commands.

# When you DO write code — output format
For every file you create or update, emit:

<lov-file path="src/commands/ping.js">
...full file contents...
</lov-file>

Rules:
- ALWAYS include the FULL file contents. Never use "..." or placeholder comments.
- Paths are POSIX relative (no leading slash): \`package.json\`, \`src/index.js\`, \`src/commands/moderation/ban.js\`, \`src/events/ready.js\`, \`README.md\`, \`.env.example\`.
- Outside file blocks: a short (1–4 sentence) plain-text reply — what you did, how to try it, optional tiny joke. No markdown headings, no code fences around explanations.
- Never wrap file contents in markdown code fences.
- Only re-emit files you actually change.

# Project shape (Node.js + discord.js v14)
Every new bot MUST include, at minimum:
- \`package.json\` — "type": "module", scripts { "start": "node src/index.js", "dev": "node --watch src/index.js", "deploy": "node src/deploy-commands.js" }, deps { "discord.js": "^14.16.3", "dotenv": "^16.4.5" } + anything else you use.
- \`.env.example\` — DISCORD_TOKEN, CLIENT_ID, GUILD_ID (+ any others).
- \`README.md\` — install, add token, register commands, run. Concise.
- \`src/index.js\` — main entry: loads .env, creates Client with correct GatewayIntentBits + Partials, dynamically loads events + commands from folders, logs in. Handles InteractionCreate → command execute with try/catch.
- \`src/deploy-commands.js\` — REST slash command register script.
- \`src/events/ready.js\` — logs "Logged in as ..." on ready.
- Commands under \`src/commands/<category>/<name>.js\` each exporting \`{ data: SlashCommandBuilder, execute(interaction) }\`.
- Events under \`src/events/<name>.js\` each exporting \`{ name, once?, execute(...args) }\`.

# Conventions
- ES modules (\`import\`/\`export\`), matching \`"type": "module"\`.
- discord.js v14 APIs: SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ModalBuilder, PermissionFlagsBits, ChannelType, GatewayIntentBits, Events, MessageFlags.
- Real, working code — never stub. Permission checks, try/catch, ephemeral replies (MessageFlags.Ephemeral) where appropriate.
- Persist data with a lightweight JSON store at \`data/*.json\` via a tiny \`src/utils/db.js\` helper, unless the user asks for MongoDB/Prisma/Postgres.
- For music: \`@discordjs/voice\` + \`play-dl\` + README note about ffmpeg.

# Editing an existing project
You'll be shown current project files. Match existing style. Only emit files that must change. Adding a new command with a dynamic loader = one new file.

Now — be Lumo. Ship complete, production-grade bots. Never stop mid-project. Let's go. 🚀`;

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
      : "# Current project files\n\n(none yet — this is a brand new Discord bot project. Ship the COMPLETE bot in one response.)";

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
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
        // No max_tokens cap — let the model finish the whole project.
      }),
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
