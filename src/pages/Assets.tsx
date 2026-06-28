import { LumoShell } from "@/components/lumo/LumoShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Upload, Image as ImageIcon, Film, FileText, Code2 } from "lucide-react";
import { useState } from "react";

const tabs = ["All", "Images", "Icons", "Videos", "Files"];

const items = [
  { name: "hero-bg.png", size: "2.4 MB", kind: "image" },
  { name: "dashboard-ui.png", size: "1.8 MB", kind: "image" },
  { name: "logo-white.svg", size: "12 KB", kind: "icon" },
  { name: "avatar.png", size: "89 KB", kind: "image" },
  { name: "feature-1.svg", size: "10 KB", kind: "icon" },
  { name: "marketing.mp4", size: "12.4 MB", kind: "video" },
  { name: "code-snippet.png", size: "850 KB", kind: "image" },
  { name: "document.pdf", size: "1.2 MB", kind: "file" },
];

function Icon({ kind }: { kind: string }) {
  const cls = "h-8 w-8";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "video") return <Film className={cls} />;
  if (kind === "icon") return <Code2 className={cls} />;
  return <FileText className={cls} />;
}

export default function Assets() {
  const [tab, setTab] = useState("All");
  const filtered = tab === "All" ? items : items.filter((i) =>
    tab === "Images" ? i.kind === "image"
    : tab === "Icons" ? i.kind === "icon"
    : tab === "Videos" ? i.kind === "video"
    : i.kind === "file");
  return (
    <LumoShell title="Assets" action={
      <Button className="bg-gradient-to-r from-primary to-primary-glow"><Upload className="mr-1 h-4 w-4" />Upload Asset</Button>
    }>
      <p className="mb-6 text-sm text-muted-foreground">Manage your media and assets.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-xs transition ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mb-6 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search assets…" className="pl-9 bg-card border-border" />
      </div>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((a) => (
          <div key={a.name} className="rounded-xl border border-border bg-card p-3 transition hover:border-primary/50">
            <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-surface-2 text-primary">
              <Icon kind={a.kind} />
            </div>
            <div className="mt-2 truncate text-xs font-medium">{a.name}</div>
            <div className="text-[10px] text-muted-foreground">{a.size}</div>
          </div>
        ))}
      </div>
    </LumoShell>
  );
}
