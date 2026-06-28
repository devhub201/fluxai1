import { LumoShell } from "@/components/lumo/LumoShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const integrations = [
  { id: "github", name: "GitHub", desc: "Sync your projects and deployments seamlessly.", connected: false, color: "from-gray-700 to-gray-900" },
  { id: "vercel", name: "Vercel", desc: "Deploy your projects to Vercel in one click.", connected: true, color: "from-black to-gray-800" },
  { id: "supabase", name: "Supabase", desc: "Connect your Supabase project and database.", connected: false, color: "from-emerald-500 to-emerald-700" },
  { id: "firebase", name: "Firebase", desc: "Use Firebase for auth, database and more.", connected: false, color: "from-amber-500 to-orange-600" },
  { id: "netlify", name: "Netlify", desc: "Deploy your sites to Netlify effortlessly.", connected: false, color: "from-teal-400 to-cyan-600" },
  { id: "cloudflare", name: "Cloudflare", desc: "Manage DNS, domains and performance.", connected: false, color: "from-orange-500 to-amber-600" },
  { id: "slack", name: "Slack", desc: "Get notifications and updates in Slack.", connected: false, color: "from-pink-500 to-rose-600" },
  { id: "linear", name: "Linear", desc: "Sync issues and track project changes.", connected: false, color: "from-indigo-500 to-purple-600" },
  { id: "postgres", name: "PostgreSQL", desc: "Connect your PostgreSQL database.", connected: false, color: "from-blue-500 to-indigo-700" },
];

export default function Integrations() {
  const [tab, setTab] = useState("All");
  const [list, setList] = useState(integrations);
  const filtered = list.filter((i) =>
    tab === "All" ? true : tab === "Connected" ? i.connected : true);

  function toggle(id: string) {
    setList((prev) => prev.map((p) => p.id === id ? { ...p, connected: !p.connected } : p));
    toast.success("Integration updated");
  }

  return (
    <LumoShell title="Integrations">
      <p className="mb-6 text-sm text-muted-foreground">Connect Lumo with your favorite tools.</p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {["All", "Connected", "Popular"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs transition ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}>
              {t} {t === "All" && `(${list.length})`}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search integrations…" className="pl-9 bg-card border-border" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${i.color} text-white text-sm font-bold`}>
                {i.name[0]}
              </div>
              <div className="font-semibold">{i.name}</div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{i.desc}</p>
            <Button size="sm" variant={i.connected ? "outline" : "default"}
              onClick={() => toggle(i.id)}
              className={`mt-4 w-full ${!i.connected ? "bg-gradient-to-r from-primary to-primary-glow" : ""}`}>
              {i.connected ? "Connected" : "Connect"}
            </Button>
          </div>
        ))}
      </div>
    </LumoShell>
  );
}
