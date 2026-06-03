import { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles, Send, Loader2, User, Bot, Trash2, Copy, RotateCcw, Database,
  Megaphone, Mail, Wrench, BarChart3, Code2, Languages, FileText, Lightbulb, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const MODELS = [
  { id: "google/gemini-3-flash-preview", label: "Gemini 3 Flash · fast" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro · smart" },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "openai/gpt-5.4", label: "GPT-5.4 · reasoning" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini" },
];

const TEMPLATES = [
  { id: "announcement", label: "Announcement", icon: Megaphone,
    mode: "announcement-writer",
    prompt: "Write a launch announcement (under 120 words) for: " },
  { id: "email", label: "Email", icon: Mail,
    mode: "email-writer",
    prompt: "Draft a friendly user email about: " },
  { id: "tool", label: "New AI tool", icon: Wrench,
    mode: "tool-ideator",
    prompt: "Brainstorm 5 new AI tools for Fluxa. For each: name, 1-line pitch, system prompt, credit price. Theme: " },
  { id: "analyze", label: "Analyze data", icon: BarChart3,
    mode: "data-analyst",
    prompt: "Using the live platform context, analyze: " },
  { id: "sql", label: "Write SQL", icon: Code2,
    mode: "sql-helper",
    prompt: "Write a Postgres SQL query for our schema (tables: profiles, chats, messages, user_credits, custom_tools, published_sites, moderation_flags) for: " },
  { id: "moderation", label: "Moderation", icon: ShieldAlert,
    mode: "moderation-summary",
    prompt: "Summarize this week's moderation flags and suggest 3 next actions. Context: " },
  { id: "translate", label: "Translate", icon: Languages,
    mode: "translator",
    prompt: "Translate to Hinglish (warm, friendly): " },
  { id: "changelog", label: "Changelog", icon: FileText,
    mode: "changelog-writer",
    prompt: "Write a user-facing changelog entry (title + 3-5 bullets) for: " },
  { id: "promo", label: "Credit promo", icon: Lightbulb,
    mode: "promo-planner",
    prompt: "Plan a 7-day credit promo with daily themes and target audience. Goal: " },
];

export default function AdminAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [mode, setMode] = useState("");
  const [useContext, setUseContext] = useState(true);
  const [context, setContext] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Load live platform context (counts) once
  useEffect(() => {
    (async () => {
      const [p, c, m, s, ct, mf] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("chats").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
        supabase.from("published_sites").select("id, is_published", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("custom_tools").select("name, credits, is_active").eq("is_active", true).limit(20),
        supabase.from("moderation_flags").select("id, status, reason, created_at").order("created_at", { ascending: false }).limit(10),
      ]);
      const lines = [
        `Date: ${new Date().toISOString().slice(0, 10)}`,
        `Total users (profiles): ${p.count ?? "?"}`,
        `Total chats: ${c.count ?? "?"}`,
        `Total messages: ${m.count ?? "?"}`,
        `Published sites: ${s.count ?? "?"}`,
        `Active custom tools: ${(ct.data ?? []).map((t: any) => `${t.name}(${t.credits}cr)`).join(", ") || "none"}`,
        `Latest moderation flags (max 10):\n${(mf.data ?? []).map((f: any) => `- [${f.status}] ${f.reason || "(no reason)"} · ${f.created_at.slice(0, 10)}`).join("\n") || "- none"}`,
      ];
      setContext(lines.join("\n"));
    })();
  }, []);

  const modelLabel = useMemo(() => MODELS.find((m) => m.id === model)?.label ?? model, [model]);

  const callAI = async (msgs: Msg[]) => {
    return supabase.functions.invoke<{ text?: string; error?: string }>("admin-ai", {
      body: {
        messages: msgs,
        model,
        mode,
        context: useContext ? context : "",
      },
    });
  };

  const send = async (text?: string, templateMode?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt) return;
    if (templateMode) setMode(templateMode);
    const newMsgs: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    const { data, error } = await callAI(newMsgs);
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "AI failed");
      return;
    }
    setMessages([...newMsgs, { role: "assistant", content: data?.text ?? "" }]);
  };

  const regenerate = async (i: number) => {
    // re-run from the user message just before assistant i
    const upto = messages.slice(0, i).filter((_, idx) => idx <= i - 1);
    // ensure the last is a user message
    const lastUserIdx = [...upto].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    setLoading(true);
    const { data, error } = await callAI(upto);
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "AI failed");
      return;
    }
    const next = [...messages];
    next[i] = { role: "assistant", content: data?.text ?? "" };
    setMessages(next);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Admin AI Copilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Live platform context · {MODELS.length} models · 9 quick templates · regenerate · copy.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 rounded-lg border border-border bg-card px-2 text-xs"
          >
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <button
            onClick={() => setUseContext((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs ${
              useContext ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-surface-2"
            }`}
            title="Inject live platform stats into the system prompt"
          >
            <Database className="h-3.5 w-3.5" /> Live context {useContext ? "ON" : "OFF"}
          </button>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setMode(""); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs hover:bg-surface-2">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </header>

      {/* Template chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {TEMPLATES.map((t) => {
          const Icon = t.icon;
          const active = mode === t.mode;
          return (
            <button
              key={t.id}
              onClick={() => { setMode(t.mode); setInput(t.prompt); }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs ${
                active ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-card border border-border p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="text-base font-semibold">How can I help you run Fluxa today?</div>
            <div className="text-xs text-muted-foreground max-w-md">
              Pick a template above, or type your own request. Currently using <span className="text-primary">{modelLabel}</span>.
            </div>
            {useContext && context && (
              <details className="mt-2 max-w-xl w-full text-left">
                <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                  Show live context that will be sent
                </summary>
                <pre className="mt-2 text-[11px] whitespace-pre-wrap bg-surface-2 border border-border rounded-lg p-3">{context}</pre>
              </details>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border/60"}`}>
              {m.role === "assistant" ? (
                <>
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
                    <button onClick={() => copy(m.content)} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                    <button onClick={() => regenerate(i)} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
                      <RotateCcw className="h-3 w-3" /> Regenerate
                    </button>
                  </div>
                </>
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div className="bg-surface-2 border border-border/60 rounded-2xl px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking with {modelLabel}…
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-card border border-border p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={mode ? `Mode: ${mode} · type details…` : "Ask the admin AI… (Shift+Enter for newline)"}
          className="flex-1 min-h-12 max-h-40 bg-transparent outline-none text-sm resize-y px-2"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
        </button>
      </div>
    </div>
  );
}
