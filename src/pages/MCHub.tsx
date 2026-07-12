import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search, Download, Star, Eye, TrendingUp, Flame, Sparkles, Boxes,
  FileCode2, Layers, Palette, Globe, Package, Users, Shield, Zap,
  ChevronRight, Github, MessageCircle, ArrowUpRight, Filter, Clock,
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────
const BRAND = "CraftVault";
const TAGLINE = "Open-source Minecraft resources — free forever.";

// ─── Categories ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "setups",  name: "Server Setups",  icon: Boxes,     count: 342, color: "from-emerald-500 to-teal-500", desc: "Complete server packs — SMP, Skyblock, Lifesteal, Bedwars." },
  { id: "configs", name: "Plugin Configs", icon: FileCode2, count: 1284, color: "from-sky-500 to-indigo-500",   desc: "Ready-to-use YAML configs for EssentialsX, LuckPerms, etc." },
  { id: "skripts", name: "Skripts",        icon: Zap,       count: 967, color: "from-amber-500 to-orange-500", desc: "Skript addons, minigames, GUI scripts, utilities." },
  { id: "models",  name: "3D Models",      icon: Layers,    count: 512, color: "from-fuchsia-500 to-pink-500", desc: "Blockbench models, custom items, mob resource packs." },
  { id: "web",     name: "Web Sources",    icon: Globe,     count: 218, color: "from-cyan-500 to-blue-500",    desc: "Server websites, store templates, forum themes." },
  { id: "packs",   name: "Resource Packs", icon: Palette,   count: 641, color: "from-rose-500 to-red-500",     desc: "Texture packs, HUD overlays, PvP packs, shaders." },
];

// ─── Mock resources (all fictional, open-source themed) ───────────────────
const RESOURCES = [
  { id: 1, cat: "setups",  title: "Aurora Lifesteal SMP",      author: "voidbyte",   ver: "1.20.4", dls: 12480, stars: 4.9, tag: "Featured", time: "2h ago",  desc: "Full lifesteal server pack with custom enchants, heart system, and 40+ configured plugins." },
  { id: 2, cat: "skripts", title: "SkyWars Elite Framework",   author: "pixelmage",  ver: "Skript 2.9", dls: 8214,  stars: 4.8, tag: "Hot",      time: "6h ago",  desc: "Modular SkyWars core — kits, cages, cosmetics, party system. MIT licensed." },
  { id: 3, cat: "configs", title: "LuckPerms · 200-rank Preset", author: "denyra",   ver: "5.4",    dls: 15903, stars: 4.9, tag: "Trending", time: "1d ago",  desc: "Fully-weighted rank ladder with meta, prefixes, and inheritance trees." },
  { id: 4, cat: "models",  title: "Cyberpunk Weapon Pack v3",  author: "kaito.mc",   ver: "1.20+",  dls: 6721,  stars: 4.7, tag: "New",      time: "3h ago",  desc: "38 CustomModelData weapons — muzzle flash animations, GeckoLib compatible." },
  { id: 5, cat: "web",     title: "Nebula Store Template",     author: "shopforge",  ver: "Tebex",  dls: 3402,  stars: 4.8, tag: "Featured", time: "12h ago", desc: "Modern dark-theme Tebex store — animated cart, tier ribbons, mobile-first." },
  { id: 6, cat: "packs",   title: "Frostbite PvP 32x",         author: "chillnode",  ver: "1.8–1.20", dls: 9840, stars: 4.6, tag: "Popular",  time: "2d ago",  desc: "Low-fire, smooth swords, clean UI. Optimized for high-FPS PvP." },
  { id: 7, cat: "setups",  title: "BedWars Constellation",     author: "starforge",  ver: "1.20.2", dls: 5120,  stars: 4.7, tag: "New",      time: "5h ago",  desc: "12 arenas, custom shop UI, party API, MongoDB stats. Fully open." },
  { id: 8, cat: "skripts", title: "GUI Builder Toolkit",       author: "voidbyte",   ver: "Skript 2.8+", dls: 4290, stars: 4.9, tag: "Hot",   time: "1d ago",  desc: "Declarative GUI system with paginated menus, animations, click cooldowns." },
  { id: 9, cat: "configs", title: "EssentialsX · Warp Bundle", author: "denyra",     ver: "2.20",   dls: 7602,  stars: 4.5, tag: "Popular",  time: "3d ago",  desc: "60 pre-built warps, kits, and messages.yml with vibrant MiniMessage formatting." },
];

