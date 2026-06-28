import { LumoShell } from "@/components/lumo/LumoShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const cats = ["All", "SaaS", "Portfolio", "AI Tools", "E-commerce", "Blog", "Agency"];

const templates = [
  { id: "saas", name: "SaaS Landing", desc: "Modern SaaS landing page with pricing & features.", tag: "Popular", gradient: "from-violet-500 to-fuchsia-500" },
  { id: "ai-startup", name: "AI Startup", desc: "Bold landing page for AI-first companies.", tag: "New", gradient: "from-blue-500 to-cyan-500" },
  { id: "portfolio", name: "Portfolio", desc: "Personal portfolio with case studies.", tag: "Popular", gradient: "from-pink-500 to-rose-500" },
  { id: "ecommerce", name: "E-commerce Store", desc: "Online store ready for products.", tag: "", gradient: "from-amber-500 to-orange-500" },
  { id: "agency", name: "Marketing Agency", desc: "Agency site with services & team.", tag: "", gradient: "from-emerald-500 to-teal-500" },
  { id: "blog", name: "Blog Template", desc: "Clean editorial blog template.", tag: "", gradient: "from-indigo-500 to-purple-500" },
];

export default function Templates() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const { user } = useAuth();
  const nav = useNavigate();

  async function use(t: typeof templates[number]) {
    if (!user) return nav("/signin");
    const prompt = `Build a ${t.name.toLowerCase()} website. ${t.desc}`;
    const { data, error } = await supabase
      .from("builder_projects").insert({ user_id: user.id, title: t.name }).select("id").single();
    if (error) return toast.error(error.message);
    sessionStorage.setItem(`builder-initial-${data.id}`, prompt);
    nav(`/build/${data.id}`);
  }

  const filtered = templates.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <LumoShell title="Templates">
      <p className="mb-6 text-sm text-muted-foreground">Choose a template and start building.</p>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates…" className="pl-9 bg-card border-border" />
        </div>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`rounded-full px-3 py-1.5 text-xs transition ${cat === c ? "bg-primary text-white" : "border border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50">
            <div className={`relative h-40 bg-gradient-to-br ${t.gradient}`}>
              {t.tag && (
                <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  {t.tag}
                </span>
              )}
              <Sparkles className="absolute bottom-3 left-3 h-6 w-6 text-white/60" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t.name}</h3>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
              <Button onClick={() => use(t)} size="sm" className="mt-4 w-full bg-gradient-to-r from-primary to-primary-glow">
                Use Template
              </Button>
            </div>
          </div>
        ))}
      </div>
    </LumoShell>
  );
}
