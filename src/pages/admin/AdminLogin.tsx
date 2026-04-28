import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Zap, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ADMIN_EMAIL } from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!loading && isAdmin) navigate("/admin", { replace: true });
  }, [loading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/signin", { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center mb-3">
            <Zap className="h-6 w-6 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            Fluxa AI <span className="text-primary">Admin</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Admin access is restricted to the authorized account.
          </p>
        </div>

        {!user ? (
          <>
            <div className="mb-4 rounded-xl border border-border bg-surface-2/60 text-sm p-3 text-muted-foreground">
              You must be signed in with the admin account to continue.
            </div>
            <button
              onClick={() => navigate("/signin", { state: { from: { pathname: "/admin" } } })}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold">Access Denied</div>
                <div className="text-xs opacity-90 mt-1">
                  Signed in as <span className="font-mono">{user.email}</span>. Only the admin
                  account can access this panel.
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="btn-primary"
            >
              Sign out & switch account
            </button>
          </>
        )}

        <button
          onClick={() => navigate("/chat")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to app
        </button>
      </div>
    </div>
  );
}
