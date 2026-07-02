import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Zap, Code2, Eye, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LumoLogo } from "@/components/lumo/LumoLogo";

const examples = [
  "Create a moderation bot with warn, mute, kick and ban",
  "Add a ticket system with a dashboard channel",
  "Build an economy bot with daily rewards & shop",
  "Welcome bot with custom banner and role menu",
];

const navLinks = [
  { to: "/templates", label: "Templates" },
  { to: "/pricing", label: "Pricing" },
  { to: "/docs", label: "Docs" },
  { to: "/changelog", label: "Changelog" },
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
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <LumoLogo />
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm text-muted-foreground transition hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
              <Link to="/projects">Dashboard <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex"><Link to="/signin">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary-glow text-white">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-4xl px-4 pt-10 pb-20 sm:pt-16">
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> AI DISCORD BOT BUILDER
          </div>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">
            Build Discord bots by <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">just chatting</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Describe what your bot should do — Lumo writes the full discord.js project, keeps memory across turns, and exports a production-ready ZIP.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border bg-card/60 p-3 shadow-2xl backdrop-blur-xl">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the Discord bot you want to build…"
            rows={3}
            className="resize-none border-0 bg-transparent text-base focus-visible:ring-0"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(prompt); }}
          />
          <div className="flex items-center justify-between gap-2 px-1 pt-2">
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border px-2 py-1">🤖 discord.js v14</span>
              <span className="rounded-md border border-border px-2 py-1">Node.js</span>
            </div>
            <Button onClick={() => start(prompt)} disabled={!prompt.trim() || creating}
              className="bg-gradient-to-r from-primary to-primary-glow">
              {creating ? "Starting…" : <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
          {examples.map((ex) => (
            <button key={ex} onClick={() => setPrompt(ex)}
              className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground">
              {ex}
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-xs uppercase tracking-wider text-muted-foreground">Bot categories Lumo builds</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground/80">
          {["Moderation", "Tickets", "Economy", "Music", "Leveling", "Giveaways", "AI Chat", "Dashboard"].map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>

        <section className="mt-20">
          <h2 className="text-center text-2xl font-semibold">Everything you need to ship a Discord bot</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">From idea to a running bot in minutes.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature icon={<Sparkles />} title="AI Bot Builder" desc="Generate full discord.js projects from a prompt." />
            <Feature icon={<Eye />} title="Project Memory" desc="Iterate turn after turn — Lumo remembers every file." />
            <Feature icon={<Rocket />} title="Export ZIP" desc="Download a production-ready project, run it anywhere." />
            <Feature icon={<Code2 />} title="Full Source" desc="Own every line — commands, events, database." />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumo. Build Discord bots with AI.
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 transition hover:border-primary/40">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
