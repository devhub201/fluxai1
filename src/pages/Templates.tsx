import { LumoShell } from "@/components/lumo/LumoShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bot, Shield, Ticket, Coins, MessageSquare, Music, Trophy, Gift, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const templates = [
  { id: "mod", name: "Moderation", desc: "warn / mute / kick / ban with a mod-log channel and audit trail.", icon: Shield, gradient: "from-red-500/80 to-orange-500/80", prompt: "Create a moderation bot with warn, mute, kick, ban, purge and a mod-log channel. Include permission checks and ephemeral replies." },
  { id: "ticket", name: "Ticket System", desc: "Support tickets with a panel, categories and transcripts.", icon: Ticket, gradient: "from-cyan-500/80 to-blue-500/80", prompt: "Build a ticket system: a panel with a Create Ticket button, per-user private channels, close button and transcript on close." },
  { id: "economy", name: "Economy", desc: "Coins, daily rewards, shop and leaderboard.", icon: Coins, gradient: "from-amber-500/80 to-yellow-500/80", prompt: "Make an economy bot: /balance, /daily, /work, /shop, /buy, /leaderboard with JSON persistence." },
  { id: "welcome", name: "Welcome & Roles", desc: "Greeting messages, autoroles, reaction role menu.", icon: Sparkles, gradient: "from-pink-500/80 to-fuchsia-500/80", prompt: "Welcome bot: greet new members in a channel, assign an autorole, and provide a /rolemenu command with buttons for self-assigned roles." },
  { id: "level", name: "Leveling", desc: "XP per message, level-up embeds and rank card.", icon: Trophy, gradient: "from-violet-500/80 to-purple-500/80", prompt: "Leveling bot: XP per message with cooldown, level-up announcement, /rank and /leaderboard commands." },
  { id: "giveaway", name: "Giveaways", desc: "Timed giveaways with entries via button.", icon: Gift, gradient: "from-emerald-500/80 to-teal-500/80", prompt: "Giveaway bot: /gstart command creates a giveaway embed with an Enter button, ends after the given duration and picks a random winner." },
  { id: "music", name: "Music", desc: "Play, pause, queue, skip using @discordjs/voice.", icon: Music, gradient: "from-indigo-500/80 to-blue-500/80", prompt: "Music bot using @discordjs/voice and play-dl: /play, /pause, /resume, /skip, /queue, /stop. Include README steps for ffmpeg." },
  { id: "aichat", name: "AI Chat", desc: "Talk to the bot in a channel — powered by Lovable AI.", icon: MessageSquare, gradient: "from-sky-500/80 to-cyan-500/80", prompt: "AI chat bot: messages in a designated channel are answered by the AI. Include a /setchannel command and use the AI gateway with the LOVABLE_API_KEY env var." },
];

export default function Templates() {
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const nav = useNavigate();

  async function use(t: typeof templates[number]) {
    if (!user) return nav("/signin");
    const { data, error } = await supabase
      .from("builder_projects").insert({ user_id: user.id, title: `${t.name} Bot` }).select("id").single();
    if (error) return toast.error(error.message);
    sessionStorage.setItem(`builder-initial-${data.id}`, t.prompt);
    nav(`/build/${data.id}`);
  }

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <LumoShell title="Templates">
      <p className="mb-6 max-w-xl text-sm text-muted-foreground">
        Instant starting points. Pick one — Lumo generates the full discord.js project and drops you into the builder to keep chatting.
      </p>
      <div className="mb-6 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bot templates…" className="pl-9 bg-card border-border h-11" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
            <div className={`relative h-32 bg-gradient-to-br ${t.gradient}`}>
              <t.icon className="absolute bottom-4 left-4 h-8 w-8 text-white drop-shadow" />
            </div>
            <div className="p-5">
              <h3 className="font-semibold">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
              <Button onClick={() => use(t)} size="sm" className="mt-4 w-full bg-gradient-to-r from-primary to-primary-glow">
                <Bot className="mr-1.5 h-3.5 w-3.5" /> Use template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </LumoShell>
  );
}
