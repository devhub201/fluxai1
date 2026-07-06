import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBuilderProject } from "@/hooks/useBuilderProject";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { LiveActivity } from "@/components/builder/LiveActivity";
import { BotInfoPane } from "@/components/builder/BotInfoPane";
import { FileExplorer } from "@/components/builder/FileExplorer";
import { CodeViewer } from "@/components/builder/CodeViewer";
import { parseLovFiles } from "@/components/builder/parseLovFiles";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Bot, Files, Loader2, Activity, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

export default function Builder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, files, messages, loading, saveFiles, addMessage, setMessages, setFiles } =
    useBuilderProject(id);

  const [streaming, setStreaming] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"activity" | "overview" | "code">("activity");
  const [mobileView, setMobileView] = useState<"chat" | "preview">("preview");
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (autoSentRef.current || loading || !project) return;
    const initial = sessionStorage.getItem(`builder-initial-${id}`);
    if (initial && messages.length === 0) {
      autoSentRef.current = true;
      sessionStorage.removeItem(`builder-initial-${id}`);
      send(initial);
    }
  }, [loading, project, messages.length, id]);

  // Auto-switch to overview once build completes
  useEffect(() => {
    if (!isLoading && Object.keys(files).length > 0 && rightTab === "activity" && !streaming) {
      // stay on activity, user can click
    }
  }, [isLoading, files, rightTab, streaming]);

  async function send(text: string) {
    if (!id || isLoading) return;
    setIsLoading(true);
    setStreaming("");
    setRightTab("activity");

    const tempUser = {
      id: `temp-${Date.now()}`,
      role: "user" as const,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUser]);
    addMessage("user", text);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          projectId: id,
          userMessage: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          currentFiles: files,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      const writtenPaths = new Set<string>();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreaming(accumulated);

        const { files: parsed } = parseLovFiles(accumulated);
        const fresh: Record<string, string> = {};
        for (const f of parsed) {
          if (!writtenPaths.has(f.path) || files[f.path] !== f.content) {
            writtenPaths.add(f.path);
            fresh[f.path] = f.content;
          }
        }
        if (Object.keys(fresh).length) setFiles((prev) => ({ ...prev, ...fresh }));
      }

      const { files: finalFiles, narrative } = parseLovFiles(accumulated);
      const updates: Record<string, string> = {};
      finalFiles.forEach((f) => { updates[f.path] = f.content; });
      if (Object.keys(updates).length) await saveFiles(updates);

      const finalAssistantText = narrative || (finalFiles.length
        ? `Shipped ${finalFiles.length} file${finalFiles.length === 1 ? "" : "s"}. 🚀`
        : accumulated.trim() || "Done.");
      await addMessage("assistant", finalAssistantText);

      if (finalFiles.length > 0) setRightTab("overview");
    } catch (e: any) {
      toast.error(e.message || "Generation failed");
      await addMessage("assistant", `❌ ${e.message || "Generation failed"}`);
    } finally {
      setStreaming(null);
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center aurora-bg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 aurora-bg">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline" size="sm"><Link to="/projects">Back to bots</Link></Button>
      </div>
    );
  }

  const paths = Object.keys(files);
  const commandCount = paths.filter((p) => p.startsWith("src/commands/")).length;
  const eventCount = paths.filter((p) => p.startsWith("src/events/")).length;

  const RightPanel = (
    <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)} className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] bg-background/40 px-3 pt-2 backdrop-blur">
        <TabsList className="bg-transparent">
          <TabsTrigger value="activity" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Activity className="mr-1.5 h-3.5 w-3.5" />Live
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Bot className="mr-1.5 h-3.5 w-3.5" />Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Files className="mr-1.5 h-3.5 w-3.5" />Code
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="activity" className="flex-1 overflow-hidden m-0">
        <LiveActivity streaming={streaming} isLoading={isLoading} files={files} projectTitle={project.title} />
      </TabsContent>
      <TabsContent value="overview" className="flex-1 overflow-hidden m-0">
        <BotInfoPane projectTitle={project.title} files={files} />
      </TabsContent>
      <TabsContent value="code" className="flex-1 overflow-hidden m-0">
        <div className="flex h-full">
          <div className="w-52 border-r border-white/[0.06] overflow-y-auto bg-background/40">
            <FileExplorer files={files} activePath={activePath} onSelect={setActivePath} />
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeViewer path={activePath} content={activePath ? files[activePath] : null} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="flex h-screen flex-col aurora-bg">
      <header className="relative z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-background/60 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-lg" style={{ background: "var(--gradient-primary)" }}>
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold leading-tight">{project.title}</div>
              <span className="hidden rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-primary sm:inline">Discord</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={isLoading ? "text-primary" : "text-emerald-400"}>
                {isLoading ? "● Generating…" : "● Ready"}
              </span>
              <span>·</span>
              <span>{paths.length} files</span>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          <HeaderStat label="cmds" value={commandCount} />
          <HeaderStat label="events" value={eventCount} />
          <HeaderStat label="files" value={paths.length} />
        </div>
      </header>

      {/* Mobile */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as any)} className="flex h-full flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat"><MessageSquare className="mr-1 h-3.5 w-3.5" />Chat</TabsTrigger>
            <TabsTrigger value="preview"><Sparkles className="mr-1 h-3.5 w-3.5" />Live</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
            <ChatPanel messages={messages} streaming={streaming} isLoading={isLoading} onSend={send} />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
            {RightPanel}
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[400px] lg:w-[440px] border-r border-white/[0.06] flex flex-col">
          <ChatPanel messages={messages} streaming={streaming} isLoading={isLoading} onSend={send} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {RightPanel}
        </div>
      </div>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px]">
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
