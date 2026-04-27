import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus, Search, Settings as SettingsIcon, LogOut, Menu, X, MessageCircle, Trash2, LayoutGrid, ShoppingBag, History as HistoryIcon, User as UserIcon, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FluxaWordmark } from "@/components/FluxaWordmark";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";

interface Chat {
  id: string;
  title: string;
  updated_at: string;
}

export const AppShell = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { credits } = useCredits();
  const [chats, setChats] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // close mobile sidebar on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const loadChats = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chats")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    if (!error && data) setChats(data as Chat[]);
  };

  useEffect(() => { loadChats(); }, [user]);

  // Listen to a custom event so the chat page can ask the sidebar to refresh
  useEffect(() => {
    const handler = () => loadChats();
    window.addEventListener("chats:refresh", handler);
    return () => window.removeEventListener("chats:refresh", handler);
  }, [user]);

  const newChat = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: "New Chat" })
      .select("id")
      .single();
    if (error || !data) { toast.error(error?.message ?? "Failed to create chat"); return; }
    await loadChats();
    navigate(`/chat/${data.id}`);
  };

  const deleteChat = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setChats((c) => c.filter((x) => x.id !== id));
    if (params.id === id) navigate("/chat");
    toast.success("Chat deleted");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const filtered = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "You";

  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <Link to="/"><FluxaWordmark size="sm" /></Link>
          <button className="md:hidden text-muted-foreground" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 space-y-3">
          <button onClick={newChat} className="w-full h-10 rounded-xl bg-primary/15 border border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/20">
            <Plus className="h-4 w-4" /> New Chat
          </button>
          <div className="relative">
            <Search className="field-icon h-4 w-4" />
            <input
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field h-10 text-xs pr-3"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              No chats yet. Click <span className="text-primary">New Chat</span> to start.
            </div>
          )}
          {filtered.map((c) => (
            <NavLink
              key={c.id}
              to={`/chat/${c.id}`}
              className={({ isActive }) =>
                `group flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isActive ? "bg-primary/15 border border-primary/30 text-primary" : "text-foreground hover:bg-surface-2"
                }`
              }
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => deleteChat(c.id, e)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                aria-label="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary">
            {displayName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{displayName}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <Link to="/settings" className="text-muted-foreground hover:text-foreground" aria-label="Settings"><SettingsIcon className="h-4 w-4" /></Link>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
        </div>

        {/* Fluxa AI Pro upgrade card */}
        <div className="px-3 pb-3">
          <div className="rounded-xl border border-border bg-surface-2/60 p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <Zap className="h-4 w-4 text-primary fill-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">Fluxa AI Pro</div>
              <div className="text-[11px] text-muted-foreground truncate">Unlock more power with Fluxa AI Pro.</div>
            </div>
            <button className="text-xs font-semibold text-primary border border-primary/40 rounded-lg px-3 py-1.5 hover:bg-primary/10">
              Upgrade
            </button>
          </div>
        </div>

        {/* Bottom nav inside sidebar */}
        <div className="border-t border-border grid grid-cols-5 h-16">
          {[
            { to: "/chat", label: "Chats", icon: MessageCircle },
            { to: "/tools", label: "Tools", icon: LayoutGrid },
            { to: "/store", label: "Store", icon: ShoppingBag },
            { to: "/history", label: "History", icon: HistoryIcon },
            { to: "/settings", label: "Profile", icon: UserIcon },
          ].map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className={active ? "h-9 w-9 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-center" : "flex items-center justify-center"}>
                  <Icon className="h-5 w-5" />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="md:hidden text-foreground"><Menu className="h-5 w-5" /></button>
          <div className="md:hidden"><FluxaWordmark size="sm" /></div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 fill-primary" /> {credits}
            </span>
            <button onClick={newChat} aria-label="New chat" className="md:hidden text-foreground"><Plus className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
