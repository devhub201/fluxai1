import { useEffect, useRef, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Send, Sparkles, ImagePlus, Globe, Telescope, Paperclip, X,
  MessageSquare, Mail, FileText, Megaphone, ScrollText, PenLine, Square,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/fluxa-logo.png";
import { CodeBlock } from "@/components/CodeBlock";

type Attachment = { kind: "image"; dataUrl: string; name?: string } | { kind: "text"; text: string; name?: string };
type Msg = { id?: string; role: "user" | "assistant"; content: string; attachments?: Attachment[] };
type Mode = "chat" | "image" | "search" | "deep";

const WRITING_TEMPLATES = [
  { icon: Megaphone, label: "Announcement", prompt: "Write a clear, exciting announcement about: " },
  { icon: Mail, label: "Email", prompt: "Write a professional email about: " },
  { icon: ScrollText, label: "Letter", prompt: "Write a formal letter regarding: " },
  { icon: FileText, label: "Application", prompt: "Write a formal application for: " },
  { icon: PenLine, label: "Essay", prompt: "Write a well-structured essay on: " },
  { icon: MessageSquare, label: "Message", prompt: "Write a thoughtful message about: " },
];

const SUGGESTIONS = [
  "Generate an image of a futuristic city at sunset",
  "Search the latest AI news today",
  "Write a React landing page for a SaaS",
  "Explain quantum computing in simple terms",
];

const looksLikeImagePrompt = (text: string) => {
  const value = text.toLowerCase().trim();
  return (
    /^\/image\b/.test(value) ||
    /\b(generate|create|make|draw|design|render)\b[\s\S]{0,90}\b(image|picture|photo|art|poster|logo|wallpaper|avatar|illustration)\b/.test(value) ||
    /\b(image|picture|photo|art|poster|logo|wallpaper|avatar|illustration)\b[\s\S]{0,90}\b(of|for|about)\b/.test(value)
  );
};

const Chat = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([]);
    if (!chatId) return;
    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) { toast.error(error.message); return; }
      if (data) setMessages(data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
    })();
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files).slice(0, 5)) {
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} too large (max 8MB)`); continue; }
      if (f.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(f); });
        next.push({ kind: "image", dataUrl, name: f.name });
      } else if (f.type.startsWith("text/") || /\.(txt|md|json|csv|js|ts|tsx|py|html|css)$/i.test(f.name)) {
        const text = await f.text();
        next.push({ kind: "text", text: text.slice(0, 30000), name: f.name });
      } else {
        toast.error(`Unsupported: ${f.name}`);
      }
    }
    setAttachments((a) => [...a, ...next]);
  };

  const stop = () => { abortRef.current?.abort(); abortRef.current = null; setStreaming(false); };

  const send = async (e?: FormEvent, override?: string, modeOverride?: Mode) => {
    e?.preventDefault();
    const text = (override ?? input).trim();
    if ((!text && attachments.length === 0) || streaming || !user) return;
    const useMode = modeOverride ?? (mode === "chat" && looksLikeImagePrompt(text) ? "image" : mode);

    setInput("");
    setShowTemplates(false);
    let activeChatId = chatId;

    if (!activeChatId) {
      const title = text.slice(0, 60) || "New Chat";
      const { data, error } = await supabase.from("chats").insert({ user_id: user.id, title }).select("id").single();
      if (error || !data) { toast.error(error?.message ?? "Failed to start chat"); return; }
      activeChatId = data.id;
      window.dispatchEvent(new Event("chats:refresh"));
      navigate(`/chat/${activeChatId}`, { replace: true });
    }

    const userMsg: Msg = { role: "user", content: text, attachments: attachments.length ? attachments : undefined };
    setMessages((p) => [...p, userMsg]);
    const currentAttachments = attachments;
    setAttachments([]);

    await supabase.from("messages").insert({
      chat_id: activeChatId, user_id: user.id, role: "user",
      content: text + (currentAttachments.length ? `\n\n_[${currentAttachments.length} attachment(s)]_` : ""),
    });

    setStreaming(true);
    let assistantSoFar = "";
    const upsert = (chunk: string, replace = false) => {
      if (replace) assistantSoFar = chunk;
      else assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          mode: useMode,
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content, attachments: m.attachments })),
        }),
        signal: controller.signal,
      });

      if (resp.status === 429) { toast.error("Rate limit hit. Slow down."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) { toast.error((await resp.text().catch(() => "")) || "Stream failed"); setStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, i); buf = buf.slice(i + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(j);
            const delta = p.choices?.[0]?.delta;
            if (delta?.replace !== undefined) upsert(delta.replace, true);
            else if (delta?.content) upsert(delta.content);
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      if (assistantSoFar) {
        await supabase.from("messages").insert({ chat_id: activeChatId, user_id: user.id, role: "assistant", content: assistantSoFar });
        if (messages.length === 0) {
          await supabase.from("chats").update({ title: text.slice(0, 60) || "New Chat" }).eq("id", activeChatId);
          window.dispatchEvent(new Event("chats:refresh"));
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") { console.error(e); toast.error("Connection error."); }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const modes: { id: Mode; label: string; icon: any; hint: string }[] = [
    { id: "chat", label: "Chat", icon: Sparkles, hint: "Default conversation" },
    { id: "image", label: "Image", icon: ImagePlus, hint: "Generate an image" },
    { id: "search", label: "Search", icon: Globe, hint: "Live web search" },
    { id: "deep", label: "Deep Research", icon: Telescope, hint: "Multi-source report" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 py-10 max-w-3xl mx-auto">
            <div className="relative w-28 h-28 flex items-center justify-center mb-5">
              <div className="absolute inset-0 green-orb rounded-full blur-2xl" />
              <img src={logo} alt="Fluxa" className="relative h-16 w-16 rounded-2xl" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center">How can I help you today?</h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">Chat, generate images, search the web, or run deep research — all in one place.</p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {WRITING_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => setInput(t.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-surface-2 hover:border-primary/40 text-xs">
                  <t.icon className="h-3.5 w-3.5 text-primary" /> {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(undefined, s)}
                  className="px-4 py-3 rounded-xl border border-border bg-surface-2 hover:bg-surface hover:border-primary/40 text-left text-sm transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((m, i) => <Bubble key={m.id ?? i} msg={m} />)}
            {streaming && messages[messages.length - 1]?.role === "user" && <Typing />}
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-border bg-background/80 backdrop-blur px-4 py-3">
        <div className="max-w-3xl mx-auto">
          {/* Mode pills */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
            {modes.map((m) => {
              const active = mode === m.id;
              return (
                <button key={m.id} type="button" onClick={() => setMode(m.id)} title={m.hint}
                  className={`flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                    active ? "bg-primary/15 border-primary/50 text-primary" : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}>
                  <m.icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              );
            })}
          </div>

          {/* Writing templates dropdown */}
          {showTemplates && (
            <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {WRITING_TEMPLATES.map((t) => (
                <button key={t.label} type="button"
                  onClick={() => { setInput(t.prompt); setShowTemplates(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface-2 hover:border-primary/40 text-xs">
                  <t.icon className="h-3.5 w-3.5 text-primary" /> {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-surface-2 border border-border text-xs">
                  {a.kind === "image" ? <img src={a.dataUrl} alt="" className="h-6 w-6 rounded object-cover" /> : <FileText className="h-3.5 w-3.5" />}
                  <span className="max-w-[120px] truncate">{a.name ?? a.kind}</span>
                  <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" multiple accept="image/*,text/*,.md,.json,.csv,.js,.ts,.tsx,.py,.html,.css"
              className="hidden" onChange={(e) => { handleFiles(e.target.files); if (fileRef.current) fileRef.current.value = ""; }} />
            <button type="button" onClick={() => fileRef.current?.click()} title="Attach files/images"
              className="h-11 w-11 shrink-0 rounded-xl bg-surface-2 border border-border flex items-center justify-center hover:border-primary/40">
              <Paperclip className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setShowTemplates((v) => !v)} title="Writing templates"
              className={`h-11 w-11 shrink-0 rounded-xl border flex items-center justify-center ${showTemplates ? "bg-primary/15 border-primary/40 text-primary" : "bg-surface-2 border-border hover:border-primary/40"}`}>
              <PenLine className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={mode === "image" ? "Describe an image to generate..." : mode === "search" ? "Ask anything — I'll search the web..." : mode === "deep" ? "Topic to deeply research..." : "Ask anything..."}
              rows={1}
              className="flex-1 resize-none max-h-40 min-h-[44px] rounded-xl bg-surface-2 border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary/60"
              disabled={streaming}
              maxLength={6000}
            />
            {streaming ? (
              <button type="button" onClick={stop} className="h-11 w-11 shrink-0 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive flex items-center justify-center" aria-label="Stop">
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button type="submit" disabled={!input.trim() && attachments.length === 0}
                className="h-11 w-11 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            Fluxa AI · {mode === "deep" ? "Deep Research (slower, multi-source)" : mode === "search" ? "Live web search" : mode === "image" ? "Image generation" : "Verify important info"}
          </p>
        </div>
      </form>
    </div>
  );
};

const Bubble = ({ msg }: { msg: Msg }) => {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] space-y-2">
          {msg.attachments?.filter((a) => a.kind === "image").map((a, i) => (
            <img key={i} src={(a as any).dataUrl} alt="" className="rounded-xl max-h-64 ml-auto" />
          ))}
          {msg.content && (
            <div className="rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-4 py-2.5 text-sm whitespace-pre-wrap">
              {msg.content}
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 animate-in fade-in duration-200">
      <img src={logo} alt="Fluxa" className="h-7 w-7 rounded-full shrink-0 mt-1" />
      <div className="flex-1 min-w-0 prose-msg">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children }: any) {
              if (inline) return <code className={className}>{children}</code>;
              return <CodeBlock className={className}>{children}</CodeBlock>;
            },
            pre({ children }: any) { return <>{children}</>; },
            img({ src, alt }: any) { return <img src={src} alt={alt} className="rounded-xl my-3 max-w-full" />; },
            a({ href, children }: any) { return <a href={href} target="_blank" rel="noreferrer" className="text-primary underline">{children}</a>; },
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

const Typing = () => (
  <div className="flex items-start gap-3">
    <img src={logo} alt="Fluxa" className="h-7 w-7 rounded-full shrink-0 mt-1" />
    <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
      <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span className="animate-pulse">Fluxa is thinking...</span>
    </div>
  </div>
);

export default Chat;
