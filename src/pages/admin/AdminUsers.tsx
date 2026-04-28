import { useAdminData } from "@/hooks/useAdminData";
import { RefreshCw } from "lucide-react";

export default function AdminUsers() {
  const { users, loading, refresh } = useAdminData();

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">All real signed-up users on Fluxa AI.</p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border text-xs hover:bg-surface-2"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_120px_120px_140px] px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <div>User</div>
          <div className="text-right">Chats</div>
          <div className="text-right">Messages</div>
          <div className="text-right">Joined</div>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No users yet.</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-2 sm:grid-cols-[1fr_120px_120px_140px] px-4 py-3 text-sm border-b border-border last:border-0 items-center gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary">
                  {(u.display_name?.[0] ?? "U").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.display_name ?? "Unnamed"}</div>
                  <div className="text-[11px] text-muted-foreground truncate font-mono">{u.id.slice(0, 8)}…</div>
                </div>
              </div>
              <div className="text-right text-primary font-semibold">{u.chat_count}</div>
              <div className="hidden sm:block text-right text-foreground">{u.message_count}</div>
              <div className="hidden sm:block text-right text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
