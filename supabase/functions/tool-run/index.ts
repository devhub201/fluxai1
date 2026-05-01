import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  "code-generator":
    "You are an expert code generator. Return ONLY clean, production-ready code in a single fenced markdown code block with the correct language tag. Add brief comments inline. No prose outside the code block.",
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

type ProjectFile = { path: string; content: string };

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const parseWebsiteProject = (message: any): { summary: string; files: ProjectFile[] } => {
  const args = message?.tool_calls?.[0]?.function?.arguments;
  const tryParse = (raw: any) => {
    if (!raw) return null;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const files = Array.isArray(parsed.files) ? parsed.files : [];
      return {
        summary: String(parsed.summary ?? "Your website project is ready."),
        files: files
          .filter((file: any) => file?.path && typeof file?.content === "string")
          .slice(0, 40)
          .map((file: any) => ({ path: String(file.path), content: String(file.content) })),
      };
    } catch (e) {
      console.error("website parse error", e);
      return null;
    }
  };

  const fromTool = tryParse(args);
  if (fromTool && fromTool.files.length) return fromTool;

  const text = String(message?.content ?? "");
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const fromContent = tryParse(cleaned);
  if (fromContent && fromContent.files.length) return fromContent;

  return {
    summary: "Your website project is ready.",
    files: [{ path: "preview.html", content: text || "<h1>Empty project</h1>" }],
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { toolId, prompt, options, creditCost, dailyCredits, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Backend credentials are not configured");
    }
    if (!toolId || !prompt) return jsonResponse({ error: "toolId and prompt are required" }, 400);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userError || !user?.id || !user.email) return jsonResponse({ error: "Please sign in again" }, 401);

    const cost = Math.max(0, Number(creditCost ?? 0));
    const localDaily = Math.max(0, Math.min(Number(dailyCredits ?? 0), cost));
    const bonusToSpend = Math.max(0, cost - localDaily);

    if (bonusToSpend > 0) {
      const { data: available, error: creditError } = await userClient.rpc("get_my_credits");
      if (creditError) return jsonResponse({ error: "Could not check credits" }, 402);
      if (Number(available ?? 0) < bonusToSpend) return jsonResponse({ error: "Not enough credits" }, 402);
    }

    const isImage = toolId === "ai-image-generator";
    const isWebsite = toolId === "website-builder";
    const isPro = mode === "pro";

    let body: any;
    if (isImage) {
      body = {
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      };
    } else if (isWebsite) {
      const websiteModel = isPro ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";
      body = {
        model: websiteModel,
        messages: [
          {
            role: "system",
            content: `You are Fluxa AI Website Builder — a senior full-stack engineer. Generate a COMPLETE, production-quality, full-stack web project from the user's request.

CRITICAL RULES:
- Output 12-30 real, useful files. NEVER fewer than 10.
- Build BOTH frontend AND backend, plus a database schema if data is involved.
- Frontend MUST use modern, beautiful, responsive design (Tailwind via CDN is fine for the preview).
- ALWAYS include a self-contained "preview.html" that uses Tailwind CDN and shows the full landing page with the site's hero, features, and main sections inline (no external file imports). This is what users see in the live preview, so make it look STUNNING.
- Include multiple real pages (e.g. src/pages/index.tsx, about.tsx, pricing.tsx, contact.tsx, dashboard.tsx).
- Include a backend (server/index.js or api/*.ts with Express or Hono routes), a database schema (db/schema.sql or prisma/schema.prisma), package.json with real dependencies, README.md with setup instructions, and a .env.example.
- Use realistic, copy-pasteable code. No "// TODO" stubs. No placeholders like "your code here".
- Never include real API keys or secrets.
- Style the preview.html with a dark, modern, premium aesthetic by default (gradients, glass cards, hover effects) unless the user asks otherwise.
- Make every page visually distinct and content-rich.

Return your response by calling the create_website_project function.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_website_project",
              description: "Return a complete downloadable full-stack website project with many files.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "1-2 sentence description of what was built." },
                  title: { type: "string", description: "Short title for the site (used as page title)." },
                  files: {
                    type: "array",
                    minItems: 10,
                    maxItems: 30,
                    items: {
                      type: "object",
                      properties: {
                        path: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["path", "content"],
                    },
                  },
                },
                required: ["summary", "title", "files"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_website_project" } },
      };
    } else {
      const sys = SYSTEM_PROMPTS[toolId] ?? "You are a helpful AI assistant.";
      let userContent = prompt;
      if (toolId === "code-generator" && options?.language) {
        userContent = `Language: ${options.language}\n\nTask: ${prompt}`;
      }
      const textModel = isPro ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview";
      body = {
        model: textModel,
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
      if (r.status === 429) return jsonResponse({ error: "Rate limit exceeded. Try again shortly." }, 429);
      if (r.status === 402) return jsonResponse({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }, 402);
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return jsonResponse({ error: "AI gateway error" }, 500);
    }

    const data = await r.json();
    const msg = data?.choices?.[0]?.message ?? {};
    const text: string = msg.content ?? "";
    const imageUrl: string | null = msg.images?.[0]?.image_url?.url ?? null;
    const project = isWebsite ? parseWebsiteProject(msg) : null;
    const projectTitle = isWebsite
      ? (() => {
          try {
            const args = msg?.tool_calls?.[0]?.function?.arguments;
            if (args) {
              const parsed = typeof args === "string" ? JSON.parse(args) : args;
              if (parsed?.title) return String(parsed.title);
            }
          } catch (_) {}
          return null;
        })()
      : null;

    let bonusBalance: number | null = null;
    if (bonusToSpend > 0) {
      const { data: nextBalance, error: spendError } = await adminClient.rpc("spend_user_credits", {
        _user_id: user.id,
        _email: user.email,
        _amount: bonusToSpend,
      });
      if (spendError) {
        console.error("Credit deduction failed", spendError);
        return jsonResponse({ error: "Could not deduct credits" }, 402);
      }
      bonusBalance = Number(nextBalance ?? 0);
    }

    return jsonResponse({
      text: isWebsite ? project?.summary ?? "Your website project is ready." : text,
      title: projectTitle,
      imageUrl,
      files: project?.files ?? null,
      mode: isPro ? "pro" : "fast",
      credits: { dailySpent: localDaily, bonusSpent: bonusToSpend, bonusBalance },
    });
  } catch (e) {
    console.error("tool-run error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
