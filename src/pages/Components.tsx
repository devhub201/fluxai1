import { LumoShell } from "@/components/lumo/LumoShell";
import { Boxes } from "lucide-react";

const items = ["Hero Section", "Pricing Table", "Footer", "Navbar", "Testimonials", "Feature Grid", "CTA Block", "Stats Bar", "FAQ", "Newsletter", "Auth Form", "Sidebar"];

export default function Components() {
  return (
    <LumoShell title="Components">
      <p className="mb-6 text-sm text-muted-foreground">Reusable building blocks for your sites.</p>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => (
          <div key={c} className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/50">
            <div className="flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-surface-2 text-primary">
              <Boxes className="h-7 w-7" />
            </div>
            <div className="mt-3 text-sm font-medium">{c}</div>
            <div className="text-xs text-muted-foreground">Drop-in component</div>
          </div>
        ))}
      </div>
    </LumoShell>
  );
}
