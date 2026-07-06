import { LumoShell } from "@/components/lumo/LumoShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Bot, Shield, Ticket, Coins, MessageSquare, Music, Trophy, Gift, Sparkles,
  Users, Bell, Calendar, Gamepad2, Image as ImgIcon, Zap, Heart, Radio, Vote,
  Megaphone, BookOpen, DollarSign, Cloud, Hammer, Star, Camera, Film, Globe,
  ChefHat, Dumbbell, Palette, Rocket, Brain, Cat, Dog, Pizza, Coffee, Tv,
  Newspaper, Package, PartyPopper, ShieldAlert, Sword, Wand2, Cpu, LineChart,
  Languages, Lock, Mic, Headphones,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  desc: string;
  icon: any;
  gradient: string;
  category: string;
  prompt: string;
};

const templates: Template[] = [
  // ---------- Moderation ----------
  { id: "mod-full", name: "Full Moderation Suite", desc: "Warn, mute, kick, ban, unban, purge, lock, unlock, slowmode with a modlog.", icon: Shield, gradient: "from-red-500 to-orange-500", category: "Moderation", prompt: "Build a complete moderation bot with warn, mute (timeout), unmute, kick, ban, unban, purge, lock, unlock, slowmode commands, plus a modlog channel that logs every action with embeds. Include permission checks and ephemeral replies." },
  { id: "automod", name: "AutoMod / Anti-Spam", desc: "Auto-detect spam, links, caps, invite links, bad words.", icon: ShieldAlert, gradient: "from-rose-500 to-red-600", category: "Moderation", prompt: "Auto-moderation bot: detect spam (5+ msgs in 5s), mass mentions, invite links, discord.gg links, excessive caps, and a configurable bad-word list. Warn on first offense, mute on second." },
  { id: "antiraid", name: "Anti-Raid", desc: "Lock the server when a raid is detected, alert staff.", icon: Lock, gradient: "from-red-600 to-pink-600", category: "Moderation", prompt: "Anti-raid bot: detect 10+ joins in 30 seconds, auto-enable verification level, kick/ban raid accounts younger than 1 day, ping staff role, and log everything." },
  { id: "verify", name: "Verification Gate", desc: "Users must click a button + solve captcha to enter.", icon: Shield, gradient: "from-emerald-500 to-teal-500", category: "Moderation", prompt: "Verification bot: post a panel with a Verify button, on click show a modal with a simple math captcha, on success give the Member role and remove Unverified." },

  // ---------- Tickets & Support ----------
  { id: "tickets", name: "Ticket System", desc: "Panel + private ticket channels + transcripts.", icon: Ticket, gradient: "from-cyan-500 to-blue-500", category: "Support", prompt: "Build a ticket system: panel with Create Ticket button, per-user private channel, category picker (Support / Billing / Report), close button, and HTML transcript sent to a log channel on close." },
  { id: "helpdesk", name: "Helpdesk with Categories", desc: "Multiple ticket categories with different staff roles.", icon: MessageSquare, gradient: "from-sky-500 to-indigo-500", category: "Support", prompt: "Advanced helpdesk: dropdown ticket panel with 5 categories (General, Billing, Technical, Report User, Partnership), each routes to a different staff role, includes claim/unclaim, and ratings after close." },
  { id: "suggestions", name: "Suggestions Board", desc: "/suggest command with vote buttons and status.", icon: Megaphone, gradient: "from-yellow-500 to-orange-500", category: "Support", prompt: "Suggestions bot: /suggest command posts to a suggestions channel with upvote/downvote buttons, staff can /approve, /deny, /consider with reason." },

  // ---------- Economy ----------
  { id: "economy", name: "Economy System", desc: "Balance, daily, work, shop, gamble, leaderboard.", icon: Coins, gradient: "from-amber-500 to-yellow-500", category: "Economy", prompt: "Full economy bot: /balance, /daily, /weekly, /work, /beg, /rob, /gamble, /coinflip, /slots, /shop, /buy, /inventory, /leaderboard, /pay. Persist to JSON with cooldowns." },
  { id: "gambling", name: "Casino & Games", desc: "Slots, blackjack, roulette, coinflip with a wallet.", icon: DollarSign, gradient: "from-yellow-500 to-amber-600", category: "Economy", prompt: "Casino bot: /slots, /blackjack, /roulette, /coinflip, /dice, /higherlower. Track wins/losses per user, wallet, /leaderboard by winnings." },
  { id: "crypto", name: "Crypto Prices", desc: "Live BTC/ETH prices, alerts, portfolio tracking.", icon: LineChart, gradient: "from-orange-500 to-amber-500", category: "Economy", prompt: "Crypto bot: /price <symbol>, /convert, /alert set price alerts, /portfolio add/remove/show tracked coins. Use CoinGecko free API." },
  { id: "stocks", name: "Stock Tracker", desc: "Live stock quotes, watchlists, market movers.", icon: LineChart, gradient: "from-green-500 to-emerald-600", category: "Economy", prompt: "Stock market bot: /quote <ticker>, /chart, /watchlist add/remove/show, /movers gainers and losers. Use a free stocks API." },

  // ---------- Community ----------
  { id: "welcome", name: "Welcome & Autoroles", desc: "Custom greetings, autoroles, reaction roles.", icon: Sparkles, gradient: "from-pink-500 to-fuchsia-500", category: "Community", prompt: "Welcome bot: greet new members with an embed in a welcome channel, assign an autorole, /rolemenu creates a reaction-role panel with buttons for self-assign roles." },
  { id: "level", name: "Leveling System", desc: "XP per message, level-up embeds, rank card.", icon: Trophy, gradient: "from-violet-500 to-purple-500", category: "Community", prompt: "Leveling bot: XP per message with 60s cooldown, level-up announcement, /rank shows an image rank card, /leaderboard top 10, /setxp admin, role rewards at levels 5/10/25/50." },
  { id: "giveaway", name: "Giveaways", desc: "Timed giveaways with entry button + winner picker.", icon: Gift, gradient: "from-emerald-500 to-teal-500", category: "Community", prompt: "Giveaway bot: /gstart <duration> <prize> <winners>, embed with Enter button, /gend early end, /greroll pick new winner. Persist active giveaways so they survive restart." },
  { id: "birthdays", name: "Birthdays", desc: "Users register birthdays, bot announces daily.", icon: PartyPopper, gradient: "from-pink-500 to-rose-500", category: "Community", prompt: "Birthday bot: /setbirthday, /removebirthday, /nextbirthdays list upcoming. Cron every day at midnight — announce today's birthdays in a channel and give a Birthday role for 24h." },
  { id: "polls", name: "Polls & Voting", desc: "/poll with buttons, /pollmulti multiple options.", icon: Vote, gradient: "from-blue-500 to-indigo-500", category: "Community", prompt: "Polls bot: /poll <question> <options,comma,separated>, up to 10 options, button voting, live results, /pollend closes and posts winner." },
  { id: "reactionroles", name: "Reaction Roles", desc: "Menu with buttons/select for self-assign roles.", icon: Users, gradient: "from-purple-500 to-violet-500", category: "Community", prompt: "Reaction roles bot: /rolemenu create <title> add roles with emoji, users get roles by clicking buttons or picking from a dropdown. Persist menus." },
  { id: "confessions", name: "Anonymous Confessions", desc: "/confess to post anonymously in a channel.", icon: Lock, gradient: "from-slate-500 to-zinc-600", category: "Community", prompt: "Anonymous confessions bot: /confess opens a modal, posts the message anonymously in a confessions channel with an auto-incrementing #ID. Staff can trace with /trace <id>." },

  // ---------- Utility ----------
  { id: "reminders", name: "Reminders", desc: "/remind me in 10m, /remindlist, /remindcancel.", icon: Bell, gradient: "from-blue-500 to-cyan-500", category: "Utility", prompt: "Reminders bot: /remind me in <duration> <message>, /reminders list yours, /forget <id>. Persist to disk so they survive restarts." },
  { id: "calendar", name: "Event Calendar", desc: "Create events, RSVP, DM reminders.", icon: Calendar, gradient: "from-indigo-500 to-blue-600", category: "Utility", prompt: "Events bot: /event create <name> <datetime> <description>, embed with Going/Maybe/Not-going buttons, DM reminders 1h before, /events list upcoming." },
  { id: "weather", name: "Weather", desc: "/weather <city> current + 3-day forecast.", icon: Cloud, gradient: "from-sky-500 to-blue-500", category: "Utility", prompt: "Weather bot: /weather <city> current conditions, /forecast <city> 3-day forecast, /setlocation save default city. Use Open-Meteo free API." },
  { id: "translate", name: "Translator", desc: "/translate text to any language, right-click too.", icon: Languages, gradient: "from-green-500 to-teal-500", category: "Utility", prompt: "Translation bot: /translate <text> <target-language>, right-click Message > Translate context menu. Use Lovable AI (LOVABLE_API_KEY) with google/gemini-3-flash-preview." },
  { id: "afk", name: "AFK System", desc: "/afk sets you AFK, bot notifies on mention.", icon: Bell, gradient: "from-slate-500 to-gray-600", category: "Utility", prompt: "AFK bot: /afk <reason>, on mention the bot replies with the AFK reason and how long. Auto-remove AFK when the user sends a message." },
  { id: "help", name: "Custom Help", desc: "Auto-generated /help with categories & pagination.", icon: BookOpen, gradient: "from-teal-500 to-cyan-500", category: "Utility", prompt: "Custom help bot: /help auto-lists all commands grouped by category folder, paginated with Prev/Next buttons and a category dropdown." },

  // ---------- Fun & Games ----------
  { id: "trivia", name: "Trivia", desc: "Multiple-choice questions, score tracking.", icon: Brain, gradient: "from-purple-500 to-pink-500", category: "Fun", prompt: "Trivia bot: /trivia <category>, 4-button multiple choice, 15s timer, tracks score per user, /trivialeaderboard. Use OpenTDB free API." },
  { id: "8ball", name: "8-Ball & Random", desc: "8ball, roll, choose, coinflip, rate.", icon: Sparkles, gradient: "from-violet-500 to-fuchsia-500", category: "Fun", prompt: "Fun commands bot: /8ball, /roll NdN, /choose comma,separated,list, /coinflip, /rate <thing>, /gayrate, /iq, /howsimp, /howbot." },
  { id: "rps", name: "Rock Paper Scissors", desc: "Play RPS vs bot or challenge a friend.", icon: Gamepad2, gradient: "from-orange-500 to-red-500", category: "Fun", prompt: "RPS bot: /rps vs bot with buttons, /rpschallenge @user for a 1v1 match. Track wins per user." },
  { id: "hangman", name: "Hangman", desc: "Classic word-guessing game in Discord.", icon: Gamepad2, gradient: "from-lime-500 to-green-500", category: "Fun", prompt: "Hangman bot: /hangman starts a game with a random word, users guess letters with buttons or a modal, ASCII gallows updates." },
  { id: "wordle", name: "Wordle Clone", desc: "Daily Wordle inside Discord.", icon: Gamepad2, gradient: "from-emerald-500 to-green-600", category: "Fun", prompt: "Wordle-in-Discord bot: /wordle daily 5-letter word, users guess via modal, colored squares reveal per guess, /wordlestreak." },
  { id: "meme", name: "Memes & Jokes", desc: "/meme, /joke, /dadjoke from Reddit APIs.", icon: Sparkles, gradient: "from-yellow-500 to-amber-500", category: "Fun", prompt: "Memes bot: /meme random meme from r/memes, /joke, /dadjoke, /roast. Use Reddit JSON and free joke APIs." },
  { id: "cat", name: "Cat & Dog Pics", desc: "/cat, /dog, /fox, /panda cute animal pics.", icon: Cat, gradient: "from-pink-500 to-rose-500", category: "Fun", prompt: "Animal pics bot: /cat, /dog, /fox, /panda, /bird — random cute animal images via free public APIs." },
  { id: "anime", name: "Anime Search", desc: "/anime, /manga, /character info via Jikan API.", icon: Tv, gradient: "from-fuchsia-500 to-pink-600", category: "Fun", prompt: "Anime bot: /anime <query>, /manga <query>, /character <name>, /random anime. Use Jikan v4 free API." },

  // ---------- Music ----------
  { id: "music", name: "Music Player", desc: "Play, pause, queue, skip with @discordjs/voice.", icon: Music, gradient: "from-indigo-500 to-blue-500", category: "Music", prompt: "Music bot using @discordjs/voice and play-dl: /play <query or url>, /pause, /resume, /skip, /queue, /nowplaying, /stop, /volume, /loop, /shuffle. README with ffmpeg install steps." },
  { id: "radio", name: "24/7 Radio", desc: "Play looping lofi / genre streams.", icon: Radio, gradient: "from-purple-600 to-indigo-600", category: "Music", prompt: "24/7 radio bot: /radio <lofi|jazz|rock|edm>, plays a streaming URL forever in a voice channel, /stopradio, auto-rejoin on disconnect." },
  { id: "soundboard", name: "Soundboard", desc: "Play custom sound clips on demand.", icon: Mic, gradient: "from-pink-500 to-purple-600", category: "Music", prompt: "Soundboard bot: /soundboard shows buttons for custom sounds in ./sounds folder, /play <name>, /addsound uploads a new clip." },

  // ---------- AI ----------
  { id: "aichat", name: "AI Chat Companion", desc: "Chat with Lovable AI in a channel — with memory.", icon: MessageSquare, gradient: "from-sky-500 to-cyan-500", category: "AI", prompt: "AI chat bot: designated channel messages get replied by AI, keep per-user memory of last 20 messages. Use ai.gateway.lovable.dev with google/gemini-3-flash-preview and LOVABLE_API_KEY. /setchannel, /clearmemory." },
  { id: "aiimage", name: "AI Image Generation", desc: "/imagine prompt — AI-generated images.", icon: ImgIcon, gradient: "from-fuchsia-500 to-purple-600", category: "AI", prompt: "AI image generation bot: /imagine <prompt>, calls Lovable AI Gateway image generation endpoint, uploads the result. Handle rate limits." },
  { id: "aisummarize", name: "AI Summarizer", desc: "Right-click a message → summarize with AI.", icon: Brain, gradient: "from-violet-500 to-indigo-600", category: "AI", prompt: "AI summarizer bot: right-click Message > Summarize context menu, /summarize last <N> messages in this channel. Use Lovable AI." },
  { id: "aicode", name: "AI Code Helper", desc: "/explain, /debug, /refactor code snippets.", icon: Cpu, gradient: "from-blue-500 to-cyan-500", category: "AI", prompt: "AI code helper bot: /explain <code>, /debug <code>, /refactor <code> <language>, syntax-highlighted embeds. Use Lovable AI." },

  // ---------- Server Management ----------
  { id: "logger", name: "Server Logger", desc: "Log joins/leaves/edits/deletes to a channel.", icon: Newspaper, gradient: "from-slate-500 to-slate-700", category: "Server", prompt: "Server logger bot: logs member joins, leaves, message edits, message deletes, role changes, channel creates/deletes to a configurable log channel with pretty embeds." },
  { id: "autorole", name: "Autoroles", desc: "Assign roles on join, based on account age, etc.", icon: Users, gradient: "from-purple-500 to-indigo-500", category: "Server", prompt: "Autoroles bot: /autorole add/remove/list — assign roles automatically on join, with an optional minimum account-age filter." },
  { id: "sticky", name: "Sticky Messages", desc: "Message that always stays at the bottom.", icon: Package, gradient: "from-yellow-500 to-orange-500", category: "Server", prompt: "Sticky messages bot: /stick <message> keeps a message pinned at the bottom of a channel by reposting after every 5 new messages. /unstick to remove." },
  { id: "embed-builder", name: "Embed Builder", desc: "Interactive embed creator with preview.", icon: Palette, gradient: "from-pink-500 to-fuchsia-500", category: "Server", prompt: "Embed builder bot: /embed opens a modal for title/desc/color/image/footer, live preview with edit buttons, /send <channel> to post." },
  { id: "customcmds", name: "Custom Commands", desc: "Admins create /custom text commands via modal.", icon: Wand2, gradient: "from-violet-500 to-purple-600", category: "Server", prompt: "Custom commands bot: /addcmd name response, /delcmd, /listcmds. Persist to JSON so admins can create text responses without code." },
  { id: "backup", name: "Server Backup", desc: "Backup channels/roles config to JSON.", icon: Package, gradient: "from-emerald-500 to-teal-600", category: "Server", prompt: "Server backup bot: /backup create dumps roles, channels, categories to JSON. /backup list, /backup load restores (owner only)." },

  // ---------- Content ----------
  { id: "news", name: "News Feed", desc: "Post latest headlines from RSS feeds.", icon: Newspaper, gradient: "from-red-500 to-pink-600", category: "Content", prompt: "News bot: subscribe channels to RSS feeds via /addfeed <url>, checks every 10min, posts new items. /removefeed, /listfeeds." },
  { id: "youtube", name: "YouTube Notifier", desc: "Ping when a channel uploads.", icon: Film, gradient: "from-red-500 to-red-700", category: "Content", prompt: "YouTube notifier bot: /addyoutube <channel-id> <discord-channel>, polls RSS every 5min, posts new video with thumbnail." },
  { id: "twitch", name: "Twitch Live Alerts", desc: "Announce when a streamer goes live.", icon: Radio, gradient: "from-purple-600 to-fuchsia-600", category: "Content", prompt: "Twitch alerts bot: /addstreamer <name> <channel>, polls Twitch Helix API, posts a live embed with thumbnail when they go live." },
  { id: "quotes", name: "Daily Quotes", desc: "Random motivational quote every morning.", icon: Star, gradient: "from-amber-500 to-yellow-600", category: "Content", prompt: "Daily quote bot: cron at 9am posts a motivational quote to a channel, /quote random quote on demand. Use quotable.io API." },

  // ---------- Niche ----------
  { id: "gym", name: "Gym Buddy", desc: "Log workouts, streaks, PR tracker.", icon: Dumbbell, gradient: "from-orange-500 to-red-600", category: "Niche", prompt: "Gym tracker bot: /log <exercise> <weight> <reps>, /pr personal records, /streak workout streak, /leaderboard total volume. Persist per user." },
  { id: "recipes", name: "Recipe Finder", desc: "/recipe <ingredient> finds meals.", icon: ChefHat, gradient: "from-yellow-500 to-orange-600", category: "Niche", prompt: "Recipe bot: /recipe <ingredient>, /random random meal, /cuisine <type>. Use TheMealDB free API." },
  { id: "coffee", name: "Coffee Break", desc: "Random coffee facts, brew timers, coffee shop mode.", icon: Coffee, gradient: "from-amber-700 to-yellow-700", category: "Niche", prompt: "Coffee bot: /coffee fact, /brew <method> starts a timer with steps for pour-over/french-press/aeropress, /shop random cafe idea." },
  { id: "pet", name: "Virtual Pets", desc: "Adopt, feed, play — pets level up over time.", icon: Dog, gradient: "from-teal-500 to-emerald-500", category: "Niche", prompt: "Virtual pets bot: /adopt <name> <species>, /pet feed/play/sleep/pat, hunger + happiness + energy decrease over time, /petlb leaderboard of levels." },
  { id: "rpg", name: "Mini RPG", desc: "Battle monsters, gain XP, equip gear.", icon: Sword, gradient: "from-red-600 to-orange-700", category: "Niche", prompt: "Mini RPG bot: /hunt fight random monster, /inventory, /equip, /shop, /profile shows level/HP/gold, XP curve and simple loot table." },
  { id: "photo", name: "Photo Contest", desc: "Weekly photo prompt with voting.", icon: Camera, gradient: "from-pink-500 to-rose-600", category: "Niche", prompt: "Photo contest bot: /submit <image> for the weekly theme, users vote via reactions, /leaderboard weekly winners." },
  { id: "roast", name: "Roast Bot", desc: "AI-powered roasts of users (SFW).", icon: Sparkles, gradient: "from-red-500 to-orange-600", category: "Niche", prompt: "Roast bot: /roast @user generates a witty SFW roast using Lovable AI, remembers past roasts per user for /roastbook." },
  { id: "chess", name: "Chess", desc: "Play chess vs the bot or friends.", icon: Gamepad2, gradient: "from-slate-600 to-zinc-700", category: "Niche", prompt: "Chess bot: /chess challenge @user, ASCII/emoji board, moves via /move e2e4, save state per game. Bonus: /chess ai for vs bot using a simple engine." },
  { id: "quiz", name: "Programming Quiz", desc: "Language-specific coding quizzes.", icon: Brain, gradient: "from-cyan-500 to-blue-600", category: "Niche", prompt: "Programming quiz bot: /quiz <js|py|rust|go> multiple choice code questions, timer, /quizrank tracks scores." },
  { id: "pizza", name: "Pizza Randomizer", desc: "/pizza random combo, /pizzabattle group vote.", icon: Pizza, gradient: "from-red-500 to-yellow-500", category: "Niche", prompt: "Pizza fun bot: /pizza random topping combo, /pizzabattle two combos, users vote which one wins." },
];

