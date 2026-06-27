import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2, Sparkles, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  title: string;
  updated_at: string;
}

export default function Projects() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase
      .from("builder_projects")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  async function create() {
    if (!user) return;
    const { data, error } = await supabase
      .from("builder_projects")
      .insert({ user_id: user.id, title: "Untitled app" })
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    navigate(`/build/${data.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("builder_projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-semibold">Lovable Builder</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon"><Link to="/settings"><SettingsIcon className="h-4 w-4" /></Link></Button>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My projects</h1>
          <Button onClick={create}><Plus className="mr-1 h-4 w-4" />New project</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : projects.length === 0 ? (
          <div className="mt-12 rounded-xl border border-dashed bg-muted/20 p-12 text-center">
            <p className="text-sm text-muted-foreground">No projects yet.</p>
            <Button className="mt-4" onClick={create}><Plus className="mr-1 h-4 w-4" />Create your first app</Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <div key={p.id} className="group relative rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-sm">
                <Link to={`/build/${p.id}`} className="block">
                  <h3 className="truncate font-medium">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </p>
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
