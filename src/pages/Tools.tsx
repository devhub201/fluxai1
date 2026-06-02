import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Star, Search, Sparkles, Wrench } from "lucide-react";
import { TOOLS } from "@/lib/tools";
import { useCustomTools } from "@/hooks/useCustomTools";

export default function Tools() {
  const { tools: customTools } = useCustomTools();
  const [q, setQ] = useState("");
  const all = useMemo(
    () => [...customTools, ...TOOLS.filter((tool) => !customTools.some((c) => c.id === tool.id))],
    [customTools],
  );
  const filtered = useMemo(
    () => (q.trim() ? all.filter((t) => (t.name + " " + t.desc).toLowerCase().includes(q.toLowerCase())) : all),
    [all, q],
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-6">
        <header className="space-y-3">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight inline-flex items-center gap-3">
                <Wrench className="h-7 w-7 text-primary" /> All <span className="text-primary">Tools</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {all.length} AI tools ready to run · Powered by Fluxa AI Gateway
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {customTools.length} custom · {TOOLS.length} built-in
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tools by name or description…"
              className="w-full h-12 rounded-xl bg-card border border-border pl-10 pr-3 text-sm outline-none focus:border-primary/60"
            />
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center text-muted-foreground text-sm">
            No tools match "{q}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to={`/tools/${t.id}`}
                className="group relative rounded-2xl bg-card border border-border p-5 hover:border-primary/50 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-15px_hsl(var(--primary)/0.5)] block"
              >
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${t.color} pointer-events-none`} />
                <div className="relative flex items-start gap-3">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${t.color} border flex items-center justify-center shrink-0`}>
                    <t.icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold leading-tight truncate">{t.name}</div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.desc}</p>
                  </div>
                </div>
                <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-border/60 text-xs">
                  <span className="inline-flex items-center gap-1 text-primary font-medium">
                    <Zap className="h-3.5 w-3.5 fill-primary" />
                    {t.credits} credits
                  </span>
                  <span className="inline-flex items-center gap-1 text-yellow-400">
                    <Star className="h-3.5 w-3.5 fill-yellow-400" />
                    {t.rating}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors font-medium">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
