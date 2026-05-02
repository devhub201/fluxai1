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
type AssistantPlan = {
  layoutSuggestions: string[];
  assetIdeas: string[];
  changeExplanation: string[];
  publishChecklist: string[];
};
type SitePage = { name: string; path: string; purpose: string; sections: string[] };
type SiteSpec = {
  title: string;
  tagline: string;
  audience: string;
  theme: string;
  pages: SitePage[];
  features: string[];
  ctas: string[];
  assistantPlan: AssistantPlan;
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const parseWebsiteProject = (message: any): { summary: string; title: string | null; assistantPlan: AssistantPlan | null; files: ProjectFile[] } => {
  const args = message?.tool_calls?.[0]?.function?.arguments ?? message?.function_call?.arguments;
  const tryParse = (raw: any) => {
    if (!raw) return null;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const files = Array.isArray(parsed.files) ? parsed.files : [];
      const plan = parsed.assistantPlan && typeof parsed.assistantPlan === "object" ? parsed.assistantPlan : null;
      return {
        summary: String(parsed.summary ?? "Your website project is ready."),
        title: parsed.title ? String(parsed.title) : null,
        assistantPlan: plan
          ? {
              layoutSuggestions: Array.isArray(plan.layoutSuggestions) ? plan.layoutSuggestions.map(String).slice(0, 6) : [],
              assetIdeas: Array.isArray(plan.assetIdeas) ? plan.assetIdeas.map(String).slice(0, 6) : [],
              changeExplanation: Array.isArray(plan.changeExplanation) ? plan.changeExplanation.map(String).slice(0, 6) : [],
              publishChecklist: Array.isArray(plan.publishChecklist) ? plan.publishChecklist.map(String).slice(0, 6) : [],
            }
          : null,
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
    title: null,
    assistantPlan: null,
    files: [{ path: "preview.html", content: text || "<h1>Empty project</h1>" }],
  };
};

const fallbackAssistantPlan = (title: string, prompt: string): AssistantPlan => ({
  layoutSuggestions: [
    `Use a conversion-focused hero for ${title} with one clear primary action.`,
    "Place proof, feature, pricing, and contact sections in a scannable homepage flow.",
    "Keep dashboard or app pages separated from marketing pages for cleaner navigation.",
  ],
  assetIdeas: [
    "Generate a premium hero visual that shows the product outcome clearly.",
    "Use consistent icon cards for core features and workflow steps.",
    "Add realistic screenshots/mockups based on the requested business category.",
  ],
  changeExplanation: [
    `Built a full-stack project structure from: ${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}`,
    "Added frontend pages, backend routes, database schema, setup docs, and a live preview file.",
    "Prepared the project so it can be downloaded as ZIP or published to a Fluxa public URL.",
  ],
  publishChecklist: [
    "Review text, links, and calls-to-action in the preview.",
    "Download the ZIP if you want to edit the source files locally.",
    "Publish only after the assistant change summary looks right.",
  ],
});

const safeArray = (value: unknown, fallback: string[], max = 8) =>
  (Array.isArray(value) ? value.map(String).filter(Boolean) : fallback).slice(0, max);

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const componentName = (name: string) =>
  (name.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("") || "Page");

const parseWebsiteSpec = (message: any, prompt: string, wantsAssistant: boolean): SiteSpec => {
  const raw = message?.tool_calls?.[0]?.function?.arguments ?? message?.function_call?.arguments ?? message?.content;
  let parsed: any = null;
  try {
    const text = typeof raw === "string" ? raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim() : raw;
    parsed = typeof text === "string" ? JSON.parse(text) : text;
  } catch (e) {
    console.error("website spec parse error", e);
  }

  const title = String(parsed?.title ?? componentName(prompt).replace(/([A-Z])/g, " $1").trim() ?? "Fluxa Site").slice(0, 80);
  const plan = parsed?.assistantPlan && typeof parsed.assistantPlan === "object"
    ? {
        layoutSuggestions: safeArray(parsed.assistantPlan.layoutSuggestions, [], 6),
        assetIdeas: safeArray(parsed.assistantPlan.assetIdeas, [], 6),
        changeExplanation: safeArray(parsed.assistantPlan.changeExplanation, [], 6),
        publishChecklist: safeArray(parsed.assistantPlan.publishChecklist, [], 6),
      }
    : fallbackAssistantPlan(title, prompt);

  const pages = Array.isArray(parsed?.pages) && parsed.pages.length
    ? parsed.pages.slice(0, 6).map((page: any) => ({
        name: String(page.name ?? "Page"),
        path: String(page.path ?? `/${String(page.name ?? "page").toLowerCase()}`),
        purpose: String(page.purpose ?? "Core page"),
        sections: safeArray(page.sections, ["Hero", "Features", "CTA"], 6),
      }))
    : [
        { name: "Home", path: "/", purpose: "Landing page", sections: ["Hero", "Features", "Pricing", "FAQ"] },
        { name: "About", path: "/about", purpose: "Brand story", sections: ["Mission", "Team", "Values"] },
        { name: "Pricing", path: "/pricing", purpose: "Plans", sections: ["Plans", "Comparison", "CTA"] },
        { name: "Dashboard", path: "/dashboard", purpose: "User workspace", sections: ["Stats", "Activity", "Quick actions"] },
      ];

  return {
    title,
    tagline: String(parsed?.tagline ?? `A polished full-stack website for ${prompt}`).slice(0, 160),
    audience: String(parsed?.audience ?? "modern web users"),
    theme: String(parsed?.theme ?? "dark premium gradient"),
    pages,
    features: safeArray(parsed?.features, ["Responsive pages", "Backend API", "Database-ready schema", "Generated assets"], 8),
    ctas: safeArray(parsed?.ctas, ["Get started", "View demo"], 4),
    assistantPlan: wantsAssistant ? plan : fallbackAssistantPlan(title, prompt),
  };
};

const buildWebsiteProject = (spec: SiteSpec, prompt: string, isPro: boolean): { summary: string; title: string; assistantPlan: AssistantPlan; files: ProjectFile[] } => {
  const title = spec.title;
  const pages = spec.pages.length ? spec.pages : [{ name: "Home", path: "/", purpose: "Landing page", sections: ["Hero", "Features", "CTA"] }];
  const primary = spec.ctas[0] ?? "Get started";
  const secondary = spec.ctas[1] ?? "View demo";
  const featureCards = spec.features.map((feature, index) => `
          <article class="rounded-2xl border border-white/10 bg-white/[0.06] p-6 hover:bg-white/[0.09] transition">
            <div class="mb-4 h-10 w-10 rounded-xl bg-cyan-400/15 text-cyan-200 grid place-items-center font-bold">${index + 1}</div>
            <h3 class="text-lg font-semibold text-white">${escapeHtml(feature)}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-300">Designed for ${escapeHtml(spec.audience)} with production-ready structure and smooth responsive behavior.</p>
          </article>`).join("");
  const previewHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>html{scroll-behavior:smooth}body{font-family:Inter,ui-sans-serif,system-ui;background:#020617;color:white}.mesh{background:radial-gradient(circle at 20% 0%,rgba(34,211,238,.25),transparent 32%),radial-gradient(circle at 80% 10%,rgba(168,85,247,.25),transparent 30%),linear-gradient(180deg,#020617,#0f172a 55%,#020617)}.glow{box-shadow:0 0 60px rgba(34,211,238,.22)}</style>
</head>
<body class="mesh min-h-screen">
  <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    <div class="flex items-center gap-3"><div class="h-10 w-10 rounded-xl bg-cyan-400 text-slate-950 grid place-items-center font-black">${escapeHtml(title.charAt(0).toUpperCase())}</div><span class="font-semibold tracking-wide">${escapeHtml(title)}</span></div>
    <div class="hidden gap-6 text-sm text-slate-300 md:flex">${pages.slice(0, 5).map((page) => `<a href="#${escapeHtml(page.name.toLowerCase())}" class="hover:text-white">${escapeHtml(page.name)}</a>`).join("")}</div>
  </nav>
  <main>
    <section class="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
      <div>
        <p class="mb-4 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">${escapeHtml(spec.theme)} · ${isPro ? "Pro" : "Fast"} build</p>
        <h1 class="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">${escapeHtml(title)}</h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-slate-300">${escapeHtml(spec.tagline)}</p>
        <div class="mt-8 flex flex-wrap gap-3"><a href="#contact" class="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200">${escapeHtml(primary)}</a><a href="#features" class="rounded-xl border border-white/15 px-5 py-3 font-semibold text-white hover:bg-white/10">${escapeHtml(secondary)}</a></div>
      </div>
      <div class="glow rounded-3xl border border-white/10 bg-white/[0.06] p-4">
        <div class="rounded-2xl bg-slate-950/80 p-5">
          <div class="mb-4 flex gap-2"><span class="h-3 w-3 rounded-full bg-rose-400"></span><span class="h-3 w-3 rounded-full bg-amber-300"></span><span class="h-3 w-3 rounded-full bg-emerald-400"></span></div>
          <div class="grid gap-3">${pages.slice(0, 5).map((page) => `<div class="rounded-xl border border-white/10 bg-white/[0.05] p-4"><div class="text-sm font-semibold text-cyan-100">${escapeHtml(page.name)}</div><div class="mt-1 text-xs text-slate-400">${escapeHtml(page.purpose)}</div></div>`).join("")}</div>
        </div>
      </div>
    </section>
    <section id="features" class="mx-auto max-w-7xl px-6 py-14"><div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">${featureCards}</div></section>
    <section id="contact" class="mx-auto max-w-5xl px-6 py-20 text-center"><h2 class="text-3xl font-bold md:text-5xl">Ready to launch?</h2><p class="mx-auto mt-4 max-w-2xl text-slate-300">This preview is generated from a full downloadable project with frontend, backend, database schema, and generated assets.</p></section>
  </main>
</body>
</html>`;

  const siteData = `export const site = ${JSON.stringify({ title, tagline: spec.tagline, audience: spec.audience, theme: spec.theme, features: spec.features, ctas: spec.ctas, pages }, null, 2)} as const;\n`;
  const pageFiles = pages.map((page) => ({
    path: `src/pages/${componentName(page.name)}.tsx`,
    content: `import { site } from "../data/site";\n\nexport default function ${componentName(page.name)}() {\n  const page = site.pages.find((item) => item.name === ${JSON.stringify(page.name)})!;\n  return (\n    <main className="page-shell">\n      <p className="eyebrow">${page.path}</p>\n      <h1>{page.name}</h1>\n      <p className="lead">{page.purpose}</p>\n      <section className="section-grid">\n        {page.sections.map((section) => (\n          <article className="panel" key={section}>\n            <h2>{section}</h2>\n            <p>Purpose-built for {site.audience} with responsive UI, strong content hierarchy, and production-ready structure.</p>\n          </article>\n        ))}\n      </section>\n    </main>\n  );\n}\n`,
  }));

  const files: ProjectFile[] = [
    { path: "preview.html", content: previewHtml },
    { path: "package.json", content: JSON.stringify({ scripts: { dev: "vite", build: "vite build", preview: "vite preview", server: "tsx server/index.ts" }, dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest", "lucide-react": "latest", express: "latest", cors: "latest", zod: "latest" }, devDependencies: { typescript: "latest", tsx: "latest" } }, null, 2) },
    { path: "README.md", content: `# ${title}\n\n${spec.tagline}\n\n## What Fluxa generated\n- Multi-page React frontend\n- Express backend routes\n- Database schema\n- SVG brand assets\n- Self-contained preview.html\n\n## Run\n\n\`\`\`bash\nnpm install\nnpm run dev\nnpm run server\n\`\`\`\n` },
    { path: ".env.example", content: "DATABASE_URL=\nAPI_BASE_URL=http://localhost:8787\n" },
    { path: "index.html", content: `<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n` },
    { path: "src/main.tsx", content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./styles.css";\n\ncreateRoot(document.getElementById("root")!).render(<React.StrictMode><App /></React.StrictMode>);\n` },
    { path: "src/App.tsx", content: `import Header from "./components/Header";\nimport Hero from "./components/Hero";\nimport FeatureGrid from "./components/FeatureGrid";\nimport Footer from "./components/Footer";\n\nexport default function App() {\n  return <><Header /><Hero /><FeatureGrid /><Footer /></>;\n}\n` },
    { path: "src/data/site.ts", content: siteData },
    { path: "src/styles.css", content: `:root{font-family:Inter,system-ui,sans-serif;color:#f8fafc;background:#020617}body{margin:0;background:radial-gradient(circle at top left,#164e63,transparent 30%),#020617}.nav{display:flex;align-items:center;justify-content:space-between;padding:24px 6vw}.brand{font-weight:800}.hero{padding:96px 6vw;max-width:1100px}.hero h1,.page-shell h1{font-size:clamp(44px,8vw,92px);line-height:.95;margin:0}.lead{max-width:720px;color:#cbd5e1;font-size:20px;line-height:1.7}.button{display:inline-flex;margin-top:24px;padding:14px 20px;border-radius:14px;background:#67e8f9;color:#020617;font-weight:800;text-decoration:none}.grid,.section-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:40px 6vw}.panel{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);border-radius:22px;padding:24px}.eyebrow{color:#67e8f9;text-transform:uppercase;letter-spacing:.18em}.page-shell{padding:80px 6vw}` },
    { path: "src/components/Header.tsx", content: `import { site } from "../data/site";\nexport default function Header(){return <nav className="nav"><div className="brand">{site.title}</div><div>{site.pages.slice(0,4).map((p)=><a key={p.path} style={{marginLeft:18,color:'#cbd5e1'}} href={p.path}>{p.name}</a>)}</div></nav>}\n` },
    { path: "src/components/Hero.tsx", content: `import { site } from "../data/site";\nexport default function Hero(){return <section className="hero"><p className="eyebrow">{site.theme}</p><h1>{site.title}</h1><p className="lead">{site.tagline}</p><a className="button" href="/contact">{site.ctas[0]}</a></section>}\n` },
    { path: "src/components/FeatureGrid.tsx", content: `import { site } from "../data/site";\nexport default function FeatureGrid(){return <section className="grid">{site.features.map((feature)=><article className="panel" key={feature}><h2>{feature}</h2><p>Fast, responsive, and connected to the generated backend architecture.</p></article>)}</section>}\n` },
    { path: "src/components/Footer.tsx", content: `import { site } from "../data/site";\nexport default function Footer(){return <footer style={{padding:'40px 6vw',color:'#94a3b8'}}>© {new Date().getFullYear()} {site.title}. Generated by Fluxa AI.</footer>}\n` },
    ...pageFiles,
    { path: "server/index.ts", content: `import express from "express";\nimport cors from "cors";\nimport { z } from "zod";\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\nconst Lead = z.object({ email: z.string().email(), message: z.string().min(2) });\napp.get("/api/health", (_, res) => res.json({ ok: true, app: ${JSON.stringify(title)} }));\napp.post("/api/leads", (req, res) => { const parsed = Lead.safeParse(req.body); if (!parsed.success) return res.status(400).json(parsed.error.flatten()); res.json({ ok: true, lead: parsed.data }); });\napp.listen(8787, () => console.log("API ready on http://localhost:8787"));\n` },
    { path: "server/routes.ts", content: `export const routes = ${JSON.stringify(pages.map((page) => ({ path: page.path, name: page.name, purpose: page.purpose })), null, 2)};\n` },
    { path: "db/schema.sql", content: `create table leads (\n  id uuid primary key default gen_random_uuid(),\n  email text not null,\n  message text not null,\n  created_at timestamptz not null default now()\n);\n\ncreate table app_events (\n  id uuid primary key default gen_random_uuid(),\n  event_name text not null,\n  payload jsonb not null default '{}'::jsonb,\n  created_at timestamptz not null default now()\n);\n` },
    { path: "public/assets/logo.svg", content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="#020617"/><path d="M28 76 58 22h34L68 56h28L54 100l12-24H28Z" fill="#67e8f9"/></svg>` },
    { path: "public/assets/hero-mark.svg", content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 420"><rect width="600" height="420" rx="40" fill="#0f172a"/><circle cx="170" cy="120" r="90" fill="#22d3ee" opacity=".25"/><circle cx="420" cy="160" r="120" fill="#a855f7" opacity=".25"/><rect x="90" y="110" width="420" height="220" rx="28" fill="#ffffff" opacity=".08"/><path d="M140 260h320M140 210h240M140 160h160" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round" opacity=".9"/></svg>` },
  ].slice(0, isPro ? 30 : 22);

  return { summary: `${title} is ready with ${files.length} generated full-stack files, assistant guidance, assets, preview, backend routes, and database schema.`, title, assistantPlan: spec.assistantPlan, files };
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
    const wantsAssistant = isWebsite && options?.assistantMode !== false;

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
            content: `You are Fluxa AI Website Builder assistant. Return a compact project SPEC, not source code.
Choose a strong product direction from the user request. Suggest layouts, asset ideas, pages, features, CTAs, and explain the planned changes before publishing.
Keep fields concise. Return by calling create_website_spec.`,
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_website_project",
              description: "Return a compact website plan/spec that Fluxa will compile into a full-stack project.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short title for the site (used as page title)." },
                  tagline: { type: "string" },
                  audience: { type: "string" },
                  theme: { type: "string" },
                  pages: {
                    type: "array",
                    minItems: isPro ? 5 : 4,
                    maxItems: 6,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        path: { type: "string" },
                        purpose: { type: "string" },
                        sections: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "path", "purpose", "sections"],
                    },
                  },
                  features: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
                  ctas: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                  assistantPlan: {
                    type: "object",
                    properties: {
                      layoutSuggestions: { type: "array", items: { type: "string" } },
                      assetIdeas: { type: "array", items: { type: "string" } },
                      changeExplanation: { type: "array", items: { type: "string" } },
                      publishChecklist: { type: "array", items: { type: "string" } },
                    },
                    required: ["layoutSuggestions", "assetIdeas", "changeExplanation", "publishChecklist"],
                  },
                },
                required: wantsAssistant ? ["title", "tagline", "audience", "theme", "pages", "features", "ctas", "assistantPlan"] : ["title", "tagline", "audience", "theme", "pages", "features", "ctas"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_website_spec" } },
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
    const projectTitle = project?.title ?? null;
    const assistantPlan = project?.assistantPlan ?? (isWebsite && wantsAssistant ? fallbackAssistantPlan(projectTitle ?? "your website", prompt) : null);

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
      assistantPlan,
      mode: isPro ? "pro" : "fast",
      credits: { dailySpent: localDaily, bonusSpent: bonusToSpend, bonusBalance },
    });
  } catch (e) {
    console.error("tool-run error", e);
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
