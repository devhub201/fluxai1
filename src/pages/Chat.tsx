import { useEffect, useRef, useState, FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, MessageCircle, Code2, Image as ImageIcon, Globe2, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/fluxa-logo.png";

type Msg = { id?: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: Code2, label: "Generate a React landing page" },
  { icon: ImageIcon, label: "Explain async/await like I'm 5" },
  { icon: Globe2, label: "Translate this to Hindi" },
  { icon: FileText, label: "Summarize a long article" },
];

const Chat = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load messages when chatId changes
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

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // Cleanup any in-flight stream on unmount
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (e?: FormEvent, override?: string) => {
    e?.preventDefault();
    const text = (override ?? input).trim();
    if (!text || streaming || !user) return;

    setInput("");
    let activeChatId = chatId;

    // Create chat if needed
    if (!activeChatId) {
      const title = text.slice(0, 60);
      const { data, error } = await supabase
        .from("chats")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error || !data) { toast.error(error?.message ?? "Failed to start chat"); return; }
      activeChatId = data.id;
      window.dispatchEvent(new Event("chats:refresh"));
      navigate(`/chat/${activeChatId}`, { replace: true });
    }

    // Persist user message
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    const { error: insErr } = await supabase
      .from("messages")
      .insert({ chat_id: activeChatId, user_id: user.id, role: "user", content: text });
    if (insErr) { toast.error(insErr.message); return; }

    setStreaming(true);
    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (resp.status === 429) { toast.error("Rate limit exceeded. Please slow down."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("AI credits exhausted. Add funds in Settings → Workspace → Usage."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) {
        const err = await resp.text().catch(() => "");
        toast.error(err || "Failed to start stream");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // flush leftovers
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "" || !raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Persist assistant message
      if (assistantSoFar) {
        await supabase
          .from("messages")
          .insert({ chat_id: activeChatId, user_id: user.id, role: "assistant", content: assistantSoFar });
        // Auto-title chat on first turn
        if (messages.length === 0) {
          await supabase.from("chats").update({ title: text.slice(0, 60) }).eq("id", activeChatId);
          window.dispatchEvent(new Event("chats:refresh"));
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Connection error. Try again.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 py-10 max-w-2xl mx-auto">
            <div className="relative w-32 h-32 flex items-center justify-center mb-6">
              <div className="absolute inset-0 green-orb rounded-full blur-xl" />
              <div className="absolute inset-2 rounded-full border border-primary/40" />
              <div className="absolute inset-6 rounded-full border border-primary/25" />
              <div className="relative h-14 w-14 rounded-2xl bg-surface-2 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center">How can I help you today?</h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">Ask anything. I reply in your language.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(undefined, s.label)}
                  className="px-4 py-3 rounded-xl border border-border bg-surface-2 hover:bg-surface text-left text-sm flex items-center gap-3"
                >
                  <s.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.map((m, i) => (
              <MessageBubble key={m.id ?? i} msg={m} />
            ))}
            {streaming && messages[messages.length - 1]?.role === "user" && <TypingBubble />}
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-border bg-background/80 backdrop-blur px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 resize-none max-h-40 rounded-2xl bg-surface-2 border border-border/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary/60 transition-colors"
            disabled={streaming}
            maxLength={4000}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="max-w-3xl mx-auto mt-2 text-[10px] text-muted-foreground text-center">
          Fluxa AI can make mistakes. Verify important information.
        </p>
      </form>
    </div>
  );
};

const MessageBubble = ({ msg }: { msg: Msg }) => {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 border border-primary/30 px-4 py-2.5 text-sm">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <img src={logo} alt="Fluxa" width={28} height={28} className="h-7 w-7 rounded-full shrink-0 mt-1" />
      <div className="flex-1 min-w-0 prose-msg">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
};

const TypingBubble = () => (
  <div className="flex items-start gap-3">
    <img src={logo} alt="Fluxa" width={28} height={28} className="h-7 w-7 rounded-full shrink-0 mt-1" />
    <div className="flex items-center gap-1.5 px-4 py-3">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  </div>
);

export default Chat;
