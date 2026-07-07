import { Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Bot, Sparkles, Zap, Shield, Ticket, Coins, ArrowRight, Music, MessageSquare, Trophy, Globe, Rocket } from "lucide-react";
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
    { icon: Shield, label: "Moderation Suite", prompt: "Build a complete moderation bot with warn, mute, kick, ban, unban, purge, lock, unlock, slowmode and a modlog channel.", grad: "from-red-500 to-orange-500" },
    { icon: Ticket, label: "Ticket System", prompt: "Build a ticket system with categories, private channels, staff claim, and HTML transcripts on close.", grad: "from-cyan-500 to-blue-500" },
    { icon: Coins, label: "Economy + Casino", prompt: "Full economy bot with daily, work, shop, gambling, slots, blackjack and a leaderboard.", grad: "from-amber-500 to-yellow-500" },
    { icon: Music, label: "Music Player", prompt: "Music bot with play, pause, skip, queue, loop, shuffle using @discordjs/voice.", grad: "from-indigo-500 to-blue-500" },
    { icon: MessageSquare, label: "AI Chat Bot", prompt: "AI chat companion with per-user memory using Lovable AI in a designated channel.", grad: "from-sky-500 to-cyan-500" },
    { icon: Trophy, label: "Leveling System", prompt: "Leveling bot with XP per message, level-up embeds, rank cards, and role rewards.", grad: "from-violet-500 to-purple-500" },
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

  // Live floating background icons
  const floaters = useMemo(() => {
    const icons = [Bot, Shield, Ticket, Coins, Music, MessageSquare, Trophy, Sparkles, Zap, Rocket, Globe];
    return Array.from({ length: 14 }, (_, i) => ({
      Icon: icons[i % icons.length],
      left: `${(i * 37) % 100}%`,
      top: `${(i * 53) % 100}%`,
      delay: `${(i * 0.7) % 8}s`,
      dur: `${8 + (i % 5) * 2}s`,
      size: 20 + ((i * 7) % 26),
    }));
  }, []);

  return (
    <LumoShell title="Home">
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-card/40 p-8 backdrop-blur-xl md:p-12 gradient-border animate-fade-up">
        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full opacity-40 blur-3xl animate-blob" style={{ background: "var(--gradient-aurora)" }} />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-52 w-52 rounded-full opacity-30 blur-3xl animate-blob" style={{ background: "var(--gradient-primary)", animationDelay: "3s" }} />

        {/* Live floating icons background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {floaters.map((f, i) => (
            <f.Icon
              key={i}
              className="absolute text-primary/20 animate-float"
              style={{
                left: f.left,
                top: f.top,
                width: f.size,
                height: f.size,
                animationDelay: f.delay,
                animationDuration: f.dur,
              }}
            />
          ))}
        </div>

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI DISCORD BOT BUILDER · 2026
          </div>
          <h2 className="font-display max-w-2xl text-4xl font-bold tracking-tight md:text-5xl">
            Ship any Discord bot by <span className="gradient-text">just chatting</span>.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Describe your bot. Watch Lumo write every command, event, and file — live. Export a production-ready project when you're happy.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild className="text-white shadow-lg shadow-primary/30" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/projects?new=1"><Sparkles className="mr-1.5 h-4 w-4" />Start a new bot</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/[0.08] bg-white/[0.02]"><Link to="/templates">Browse 60+ templates</Link></Button>
            <Button asChild variant="outline" className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"><Link to="/cloner"><Globe className="mr-1.5 h-4 w-4" />Clone a website</Link></Button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Your bots" value={stats.projects} icon={<Bot className="h-4 w-4" />} />
        <Stat label="Framework" value="discord.js v14" icon={<Zap className="h-4 w-4" />} />
        <Stat label="Runtime" value="Node.js 20+" icon={<Sparkles className="h-4 w-4" />} />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold">Start with an idea</h3>
            <p className="text-xs text-muted-foreground">One click — Lumo builds the whole thing.</p>
          </div>
          <Link to="/templates" className="text-xs text-primary hover:underline">All templates →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((i) => (
            <button
              key={i.label}
              onClick={() => startFrom(i.prompt)}
              className="group text-left overflow-hidden rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-xl transition-all hover-lift hover:border-primary/40"
            >
              <div className={`relative h-24 bg-gradient-to-br ${i.grad} overflow-hidden`}>
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "14px 14px"
                }} />
                <i.icon className="absolute bottom-3 left-3 h-7 w-7 text-white drop-shadow" />
              </div>
              <div className="p-4">
                <div className="font-display font-semibold">{i.label}</div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{i.prompt}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary opacity-0 transition group-hover:opacity-100">
                  Build this <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold">Recent bots</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((p) => (
              <Link
                key={p.id}
                to={`/build/${p.id}`}
                className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-card/40 backdrop-blur-xl transition hover-lift hover:border-primary/40"
              >
                <div className="relative h-24 overflow-hidden" style={{ background: "var(--gradient-aurora)" }}>
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
                    backgroundSize: "14px 14px"
                  }} />
                  <Bot className="absolute bottom-3 left-3 h-6 w-6 text-white/90 drop-shadow" />
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
    <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className="font-display mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
