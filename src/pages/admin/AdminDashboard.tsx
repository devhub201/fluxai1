import {
  Users as UsersIcon,
  MessageCircle,
  Box,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminData, useAnnouncementsDB } from "@/hooks/useAdminData";
import { getTools } from "@/lib/adminStore";
import { useMemo } from "react";

const StatCard = ({
  label,
  value,
  delta,
  Icon,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  Icon: any;
  tone: string;
}) => (
  <div className="rounded-2xl bg-card border border-border p-4">
    <div className="flex items-center gap-3">
      <div className={`h-11 w-11 rounded-xl border flex items-center justify-center ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
    <div className="text-2xl sm:text-3xl font-bold mt-3">{value}</div>
    <div className="text-[11px] text-emerald-400 mt-1 inline-flex items-center gap-1">
      <TrendingUp className="h-3 w-3" /> {delta}
    </div>
  </div>
);

const buildBuckets = (items: { created_at: string }[]) => {
  const days = 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets: { day: string; value: number; ts: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({
      day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: 0,
      ts: d.getTime(),
    });
  }
  items.forEach((it) => {
    const t = new Date(it.created_at).getTime();
    for (let i = buckets.length - 1; i >= 0; i--) {
      if (t >= buckets[i].ts) {
        buckets[i].value++;
        break;
      }
    }
  });
  return buckets;
};

export default function AdminDashboard() {
  const { users, chats, messages, loading } = useAdminData();
  const { items: announcements } = useAnnouncementsDB();
  const tools = getTools();

  const userGrowth = useMemo(() => buildBuckets(users.map((u) => ({ created_at: u.created_at }))), [users]);
  const messagesPerDay = useMemo(() => buildBuckets(messages.map((m) => ({ created_at: m.created_at }))), [messages]);

  const topUsers = [...users].sort((a, b) => b.message_count - a.message_count).slice(0, 5);
  const maxMsgs = Math.max(1, ...topUsers.map((u) => u.message_count));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading real data…" : "Live data from your Fluxa AI backend."}
          </p>
        </div>
        <div className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-2">
          {new Date().toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Users"
          value={users.length.toLocaleString()}
          delta="Real signups"
          Icon={UsersIcon}
          tone="bg-violet-500/15 border-violet-500/40 text-violet-300"
        />
        <StatCard
          label="Total Chats"
          value={chats.length.toLocaleString()}
          delta="Across all users"
          Icon={MessageCircle}
          tone="bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
        />
        <StatCard
          label="Total Messages"
          value={messages.length.toLocaleString()}
          delta="Last 500 tracked"
          Icon={Box}
          tone="bg-blue-500/15 border-blue-500/40 text-blue-300"
        />
        <StatCard
          label="Active Tools"
          value={tools.length.toLocaleString()}
          delta="Configured in store"
          Icon={Box}
          tone="bg-orange-500/15 border-orange-500/40 text-orange-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">User Growth</div>
            <div className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-0.5">
              7 Days
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(270 80% 60%)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(270 80% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(270 80% 65%)" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Messages / Day</div>
            <div className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-0.5">
              7 Days
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messagesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="text-sm font-semibold mb-3">Top Active Users</div>
          {topUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground w-4">{i + 1}</div>
                  <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                    {(u.display_name?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{u.display_name ?? "Unnamed"}</div>
                    <div className="h-1.5 mt-1 rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(u.message_count / maxMsgs) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {u.message_count} msgs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="text-sm font-semibold inline-flex items-center gap-2 mb-3">
            <Megaphone className="h-4 w-4 text-primary" /> Recent Announcements
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-muted-foreground">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.key} className="text-sm">
                  <div className="font-medium">📣 {a.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            <div className="text-sm font-semibold mb-2">Recent Chats</div>
            {chats.length === 0 ? (
              <p className="text-xs text-muted-foreground">No chats yet.</p>
            ) : (
              <div className="space-y-2">
                {chats.slice(0, 5).map((c) => (
                  <div key={c.id} className="text-xs flex items-center justify-between gap-2">
                    <span className="truncate">{c.title}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