const categories = ["All", ...Array.from(new Set(templates.map((t) => t.category)))];

export default function Templates() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const { user } = useAuth();
  const nav = useNavigate();

  async function use(t: Template) {
    if (!user) return nav("/signin");
    const { data, error } = await supabase
      .from("builder_projects").insert({ user_id: user.id, title: `${t.name} Bot` }).select("id").single();
    if (error) return toast.error(error.message);
    sessionStorage.setItem(`builder-initial-${data.id}`, t.prompt);
    nav(`/build/${data.id}`);
  }

  const filtered = useMemo(() => templates.filter((t) =>
    (cat === "All" || t.category === cat) &&
    (t.name.toLowerCase().includes(q.toLowerCase()) || t.desc.toLowerCase().includes(q.toLowerCase()))
  ), [q, cat]);

  return (
    <LumoShell title="Templates">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            {templates.length}+ ready-to-ship <span className="gradient-text">bot templates</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick one — Lumo writes the full discord.js project and drops you into the live builder.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 50+ templates…" className="pl-9 bg-card border-border h-11" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                cat === c
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/20 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card/60 backdrop-blur-xl transition-all hover-lift hover:border-primary/40">
            <div className={`relative h-32 overflow-hidden bg-gradient-to-br ${t.gradient}`}>
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.3), transparent 40%)"
              }} />
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "16px 16px"
              }} />
              <t.icon className="absolute bottom-4 left-4 h-10 w-10 text-white drop-shadow-lg transition-transform group-hover:scale-110" />
              <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur">
                {t.category}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display font-semibold">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
              <Button onClick={() => use(t)} size="sm" className="mt-4 w-full text-white" style={{ background: "var(--gradient-primary)" }}>
                <Bot className="mr-1.5 h-3.5 w-3.5" /> Use template
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No templates match "{q}". Try a different search.
        </div>
      )}
    </LumoShell>
  );
}
