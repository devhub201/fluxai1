import { Coins, Megaphone, Wrench } from "lucide-react";
import { getLogs } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";

const iconFor = (t: string) => {
  if (t === "tool") return Wrench;
  if (t === "credit") return Coins;
  return Megaphone;
};

export default function AdminLogs() {
  useAdminStore();
  const logs = getLogs();
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Logs / Activity</h1>
        <p className="text-sm text-muted-foreground">Recent actions across the platform.</p>
      </header>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No activity yet.</div>
        ) : (
          logs.map((l) => {
            const Icon = iconFor(l.type);
            return (
              <div
                key={l.id}
                className="px-4 py-3 border-b border-border last:border-0 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{l.message}{l.user ? ` — ${l.user}` : ""}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString()}
                  </div>
                </div>
                {typeof l.amount === "number" && (
                  <div className="text-xs font-semibold text-primary">{l.amount > 0 ? `+${l.amount}` : l.amount}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
