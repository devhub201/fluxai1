import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, CheckCircle2, Clock, Flag, MessageSquare, RefreshCw, Shield, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminData } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FlagRow = {
  id: string;
  status: string;
  reason: string;
  target_type: string;
  target_id: string | null;
  created_at: string;
};

export default function StaffPanel() {
  const { messages, chats, users, loading, refresh } = useAdminData();
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [aiPrompt, setAiPrompt] = useState("Summarize today’s risky messages and suggest actions.");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadFlags = async () => {
    const { data } = await supabase
      .from("moderation_flags")
      .select("id,status,reason,target_type,target_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setFlags((data ?? []) as FlagRow[]);
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const reviewFlag = async (id: string, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("moderation_flags").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Flag ${status}`);
    loadFlags();
  };

  const askAi = async () => {
    if (!aiPrompt.trim()) return toast.error("Ask something first");
    setAiLoading(true);
    setAiOutput("");
    const context = messages.slice(0, 12).map((m) => `${m.role}: ${m.content.slice(0, 220)}`).join("\n");
    const { data, error } = await supabase.functions.invoke<{ text?: string; error?: string }>("tool-run", {
      body: {
        toolId: "text-summarizer",
        prompt: `${aiPrompt}\n\nStaff context:\n${context || "No recent messages."}`,
        creditCost: 0,
        dailyCredits: 0,
        mode: "fast",
      },
    });
    setAiLoading(false);
    if (error || data?.error) return toast.error(data?.error ?? error?.message ?? "AI failed");
    setAiOutput(data?.text ?? "No answer returned.");
  };

  const openFlags = flags.filter((flag) => flag.status === "open").length;
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u.display_name ?? "Unnamed"])), [users]);

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link to="/chat" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-3">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to app
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold inline-flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" /> Staff Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Moderation workspace only for staff and admins.</p>
          </div>
          <Button variant="outline" onClick={() => { refresh(); loadFlags(); }} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Metric icon={Flag} label="Open Flags" value={openFlags.toString()} />
          <Metric icon={MessageSquare} label="Recent Messages" value={messages.length.toString()} />
          <Metric icon={UserRound} label="Users Visible" value={users.length.toString()} />
          <Metric icon={Clock} label="Active Chats" value={chats.length.toString()} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-4">
          <section className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold">Moderation Flags</h2>
              <span className="text-xs text-muted-foreground">{flags.length} total</span>
            </div>
            {flags.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No flags yet.</div>
            ) : flags.map((flag) => (
              <div key={flag.id} className="p-4 border-b border-border last:border-0 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Flag className="h-4 w-4 text-primary" /> {flag.reason || "Review requested"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{flag.target_type} · {flag.target_id?.slice(0, 8) ?? "unknown"} · {new Date(flag.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] rounded-full border border-border px-2 py-1 text-muted-foreground">{flag.status}</span>
                  {flag.status === "open" && <Button size="sm" variant="outline" onClick={() => reviewFlag(flag.id, "dismissed")}>Dismiss</Button>}
                  {flag.status === "open" && <Button size="sm" onClick={() => reviewFlag(flag.id, "resolved")}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div className="text-sm font-semibold inline-flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Staff AI</div>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="w-full min-h-28 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60" />
            <Button onClick={askAi} disabled={aiLoading} className="w-full gap-2"><Sparkles className="h-4 w-4" /> {aiLoading ? "Thinking…" : "Ask Staff AI"}</Button>
            {aiOutput && <div className="rounded-xl bg-surface-2/60 border border-border p-3 text-sm whitespace-pre-wrap text-muted-foreground">{aiOutput}</div>}
          </section>
        </div>

        <section className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold">Latest Messages</h2></div>
          {messages.slice(0, 12).map((message) => (
            <div key={message.id} className="px-4 py-3 border-b border-border last:border-0 text-sm">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium truncate">{userById.get(message.user_id) ?? message.user_id.slice(0, 8)}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(message.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

const Metric = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <div className="h-10 w-10 rounded-xl border border-primary/30 bg-primary/10 text-primary flex items-center justify-center mb-3"><Icon className="h-5 w-5" /></div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);