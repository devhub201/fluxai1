import { LumoLogo } from "@/components/lumo/LumoLogo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const entries = [
  { tag: "Added", color: "bg-emerald-500/15 text-emerald-400", title: "Custom Domains", desc: "You can now connect and manage custom domains.", date: "Jun 16, 2026" },
  { tag: "Improved", color: "bg-blue-500/15 text-blue-400", title: "AI Code Generation", desc: "Better code quality and more accurate suggestions.", date: "Jun 14, 2026" },
  { tag: "New", color: "bg-violet-500/15 text-primary", title: "Version History", desc: "View and restore previous versions of your projects.", date: "Jun 12, 2026" },
  { tag: "Fixed", color: "bg-amber-500/15 text-amber-400", title: "Deployment Issue", desc: "Fixed issue with deployment on custom domains.", date: "Jun 10, 2026" },
  { tag: "Improved", color: "bg-blue-500/15 text-blue-400", title: "Performance", desc: "Improved editor and preview performance.", date: "Jun 8, 2026" },
];

export default function Changelog() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-8">
        <LumoLogo />
        <Button asChild variant="ghost" size="sm"><Link to="/">Home</Link></Button>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 sm:px-8">
        <h1 className="text-3xl font-semibold">Changelog</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stay updated with the latest features and improvements.</p>
        <div className="mt-8 space-y-4">
          {entries.map((e) => (
            <div key={e.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${e.color}`}>{e.tag}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{e.title}</h3>
                  <span className="text-xs text-muted-foreground">{e.date}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{e.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
