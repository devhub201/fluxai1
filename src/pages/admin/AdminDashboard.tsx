import {
  Users as UsersIcon,
  Zap,
  Box,
  DollarSign,
  TrendingUp,
  Megaphone,
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
import {
  creditsUsageData,
  getAnnouncements,
  getLogs,
  getMetrics,
  getUsers,
  userGrowthData,
} from "@/lib/adminStore";

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

export default function AdminDashboard() {
  const m = getMetrics();
  const users = getUsers();
  const logs = getLogs();
  const announcements = getAnnouncements();

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, Admin! Here's what's happening today.
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
          value={m.totalUsers.toLocaleString()}
          delta="12.5% from last 7 days"
          Icon={UsersIcon}
          tone="bg-violet-500/15 border-violet-500/40 text-violet-300"
        />
        <StatCard
          label="Total Credits Used"
          value={m.totalCredits.toLocaleString()}
          delta="8.7% from last 7 days"
          Icon={Zap}
          tone="bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
        />
        <StatCard
          label="Total Tools Used"
          value={m.toolUses.toLocaleString()}
          delta="15.3% from last 7 days"
          Icon={Box}
          tone="bg-blue-500/15 border-blue-500/40 text-blue-300"
        />
        <StatCard
          label="Total Revenue"
          value={`$${m.revenue.toLocaleString()}`}
          delta="18.6% from last 7 days"
          Icon={DollarSign}
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
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(270 80% 60%)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(270 80% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
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
            <div className="text-sm font-semibold">Credits Usage</div>
            <div className="text-[11px] text-muted-foreground border border-border rounded-md px-2 py-0.5">
              7 Days
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={creditsUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
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
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Top Active Users</div>
          </div>
          <div className="space-y-3">
            {users.slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="text-xs text-muted-foreground w-4">{i + 1}</div>
                <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                  {u.username[1]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.username}</div>
                  <div className="h-1.5 mt-1 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (u.credits / 12500) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {u.credits.toLocaleString()} used
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold inline-flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" /> Recent Announcements
            </div>
          </div>
          {announcements.length === 0 ? (
            <p className="text-xs text-muted-foreground">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id} className="text-sm">
                  <div className="font-medium">📣 {a.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            <div className="text-sm font-semibold mb-2">Recent Activity</div>
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 4).map((l) => (
                  <div key={l.id} className="text-xs flex items-center justify-between gap-2">
                    <span className="truncate">{l.message}{l.user ? ` — ${l.user}` : ""}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
