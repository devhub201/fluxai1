import { LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminStore";

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Admin account and session.</p>
      </header>

      <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">Admin Account</div>
            <div className="text-xs text-muted-foreground">{user?.email ?? ADMIN_EMAIL}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          User ID: <span className="font-mono">{user?.id ?? "—"}</span>
        </div>
        <button
          onClick={async () => {
            await signOut();
            toast.success("Logged out");
            navigate("/signin", { replace: true });
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-sm"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}
