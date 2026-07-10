import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Send, Loader2, Eye, Code2, Download, RefreshCw,
  Monitor, Smartphone, Tablet, Rocket, Copy, Brain, Wand2,
  ArrowLeft, Share2, ChevronDown, Zap, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { FluxaWordmark } from "@/components/FluxaWordmark";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

type Msg = { role: "user" | "assistant"; content: string; thoughts?: string[] };
type Thought = { text: string; ts: number };

const IDEAS = [
  { icon: "🚀", label: "SaaS landing for an AI note-taking app called Ripple" },
  { icon: "🎨", label: "Portfolio for a product designer, editorial dark theme" },
  { icon: "🍜", label: "Modern Japanese izakaya restaurant site" },
  { icon: "🌱", label: "Climate tech startup pitch page with data viz" },
  { icon: "✍️", label: "Personal blog with warm minimal aesthetic" },
  { icon: "💎", label: "Luxury watch brand e-commerce showcase" },
];

function extract(text: string) {
  const thoughts = [...text.matchAll(/<thought>([\s\S]*?)<\/thought>/g)].map((m) => m[1].trim());
  const htmlMatch = text.match(/<html>([\s\S]*?)(?:<\/html>|$)/);
  let html = htmlMatch ? htmlMatch[1].trim() : "";
  if (html.includes("<!DOCTYPE") || html.includes("<!doctype")) {
    const i = html.search(/<!doctype/i);
    html = html.slice(i);
  }
  const sumMatch = text.match(/<summary>([\s\S]*?)<\/summary>/);
  const summary = sumMatch ? sumMatch[1].trim() : "";
  return { thoughts, html, summary };
}

