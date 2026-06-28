import { ReactNode, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Home, Sparkles, FolderKanban, LayoutTemplate, Rocket, Image as ImageIcon,
  Boxes, Plug, History, Settings as SettingsIcon, Menu, X, Bell,
} from "lucide-react";
import { LumoLogo } from "./LumoLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/projects", label: "AI Builder", icon: Sparkles },
  { to: "/projects?view=all", label: "Projects", icon: FolderKanban },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/deployments", label: "Deployments", icon: Rocket },
  { to: "/assets", label: "Assets", icon: ImageIcon },
  { to: "/components", label: "Components", icon: Boxes },
  { to: "/integrations", label: "Integrations", icon: Plug },
  { to: "/history", label: "History", icon: History },
];

export function LumoShell({
  children,
  title,
  action,
}: { children: ReactNode; title?: string; action?: ReactNode }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-transform md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <LumoLogo />
          <button className="md:hidden text-muted-foreground" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <Link
          to="/projects?new=1"
          className="mx-4 mb-4 inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-primary to-primary-glow text-sm font-medium text-white shadow-lg shadow-primary/30 hover:opacity-95"
        >
          + New Project
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/projects"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )
            }
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </NavLink>
          {user && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{user.email?.split("@")[0]}</div>
                <div className="text-[10px] text-muted-foreground">Pro Plan</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-muted-foreground" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
            </Button>
            {!user && (
              <Button asChild size="sm" variant="ghost"><Link to="/signin">Sign in</Link></Button>
            )}
            {user && (
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            )}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