// ─── Contributors ─────────────────────────────────────────────────────────
const CONTRIBUTORS = [
  { name: "voidbyte",   uploads: 47, dls: "128K", rank: "Elite" },
  { name: "denyra",     uploads: 38, dls: "94K",  rank: "Elite" },
  { name: "pixelmage",  uploads: 29, dls: "71K",  rank: "Verified" },
  { name: "kaito.mc",   uploads: 22, dls: "48K",  rank: "Verified" },
  { name: "starforge",  uploads: 18, dls: "33K",  rank: "Rising" },
];

const TAG_COLORS: Record<string, string> = {
  Featured: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Hot:      "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Trending: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  New:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Popular:  "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

export default function MCHub() {
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");

  const filtered = useMemo(() => {
    return RESOURCES.filter(r =>
      (activeCat === "all" || r.cat === activeCat) &&
      (q === "" || r.title.toLowerCase().includes(q.toLowerCase()) || r.author.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, activeCat]);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans antialiased selection:bg-emerald-500/30">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-fuchsia-500/5 blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        {/* ─── NAV ────────────────────────────────────── */}
        <nav className="sticky top-0 z-40 border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/mchub" className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30">
                <Boxes className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight">{BRAND}</span>
                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">BETA</span>
              </div>
            </Link>
            <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
              <a href="#browse" className="transition hover:text-white">Browse</a>
              <a href="#categories" className="transition hover:text-white">Categories</a>
              <a href="#top" className="transition hover:text-white">Contributors</a>
              <a href="#faq" className="transition hover:text-white">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:text-white sm:inline-flex">
                <Github className="h-3.5 w-3.5" /> GitHub
              </button>
              <button className="rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40">
                Upload resource
              </button>
            </div>
          </div>
        </nav>

        {/* ─── HERO ───────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-300">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>
              4,164 open-source resources · all free
            </div>
            <h1 className="font-display bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-5xl font-bold leading-[1.05] tracking-tight text-transparent md:text-7xl">
              The vault for<br />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-300 bg-clip-text text-transparent">Minecraft creators.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 md:text-lg">
              {TAGLINE} Setups, configs, Skripts, models, and web sources — curated, MIT-friendly, and community-run.
            </p>

            {/* Search */}
            <div className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-2 shadow-2xl shadow-emerald-500/5 backdrop-blur">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search Skripts, plugins, models…"
                  className="w-full bg-transparent py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
              <button className="rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20">
                Search
              </button>
            </div>

            {/* Stats strip */}
            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { n: "4,164", l: "Resources" },
                { n: "890K",  l: "Downloads" },
                { n: "12,400",l: "Members" },
                { n: "100%",  l: "Open-source" },
              ].map(s => (
                <div key={s.l} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="text-xl font-bold text-white">{s.n}</div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CATEGORIES ─────────────────────────────── */}
        <section id="categories" className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Explore</div>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">Browse by category</h2>
            </div>
            <a href="#browse" className="hidden items-center gap-1 text-sm text-slate-400 transition hover:text-white sm:inline-flex">
              All resources <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveCat(c.id); document.getElementById("browse")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${c.color} opacity-10 blur-2xl transition group-hover:opacity-20`} />
                  <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{c.name}</h3>
                    <span className="text-xs text-slate-500">{c.count.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{c.desc}</p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-400 opacity-0 transition group-hover:opacity-100">
                    Explore <ArrowUpRight className="h-3 w-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── BROWSE ─────────────────────────────────── */}
        <section id="browse" className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Latest</div>
              <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">Fresh from the vault</h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCat("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCat === "all" ? "bg-white text-slate-900" : "border border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20"}`}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCat === c.id ? "bg-white text-slate-900" : "border border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-sm text-slate-500">
                No resources match "{q}". Try clearing filters.
              </div>
            )}
            {filtered.map((r) => {
              const cat = CATEGORIES.find(c => c.id === r.cat)!;
              const Icon = cat.icon;
              return (
                <article
                  key={r.id}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5 transition hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${cat.color} shadow-lg`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TAG_COLORS[r.tag]}`}>{r.tag}</span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-white transition group-hover:text-emerald-300">{r.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{r.desc}</p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.author}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span>{r.ver}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.time}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-slate-400"><Download className="h-3.5 w-3.5" />{r.dls.toLocaleString()}</span>
                      <span className="flex items-center gap-1 text-amber-300"><Star className="h-3.5 w-3.5 fill-current" />{r.stars}</span>
                    </div>
                    <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition group-hover:bg-emerald-500 group-hover:text-white">
                      Download
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ─── FEATURED SPOTLIGHT ─────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-8 md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Flame className="h-3 w-3" /> RESOURCE OF THE WEEK
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">Aurora Lifesteal SMP</h2>
                <p className="mt-3 text-slate-300">
                  A production-ready lifesteal pack: custom heart economy, 40+ tuned plugins, MiniMessage UI, and a modular quest system. Ships with docker-compose and Pterodactyl egg.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Paper 1.20.4", "MIT License", "Docker ready", "Skript 2.9"].map(t => (
                    <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">{t}</span>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30">
                    <Download className="h-4 w-4" /> Download · 12.4K
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-2.5 text-sm font-medium text-white transition hover:border-white/20">
                    <Eye className="h-4 w-4" /> Preview
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-[#0a0d14]/60 p-1 backdrop-blur">
                  <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                    <span className="ml-2 text-[11px] text-slate-500">aurora/config.yml</span>
                  </div>
                  <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-slate-300">
{`server:
  name: "Aurora Lifesteal"
  version: 1.20.4
  softDepend: [LuckPerms, Skript, PlaceholderAPI]

hearts:
  start: 10
  min: 1
  max: 20
  onKill: +1
  onDeath: -1
  eliminate: true

economy:
  currency: "shards"
  starting: 250
  daily: 100`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TOP CONTRIBUTORS ───────────────────────── */}
        <section id="top" className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Community</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">Top contributors</h2>
            <p className="mt-2 text-slate-400">Builders keeping the vault stocked.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Creator</div>
              <div className="col-span-2">Uploads</div>
              <div className="col-span-2">Downloads</div>
              <div className="col-span-2 text-right">Rank</div>
            </div>
            {CONTRIBUTORS.map((c, i) => (
              <div key={c.name} className="grid grid-cols-12 items-center gap-4 border-b border-white/5 px-6 py-4 last:border-0 transition hover:bg-white/[0.02]">
                <div className="col-span-1 font-mono text-sm text-slate-500">{String(i + 1).padStart(2, "0")}</div>
                <div className="col-span-5 flex items-center gap-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${["from-emerald-400 to-teal-600","from-sky-400 to-indigo-600","from-amber-400 to-orange-600","from-fuchsia-400 to-pink-600","from-cyan-400 to-blue-600"][i]} font-bold text-white`}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-500">joined 2024</div>
                  </div>
                </div>
                <div className="col-span-2 text-sm text-slate-300">{c.uploads}</div>
                <div className="col-span-2 text-sm text-slate-300">{c.dls}</div>
                <div className="col-span-2 text-right">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    c.rank === "Elite" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" :
                    c.rank === "Verified" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" :
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }`}>{c.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── VALUE PROPS ────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Shield, title: "Open-source only", desc: "Every resource ships with an OSI-approved license. No leaks, no cracks — ever." },
              { icon: Sparkles, title: "Human-reviewed", desc: "Moderators check each upload for malware, license clarity, and quality before it goes live." },
              { icon: TrendingUp, title: "Built for creators", desc: "Free forever. Uploaders keep credit. Downloaders keep freedom." },
            ].map(v => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── FAQ ───────────────────────────────────── */}
        <section id="faq" className="mx-auto max-w-3xl px-6 py-14">
          <div className="mb-8 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">FAQ</div>
            <h2 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">Common questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is everything really free?", a: "Yes. Every resource is open-source with an MIT, Apache, or similar license. No paywalls." },
              { q: "Can I upload paid or leaked content?", a: "No. Uploads must be your original work or something you have permission to redistribute under an open license." },
              { q: "How do I contribute?", a: "Create an account, hit Upload Resource, attach your files + a license, and our mods review within 24h." },
              { q: "Which Minecraft versions are supported?", a: "Resources span 1.8 → 1.21 (Paper, Purpur, Folia, Fabric, Forge). Each listing shows its target version." },
            ].map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium text-white">
                  {f.q}
                  <ChevronRight className="h-4 w-4 text-slate-500 transition group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-slate-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-sky-500/10 p-10 text-center md:p-14">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.15),transparent_60%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-5xl">
                Share what you build.<br />
                <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Keep it open.</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-300">Join 12,400 creators uploading configs, Skripts, and models — all under free licenses.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-xl">
                  Upload your first resource <ArrowUpRight className="h-4 w-4" />
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white">
                  <MessageCircle className="h-4 w-4" /> Join Discord
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─────────────────────────────────── */}
        <footer className="border-t border-white/5 mt-12">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-slate-500 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="grid h-5 w-5 place-items-center rounded bg-gradient-to-br from-emerald-400 to-teal-600">
                <Boxes className="h-3 w-3 text-white" />
              </div>
              © 2026 {BRAND}. Open-source, always.
            </div>
            <div className="flex items-center gap-5">
              <a href="#" className="hover:text-white">Guidelines</a>
              <a href="#" className="hover:text-white">Licenses</a>
              <a href="#" className="hover:text-white">DMCA</a>
              <a href="#" className="hover:text-white">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
