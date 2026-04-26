import { Phone } from "@/components/Phone";
import { FluxaWordmark } from "@/components/FluxaWordmark";
import { Link } from "react-router-dom";
import { Plus, Search, X, Crown, Settings as SettingsIcon } from "lucide-react";

const chats = {
  Today: [
    { title: "AI Website Builder", time: "11:32 AM", active: true },
    { title: "Code Generator", time: "10:30 AM" },
    { title: "Python Help", time: "09:15 AM" },
  ],
  Yesterday: [
    { title: "Script Writing", time: "Yesterday" },
    { title: "Project Ideas", time: "Yesterday" },
    { title: "Database Schema", time: "Yesterday" },
  ],
  Older: [
    { title: "Linux Commands", time: "2 days ago" },
    { title: "Marketing Plan", time: "3 days ago" },
  ],
};

const Sidebar = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <FluxaWordmark size="sm" />
          <Link to="/chat" aria-label="Close"><X className="h-5 w-5 text-foreground" /></Link>
        </div>

        <div className="px-3 pt-3 space-y-3 flex-1 overflow-y-auto">
          <button className="w-full h-10 rounded-xl bg-primary/15 border border-primary/40 text-primary text-sm font-medium flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> New Chat <span className="ml-auto text-xs">⌘ K</span>
          </button>

          <div className="relative">
            <Search className="field-icon h-4 w-4" />
            <input placeholder="Search chats..." className="field h-10 text-xs" />
          </div>

          {Object.entries(chats).map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] font-medium text-muted-foreground px-2 mb-1.5">{group}</div>
              <div className="space-y-0.5">
                {items.map((c) => (
                  <button
                    key={c.title}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs ${
                      c.active ? "bg-primary/15 border border-primary/30 text-primary" : "text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <span className="text-xs">💬</span>
                    <span className="flex-1 truncate">{c.title}</span>
                    <span className={`text-[10px] ${c.active ? "text-primary" : "text-muted-foreground"}`}>{c.time}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border/40 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-sm">👤</div>
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-1.5">
              Cube X <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[9px] font-bold flex items-center gap-0.5"><Crown className="h-2.5 w-2.5" />Pro</span>
            </div>
            <div className="text-[10px] text-muted-foreground">cubeX@gmail.com</div>
          </div>
          <Link to="/settings"><SettingsIcon className="h-4 w-4 text-muted-foreground" /></Link>
        </div>
      </div>
    </Phone>
  </div>
);

export default Sidebar;
