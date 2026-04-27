import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail, Zap, ShieldAlert } from "lucide-react";
import { ADMIN_EMAIL, isAdminLoggedIn, setSession } from "@/lib/adminStore";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (isAdminLoggedIn()) navigate("/admin", { replace: true });
  }, [navigate]);

  if (isAdminLoggedIn()) return <Navigate to="/admin" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDenied(false);
    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setDenied(true);
      toast.error("Access Denied");
      return;
    }
    if (password.length < 1) {
      toast.error("Enter a password");
      return;
    }
    setSession({ email: ADMIN_EMAIL, loggedInAt: Date.now() });
    toast.success("Welcome, Admin");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center mb-3">
            <Zap className="h-6 w-6 text-primary fill-primary" />
          </div>
          <h1 className="text-2xl font-bold">Fluxa AI <span className="text-primary">Admin</span></h1>
          <p className="text-xs text-muted-foreground mt-1">Sign in with the admin email to continue.</p>
        </div>

        {denied && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm p-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" /> Access Denied
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail className="field-icon h-4 w-4" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
              className="field"
            />
          </div>
          <div className="relative">
            <Lock className="field-icon h-4 w-4" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="field"
            />
          </div>
          <button type="submit" className="btn-primary">Sign in to Admin</button>
        </form>

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
