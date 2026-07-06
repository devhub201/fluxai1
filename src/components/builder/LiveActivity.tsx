import { useEffect, useMemo, useRef, useState } from "react";
import { FileCode, Sparkles, CheckCircle2, Loader2, Bot } from "lucide-react";
import { parseLovFiles } from "./parseLovFiles";
import { cn } from "@/lib/utils";

interface Props {
  streaming: string | null;
  isLoading: boolean;
  files: Record<string, string>;
  projectTitle: string;
}

/**
 * Lovable-style live activity feed. Shows what Lumo is currently doing:
 * - thinking / narrative snippets
 * - files being written (with a live "writing…" state on the last partial)
 * - files completed
 */
export function LiveActivity({ streaming, isLoading, files, projectTitle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isLoading) return;
    const i = setInterval(() => setNow(Date.now()), 400);
    return () => clearInterval(i);
  }, [isLoading]);

  const { events, currentFile, narrative } = useMemo(() => {
    if (!streaming) return { events: [] as { path: string; done: boolean }[], currentFile: null as string | null, narrative: "" };
    const parsed = parseLovFiles(streaming);
    const done = parsed.files.map((f) => ({ path: f.path, done: true }));
    // Detect currently-open (partial) file
    const openMatch = streaming.match(/<lov-file\s+path="([^"]+)"\s*>(?![\s\S]*<\/lov-file>)/);
    const currentFile = openMatch ? openMatch[1] : null;
    const events = currentFile ? [...done, { path: currentFile, done: false }] : done;
    return { events, currentFile, narrative: parsed.narrative };
  }, [streaming]);

  const completedPaths = Object.keys(files);
  const allEvents = events.length > 0 ? events : completedPaths.map((p) => ({ path: p, done: true }));

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [allEvents.length, currentFile]);

  const hasAnything = allEvents.length > 0 || isLoading || streaming;

  return (
    <div className="relative flex h-full flex-col overflow-hidden aurora-bg">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] bg-background/40 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isLoading ? "animate-pulse-glow" : "",
          )} style={{ background: "var(--gradient-primary)" }}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">{projectTitle}</div>
            <div className="text-[11px] text-muted-foreground">
              {isLoading ? "● Building live…" : allEvents.length > 0 ? `● ${allEvents.filter(e => e.done).length} files ready` : "● Waiting for prompt"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Lumo Live
        </div>
      </div>

      {/* Activity feed */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        {!hasAnything ? (
          <EmptyHero />
        ) : (
          <div className="mx-auto max-w-2xl space-y-2">
            {narrative && (
              <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm leading-relaxed text-foreground/90 backdrop-blur animate-fade-in">
                {narrative.slice(0, 500)}{narrative.length > 500 ? "…" : ""}
              </div>
            )}
            {allEvents.map((e, i) => (
              <ActivityRow key={`${e.path}-${i}`} path={e.path} done={e.done} isLast={i === allEvents.length - 1} />
            ))}
            {isLoading && allEvents.length === 0 && (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="animate-shimmer bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                  Lumo is thinking…
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats footer */}
      {completedPaths.length > 0 && (
        <div className="relative z-10 border-t border-white/[0.06] bg-background/40 px-4 py-2.5 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center gap-4 text-[11px] text-muted-foreground">
            <span><b className="text-foreground">{completedPaths.length}</b> files</span>
            <span><b className="text-foreground">{completedPaths.filter(p => p.startsWith("src/commands/")).length}</b> commands</span>
            <span><b className="text-foreground">{completedPaths.filter(p => p.startsWith("src/events/")).length}</b> events</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ path, done, isLast }: { path: string; done: boolean; isLast: boolean }) {
  const label = path.startsWith("src/commands/") ? "Command" :
    path.startsWith("src/events/") ? "Event" :
    path === "package.json" ? "Package config" :
    path === "README.md" ? "Documentation" :
    path === ".env.example" ? "Env template" :
    path.startsWith("src/utils/") ? "Utility" :
    "File";

  return (
    <div className={cn(
      "group flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2.5 backdrop-blur-sm transition-all animate-fade-up",
      !done && "border-primary/30 bg-primary/[0.04]",
    )}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2">
        {done ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span>{done ? "Wrote" : "Writing"}</span>
          <span className="text-primary">·</span>
          <span>{label}</span>
        </div>
        <div className="truncate font-mono text-xs text-foreground/90">{path}</div>
      </div>
      {!done && (
        <FileCode className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />
      )}
    </div>
  );
}

function EmptyHero() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center pt-16 text-center animate-fade-up">
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 animate-blob opacity-40 blur-2xl" style={{ background: "var(--gradient-aurora)" }} />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-2xl" style={{ background: "var(--gradient-primary)" }}>
          <Bot className="h-7 w-7 text-white" />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold">Ready when you are</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Tell Lumo what your Discord bot should do. Watch it build every command, event and file — live.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-1.5 text-[11px] text-muted-foreground">
        {["moderation", "tickets", "economy", "music", "AI chat", "welcome"].map((t) => (
          <span key={t} className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">{t}</span>
        ))}
      </div>
    </div>
  );
}
