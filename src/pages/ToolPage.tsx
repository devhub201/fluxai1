import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Zap, Loader2, Download, Copy, Check, Sparkles, Eye, Code as CodeIcon, Trash2, Globe, Rocket, Gauge, Brain, ExternalLink, Wand2, LayoutTemplate, ImagePlus, ListChecks } from "lucide-react";
import { getTool } from "@/lib/tools";
import { useCredits } from "@/hooks/useCredits";
import { useState, useMemo, type HTMLAttributes, type ReactNode } from "react";
import { addLog } from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import JSZip from "jszip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type GeneratedFile = { path: string; content: string };
type AssistantPlan = {
  layoutSuggestions: string[];
  assetIdeas: string[];
  changeExplanation: string[];
  publishChecklist: string[];
};
type ToolRunResponse = {
  text?: string;
  title?: string | null;
  imageUrl?: string | null;
  files?: GeneratedFile[] | null;
  assistantPlan?: AssistantPlan | null;
  mode?: string;
  credits?: { dailySpent?: number; bonusBalance?: number | null };
  error?: string;
};

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift", "HTML", "CSS", "SQL"];

const PLACEHOLDERS: Record<string, string> = {
  "code-generator": "e.g. A function that returns the nth Fibonacci number using memoization",
  "ai-image-generator": "e.g. A cyberpunk city at night, neon lights, cinematic, 4k",
  "website-builder": "e.g. A modern SaaS landing page for an AI startup with hero, features, pricing",
  "script-writer": "e.g. 60-second YouTube short about productivity hacks for founders",
  "prompt-generator": "e.g. Blog post outlines for a fitness coach targeting busy professionals",
  "text-summarizer": "Paste the text you want summarized here…",
  "email-writer": "e.g. Follow-up email after a sales meeting with a SaaS prospect",
  "marketing-copy": "e.g. AI photo editing app for creators — focus on speed and quality",
};

const SUGGESTIONS: Record<string, string[]> = {
  "code-generator": ["Debounce hook in React", "REST API in Express with auth", "Binary search in Python"],
  "ai-image-generator": ["Cyberpunk samurai, neon rain", "Minimal product shot, soft light", "Fantasy castle at sunset"],
  "website-builder": ["Full SaaS with auth pages and API", "Portfolio with CMS backend", "Restaurant site with booking API"],
  "script-writer": ["YouTube short on AI tools", "30s product ad", "Podcast intro script"],
  "prompt-generator": ["Midjourney art prompts", "ChatGPT writing prompts", "Code review prompts"],
  "text-summarizer": ["Summarize a research paper", "TL;DR for a news article", "Meeting notes recap"],
  "email-writer": ["Cold outreach email", "Follow-up after demo", "Apology email to client"],
  "marketing-copy": ["Instagram caption", "Landing page hero copy", "Product launch tweet"],
};

const EXT_BY_LANGUAGE: Record<string, string> = {
  JavaScript: "js",
  TypeScript: "ts",
  Python: "py",
  Java: "java",
  "C++": "cpp",
  Go: "go",
  Rust: "rs",
  PHP: "php",
  Ruby: "rb",
  Swift: "swift",
  HTML: "html",
  CSS: "css",
  SQL: "sql",
};

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "fluxa-output";

const stripFence = (value: string) => {
  const match = value.match(/^```[\w-]*\s*([\s\S]*?)```$/i);
  return match ? match[1].trim() : value.trim();
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden my-3">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-surface-2/60">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <CodeIcon className="h-3.5 w-3.5" />
          {language || "code"}
        </div>
        <button onClick={onCopy} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 overflow-auto text-[12.5px] leading-relaxed"><code className={`language-${language}`}>{value}</code></pre>
    </div>
  );
}

