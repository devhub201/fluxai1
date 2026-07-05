import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useBuilderProject } from "@/hooks/useBuilderProject";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { BotInfoPane } from "@/components/builder/BotInfoPane";
import { FileExplorer } from "@/components/builder/FileExplorer";
import { CodeViewer } from "@/components/builder/CodeViewer";
import { parseLovFiles } from "@/components/builder/parseLovFiles";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, MessageSquare, Bot, Files, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [mobileView, setMobileView] = useState<"chat" | "preview" | "code">("preview");
  const autoSentRef = useRef(false);

  // Auto-send the initial prompt passed from landing.
  useEffect(() => {
    if (autoSentRef.current || loading || !project) return;
    const initial = sessionStorage.getItem(`builder-initial-${id}`);
    if (initial && messages.length === 0) {
      autoSentRef.current = true;
      sessionStorage.removeItem(`builder-initial-${id}`);
      send(initial);
    }
  }, [loading, project, messages.length, id]);

  async function send(text: string) {
    if (!id || isLoading) return;
    setIsLoading(true);
    setStreaming("");

    // Optimistic user message
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

        // Incrementally flush completed files to preview.
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

      // Final flush + persist
      const { files: finalFiles, narrative } = parseLovFiles(accumulated);
      const updates: Record<string, string> = {};
      finalFiles.forEach((f) => { updates[f.path] = f.content; });
      if (Object.keys(updates).length) await saveFiles(updates);

      const finalAssistantText = narrative || (finalFiles.length
        ? `Updated ${finalFiles.length} file${finalFiles.length === 1 ? "" : "s"}.`
        : accumulated.trim() || "Done.");
      await addMessage("assistant", finalAssistantText);
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
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <Button asChild variant="outline" size="sm"><Link to="/projects">Back to projects</Link></Button>
      </div>
    );
  }

  const paths = Object.keys(files);
  const commandCount = paths.filter((p) => p.startsWith("src/commands/")).length;
  const eventCount = paths.filter((p) => p.startsWith("src/events/")).length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Project context header */}
      <header className="flex items-center justify-between gap-3 border-b bg-card/60 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-md shadow-primary/30">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">{project.title}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className={isLoading ? "text-primary" : ""}>
                {isLoading ? "● Generating…" : "● Ready"}
              </span>
              <span>·</span>
              <span>Discord bot</span>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex">
          <HeaderStat label="Files" value={paths.length} />
          <HeaderStat label="Cmds" value={commandCount} />
          <HeaderStat label="Events" value={eventCount} />
        </div>
      </header>


      {/* Mobile tabbed view */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <Tabs value={mobileView} onValueChange={(v) => setMobileView(v as any)} className="flex h-full flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-3">
            <TabsTrigger value="chat"><MessageSquare className="mr-1 h-3.5 w-3.5" />Chat</TabsTrigger>
            <TabsTrigger value="preview"><Bot className="mr-1 h-3.5 w-3.5" />Preview</TabsTrigger>
            <TabsTrigger value="code"><Files className="mr-1 h-3.5 w-3.5" />Code</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
            <ChatPanel messages={messages} streaming={streaming} isLoading={isLoading} onSend={send} />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
            <BotInfoPane projectTitle={project.title} files={files} />
          </TabsContent>
          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              <div className="w-44 border-r overflow-y-auto">
                <FileExplorer files={files} activePath={activePath} onSelect={setActivePath} />
              </div>
              <div className="flex-1 overflow-hidden">
                <CodeViewer path={activePath} content={activePath ? files[activePath] : null} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop split view */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <div className="w-[380px] lg:w-[420px] border-r flex flex-col">
          <ChatPanel messages={messages} streaming={streaming} isLoading={isLoading} onSend={send} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="preview" className="flex h-full flex-col">
            <div className="border-b px-3 pt-2">
              <TabsList>
                <TabsTrigger value="preview"><Bot className="mr-1 h-3.5 w-3.5" />Preview</TabsTrigger>
                <TabsTrigger value="code"><Files className="mr-1 h-3.5 w-3.5" />Code</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="preview" className="flex-1 overflow-hidden m-0">
              <BotInfoPane projectTitle={project.title} files={files} />
            </TabsContent>
            <TabsContent value="code" className="flex-1 overflow-hidden m-0">
              <div className="flex h-full">
                <div className="w-56 border-r overflow-y-auto">
                  <FileExplorer files={files} activePath={activePath} onSelect={setActivePath} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CodeViewer path={activePath} content={activePath ? files[activePath] : null} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
