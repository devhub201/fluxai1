import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, LogOut, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
      setDisplayName(data?.display_name ?? user.user_metadata?.display_name ?? "");
      setLoading(false);
    })();
  }, [user]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName.trim().slice(0, 100) });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Section title="Account">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display name</label>
              <div className="relative">
                <User className="field-icon h-4 w-4" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="field"
                  maxLength={100}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="field-icon h-4 w-4" />
                <input type="email" value={user?.email ?? ""} className="field opacity-70" readOnly />
              </div>
            </div>
            <button type="submit" disabled={saving || loading} className="btn-primary !w-auto px-6 inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Section>

        <Section title="App">
          <Row label="Appearance" value="Dark" />
          <Row label="Language" value="Auto" />
          <Row label="Version" value="1.0.0" />
        </Section>

        <button onClick={handleSignOut} className="mt-8 w-full h-12 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors">
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">{title}</h2>
    <div className="rounded-2xl bg-card border border-border p-4 sm:p-6 space-y-3">{children}</div>
  </section>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <span className="text-foreground">{label}</span>
    <span className="text-muted-foreground">{value}</span>
  </div>
);

export default Settings;