export default function WebBuilder() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState("");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [started, setStarted] = useState(false);
  const [projectName] = useState("Untitled site");
  const chatEnd = useRef<HTMLDivElement>(null);
  const seenThoughts = useRef<Set<string>>(new Set());

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thoughts, loading]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const nextMsgs = [...messages, { role: "user" as const, content }];
    setMessages(nextMsgs);
    setLoading(true);
    setStarted(true);
    seenThoughts.current = new Set();
    const turnThoughts: string[] = [];

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/web-builder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ messages: nextMsgs, currentHtml: html }),
      });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });

        const thoughtMatches = [...acc.matchAll(/<thought>([\s\S]*?)<\/thought>/g)];
        for (const m of thoughtMatches) {
          const t = m[1].trim();
          if (t && !seenThoughts.current.has(t)) {
            seenThoughts.current.add(t);
            turnThoughts.push(t);
            setThoughts((prev) => [...prev, { text: t, ts: Date.now() }]);
          }
        }

        const openIdx = acc.search(/<html>/);
        if (openIdx !== -1) {
          const closeIdx = acc.indexOf("</html>", openIdx);
          const raw = closeIdx === -1 ? acc.slice(openIdx + 6) : acc.slice(openIdx + 6, closeIdx);
          const doctypeIdx = raw.search(/<!doctype/i);
          const usable = doctypeIdx !== -1 ? raw.slice(doctypeIdx) : raw;
          if (usable.length > 200) setHtml(usable);
        }
      }

      const { html: finalHtml, summary } = extract(acc);
      if (finalHtml) setHtml(finalHtml);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: summary || "Done — check the preview.",
        thoughts: turnThoughts,
      }]);
      setTab("preview");
      toast.success("Site updated ✨");
    } catch (e: any) {
      toast.error(e.message || "Build failed");
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${e.message || "Something went wrong"}` }]);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "site.html";
    a.click();
  }

  async function publish() {
    if (!html) return toast.error("Build something first");
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast.success("Published preview opened in a new tab");
  }

  async function share() {
    if (!html) return toast.error("Nothing to share yet");
    await navigator.clipboard.writeText(html);
    toast.success("HTML copied to clipboard");
  }

  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 820 : "100%";

  // Empty state — full-page hero
  if (!started) {
    return (
      <div className="relative min-h-screen aurora-bg text-foreground overflow-hidden">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-background/60 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/home" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <FluxaWordmark size="sm" />
            <span className="hidden md:inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">v8</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="ghost"><Link to="/projects">My Bots</Link></Button>
            <Button asChild size="sm" variant="ghost"><Link to="/cloner">Cloner</Link></Button>
          </div>
        </header>

        <div className="relative mx-auto max-w-3xl px-4 pt-12 md:pt-20">
          <div className="pointer-events-none absolute -top-8 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-blob"
               style={{ background: "var(--gradient-aurora)" }} />
          <div className="relative text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Wand2 className="h-3 w-3" /> LUMO AI v8 · WEB BUILDER
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              What should we <span className="gradient-text">build</span> today?
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Describe your idea. I'll think it through, design it, and ship a live site — then keep iterating with you by chat.
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative rounded-2xl border border-white/[0.08] bg-card/60 p-2 backdrop-blur-xl shadow-2xl focus-within:border-primary/40">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={3}
                  autoFocus
                  placeholder="Build a landing page for my AI startup called Nova…"
                  className="w-full resize-none bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted-foreground/60"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className="text-[11px] text-muted-foreground">↵ to send · shift+↵ new line</span>
                  <Button onClick={() => send()} disabled={!input.trim()}
                          className="text-white shadow-lg shadow-primary/30"
                          style={{ background: "var(--gradient-primary)" }}>
                    <Sparkles className="mr-1.5 h-4 w-4" /> Build it
                  </Button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {IDEAS.map((i) => (
                  <button key={i.label} onClick={() => send(i.label)}
                          className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground">
                    <span className="text-lg">{i.icon}</span>
                    <span className="flex-1">{i.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Builder workspace — Lovable-style: full-height, chat left, live embed right
  return (
    <div className="flex h-screen flex-col overflow-hidden aurora-bg text-foreground">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-white/[0.06] bg-background/70 px-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <FluxaWordmark size="sm" />
          <span className="hidden md:inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">v8</span>
          <div className="hidden md:flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
            {projectName} <ChevronDown className="h-3 w-3" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={download} disabled={!html} className="h-8">
            <Download className="mr-1.5 h-3.5 w-3.5" /> HTML
          </Button>
          <Button size="sm" variant="ghost" onClick={share} disabled={!html} className="h-8">
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share
          </Button>
          <Button size="sm" onClick={publish} disabled={!html} className="h-8 text-white shadow-lg shadow-primary/30"
                  style={{ background: "var(--gradient-primary)" }}>
            <Rocket className="mr-1.5 h-3.5 w-3.5" /> Publish
          </Button>
        </div>
      </header>

      {/* Body: chat | preview */}
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[380px_1fr]">
        {/* Chat panel */}
        <div className="flex min-h-0 flex-col border-r border-white/[0.06] bg-background/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Chat</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{messages.filter(m => m.role === "user").length} turns</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[90%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white shadow-lg shadow-primary/20"
                         style={{ background: "var(--gradient-primary)" }}>
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <div className="flex h-4 w-4 items-center justify-center rounded" style={{ background: "var(--gradient-primary)" }}>
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                      Lumo AI
                    </div>
                    {m.thoughts && m.thoughts.length > 0 && (
                      <details className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-xs" open>
                        <summary className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
                          <Brain className="h-3 w-3 text-primary" />
                          Thought for a moment · {m.thoughts.length} step{m.thoughts.length > 1 ? "s" : ""}
                        </summary>
                        <div className="mt-2 space-y-1.5 border-l border-primary/30 pl-2.5">
                          {m.thoughts.map((t, ti) => (
                            <div key={ti} className="text-[11px] leading-relaxed text-muted-foreground">{t}</div>
                          ))}
                        </div>
                      </details>
                    )}
                    <div className="text-sm leading-relaxed text-foreground/95">{m.content}</div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <div className="flex h-4 w-4 items-center justify-center rounded animate-pulse" style={{ background: "var(--gradient-primary)" }}>
                    <Sparkles className="h-2.5 w-2.5 text-white" />
                  </div>
                  Lumo AI
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking live…
                  </div>
                  <div className="mt-2 space-y-1 border-l border-primary/30 pl-2.5 max-h-40 overflow-y-auto">
                    {thoughts.slice(-5).map((t, i) => (
                      <div key={i} className="text-[11px] leading-relaxed text-muted-foreground animate-fade-in">{t.text}</div>
                    ))}
                    {thoughts.length === 0 && (
                      <div className="text-[11px] italic text-muted-foreground">Analyzing your request…</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div className="border-t border-white/[0.06] p-2.5">
            <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-primary/40">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                rows={2}
                placeholder="Ask Lumo to edit anything…"
                disabled={loading}
                className="w-full resize-none bg-transparent px-3 py-2 pr-11 text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon"
                      className="absolute bottom-1.5 right-1.5 h-7 w-7 rounded-lg text-white"
                      style={{ background: input.trim() && !loading ? "var(--gradient-primary)" : undefined }}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-primary" /> v8 · gemini-2.5-flash</span>
              <span>↵ send · ⇧↵ new line</span>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex min-h-0 flex-col bg-background/20">
          <div className="flex h-11 items-center justify-between border-b border-white/[0.06] bg-background/60 px-3 backdrop-blur-xl">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
              {(["preview", "code"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "preview" ? <Eye className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
                  {t === "preview" ? "Preview" : "Code"}
                </button>
              ))}
            </div>

            {tab === "preview" && (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                  {[
                    { d: "desktop", i: Monitor },
                    { d: "tablet", i: Tablet },
                    { d: "mobile", i: Smartphone },
                  ].map(({ d, i: Ic }) => (
                    <button key={d} onClick={() => setDevice(d as any)}
                            className={`rounded-md p-1.5 transition ${device === d ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      <Ic className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setHtml((h) => h + " ")}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {tab === "code" && (
              <Button size="sm" variant="ghost" className="h-7" onClick={() => { navigator.clipboard.writeText(html); toast.success("Copied"); }}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            )}
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            {tab === "preview" && (
              <div className="flex h-full items-start justify-center overflow-auto bg-neutral-950 p-4">
                {html ? (
                  <div className="h-full transition-all" style={{ maxWidth: deviceWidth, width: deviceWidth }}>
                    <iframe title="preview" srcDoc={html}
                            className="h-full w-full rounded-lg border border-white/10 bg-white shadow-2xl"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
                      <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--gradient-primary)" }}>
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      Lumo is building your site…
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "code" && (
              <pre className="h-full overflow-auto bg-background/80 p-4 text-xs leading-relaxed font-mono">
                <code>{html || "// waiting for build…"}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
