import { useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { addTool, deleteTool, getTools, updateTool } from "@/lib/adminStore";
import { useAdminStore } from "@/hooks/useAdminStore";
import { toast } from "sonner";

export default function AdminTools() {
  useAdminStore();
  const tools = getTools();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", desc: "", credits: 100 });
  const [adding, setAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: "", desc: "", credits: 100 });

  const startEdit = (id: string) => {
    const t = tools.find((x) => x.id === id);
    if (!t) return;
    setForm({ name: t.name, desc: t.desc, credits: t.credits });
    setEditing(id);
  };

  const saveEdit = () => {
    if (!editing) return;
    updateTool(editing, form);
    setEditing(null);
    toast.success("Tool updated");
  };

  const handleAdd = () => {
    if (!newTool.name.trim()) return toast.error("Name required");
    addTool({ ...newTool, rating: 4.5 });
    setNewTool({ name: "", desc: "", credits: 100 });
    setAdding(false);
    toast.success("Tool added");
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tools Management</h1>
          <p className="text-sm text-muted-foreground">Add, edit and remove AI tools.</p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Tool
        </button>
      </header>

      {adding && (
        <div className="rounded-2xl bg-card border border-primary/40 p-4 space-y-3">
          <div className="text-sm font-semibold">New Tool</div>
          <input
            value={newTool.name}
            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
            placeholder="Tool name"
            className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
          />
          <textarea
            value={newTool.desc}
            onChange={(e) => setNewTool({ ...newTool, desc: e.target.value })}
            placeholder="Description"
            className="w-full min-h-20 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60"
          />
          <input
            type="number"
            value={newTool.credits}
            onChange={(e) => setNewTool({ ...newTool, credits: Number(e.target.value) })}
            placeholder="Credits"
            className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="btn-primary !h-10">Save</button>
            <button onClick={() => setAdding(false)} className="btn-outline !h-10">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tools.map((t) => {
          const isEditing = editing === t.id;
          return (
            <div key={t.id} className="rounded-2xl bg-card border border-border p-4">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-10 rounded-xl bg-surface-2 border border-border/60 px-3 text-sm outline-none focus:border-primary/60"
                  />
                  <textarea
                    value={form.desc}
                    onChange={(e) => setForm({ ...form, desc: e.target.value })}
                    className="w-full min-h-16 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Credits:</span>
                    <input
                      type="number"
                      value={form.credits}
                      onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                      className="w-28 h-9 rounded-lg bg-surface-2 border border-border/60 px-2 text-sm outline-none focus:border-primary/60"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveEdit} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-border text-xs">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(t.id)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${t.name}?`)) {
                            deleteTool(t.id);
                            toast.success("Tool deleted");
                          }
                        }}
                        className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">
                    {t.credits} credits
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
