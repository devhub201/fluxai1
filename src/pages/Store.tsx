import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Flame, Crown, ShoppingBag, ChevronRight, Star, Zap, BadgeCheck } from "lucide-react";
import { TOOLS } from "@/lib/tools";

const categories = ["All", "Popular", "New", "Tools", "Prompts", "Templates", "Images", "Themes"];

const tools = TOOLS;

const creators = [
  { name: "Fluxa Team", tools: "125+ Tools", sales: "12.5K Sales", color: "from-blue-500 to-fuchsia-500" },
  { name: "Prompt Master", tools: "85+ Tools", sales: "8.2K Sales", color: "from-fuchsia-500 to-pink-500" },
  { name: "Code Wizard", tools: "60+ Tools", sales: "6.1K Sales", color: "from-cyan-500 to-blue-500" },
];

export default function Store() {
  const [active, setActive] = useState("All");
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Fluxa <span className="text-primary">Store</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Discover powerful tools, prompts, templates and more.</p>
        </header>

        {/* Search + filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="field-icon h-4 w-4" />
            <input placeholder="Search tools, prompts, templates..." className="field h-12" />
          </div>
          <button className="h-12 px-4 rounded-xl border border-border bg-card flex items-center gap-2 text-sm hover:bg-surface-2">
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`shrink-0 h-9 px-4 rounded-full text-sm border transition-colors ${
                active === c
                  ? "border-primary text-primary bg-primary/10 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]"
                  : "border-border text-foreground/80 hover:bg-surface-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Featured banner */}
        <div className="relative rounded-2xl border border-border bg-gradient-to-br from-violet-600/15 via-card to-emerald-600/10 p-5 sm:p-6 overflow-hidden">
          <div className="relative z-10 max-w-[60%]">
            <span className="inline-flex items-center gap-1 text-xs text-violet-300 bg-violet-500/15 border border-violet-400/30 rounded-full px-2 py-0.5">
              <Star className="h-3 w-3 fill-violet-300" /> Featured
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold">AI Website Builder</h2>
            <p className="text-sm text-muted-foreground mt-1">Build beautiful, responsive websites in seconds with AI.</p>
            <button className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/10">
              <Zap className="h-4 w-4 fill-primary" /> 499 Credits
            </button>
          </div>
          <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-7xl sm:text-8xl opacity-90 select-none">
            🛍️
          </div>
        </div>

        {/* Popular Tools */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> Popular Tools</h3>
            <button className="text-xs text-primary">View all</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tools.map((t) => (
              <div key={t.name} className="rounded-2xl bg-card border border-border p-3 hover:border-primary/40 transition-colors">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${t.color} border flex items-center justify-center mb-3`}>
                  <t.icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold leading-tight">{t.name}</div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.desc}</p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-primary"><Zap className="h-3.5 w-3.5 fill-primary" />{t.credits}</span>
                  <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-yellow-400" />{t.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Creators */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Top Creators</h3>
            <button className="text-xs text-primary">View all</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {creators.map((c) => (
              <div key={c.name} className="rounded-2xl bg-card border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${c.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold flex items-center gap-1 truncate">
                      {c.name} <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{c.tools}</div>
                    <div className="text-[11px] text-muted-foreground">{c.sales}</div>
                  </div>
                </div>
                <button className="mt-3 w-full h-9 rounded-lg border border-border text-sm hover:bg-surface-2">Follow</button>
              </div>
            ))}
          </div>
        </section>

        {/* My Purchases */}
        <button className="w-full rounded-2xl bg-card border border-border p-4 flex items-center gap-3 text-left hover:border-primary/40">
          <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">My Purchases</div>
            <div className="text-xs text-muted-foreground">View all your purchased items</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
