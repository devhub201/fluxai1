import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Wrench,
  Coins,
  Megaphone,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Zap,
  Search,
  Bell,
} from "lucide-react";
import { getMetrics, setSession } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const nav = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/credits", label: "Credits", icon: Coins },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export const AdminShell = () => {
  useAdminStore();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const m = getMetrics();

  useEffect(() => setOpen(false), [navigate]);

  const logout = async () => {
    setSession(null);
    await signOut();
    toast.success("Logged out");
    navigate("/signin", { replace: true });
  };

  const adminInitial = (user?.email?.[0] || "A").toUpperCase();

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary fill-primary" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">Fluxa AI</div>
              <div className="text-[10px] text-primary uppercase tracking-wider">Admin Panel</div>
            </div>
          </div>
          <button className="md:hidden text-muted-foreground" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/15 border border-primary/30 text-primary"
                    : "text-foreground/80 hover:bg-surface-2"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <Link
            to="/chat"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            ← Back to app
          </Link>
          <button
            onClick={logout}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-border hover:bg-surface-2 text-sm"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border">
          <button
            onClick={() => setOpen(true)}
            className="md:hidden text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="field-icon h-4 w-4" />
              <input placeholder="Search anything..." className="field h-10 text-sm" />
            </div>
          </div>
          <div className="flex-1 md:hidden" />
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 fill-primary" /> {m.totalCredits.toLocaleString()} Credits
          </span>
          <button className="relative h-9 w-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">3</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
            <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">{adminInitial}</div>
            <div className="leading-tight max-w-[160px]">
              <div className="text-sm font-semibold truncate">Admin</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email ?? "Super Admin"}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
