import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Zap, Code2, Eye, Rocket, Bot, Shield, Ticket, Coins, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LumoLogo } from "@/components/lumo/LumoLogo";

const examples = [
  "Build a moderation bot with warn, mute, kick, ban and modlog",
  "Ticket system with categories and transcripts",
  "Economy bot with daily rewards, shop and gambling",
  "AI chat companion with memory per user",
  "Music bot with queue, skip, loop and shuffle",
  "Giveaways with entry buttons and auto winner picking",
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  async function start(text: string) {
    if (!text.trim()) return;
    if (!user) {
      sessionStorage.setItem("pending-prompt", text);
      navigate("/signin");
      return;
    }
    setCreating(true);
    try {
      const title = text.length > 60 ? text.slice(0, 57) + "…" : text;
      const { data, error } = await supabase
        .from("builder_projects").insert({ user_id: user.id, title }).select("id").single();
      if (error) throw error;
      sessionStorage.setItem(`builder-initial-${data.id}`, text);
      navigate(`/build/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
      setCreating(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden aurora-bg">
      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <LumoLogo />
        <nav className="hidden items-center gap-7 md:flex">
          <Link to="/templates" className="text-sm text-muted-foreground transition hover:text-foreground">Templates</Link>
          <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">Features</a>
          <a href="#how" className="text-sm text-muted-foreground transition hover:text-foreground">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="text-white" style={{ background: "var(--gradient-primary)" }}>
              <Link to="/home">Dashboard <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex"><Link to="/signin">Sign in</Link></Button>
              <Button asChild size="sm" className="text-white" style={{ background: "var(--gradient-primary)" }}>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pt-10 pb-20 sm:pt-20">
        <div className="text-center animate-fade-up">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            AI DISCORD BOT BUILDER · LIVE
          </div>
          <h1 className="font-display mt-6 text-5xl font-bold tracking-tight sm:text-7xl">
            Build Discord bots<br />by <span className="gradient-text">just chatting</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Describe your bot in plain English. Watch Lumo write every command, event and file — live — then export a production-ready project.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/[0.08] bg-card/60 p-3 shadow-2xl backdrop-blur-xl animate-fade-up gradient-border" style={{ animationDelay: "0.1s" }}>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your Discord bot… e.g. a moderation bot with modlog, ticket system, and AI chat channel."
            rows={3}
            className="resize-none border-0 bg-transparent text-base focus-visible:ring-0"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(prompt); }}
          />
          <div className="flex items-center justify-between gap-2 px-1 pt-2">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1">🤖 discord.js v14</span>
              <span className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 hidden sm:inline">Node.js</span>
            </div>
            <Button onClick={() => start(prompt)} disabled={!prompt.trim() || creating}
              className="text-white shadow-lg shadow-primary/40" style={{ background: "var(--gradient-primary)" }}>
              {creating ? "Starting…" : <>Build it <ArrowRight className="ml-1 h-4 w-4" /></>}
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {examples.map((ex) => (
            <button key={ex} onClick={() => setPrompt(ex)}
              className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              {ex}
            </button>
          ))}
        </div>

        <section id="features" className="mt-28">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to <span className="gradient-text">ship a bot</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">From idea to a running Discord bot in minutes.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={<Sparkles />} title="Live AI builder" desc="Watch Lumo write every file in real-time, Lovable-style." />
            <Feature icon={<Eye />} title="Project memory" desc="Iterate turn after turn — Lumo remembers every file." />
            <Feature icon={<Rocket />} title="Export ZIP" desc="Own the source — download a production-ready Node.js project." />
            <Feature icon={<Code2 />} title="50+ templates" desc="Moderation, tickets, economy, music, AI chat and more." />
          </div>
        </section>

        <section id="how" className="mt-28">
          <div className="text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How Lumo <span className="gradient-text">builds your bot</span></h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Step n="1" title="Describe" desc="Type what your bot should do. Any feature, any complexity." />
            <Step n="2" title="Watch it build" desc="Lumo streams every command, event and file live in the preview." />
            <Step n="3" title="Iterate & export" desc="Chat to refine, then export the ZIP and run anywhere." />
          </div>
        </section>

        <section className="mt-28 rounded-3xl border border-white/[0.08] bg-card/40 p-8 backdrop-blur-xl md:p-12 gradient-border">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">Every bot category, <span className="gradient-text">covered.</span></h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Whether it's a full moderation suite, an economy with gambling, a music player, or an AI chat companion — Lumo ships production-grade code.
              </p>
              <Button asChild className="mt-6 text-white" style={{ background: "var(--gradient-primary)" }}>
                <Link to="/templates">Browse templates <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: "Moderation", grad: "from-red-500 to-orange-500" },
                { icon: Ticket, label: "Tickets", grad: "from-cyan-500 to-blue-500" },
                { icon: Coins, label: "Economy", grad: "from-amber-500 to-yellow-500" },
                { icon: Music, label: "Music", grad: "from-indigo-500 to-blue-500" },
                { icon: Bot, label: "AI Chat", grad: "from-sky-500 to-cyan-500" },
                { icon: Sparkles, label: "Fun", grad: "from-pink-500 to-fuchsia-500" },
              ].map((c) => (
                <div key={c.label} className={`aspect-square rounded-xl bg-gradient-to-br ${c.grad} flex flex-col items-center justify-center gap-1 shadow-lg hover-lift`}>
                  <c.icon className="h-6 w-6 text-white" />
                  <span className="text-[10px] font-medium text-white/90">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumo. Build Discord bots with AI.
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-5 backdrop-blur-xl transition hover-lift hover:border-primary/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <h3 className="font-display mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-card/40 p-6 backdrop-blur-xl">
      <div className="font-display text-5xl font-bold gradient-text">{n}</div>
      <h3 className="font-display mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
