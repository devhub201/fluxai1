import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DISMISS_KEY = "fluxa_announcement_dismissed_v1";

type Item = { key: string; title: string; body: string };

export const AnnouncementBanner = () => {
  const [latest, setLatest] = useState<Item | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(
    () => localStorage.getItem(DISMISS_KEY)
  );

  const refresh = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .like("key", "announcement:%")
      .order("updated_at", { ascending: false })
      .limit(1);
    const row: any = data?.[0];
    if (row) setLatest({ key: row.key, title: row.value?.title ?? "", body: row.value?.body ?? "" });
    else setLatest(null);
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("fluxa:announcements", handler);
    return () => window.removeEventListener("fluxa:announcements", handler);
  }, []);

  if (!latest || dismissed === latest.key) return null;

  return (
    <div className="mx-3 mt-3 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 flex items-start gap-2">
      <Megaphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 text-xs">
        <div className="font-semibold text-primary truncate">{latest.title}</div>
        {latest.body && (
          <div className="text-muted-foreground truncate">{latest.body}</div>
        )}
      </div>
      <button
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, latest.key);
          setDismissed(latest.key);
        }}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
