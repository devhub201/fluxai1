import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Trash2, Search, Sparkles } from "lucide-react";
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
      .from("builder_projects").insert({ user_id: user.id, title: "Untitled Project" }).select("id").single();
    if (error) return toast.error(error.message);
    navigate(`/build/${data.id}`);
  }

  useEffect(() => { if (params.get("new") === "1") create(); /* eslint-disable-next-line */ }, []);

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("builder_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  const filtered = projects.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <LumoShell title="Projects" action={
      <Button onClick={create} className="bg-gradient-to-r from-primary to-primary-glow">
        <Plus className="mr-1 h-4 w-4" />New Project
      </Button>
    }>
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects…" className="pl-9 bg-card border-border" />
      </div>

      <div className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
        {["All", "Recent", "Starred", "Archived"].map((t, i) => (
          <button key={t} className={`rounded-md px-3 py-1.5 transition ${i === 0 ? "bg-surface-2 text-foreground" : "hover:bg-surface-2"}`}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">No projects yet. Start your first build.</p>
          <Button className="mt-4 bg-gradient-to-r from-primary to-primary-glow" onClick={create}>
            <Plus className="mr-1 h-4 w-4" />Create project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
              <Link to={`/build/${p.id}`} className="block">
                <div className="relative h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-card">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-white/50" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="truncate font-medium">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </p>
                </div>
              </Link>
              <button onClick={() => remove(p.id)}
                className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition hover:bg-destructive/20 hover:text-destructive group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </LumoShell>
  );
}
