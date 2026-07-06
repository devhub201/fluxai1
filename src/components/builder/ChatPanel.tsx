import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Sparkles, Bot, User } from "lucide-react";
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => { inputRef.current?.focus(); }, [isLoading]);

  const submit = () => {
    const t = input.trim();
    if (!t || isLoading) return;
    onSend(t);
    setInput("");
  };

  // Show streaming narrative without lov-file blocks — just the assistant's chat text.
  const cleanedStream = streaming
    ? streaming.replace(/<lov-file[\s\S]*?(<\/lov-file>|$)/g, "").trim()
    : null;

  const showStreamBubble = cleanedStream && cleanedStream.length > 0;
  const showBuildingIndicator = isLoading && streaming && !showStreamBubble;

  return (
    <div className="flex h-full flex-col bg-background/40 backdrop-blur-xl">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-5 sm:px-5">
        {messages.length === 0 && !streaming && (
          <div className="mx-auto max-w-md py-12 text-center animate-fade-up">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-display text-lg font-semibold">Chat with Lumo</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              "Build a moderation bot with warn, mute, kick, ban and modlog"
            </p>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {messages.map((m) => (
            <Message key={m.id} role={m.role} content={m.content} />
          ))}
          {showStreamBubble && <Message role="assistant" content={cleanedStream!} streaming />}
          {(isLoading && !showStreamBubble) && (
            <div className="flex items-center gap-2 pl-10 text-sm text-muted-foreground animate-fade-in">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="animate-shimmer bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                {showBuildingIndicator ? "Writing your bot…" : "Thinking…"}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-white/[0.06] bg-background/60 p-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 focus-within:border-primary/40 transition-colors">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Lumo anything… add a command, fix a bug, iterate."
            rows={1}
            className="min-h-[38px] resize-none border-0 bg-transparent px-2 focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            disabled={isLoading}
          />
          <Button onClick={submit} disabled={isLoading || !input.trim()} size="icon"
            className="h-9 w-9 shrink-0 rounded-xl text-white"
            style={{ background: input.trim() && !isLoading ? "var(--gradient-primary)" : undefined }}>
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
    <div className={cn("flex gap-3 animate-fade-up", isUser && "flex-row-reverse")}>
      <div className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
        isUser ? "bg-surface-2 text-muted-foreground" : "text-white",
      )} style={!isUser ? { background: "var(--gradient-primary)" } : undefined}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn(
        "min-w-0 whitespace-pre-wrap text-[14.5px] leading-relaxed",
        isUser ? "max-w-[85%] rounded-2xl bg-primary/90 px-4 py-2.5 text-white" : "flex-1 text-foreground/95",
        streaming && !isUser && "opacity-90",
      )}>
        {content || (streaming ? "…" : "")}
      </div>
    </div>
  );
}
