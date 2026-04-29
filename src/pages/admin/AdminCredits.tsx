import { useEffect, useState, useCallback } from "react";
import { Coins, Plus, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CreditRow = {
  id: string;
  email: string;
  balance: number;
  granted_total: number;
  user_id: string | null;
  updated_at: string;
};

type GrantRow = {
  id: string;
  email: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export default function AdminCredits() {
  const [rows, setRows] = useState<CreditRow[]>([]);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [creditsRes, grantsRes] = await Promise.all([
      supabase.from("user_credits").select("*").order("updated_at", { ascending: false }),
      supabase.from("credit_grants").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setRows((creditsRes.data ?? []) as CreditRow[]);
    setGrants((grantsRes.data ?? []) as GrantRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleGrant = async () => {
    const trimmed = email.trim().toLowerCase();
    const amt = Number(amount);
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Enter a valid email");
      return;
    }
    if (!Number.isFinite(amt) || amt === 0) {
      toast.error("Enter a non-zero amount");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("admin_grant_credits", {
      _email: trimmed,
      _amount: Math.trunc(amt),
      _note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Failed to grant credits");
      return;
    }
    toast.success(`Granted ${amt} credits to ${trimmed}`);
    setEmail(""); setAmount(""); setNote("");
    setOpen(false);
    refresh();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" /> Credits Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Grant unlimited credits to any email. Users see them instantly on their account.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Credits
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Grant Credits</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="g-email">User Email</Label>
                <Input
                  id="g-email"
                  type="email"
                  placeholder="user@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-amount">Credits Amount</Label>
                <Input
                  id="g-amount"
                  type="number"
                  placeholder="e.g. 5000 (negative to deduct)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">No upper limit. Use negative numbers to subtract.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="g-note">Note (optional)</Label>
                <Input
                  id="g-note"
                  placeholder="Reason / reference"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleGrant} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Granting…</> : "Grant Credits"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Balances</h2>
          <span className="text-xs text-muted-foreground">{rows.length} accounts</span>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground text-center">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No credits granted yet.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="p-4 border-b border-border last:border-0 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.email}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Total granted: {r.granted_total.toLocaleString()} · Updated {new Date(r.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">{r.balance.toLocaleString()}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">credits</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setEmail(r.email); setAmount(""); setNote(""); setOpen(true); }}
              >
                Add
              </Button>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Recent Grants</h2>
        </div>
        {grants.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center">No grants yet.</div>
        ) : (
          grants.map((g) => (
            <div key={g.id} className="px-4 py-3 border-b border-border last:border-0 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex-1 min-w-[180px] truncate">{g.email}</div>
              <div className={`font-semibold ${g.amount >= 0 ? "text-primary" : "text-destructive"}`}>
                {g.amount >= 0 ? "+" : ""}{g.amount.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground w-full sm:w-auto truncate">{g.note ?? "—"}</div>
              <div className="text-[11px] text-muted-foreground">{new Date(g.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
