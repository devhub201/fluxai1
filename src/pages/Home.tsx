import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Bot, Sparkles, Zap, Shield, Ticket, Coins, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Project { id: string; title: string; updated_at: string; }

export default function Home() {
  const [stats, setStats] = useState({ projects: 0 });
  const [recent, setRecent] = useState<Project[]>([]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("builder_projects").select("*", { count: "exact", head: true });
      const { data } = await supabase
        .from("builder_projects").select("id,title,updated_at")
        .order("updated_at", { ascending: false }).limit(4);
      setStats({ projects: count ?? 0 });
      setRecent((data ?? []) as Project[]);
    })();
  }, []);

  const ideas = [
    { icon: Shield, label: "Moderation bot", prompt: "Create a moderation bot with warn, mute, kick, ban and a mod log channel" },
    { icon: Ticket, label: "Ticket system", prompt: "Build a ticket system with a support panel, ticket transcripts and staff-only channels" },
    { icon: Coins, label: "Economy bot", prompt: "Make an economy bot with daily rewards, coins, a shop and a leaderboard" },
    { icon: Zap, label: "Welcome + roles", prompt: "Welcome bot with custom greeting image, autoroles and a reaction role menu" },
  ];

  async function startFrom(prompt: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const title = prompt.split(" ").slice(0, 6).join(" ");
    const { data } = await supabase.from("builder_projects").insert({ user_id: user.id, title }).select("id").single();
    if (data) {
      sessionStorage.setItem(`builder-initial-${data.id}`, prompt);
      window.location.href = `/build/${data.id}`;
    }
  }

  return (
    <LumoShell title="Home">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-8 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI DISCORD BOT BUILDER
          </div>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            Build any Discord bot by <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">just chatting</span>.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Describe your bot. Lumo writes the full discord.js project — commands, events, database — and exports a production-ready ZIP.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild className="bg-gradient-to-r from-primary to-primary-glow shadow-lg shadow-primary/30">
              <Link to="/projects?new=1"><Sparkles className="mr-1.5 h-4 w-4" />Start a new bot</Link>
            </Button>
            <Button asChild variant="outline"><Link to="/templates">Browse templates</Link></Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Your bots" value={stats.projects} icon={<Bot className="h-4 w-4" />} />
        <Stat label="Framework" value="discord.js v14" icon={<Zap className="h-4 w-4" />} />
        <Stat label="Runtime" value="Node.js" icon={<Sparkles className="h-4 w-4" />} />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Start with an idea</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ideas.map((i) => (
            <button
              key={i.label}
              onClick={() => startFrom(i.prompt)}
              className="group text-left rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <i.icon className="h-5 w-5" />
              </div>
              <div className="mt-3 font-semibold">{i.label}</div>
              <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.prompt}</div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                Build this <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent bots</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((p) => (
              <Link
                key={p.id}
                to={`/build/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/50"
              >
                <div className="relative h-24 bg-gradient-to-br from-primary/40 via-primary/10 to-transparent">
                  <Bot className="absolute bottom-3 left-3 h-6 w-6 text-white/70" />
                </div>
                <div className="p-4">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </LumoShell>
  );
}

function Stat({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
