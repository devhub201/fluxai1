import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { addAnnouncement, deleteAnnouncement, getAnnouncements } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";
import { toast } from "sonner";

export default function AdminAnnouncements() {
  useAdminStore();
  const list = getAnnouncements();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    addAnnouncement(title.trim(), body.trim());
    setTitle("");
    setBody("");
    toast.success("Announcement published");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground">Create announcements visible across the app.</p>
      </header>

      <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          className="w-full min-h-24 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60"
        />
        <button type="submit" className="btn-primary !h-10 !w-auto px-5 inline-flex">
          <Megaphone className="h-4 w-4 mr-2" /> Publish
        </button>
      </form>

      <div className="space-y-2">
        {list.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-border rounded-2xl p-6 text-center">
            No announcements yet.
          </div>
        ) : (
          list.map((a) => (
            <div key={a.id} className="rounded-2xl bg-card border border-border p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Megaphone className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{a.title}</div>
                {a.body && <p className="text-xs text-muted-foreground mt-1">{a.body}</p>}
                <div className="text-[11px] text-muted-foreground mt-1">
                  {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => {
                  deleteAnnouncement(a.id);
                  toast.success("Deleted");
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
