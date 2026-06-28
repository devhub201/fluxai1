import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Sparkles, Rocket, LayoutTemplate, Plug, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [stats, setStats] = useState({ projects: 0, deployments: 0 });
  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("builder_projects").select("*", { count: "exact", head: true });
      const { count: dep } = await supabase.from("published_sites").select("*", { count: "exact", head: true });
      setStats({ projects: count ?? 0, deployments: dep ?? 0 });
    })();
  }, []);

  return (
    <LumoShell title="Home">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8">
        <h2 className="text-2xl font-semibold md:text-3xl">Welcome back 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick up where you left off, or start something new.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-to-r from-primary to-primary-glow">
            <Link to="/projects?new=1"><Sparkles className="mr-1.5 h-4 w-4" />Start a new build</Link>
          </Button>
          <Button asChild variant="outline"><Link to="/templates">Browse templates</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Projects" value={stats.projects} icon={<Sparkles className="h-4 w-4" />} />
        <Stat label="Deployments" value={stats.deployments} icon={<Rocket className="h-4 w-4" />} />
        <Stat label="Plan" value="Pro" icon={<LayoutTemplate className="h-4 w-4" />} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <QuickCard to="/projects" title="AI Builder" desc="Chat with Lumo to build & edit your apps." icon={<Sparkles />} />
        <QuickCard to="/deployments" title="Deployments" desc="Manage and monitor your live sites." icon={<Rocket />} />
        <QuickCard to="/integrations" title="Integrations" desc="Connect Vercel, Supabase, GitHub, more." icon={<Plug />} />
        <QuickCard to="/templates" title="Templates" desc="Start from a beautiful starting point." icon={<LayoutTemplate />} />
      </div>
    </LumoShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickCard({ to, title, desc, icon }: any) {
  return (
    <Link to={to} className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition hover:border-primary/50 hover:bg-card/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
    </Link>
  );
}
