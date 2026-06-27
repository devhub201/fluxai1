import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Sparkles, Zap, Code2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const examples = [
  "A todo app with dark mode and local storage",
  "A landing page for a coffee shop with menu",
  "A pomodoro timer with sound and history",
  "A markdown notes app with search",
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
        .from("builder_projects")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error) throw error;
      sessionStorage.setItem(`builder-initial-${data.id}`, text);
      navigate(`/build/${data.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create project");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Lovable Builder</span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild size="sm" variant="ghost"><Link to="/projects">My projects</Link></Button>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost"><Link to="/signin">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-12 pb-20 sm:pt-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> AI app builder
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
            Build apps by chatting.
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Describe what you want. Watch it appear live, with code you can read and edit.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border bg-background p-3 shadow-sm">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the app you want to build…"
            rows={3}
            className="resize-none border-0 text-base focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(prompt);
            }}
          />
          <div className="flex items-center justify-between px-1 pt-2">
            <span className="text-xs text-muted-foreground hidden sm:block">⌘ + Enter to start</span>
            <Button onClick={() => start(prompt)} disabled={!prompt.trim() || creating}>
              {creating ? "Starting…" : "Build it"} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          <Feature icon={<Zap className="h-5 w-5" />} title="Instant preview" desc="See your app render live as the AI types it." />
          <Feature icon={<Code2 className="h-5 w-5" />} title="Real code" desc="React + Tailwind files you can read and download." />
          <Feature icon={<Eye className="h-5 w-5" />} title="Iterate by chat" desc="Ask for changes — add a button, change colors, anything." />
        </div>
      </main>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
