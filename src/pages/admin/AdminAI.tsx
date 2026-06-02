import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, User, Bot, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Draft a launch announcement for a new AI Image Studio tool.",
  "Write a polite email asking inactive users to come back, offer 200 bonus credits.",
  "Summarize what a healthy week of moderation flags should look like.",
  "Suggest 5 new AI tools we could ship next, with credit pricing.",
  "Plan a 7-day credit promo with daily themes.",
];

export default function AdminAI() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const prompt = (text ?? input).trim();
    if (!prompt) return;
    const newMsgs: Msg[] = [...messages, { role: "user", content: prompt }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>("admin-ai", {
      body: { messages: newMsgs },
    });
    setLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "AI failed");
      return;
    }
    setMessages([...newMsgs, { role: "assistant", content: data?.text ?? "" }]);
  };

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <header className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Admin AI Copilot
          </h1>
          <p className="text-sm text-muted-foreground">Ask anything — draft announcements, plan tools, summarize data, write copy.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-xs hover:bg-surface-2">
            <Trash2 className="h-3.5 w-3.5" /> Clear chat
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto rounded-2xl bg-card border border-border p-4 space-y-3">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div className="text-base font-semibold">How can I help you run Fluxa today?</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full mt-3">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-left rounded-xl border border-border/60 bg-surface-2 hover:border-primary/40 hover:text-primary p-3 text-xs">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-2 border border-border/60"}`}>
              {m.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
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
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
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
          placeholder="Ask the admin AI… (Shift+Enter for newline)"
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
