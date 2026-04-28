import { MessageCircle, RefreshCw, User as UserIcon } from "lucide-react";
import { useAdminData } from "@/hooks/useAdminData";

export default function AdminLogs() {
  const { messages, users, loading, refresh } = useAdminData();
  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-muted-foreground">Latest real messages across the platform.</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-xs hover:bg-surface-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No activity yet.</div>
        ) : (
          messages.slice(0, 100).map((m) => {
            const u = userById.get(m.user_id);
            const Icon = m.role === "user" ? UserIcon : MessageCircle;
            return (
              <div
                key={m.id}
                className="px-4 py-3 border-b border-border last:border-0 flex items-center gap-3"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    <span className="text-muted-foreground mr-1">[{m.role}]</span>
                    {m.content}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {u?.display_name ?? m.user_id.slice(0, 8)} · {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
