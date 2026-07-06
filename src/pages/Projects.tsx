import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Trash2, Search, Bot } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { LumoShell } from "@/components/lumo/LumoShell";

interface Project { id: string; title: string; updated_at: string; }

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("builder_projects").select("id,title,updated_at").order("updated_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function create() {
    if (!user) return;
    const { data, error } = await supabase
      .from("builder_projects").insert({ user_id: user.id, title: "Untitled Bot" }).select("id").single();
    if (error) return toast.error(error.message);
    navigate(`/build/${data.id}`);
  }

  useEffect(() => { if (params.get("new") === "1") create(); /* eslint-disable-next-line */ }, []);

  async function remove(id: string) {
    if (!confirm("Delete this bot?")) return;
    const { error } = await supabase.from("builder_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <LumoShell title="My Bots" action={
      <Button onClick={create} className="text-white" style={{ background: "var(--gradient-primary)" }}>
        <Plus className="mr-1 h-4 w-4" />New Bot
      </Button>
    }>
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your bots…" className="pl-9 bg-card border-border h-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No bots yet. Start your first build.</p>
          <Button className="mt-4 bg-gradient-to-r from-primary to-primary-glow" onClick={create}>
            <Plus className="mr-1 h-4 w-4" />Create bot
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, idx) => (
            <div key={p.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-xl transition-all hover-lift hover:border-primary/40 animate-fade-up" style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>
              <Link to={`/build/${p.id}`} className="block">
                <div className="relative h-32 overflow-hidden" style={{ background: "var(--gradient-aurora)" }}>
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.3), transparent 40%)"
                  }} />
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "16px 16px"
                  }} />
                  <Bot className="absolute bottom-3 left-3 h-9 w-9 text-white/95 drop-shadow-lg transition-transform group-hover:scale-110" />
                </div>
                <div className="p-4">
                  <h3 className="truncate font-display font-semibold">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
              <button onClick={() => remove(p.id)}
                className="absolute right-2 top-2 rounded-md bg-black/50 p-1.5 text-white/80 opacity-0 backdrop-blur transition hover:bg-destructive/60 hover:text-white group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </LumoShell>
  );
}
