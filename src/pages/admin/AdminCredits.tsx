import { useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { addCreditsToUser, getUsers, resetUserCredits } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";

export default function AdminCredits() {
  useAdminStore();
  const users = getUsers();
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Credits Control</h1>
        <p className="text-sm text-muted-foreground">Add or reset credits for any user.</p>
      </header>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {users.map((u) => (
          <div key={u.id} className="p-4 border-b border-border last:border-0 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {u.username[1]?.toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{u.username}</div>
                <div className="text-[11px] text-muted-foreground">{u.credits.toLocaleString()} credits</div>
              </div>
            </div>
            <input
              type="number"
              placeholder="Amount"
              value={amounts[u.id] ?? ""}
              onChange={(e) => setAmounts({ ...amounts, [u.id]: Number(e.target.value) })}
              className="w-28 h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
            />
            <button
              onClick={() => {
                const amt = amounts[u.id] || 0;
                if (amt <= 0) return;
                addCreditsToUser(u.id, amt);
                setAmounts({ ...amounts, [u.id]: 0 });
              }}
              className="inline-flex items-center gap-1 h-10 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
            <button
              onClick={() => resetUserCredits(u.id)}
              className="inline-flex items-center gap-1 h-10 px-3 rounded-xl border border-border text-xs hover:bg-surface-2"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
