import { getUsers } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";

export default function AdminUsers() {
  useAdminStore();
  const users = getUsers();
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">All users on Fluxa AI.</p>
      </header>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1.4fr_120px_140px] px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
          <div>User</div>
          <div>Email</div>
          <div className="text-right">Credits</div>
          <div className="text-right">Joined</div>
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-2 sm:grid-cols-[1fr_1.4fr_120px_140px] px-4 py-3 text-sm border-b border-border last:border-0 items-center gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[11px] font-bold text-primary">
                {u.username[1]?.toUpperCase()}
              </div>
              <span className="truncate font-medium">{u.username}</span>
            </div>
            <div className="hidden sm:block truncate text-muted-foreground">{u.email}</div>
            <div className="text-right text-primary font-semibold">{u.credits.toLocaleString()}</div>
            <div className="hidden sm:block text-right text-xs text-muted-foreground">
              {new Date(u.joinedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
