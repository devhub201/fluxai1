import { useEffect, useRef, useState } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Send, Loader2, Eye, Code2, Download, RefreshCw,
  Monitor, Smartphone, Tablet, Rocket, Copy, Brain, Wand2, Globe
} from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

type Msg = { role: "user" | "assistant"; content: string };
type Thought = { text: string; ts: number };

const IDEAS = [
  "SaaS landing page for an AI note-taking app called Ripple",
  "Portfolio for a product designer, dark theme, big type",
  "Restaurant site for a modern Japanese izakaya",
  "Startup pitch page for a climate tech company",
  "Personal blog with a warm minimal aesthetic",
];

function extract(text: string) {
  const thoughts = [...text.matchAll(/<thought>([\s\S]*?)<\/thought>/g)].map((m) => m[1].trim());
  const htmlMatch = text.match(/<html>([\s\S]*?)(?:<\/html>|$)/);
  let html = htmlMatch ? htmlMatch[1].trim() : "";
  // fix if AI dropped <html>...</html> wrapping the DOCTYPE
  if (html.startsWith("<!DOCTYPE") || html.startsWith("<!doctype")) {
    // fine
  } else if (html.includes("<!DOCTYPE") || html.includes("<!doctype")) {
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
  const [streamBuf, setStreamBuf] = useState("");
  const [html, setHtml] = useState("");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [tab, setTab] = useState<"preview" | "code" | "thoughts">("preview");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showEmbed, setShowEmbed] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const seenThoughts = useRef<Set<string>>(new Set());

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamBuf]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const nextMsgs = [...messages, { role: "user" as const, content }];
    setMessages(nextMsgs);
    setLoading(true);
    setStreamBuf("");
    setShowEmbed(true);
    setTab("thoughts");

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
        setStreamBuf(acc);

        // Live-extract thoughts as they close
        const thoughtMatches = [...acc.matchAll(/<thought>([\s\S]*?)<\/thought>/g)];
        for (const m of thoughtMatches) {
          const t = m[1].trim();
          if (t && !seenThoughts.current.has(t)) {
            seenThoughts.current.add(t);
            setThoughts((prev) => [...prev, { text: t, ts: Date.now() }]);
          }
        }

        // Live-extract HTML (even partial while streaming) and switch to preview
        const openIdx = acc.search(/<html>/);
        if (openIdx !== -1) {
          const closeIdx = acc.indexOf("</html>", openIdx);
          const raw = closeIdx === -1 ? acc.slice(openIdx + 6) : acc.slice(openIdx + 6, closeIdx);
          const doctypeIdx = raw.search(/<!doctype/i);
          const usable = doctypeIdx !== -1 ? raw.slice(doctypeIdx) : raw;
          if (usable.length > 200) {
            setHtml(usable);
            if (tab === "thoughts") setTab("preview");
          }
        }
      }

      const { thoughts: allThoughts, html: finalHtml, summary } = extract(acc);
      if (finalHtml) setHtml(finalHtml);
      allThoughts.forEach((t) => {
        if (!seenThoughts.current.has(t)) {
          seenThoughts.current.add(t);
          setThoughts((prev) => [...prev, { text: t, ts: Date.now() }]);
        }
      });
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: summary || "Done — check the preview.",
      }]);
      setTab("preview");
      toast.success("Site updated ✨");
    } catch (e: any) {
      toast.error(e.message || "Build failed");
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${e.message || "Something went wrong"}` }]);
    } finally {
      setLoading(false);
      setStreamBuf("");
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
    // Simple client-side publish: data URL open
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast.success("Opened in new tab — right-click → Save As to host anywhere");
  }

  const deviceWidth = device === "mobile" ? 390 : device === "tablet" ? 820 : "100%";

  // Empty state — Lovable-style idea prompt
  if (!showEmbed && messages.length === 0) {
    return (
      <LumoShell title="Web Builder">
        <div className="relative mx-auto max-w-3xl pt-8 md:pt-16">
          <div className="pointer-events-none absolute -top-8 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-blob"
               style={{ background: "var(--gradient-aurora)" }} />
          <div className="relative text-center">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Wand2 className="h-3 w-3" /> LUMO WEB BUILDER · 2026
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Build any <span className="gradient-text">website</span> by chatting
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Describe your site. Watch Lumo think, design, and ship it live — then keep editing by asking.
            </p>

            <div className="mx-auto mt-8 max-w-2xl">
              <div className="relative rounded-2xl border border-white/[0.08] bg-card/60 p-2 backdrop-blur-xl shadow-2xl">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  rows={3}
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

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {IDEAS.map((i) => (
                  <button key={i} onClick={() => send(i)}
                          className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-primary">
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </LumoShell>
    );
  }

  // Builder workspace — chat left, live embed right
  return (
    <LumoShell title="Web Builder" action={
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={download} disabled={!html}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> HTML
        </Button>
        <Button size="sm" onClick={publish} disabled={!html} className="text-white" style={{ background: "var(--gradient-primary)" }}>
          <Rocket className="mr-1.5 h-3.5 w-3.5" /> Publish
        </Button>
      </div>
    }>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]" style={{ height: "calc(100vh - 140px)" }}>
        {/* Chat panel */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold">Lumo</div>
              <div className="text-[10px] text-muted-foreground">Your AI web builder</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white"
                       style={{ background: "var(--gradient-primary)" }}>
                    {m.content}
                  </div>
                ) : (
                  <div className="text-sm text-foreground/90 leading-relaxed">{m.content}</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {thoughts.length > 0 ? thoughts[thoughts.length - 1].text.slice(0, 60) + "…" : "Thinking…"}
              </div>
            )}
            <div ref={chatEnd} />
          </div>

          <div className="border-t border-white/[0.06] p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ask Lumo to edit anything…"
                disabled={loading}
                className="bg-background/60 border-white/[0.08]"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon"
                      className="text-white" style={{ background: "var(--gradient-primary)" }}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Live embed */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-card/40 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
            <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
              {(["preview", "thoughts", "code"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs transition ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "preview" && <Eye className="h-3.5 w-3.5" />}
                  {t === "thoughts" && <Brain className="h-3.5 w-3.5" />}
                  {t === "code" && <Code2 className="h-3.5 w-3.5" />}
                  {t === "preview" ? "Preview" : t === "thoughts" ? "Live thoughts" : "Code"}
                  {t === "thoughts" && thoughts.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-[9px]">{thoughts.length}</span>
                  )}
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
                <Button size="sm" variant="ghost" onClick={() => setHtml((h) => h + " ")}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {tab === "code" && (
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(html); toast.success("Copied"); }}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </Button>
            )}
          </div>

          <div className="relative flex-1 overflow-hidden">
            {tab === "preview" && (
              <div className="flex h-full items-start justify-center overflow-auto bg-neutral-950 p-4">
                {html ? (
                  <div className="h-full w-full transition-all"
                       style={{ maxWidth: deviceWidth, width: deviceWidth }}>
                    <iframe title="preview" srcDoc={html}
                            className="h-full w-full rounded-lg border border-white/10 bg-white shadow-2xl"
                            sandbox="allow-scripts allow-same-origin" />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Lumo is building…
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "thoughts" && (
              <div className="h-full overflow-y-auto p-6 space-y-3">
                {thoughts.length === 0 && !loading && (
                  <div className="text-sm text-muted-foreground">No thoughts yet — send a message to see Lumo reason live.</div>
                )}
                {thoughts.map((t, i) => (
                  <div key={i} className="flex gap-3 animate-fade-in">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Thought · {new Date(t.ts).toLocaleTimeString()}</div>
                      <div className="text-sm leading-relaxed">{t.text}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full bg-primary" />
                    <div className="text-sm text-muted-foreground italic">Thinking…</div>
                  </div>
                )}
              </div>
            )}

            {tab === "code" && (
              <pre className="h-full overflow-auto bg-background/60 p-4 text-xs leading-relaxed">
                <code>{html || "// waiting for build…"}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </LumoShell>
  );
}
