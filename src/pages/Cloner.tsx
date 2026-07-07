import { useState, useRef } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Download, Loader2, Sparkles, Eye, Code2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

const examples = [
  "https://vercel.com",
  "https://linear.app",
  "https://stripe.com",
  "https://openai.com",
];

export default function Cloner() {
  const [url, setUrl] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"preview" | "code">("preview");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  async function clone(target?: string) {
    const src = (target ?? url).trim();
    if (!src) return toast.error("Paste a URL first");
    let normalized = src;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    setUrl(normalized);
    setLoading(true);
    setHtml("");
    setView("preview");

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/clone-site`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ url: normalized }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        // strip any wrapping fences the model might sneak in
        const clean = acc.replace(/^```html\s*/i, "").replace(/```\s*$/, "");
        setHtml(clean);
      }
      toast.success("Clone ready 🎯");
    } catch (e: any) {
      toast.error(e.message || "Clone failed");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `clone-${new URL(url).hostname.replace(/\./g, "-")}.html`;
    a.click();
  }

  return (
    <LumoShell title="Website Cloner">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-card/40 p-8 backdrop-blur-xl md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl animate-blob" style={{ background: "var(--gradient-aurora)" }} />
        <div className="pointer-events-none absolute -left-20 -bottom-24 h-56 w-56 rounded-full opacity-30 blur-3xl animate-blob" style={{ background: "var(--gradient-primary)", animationDelay: "3s" }} />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI-POWERED WEB CLONER
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Clone any website in <span className="gradient-text">seconds</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Paste a URL. Lumo fetches it, understands the design, and rebuilds it as a single, editable, Tailwind-powered HTML file.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && clone()}
                placeholder="https://linear.app"
                className="h-12 pl-9 bg-background/60 border-white/[0.08] text-base"
                disabled={loading}
              />
            </div>
            <Button
              onClick={() => clone()}
              disabled={loading || !url.trim()}
              className="h-12 px-6 text-white shadow-lg shadow-primary/30"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cloning…</> : <><Sparkles className="mr-2 h-4 w-4" />Clone site</>}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => clone(ex)}
                disabled={loading}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:opacity-40"
              >
                {ex.replace(/^https?:\/\//, "")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(html || loading) && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-background/40 px-4 py-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
              <button
                onClick={() => setView("preview")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition ${view === "preview" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button
                onClick={() => setView("code")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition ${view === "code" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Code2 className="h-3.5 w-3.5" /> Code
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                {loading ? "Streaming…" : `${(html.length / 1024).toFixed(1)} KB`}
              </span>
              <Button size="sm" variant="ghost" onClick={() => clone()} disabled={loading || !url}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.open(url, "_blank")} disabled={!url}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" onClick={download} disabled={!html || loading} className="text-white" style={{ background: "var(--gradient-primary)" }}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> HTML
              </Button>
            </div>
          </div>

          {view === "preview" ? (
            <div className="relative bg-white" style={{ height: "70vh" }}>
              {loading && !html && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching + rebuilding…
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="clone preview"
                srcDoc={html}
                className="h-full w-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <pre className="overflow-auto bg-background/60 p-4 text-xs leading-relaxed" style={{ maxHeight: "70vh", fontFamily: "var(--font-mono, ui-monospace)" }}>
              <code>{html || "// waiting for stream…"}</code>
            </pre>
          )}
        </div>
      )}
    </LumoShell>
  );
}
