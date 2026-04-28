import { useAdminData } from "@/hooks/useAdminData";
import { Info } from "lucide-react";

export default function AdminCredits() {
  const { users, loading } = useAdminData();

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Credits Overview</h1>
        <p className="text-sm text-muted-foreground">Real per-user activity. Credits are device-local — manage caps via the Tools page.</p>
      </header>

      <div className="rounded-xl border border-primary/30 bg-primary/10 text-xs text-foreground/80 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          Credits are stored locally on each user's device (100 free / day, auto-reset). To grant
          unlimited credits to specific users, expand this with a server-side credits table.
        </span>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No users yet.</div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="p-4 border-b border-border last:border-0 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {(u.display_name?.[0] ?? "U").toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{u.display_name ?? "Unnamed"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {u.chat_count} chats · {u.message_count} messages
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Joined {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
