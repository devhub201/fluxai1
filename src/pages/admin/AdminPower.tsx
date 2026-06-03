import { useEffect, useState } from "react";
import {
  Zap, Coins, RotateCcw, UserPlus, ShieldCheck, Download, Megaphone, Flag,
  ToggleLeft, FileText, Activity, Search, Loader2, ShieldAlert, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Counts = { users: number; chats: number; messages: number; sites: number; flagsOpen: number; tools: number };

const Section = ({ title, icon: Icon, desc, children }: { title: string; icon: any; desc: string; children: React.ReactNode }) => (
  <div className="rounded-2xl bg-card border border-border p-4 flex flex-col">
    <div className="flex items-start gap-3 mb-3">
      <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </div>
    <div className="mt-auto">{children}</div>
  </div>
);

const Field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`h-9 w-full rounded-lg border border-border bg-surface-2 px-2 text-xs outline-none focus:border-primary/50 ${props.className ?? ""}`} />
);

const Btn = ({ children, loading, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) => (
  <button
    {...rest}
    disabled={loading || rest.disabled}
    className={`h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${rest.className ?? ""}`}
  >
    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
    {children}
  </button>
);

const downloadCsv = (filename: string, rows: any[]) => {
  if (!rows.length) { toast.error("No rows to export"); return; }
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} rows`);
};

export default function AdminPower() {
  const [counts, setCounts] = useState<Counts | null>(null);

  // form state
  const [grantEmail, setGrantEmail] = useState("");
  const [grantAmt, setGrantAmt] = useState(100);
  const [bulkAmt, setBulkAmt] = useState(50);
  const [staffEmail, setStaffEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [flagKey, setFlagKey] = useState("");
  const [flagDesc, setFlagDesc] = useState("");
  const [chTitle, setChTitle] = useState("");
  const [chBody, setChBody] = useState("");

  const [busy, setBusy] = useState<string | null>(null);

  const loadCounts = async () => {
    const [u, c, m, s, fo, ct] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("chats").select("id", { count: "exact", head: true }),
      supabase.from("messages").select("id", { count: "exact", head: true }),
      supabase.from("published_sites").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("moderation_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("custom_tools").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setCounts({
      users: u.count ?? 0, chats: c.count ?? 0, messages: m.count ?? 0,
      sites: s.count ?? 0, flagsOpen: fo.count ?? 0, tools: ct.count ?? 0,
    });
  };
  useEffect(() => { loadCounts(); }, []);

  const wrap = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try { await fn(); } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    setBusy(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" /> Power Tools
        </h1>
        <p className="text-sm text-muted-foreground">12 admin utilities in one place — credits, roles, exports, broadcasts, flags, health.</p>
      </header>

      {/* System Health */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Users", value: counts?.users },
          { label: "Chats", value: counts?.chats },
          { label: "Messages", value: counts?.messages },
          { label: "Sites", value: counts?.sites },
          { label: "Open flags", value: counts?.flagsOpen },
          { label: "Active tools", value: counts?.tools },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-card border border-border p-3">
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
            <div className="text-xl font-bold">{s.value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">

        {/* 1. Grant credits by email */}
        <Section title="Grant credits to a user" icon={Coins} desc="Adds credits to a specific email.">
          <div className="space-y-2">
            <Field placeholder="user@email.com" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
            <Field type="number" value={grantAmt} onChange={(e) => setGrantAmt(Number(e.target.value))} />
            <Btn loading={busy === "grant"} onClick={() => wrap("grant", async () => {
              const { error } = await supabase.rpc("admin_grant_credits", { _email: grantEmail, _amount: grantAmt, _note: "Power Tools" });
              if (error) throw error;
              toast.success(`Granted ${grantAmt} credits to ${grantEmail}`);
              setGrantEmail("");
            })}>Grant</Btn>
          </div>
        </Section>

        {/* 2. Bulk grant */}
        <Section title="Bulk grant to everyone" icon={Coins} desc="Adds credits to every user.">
          <div className="space-y-2">
            <Field type="number" value={bulkAmt} onChange={(e) => setBulkAmt(Number(e.target.value))} />
            <Btn loading={busy === "bulk"} onClick={() => wrap("bulk", async () => {
              if (!confirm(`Add ${bulkAmt} credits to ALL users?`)) return;
              const { data, error } = await supabase.rpc("admin_bulk_grant_credits", { _amount: bulkAmt, _note: "Bulk power-tools grant" });
              if (error) throw error;
              toast.success(`Updated ${data} users`);
            })}>Bulk grant</Btn>
          </div>
        </Section>

        {/* 3. Reset all credits */}
        <Section title="Reset all credits" icon={RotateCcw} desc="Sets every user's balance to 0. Destructive.">
          <Btn className="!bg-destructive !text-destructive-foreground" loading={busy === "reset"} onClick={() => wrap("reset", async () => {
            if (!confirm("Reset ALL credit balances to 0? This cannot be undone.")) return;
            const { data, error } = await supabase.rpc("admin_reset_all_credits");
            if (error) throw error;
            toast.success(`Reset ${data} balances`);
          })}>Reset all</Btn>
        </Section>

        {/* 4. Promote/demote staff */}
        <Section title="Make user staff" icon={ShieldCheck} desc="Grants the staff panel to an email.">
          <div className="space-y-2">
            <Field placeholder="user@email.com" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} />
            <div className="flex gap-2">
              <Btn loading={busy === "staffOn"} onClick={() => wrap("staffOn", async () => {
                const { error } = await supabase.rpc("admin_set_staff_role", { _email: staffEmail, _enabled: true });
                if (error) throw error;
                toast.success(`${staffEmail} is now staff`);
              })}><UserPlus className="h-3.5 w-3.5" /> Promote</Btn>
              <Btn className="!bg-surface-2 !text-foreground border border-border" loading={busy === "staffOff"} onClick={() => wrap("staffOff", async () => {
                const { error } = await supabase.rpc("admin_set_staff_role", { _email: staffEmail, _enabled: false });
                if (error) throw error;
                toast.success(`Removed staff from ${staffEmail}`);
              })}>Demote</Btn>
            </div>
          </div>
        </Section>

        {/* 5. Search user */}
        <Section title="Search user by email" icon={Search} desc="Quick lookup with credits and role.">
          <div className="space-y-2">
            <Field placeholder="user@email.com" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
            <Btn loading={busy === "search"} onClick={() => wrap("search", async () => {
              const { data, error } = await supabase.rpc("admin_list_users");
              if (error) throw error;
              const hit = (data ?? []).find((u: any) => u.email?.toLowerCase() === searchEmail.toLowerCase());
              if (!hit) { toast.error("Not found"); setSearchResult(null); return; }
              const { data: cr } = await supabase.from("user_credits").select("balance").eq("user_id", hit.user_id).maybeSingle();
              setSearchResult({ ...hit, balance: cr?.balance ?? 0 });
            })}>Search</Btn>
            {searchResult && (
              <div className="text-[11px] bg-surface-2 border border-border rounded-lg p-2 mt-2">
                <div><span className="text-muted-foreground">Name:</span> {searchResult.display_name ?? "—"}</div>
                <div><span className="text-muted-foreground">Roles:</span> {searchResult.roles?.join(", ") || "user"}</div>
                <div><span className="text-muted-foreground">Credits:</span> {searchResult.balance}</div>
                <div><span className="text-muted-foreground">Joined:</span> {searchResult.created_at?.slice(0, 10)}</div>
              </div>
            )}
          </div>
        </Section>

        {/* 6. Export users CSV */}
        <Section title="Export users CSV" icon={Download} desc="Email, name, roles, joined.">
          <Btn loading={busy === "expU"} onClick={() => wrap("expU", async () => {
            const { data, error } = await supabase.rpc("admin_list_users");
            if (error) throw error;
            downloadCsv("users.csv", (data ?? []).map((u: any) => ({
              email: u.email, name: u.display_name, roles: (u.roles ?? []).join("|"), joined: u.created_at,
            })));
          })}><Download className="h-3.5 w-3.5" /> Download</Btn>
        </Section>

        {/* 7. Export messages CSV */}
        <Section title="Export last 500 messages" icon={Download} desc="For analysis / audit.">
          <Btn loading={busy === "expM"} onClick={() => wrap("expM", async () => {
            const { data, error } = await supabase.from("messages")
              .select("id, chat_id, user_id, role, content, created_at")
              .order("created_at", { ascending: false }).limit(500);
            if (error) throw error;
            downloadCsv("messages.csv", data ?? []);
          })}><Download className="h-3.5 w-3.5" /> Download</Btn>
        </Section>

        {/* 8. Export sites CSV */}
        <Section title="Export published sites" icon={Download} desc="Slug, title, domain, owner.">
          <Btn loading={busy === "expS"} onClick={() => wrap("expS", async () => {
            const { data, error } = await supabase.from("published_sites")
              .select("id, slug, title, custom_domain, user_id, is_published, updated_at")
              .order("updated_at", { ascending: false });
            if (error) throw error;
            downloadCsv("sites.csv", data ?? []);
          })}><Download className="h-3.5 w-3.5" /> Download</Btn>
        </Section>

        {/* 9. Push announcement */}
        <Section title="Push announcement banner" icon={Megaphone} desc="Shown to all logged-in users.">
          <div className="space-y-2">
            <Field placeholder="Title" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} />
            <textarea placeholder="Body (markdown ok)" value={annBody} onChange={(e) => setAnnBody(e.target.value)}
              className="w-full min-h-16 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs" />
            <Btn loading={busy === "ann"} onClick={() => wrap("ann", async () => {
              if (!annTitle.trim()) { toast.error("Title required"); return; }
              const key = `ann-${Date.now()}`;
              const { error } = await supabase.from("app_settings").upsert({
                key: `announcement:${key}`, value: { title: annTitle, body: annBody, created_at: new Date().toISOString() },
              });
              if (error) throw error;
              toast.success("Announcement pushed");
              setAnnTitle(""); setAnnBody("");
            })}><Megaphone className="h-3.5 w-3.5" /> Publish</Btn>
          </div>
        </Section>

        {/* 10. Feature flag toggle */}
        <Section title="Feature flag" icon={ToggleLeft} desc="Create or flip a feature flag.">
          <div className="space-y-2">
            <Field placeholder="flag_key" value={flagKey} onChange={(e) => setFlagKey(e.target.value)} />
            <Field placeholder="description" value={flagDesc} onChange={(e) => setFlagDesc(e.target.value)} />
            <div className="flex gap-2">
              <Btn loading={busy === "flagOn"} onClick={() => wrap("flagOn", async () => {
                const { error } = await supabase.from("feature_flags").upsert({ key: flagKey, enabled: true, description: flagDesc });
                if (error) throw error;
                toast.success(`Enabled ${flagKey}`);
              })}>Enable</Btn>
              <Btn className="!bg-surface-2 !text-foreground border border-border" loading={busy === "flagOff"} onClick={() => wrap("flagOff", async () => {
                const { error } = await supabase.from("feature_flags").upsert({ key: flagKey, enabled: false, description: flagDesc });
                if (error) throw error;
                toast.success(`Disabled ${flagKey}`);
              })}>Disable</Btn>
            </div>
          </div>
        </Section>

        {/* 11. Add changelog entry */}
        <Section title="Add changelog entry" icon={FileText} desc="Surfaces in the admin shell.">
          <div className="space-y-2">
            <Field placeholder="Title" value={chTitle} onChange={(e) => setChTitle(e.target.value)} />
            <textarea placeholder="Body" value={chBody} onChange={(e) => setChBody(e.target.value)}
              className="w-full min-h-16 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs" />
            <Btn loading={busy === "ch"} onClick={() => wrap("ch", async () => {
              if (!chTitle.trim()) { toast.error("Title required"); return; }
              const { error } = await supabase.from("admin_changelog").insert({ title: chTitle, body: chBody });
              if (error) throw error;
              toast.success("Changelog added");
              setChTitle(""); setChBody("");
            })}>Add entry</Btn>
          </div>
        </Section>

        {/* 12. Close all open flags */}
        <Section title="Close all open flags" icon={Flag} desc="Marks every open moderation flag resolved.">
          <Btn className="!bg-destructive !text-destructive-foreground" loading={busy === "flags"} onClick={() => wrap("flags", async () => {
            if (!confirm(`Close ${counts?.flagsOpen ?? 0} open flags?`)) return;
            const { error } = await supabase.from("moderation_flags").update({ status: "resolved" }).eq("status", "open");
            if (error) throw error;
            toast.success("All open flags closed");
            await loadCounts();
          })}><ShieldAlert className="h-3.5 w-3.5" /> Close all</Btn>
        </Section>

        {/* 13. Refresh stats */}
        <Section title="Refresh system stats" icon={Activity} desc="Re-fetch the counts above.">
          <Btn loading={busy === "refresh"} onClick={() => wrap("refresh", async () => { await loadCounts(); toast.success("Refreshed"); })}>
            <Activity className="h-3.5 w-3.5" /> Refresh
          </Btn>
        </Section>
      </div>
    </div>
  );
}
