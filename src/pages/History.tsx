import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function History() {
  const { user } = useAuth();
  const [chats, setChats] = useState<{ id: string; title: string; updated_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("chats").select("id,title,updated_at").order("updated_at", { ascending: false }).then(({ data }) => {
      if (data) setChats(data);
    });
  }, [user]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-4">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">History</h1>
          <p className="text-sm text-muted-foreground mt-1">Your recent chat sessions.</p>
        </header>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {chats.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No chats yet.</div>}
          {chats.map((c) => (
            <Link key={c.id} to={`/chat/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-surface-2 transition-colors">
              <MessageCircle className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(c.updated_at).toLocaleString()}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
