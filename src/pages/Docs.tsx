import { LumoLogo } from "@/components/lumo/LumoLogo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Rocket, Sparkles, Plug, BookOpen } from "lucide-react";

const topics = [
  { icon: Rocket, title: "Getting Started", desc: "Learn the basics of Lumo." },
  { icon: Sparkles, title: "AI Builder Guide", desc: "Build websites with AI." },
  { icon: Rocket, title: "Deploy & Publish", desc: "Go live in minutes." },
  { icon: Plug, title: "Integrations", desc: "Connect your tools." },
];

const categories = [
  "Account & Billing", "AI Builder", "Deployments", "Custom Domains", "Integrations", "API & Developers", "Troubleshooting",
];

export default function Docs() {
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <LumoLogo />
        <Button asChild variant="ghost" size="sm"><Link to="/">Home</Link></Button>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Help Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">How can we help you today?</p>
          <div className="relative mx-auto mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search help articles…" className="h-12 pl-11 bg-card border-border" />
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Popular Topics</h3>
            <div className="grid grid-cols-2 gap-3">
              {topics.map((t) => (
                <div key={t.title} className="rounded-xl border border-border bg-card p-4 text-center">
                  <t.icon className="mx-auto h-6 w-6 text-primary" />
                  <div className="mt-2 text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">All Categories</h3>
            <ul className="rounded-xl border border-border bg-card divide-y divide-border">
              {categories.map((c) => (
                <li key={c} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-2"><BookOpen className="h-4 w-4 text-primary" />{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
