import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Menu, MoreVertical, Pencil, Mic, Paperclip, Send } from "lucide-react";
import { FluxaWordmark } from "./FluxaWordmark";

export const ChatHeader = () => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
    <Link to="/sidebar" aria-label="Menu" className="text-foreground">
      <Menu className="h-5 w-5" />
    </Link>
    <FluxaWordmark size="sm" />
    <div className="flex items-center gap-3 text-foreground">
      <Pencil className="h-4 w-4" />
      <Link to="/settings" aria-label="More"><MoreVertical className="h-4 w-4" /></Link>
    </div>
  </div>
);

export const ChatComposer = () => (
  <div className="px-4 pb-4 pt-2">
    <div className="flex items-center gap-2 h-12 rounded-full bg-surface-2 border border-border/60 pl-4 pr-1.5">
      <input placeholder="Ask anything..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 outline-none" />
      <button aria-label="Attach" className="text-muted-foreground"><Paperclip className="h-4 w-4" /></button>
      <button aria-label="Voice" className="text-muted-foreground"><Mic className="h-4 w-4" /></button>
      <button aria-label="Send" className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <Send className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export const ChatLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex-1 flex flex-col">
    <ChatHeader />
    <div className="flex-1 overflow-hidden">{children}</div>
    <ChatComposer />
  </div>
);
