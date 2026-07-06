import { ReactNode, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Home, Sparkles, LayoutTemplate, Settings as SettingsIcon, Menu, X, Bot, Zap } from "lucide-react";
import { LumoLogo } from "./LumoLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/projects", label: "My Bots", icon: Bot },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
];

export function LumoShell({
  children,
  title,
  action,
}: { children: ReactNode; title?: string; action?: ReactNode }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen aurora-bg text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/[0.06] bg-background/70 backdrop-blur-2xl transition-transform md:relative md:translate-x-0",
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
          className="group mx-4 mb-4 relative inline-flex h-11 items-center justify-center gap-1.5 overflow-hidden rounded-xl text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:shadow-primary/50"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="h-4 w-4" /> New Bot
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground border border-transparent",
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}

          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-primary" /> Free plan
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">Unlimited chats · export ZIP</div>
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <NavLink
            to="/settings"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              )
            }
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </NavLink>
          {user && (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "var(--gradient-primary)" }}>
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{user.email?.split("@")[0]}</div>
                <div className="text-[10px] text-muted-foreground">Lumo Builder</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/[0.06] bg-background/60 px-4 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-muted-foreground" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            {title && <h1 className="font-display text-lg font-semibold">{title}</h1>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {!user && (
              <Button asChild size="sm" variant="ghost"><Link to="/signin">Sign in</Link></Button>
            )}
            {user && (
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            )}
          </div>
        </header>
        <main className="relative flex-1 px-4 py-6 md:px-8 md:py-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
