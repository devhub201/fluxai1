import { useState } from "react";
import { LumoShell } from "@/components/lumo/LumoShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const tabs = ["Profile", "Appearance", "AI Model", "API Keys", "Billing", "Notifications", "Security"];

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState("Profile");
  const [name, setName] = useState(user?.email?.split("@")[0] ?? "");

  return (
    <LumoShell title="Settings">
      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative px-3 py-2 text-sm transition ${tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
            {tab === t && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <div className="space-y-6">
          <Section title="Profile Information" desc="Update your profile information.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 bg-surface-2 border-border" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled className="mt-1 bg-surface-2 border-border" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-lg font-semibold text-white">
                {name[0]?.toUpperCase() ?? "U"}
              </div>
              <Button variant="outline" size="sm">Change Avatar</Button>
              <span className="text-xs text-muted-foreground">JPG, PNG or GIF. Max size 3MB.</span>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => toast.success("Saved")} className="bg-gradient-to-r from-primary to-primary-glow">Save Changes</Button>
            </div>
          </Section>

          <Section title="Account" desc="Delete your account and all of your data." danger>
            <Button variant="destructive">Delete Account</Button>
          </Section>
        </div>
      )}

      {tab === "Appearance" && (
        <Section title="Appearance" desc="Customize the look of Lumo.">
          <div className="grid gap-3 sm:grid-cols-3">
            {["Dark", "Light", "System"].map((t) => (
              <button key={t} className={`rounded-xl border p-4 text-left transition ${t === "Dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <div className="text-sm font-medium">{t}</div>
                <div className="text-xs text-muted-foreground">Theme preference</div>
              </button>
            ))}
          </div>
        </Section>
      )}

      {tab === "AI Model" && (
        <Section title="Model Preferences" desc="Choose the default AI model for new projects.">
          {["GPT-4o (Recommended)", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "Llama 3.1 70B"].map((m, i) => (
            <label key={m} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div>
                <div className="text-sm font-medium">{m}</div>
                <div className="text-xs text-muted-foreground">Most capable model for complex tasks.</div>
              </div>
              <input type="radio" name="model" defaultChecked={i === 0} className="accent-[hsl(var(--primary))]" />
            </label>
          ))}
        </Section>
      )}

      {tab === "API Keys" && (
        <Section title="API Keys" desc="Manage your API keys and integrate Lumo with your tools.">
          {["Production Key", "Development Key", "Test Key"].map((k) => (
            <div key={k} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <div>
                <div className="text-sm font-medium">{k}</div>
                <div className="text-xs text-muted-foreground">lum_•••••••••••</div>
              </div>
              <Button variant="outline" size="sm">Copy</Button>
            </div>
          ))}
          <div className="mt-4"><Button className="bg-gradient-to-r from-primary to-primary-glow">+ New API Key</Button></div>
        </Section>
      )}

      {tab === "Billing" && (
        <Section title="Billing & Subscription" desc="Manage your plan, payment methods and billing details.">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">Current Plan</div>
                <div className="text-xl font-semibold">Pro Plan</div>
                <div className="text-xs text-muted-foreground">$19/month · Renews Jun 16, 2026</div>
              </div>
              <Button className="bg-gradient-to-r from-primary to-primary-glow">Upgrade Plan</Button>
            </div>
          </div>
        </Section>
      )}

      {tab === "Notifications" && (
        <Section title="Notifications" desc="Configure your email and push notifications.">
          {["Deployment alerts", "Weekly summary", "Product updates", "Security alerts"].map((n, i) => (
            <label key={n} className="flex items-center justify-between border-b border-border py-3 last:border-0">
              <span className="text-sm">{n}</span>
              <input type="checkbox" defaultChecked={i < 2} className="accent-[hsl(var(--primary))]" />
            </label>
          ))}
        </Section>
      )}

      {tab === "Security" && (
        <Section title="Security" desc="Manage your password and two-factor authentication.">
          <Button variant="outline">Change Password</Button>
          <Button variant="outline" className="ml-2">Enable 2FA</Button>
        </Section>
      )}
    </LumoShell>
  );
}

function Section({ title, desc, children, danger }: any) {
  return (
    <div className={`rounded-xl border bg-card p-6 ${danger ? "border-destructive/30" : "border-border"}`}>
      <h2 className={`text-base font-semibold ${danger ? "text-destructive" : ""}`}>{title}</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
