import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Zap, Loader2, Download, Copy, Check } from "lucide-react";
import { getTool } from "@/lib/tools";
import { useCredits } from "@/hooks/useCredits";
import { useState } from "react";
import { addLog } from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "PHP", "Ruby", "Swift"];

const PLACEHOLDERS: Record<string, string> = {
  "code-generator": "Describe what you want to build (e.g. a function that returns the nth Fibonacci number)",
  "ai-image-generator": "Describe the image you want (e.g. a cyberpunk city at night, neon lights, cinematic)",
  "website-builder": "Describe your website (e.g. a modern SaaS landing page for an AI startup)",
  "script-writer": "Topic or idea (e.g. 60-second YouTube short about productivity hacks)",
  "prompt-generator": "What do you need prompts for? (e.g. blog post outlines for a fitness coach)",
  "text-summarizer": "Paste the text you want summarized...",
  "email-writer": "What's the email about? (e.g. follow-up after a sales meeting)",
  "marketing-copy": "Product/service to promote (e.g. AI photo editing app for creators)",
};

export default function ToolPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tool = getTool(id ?? "");
  const { credits, spend } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!tool) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Tool not found.</p>
          <button onClick={() => navigate("/store")} className="text-primary text-sm">Back to Store</button>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;
  const isImage = tool.id === "ai-image-generator";
  const isWebsite = tool.id === "website-builder";

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
    try {
      const { data, error } = await supabase.functions.invoke("tool-run", {
        body: { toolId: tool.id, prompt, options: { language } },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const ok = await spend(tool.credits);
      if (!ok) {
        setLoading(false);
        return;
      }
      addLog({ type: "tool", message: `Used ${tool.name}`, amount: tool.credits });

      setOutput((data as any)?.text ?? "");
      setImageUrl((data as any)?.imageUrl ?? null);
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `fluxa-${Date.now()}.png`;
    a.click();
  };

  // Extract HTML for website-builder preview
  const htmlMatch = isWebsite ? output.match(/```html\s*([\s\S]*?)```/i) : null;
  const previewHtml = htmlMatch?.[1] ?? (isWebsite && output.trim().startsWith("<") ? output : null);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Tools
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">
            <Zap className="h-3.5 w-3.5 fill-primary" /> {credits} Credits
          </span>
        </div>

        {/* Header card */}
        <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 flex items-start gap-4">
          <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${tool.color} border flex items-center justify-center shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{tool.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 text-primary"><Zap className="h-3.5 w-3.5 fill-primary" />Cost: {tool.credits} Credits</span>
              <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-yellow-400" />{tool.rating}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input */}
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <div className="text-sm font-semibold">Describe your input</div>

            {tool.id === "code-generator" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Programming Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 rounded-lg bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PLACEHOLDERS[tool.id]}
              className="w-full min-h-40 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60 resize-y"
            />

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Zap className="h-4 w-4 fill-current" /> Generate {isImage ? "Image" : isWebsite ? "Website" : ""}</>
              )}
            </button>
          </div>

          {/* Output */}
          <div className="rounded-2xl bg-card border border-border p-5 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Output</div>
              {output && !isImage && (
                <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              )}
              {imageUrl && (
                <button onClick={handleDownloadImage} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              )}
            </div>

            <div className="flex-1 rounded-xl bg-surface-2 border border-border/60 p-4 overflow-auto">
              {loading && (
                <div className="h-full min-h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div className="text-xs">Generating with Fluxa AI...</div>
                </div>
              )}

              {!loading && !output && !imageUrl && (
                <div className="h-full min-h-48 flex items-center justify-center text-xs text-muted-foreground text-center">
                  Your generated result will appear here.
                </div>
              )}

              {!loading && imageUrl && (
                <img src={imageUrl} alt="Generated" className="w-full h-auto rounded-lg border border-border" />
              )}

              {!loading && previewHtml && (
                <div className="space-y-3">
                  <iframe
                    title="Website preview"
                    srcDoc={previewHtml}
                    className="w-full h-[420px] rounded-lg border border-border bg-white"
                    sandbox="allow-scripts"
                  />
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">View HTML source</summary>
                    <pre className="mt-2 p-3 bg-background rounded-lg overflow-auto max-h-64 text-[11px]"><code>{previewHtml}</code></pre>
                  </details>
                </div>
              )}

              {!loading && output && !imageUrl && !previewHtml && (
                <div className="prose prose-invert prose-sm max-w-none prose-pre:bg-background prose-pre:border prose-pre:border-border prose-code:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
