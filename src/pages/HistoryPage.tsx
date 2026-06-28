import { LumoShell } from "@/components/lumo/LumoShell";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Loader2, History as HistoryIcon } from "lucide-react";

export default function HistoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("builder_projects").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(50);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <LumoShell title="History" action={<Button variant="outline" size="sm">Clear History</Button>}>
      <p className="mb-6 text-sm text-muted-foreground">View your past conversations and generations.</p>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
          <HistoryIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
          No history yet.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {items.map((it, i) => (
            <div key={it.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-semibold">v{i + 1}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{it.title}</div>
                  <div className="text-xs text-muted-foreground">Generated a project</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(it.updated_at), { addSuffix: true })}</div>
            </div>
          ))}
        </div>
      )}
    </LumoShell>
  );
}
