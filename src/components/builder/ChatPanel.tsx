import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BuilderMessage } from "@/hooks/useBuilderProject";

interface Props {
  messages: BuilderMessage[];
  streaming: string | null;
  isLoading: boolean;
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, streaming, isLoading, onSend }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const submit = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    onSend(t);
    setInput("");
  };

  const cleanedStream = streaming
    ? streaming.replace(/<lov-file[^>]*>[\s\S]*?(<\/lov-file>|$)/g, "📄 writing files…").trim()
    : null;

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {messages.length === 0 && !streaming && (
          <div className="mx-auto max-w-md py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold">Describe what to build</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try: "A todo app with dark mode" or "A landing page for my coffee shop"
            </p>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((m) => (
            <Message key={m.id} role={m.role} content={m.content} />
          ))}
          {cleanedStream && <Message role="assistant" content={cleanedStream} streaming />}
          {isLoading && !streaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>
      <div className="border-t bg-background p-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a change or new feature…"
            rows={1}
            className="min-h-[44px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            disabled={isLoading}
          />
          <Button onClick={submit} disabled={isLoading || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted",
          streaming && "animate-pulse",
        )}
      >
        {content || (streaming ? "…" : "")}
      </div>
    </div>
  );
}
