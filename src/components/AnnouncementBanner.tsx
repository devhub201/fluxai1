import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";
import { getAnnouncements, type Announcement } from "@/lib/adminStore";

const DISMISS_KEY = "fluxa_announcement_dismissed_v1";

export const AnnouncementBanner = () => {
  const [latest, setLatest] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(
    () => localStorage.getItem(DISMISS_KEY)
  );

  const refresh = () => {
    const list = getAnnouncements();
    setLatest(list[0] ?? null);
  };

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("fluxa:announcements", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("fluxa:announcements", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  if (!latest || dismissed === latest.id) return null;

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
          localStorage.setItem(DISMISS_KEY, latest.id);
          setDismissed(latest.id);
        }}
        className="text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