export default function ToolPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tool = getTool(id ?? "");
  const { credits, dailyCredits, applySpendResult } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [websiteView, setWebsiteView] = useState<"preview" | "code">("preview");
  const [mode, setMode] = useState<"fast" | "pro">("fast");
  const [generatedTitle, setGeneratedTitle] = useState<string>("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishSlug, setPublishSlug] = useState("");
  const [publishTitle, setPublishTitle] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const Icon = tool?.icon;
  const isImage = tool?.id === "ai-image-generator";
  const isWebsite = tool?.id === "website-builder";
  const isCode = tool?.id === "code-generator";

  // Extract HTML for website builder
  const previewHtml = useMemo(() => {
    if (!isWebsite) return null;
    const previewFile = generatedFiles.find((file) => file.path.toLowerCase().endsWith("preview.html") || file.path.toLowerCase().endsWith("index.html"));
    if (previewFile?.content) return previewFile.content;
    if (!output) return null;
    const m = output.match(/```html\s*([\s\S]*?)```/i);
    if (m) return m[1];
    if (output.trim().startsWith("<")) return output;
    return null;
  }, [generatedFiles, isWebsite, output]);

  if (!tool || !Icon) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Tool not found.</p>
          <button onClick={() => navigate("/store")} className="text-primary text-sm">Back to Store</button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    if (credits < tool.credits) {
      toast.error("Not enough credits");
      return;
    }
    setLoading(true);
    setOutput("");
    setImageUrl(null);
    setGeneratedFiles([]);
    setGeneratedTitle("");
    setPublishedUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke<ToolRunResponse>("tool-run", {
        body: { toolId: tool.id, prompt, options: { language }, creditCost: tool.credits, dailyCredits, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      applySpendResult(Number(data?.credits?.dailySpent ?? 0), data?.credits?.bonusBalance ?? null);
      addLog({ type: "tool", message: `Used ${tool.name} (${mode})`, amount: tool.credits });

      setOutput(data?.text ?? "");
      setImageUrl(data?.imageUrl ?? null);
      setGeneratedFiles(Array.isArray(data?.files) ? data.files : []);
      if (data?.title) setGeneratedTitle(data.title);
      toast.success(isWebsite ? `Website built with ${mode === "pro" ? "Pro" : "Fast"} mode` : "Generated!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublish = () => {
    const baseTitle = generatedTitle || prompt.slice(0, 60) || "My Site";
    setPublishTitle(baseTitle);
    setPublishSlug(slugify(baseTitle));
    setPublishedUrl(null);
    setPublishOpen(true);
  };

  const handlePublish = async () => {
    if (!generatedFiles.length) {
      toast.error("Generate a website first");
      return;
    }
    if (!publishSlug.trim()) {
      toast.error("Please choose a URL");
      return;
    }
    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; slug?: string; error?: string }>(
        "publish-site",
        {
          body: {
            action: "publish",
            slug: slugify(publishSlug),
            title: publishTitle || "Untitled Site",
            files: generatedFiles,
            prompt,
            model: mode === "pro" ? "pro" : "fast",
          },
        },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const url = `${window.location.origin}/sites/${data?.slug}`;
      setPublishedUrl(url);
      toast.success("Published! Site is live.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(output);
    setCopiedAll(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `fluxa-${Date.now()}.png`;
    a.click();
  };

  const handleDownloadOutput = async () => {
    if (generatedFiles.length > 0) {
      const zip = new JSZip();
      generatedFiles.forEach((file) => zip.file(file.path.replace(/^\/+/, ""), file.content));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${slugify(tool.name)}-${Date.now()}.zip`);
      toast.success("Project ZIP downloaded");
      return;
    }
    if (!output) return;
    const ext = isCode ? EXT_BY_LANGUAGE[language] ?? "txt" : "md";
    const content = isCode ? stripFence(output) : output;
    downloadBlob(new Blob([content], { type: "text/plain;charset=utf-8" }), `${slugify(tool.name)}-${Date.now()}.${ext}`);
    toast.success("File downloaded");
  };

  const handleClear = () => {
    setOutput("");
    setImageUrl(null);
    setGeneratedFiles([]);
  };

  const hasOutput = !!output || !!imageUrl || generatedFiles.length > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-12 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Tools
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 fill-primary" /> {credits} Credits
          </span>
        </div>

        {/* Hero header */}
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5 sm:p-6">
          <div className={`absolute inset-0 opacity-30 bg-gradient-to-br ${tool.color} pointer-events-none`} />
          <div className="relative flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${tool.color} border flex items-center justify-center shrink-0`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{tool.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-primary border border-primary/30 bg-primary/10 rounded-full px-2 py-1">
                  <Zap className="h-3 w-3 fill-primary" /> {tool.credits} credits / run
                </span>
                <span className="inline-flex items-center gap-1 text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 rounded-full px-2 py-1">
                  <Star className="h-3 w-3 fill-yellow-400" /> {tool.rating}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground border border-border rounded-full px-2 py-1">
                  <Sparkles className="h-3 w-3" /> Powered by Fluxa AI
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Input panel */}
          <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 space-y-4 h-fit lg:sticky lg:top-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Your input</div>
              <span className="text-[11px] text-muted-foreground">{prompt.length} chars</span>
            </div>

            {isCode && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 rounded-lg bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={PLACEHOLDERS[tool.id]}
                className="w-full min-h-44 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60 resize-y"
              />
            </div>

            {/* Suggestions */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Try</div>
              <div className="flex flex-wrap gap-1.5">
                {(SUGGESTIONS[tool.id] ?? []).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-surface-2 hover:border-primary/40 hover:text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {!isImage && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">AI Mode</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-2 border border-border/60">
                  <button
                    onClick={() => setMode("fast")}
                    className={`h-9 rounded-lg text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-all ${mode === "fast" ? "bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.4)]" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Gauge className="h-3.5 w-3.5" /> Fast
                  </button>
                  <button
                    onClick={() => setMode("pro")}
                    className={`h-9 rounded-lg text-[12px] font-medium inline-flex items-center justify-center gap-1.5 transition-all ${mode === "pro" ? "bg-gradient-to-r from-fuchsia-500 to-primary text-white shadow-[0_0_18px_hsl(var(--primary)/0.5)]" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Brain className="h-3.5 w-3.5" /> Pro
                  </button>
                </div>
                <p className="text-[10.5px] text-muted-foreground">
                  {mode === "fast" ? "Fast mode — quick results, lower cost." : "Pro mode — deeper reasoning, higher quality, slower."}
                </p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isWebsite ? "Building your site…" : "Generating…"}</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generate {isImage ? "Image" : isWebsite ? "Website" : ""}</>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Costs <span className="text-primary font-medium">{tool.credits} credits</span> per run
            </p>
          </div>

          {/* Output panel */}
          <div className="lg:col-span-3 rounded-2xl bg-card border border-border p-5 min-h-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="text-sm font-semibold inline-flex items-center gap-2">
                Output
                {hasOutput && <span className="text-[10px] text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 rounded-full px-2 py-0.5">Ready</span>}
              </div>
              <div className="flex items-center gap-2">
                {isWebsite && previewHtml && (
                  <div className="inline-flex rounded-lg border border-border/60 overflow-hidden">
                    <button
                      onClick={() => setWebsiteView("preview")}
                      className={`px-2.5 py-1 text-[11px] inline-flex items-center gap-1 ${websiteView === "preview" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Eye className="h-3 w-3" /> Preview
                    </button>
                    <button
                      onClick={() => setWebsiteView("code")}
                      className={`px-2.5 py-1 text-[11px] inline-flex items-center gap-1 border-l border-border/60 ${websiteView === "code" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <CodeIcon className="h-3 w-3" /> Code
                    </button>
                  </div>
                )}
                {output && (
                  <button onClick={handleCopyAll} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-2.5 py-1">
                    {copiedAll ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                )}
                {imageUrl && (
                  <button onClick={handleDownloadImage} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-2.5 py-1">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                )}
                {!imageUrl && (output || generatedFiles.length > 0) && (
                  <button onClick={handleDownloadOutput} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-2.5 py-1">
                    <Download className="h-3.5 w-3.5" /> {generatedFiles.length > 0 ? "ZIP" : "File"}
                  </button>
                )}
                {isWebsite && generatedFiles.length > 0 && (
                  <button
                    onClick={handleOpenPublish}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-primary hover:opacity-90 rounded-lg px-3 py-1.5 shadow-[0_0_18px_hsl(var(--primary)/0.4)]"
                  >
                    <Rocket className="h-3.5 w-3.5" /> Publish
                  </button>
                )}
                {hasOutput && (
                  <button onClick={handleClear} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-lg px-2.5 py-1">
                    <Trash2 className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 rounded-xl bg-surface-2/60 border border-border/60 p-4 overflow-auto">
              {loading && (
                <div className="h-full min-h-60 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <Sparkles className="h-5 w-5 text-primary absolute inset-0 m-auto" />
                  </div>
                  <div className="text-xs">Generating with Fluxa AI…</div>
                </div>
              )}

              {!loading && !hasOutput && (
                <div className="h-full min-h-60 flex flex-col items-center justify-center gap-2 text-center px-6">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tool.color} border flex items-center justify-center mb-1`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium">Ready when you are</div>
                  <div className="text-xs text-muted-foreground max-w-sm">
                    Enter a prompt on the left and click Generate. Your result will appear here instantly.
                  </div>
                </div>
              )}

              {!loading && imageUrl && (
                <div className="space-y-3">
                  <img src={imageUrl} alt="Generated" className="w-full h-auto rounded-lg border border-border" />
                  <p className="text-[11px] text-muted-foreground text-center">Right-click the image to save, or use the Download button above.</p>
                </div>
              )}

              {!loading && isWebsite && previewHtml && websiteView === "preview" && (
                <div className="space-y-3">
                  <iframe
                    title="Website preview"
                    srcDoc={previewHtml}
                    className="w-full h-[520px] rounded-lg border border-border bg-white"
                    sandbox="allow-scripts"
                  />
                  {generatedFiles.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generatedFiles.map((file) => (
                        <div key={file.path} className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs text-muted-foreground truncate">
                          {file.path}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!loading && isWebsite && websiteView === "code" && (generatedFiles.length > 0 || previewHtml) && (
                <div className="space-y-3">
                  {(generatedFiles.length > 0 ? generatedFiles : [{ path: "preview.html", content: previewHtml ?? "" }]).map((file) => (
                    <div key={file.path}>
                      <div className="mb-1 text-xs text-muted-foreground">{file.path}</div>
                      <CodeBlock language={file.path.split(".").pop() ?? "txt"} value={file.content} />
                    </div>
                  ))}
                </div>
              )}

              {!loading && output && !imageUrl && !(isWebsite && previewHtml) && (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ inline, className, children, ...props }: HTMLAttributes<HTMLElement> & { inline?: boolean; children?: ReactNode }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const value = String(children).replace(/\n$/, "");
                        if (!inline && (match || value.includes("\n"))) {
                          return <CodeBlock language={match?.[1] ?? (isCode ? language.toLowerCase() : "")} value={value} />;
                        }
                        return <code className="px-1.5 py-0.5 rounded bg-background/80 border border-border/60 text-[12px]" {...props}>{children}</code>;
                      },
                    }}
                  >
                    {output}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" /> Publish your website
            </DialogTitle>
            <DialogDescription>
              Your site will be live instantly at a public Fluxa URL.
            </DialogDescription>
          </DialogHeader>

          {publishedUrl ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-emerald-300">Live URL</div>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary text-sm font-medium break-all inline-flex items-center gap-1.5 hover:underline"
                >
                  {publishedUrl} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl);
                    toast.success("URL copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy URL
                </Button>
                <Button className="flex-1" onClick={() => window.open(publishedUrl, "_blank")}>
                  <Globe className="h-3.5 w-3.5" /> Open Site
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Site title</label>
                <Input value={publishTitle} onChange={(e) => setPublishTitle(e.target.value)} placeholder="My awesome site" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Public URL</label>
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-2 px-3 h-10 text-sm">
                  <span className="text-muted-foreground text-xs truncate">{window.location.host}/sites/</span>
                  <input
                    value={publishSlug}
                    onChange={(e) => setPublishSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="flex-1 bg-transparent outline-none text-sm"
                    placeholder="my-site"
                  />
                </div>
                <p className="text-[10.5px] text-muted-foreground">Lowercase letters, numbers, and dashes only.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={publishing}>Cancel</Button>
                <Button onClick={handlePublish} disabled={publishing}>
                  {publishing ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</> : <><Rocket className="h-3.5 w-3.5" /> Publish Now</>}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
