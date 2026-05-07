import { useAdminData } from "@/hooks/useAdminData";
import { RefreshCw, Shield, UserPlus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminUsers() {
  const { users, loading, refresh } = useAdminData();
  const [staffEmail, setStaffEmail] = useState("");
  const [staffBusy, setStaffBusy] = useState(false);

  const setStaff = async (enabled: boolean) => {
    const email = staffEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) return toast.error("Enter user email");
    setStaffBusy(true);
    const { error } = await supabase.rpc("admin_set_staff_role", { _email: email, _enabled: enabled });
    setStaffBusy(false);
    if (error) return toast.error(error.message);
    toast.success(enabled ? "Staff access granted" : "Staff access removed");
    setStaffEmail("");
  };

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

      <section className="rounded-2xl bg-card border border-primary/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-primary" /> Staff Access</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="user@gmail.com" className="field h-10 pl-3 pr-3 flex-1" />
          <button disabled={staffBusy} onClick={() => setStaff(true)} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"><UserPlus className="h-4 w-4" /> Make Staff</button>
          <button disabled={staffBusy} onClick={() => setStaff(false)} className="h-10 px-4 rounded-xl border border-border text-sm hover:bg-surface-2 disabled:opacity-60">Remove</button>
        </div>
      </section>

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
