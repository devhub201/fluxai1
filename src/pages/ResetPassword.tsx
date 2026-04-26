import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FluxaWordmark } from "@/components/FluxaWordmark";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash and creates a session via onAuthStateChange.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated. You're signed in.");
    navigate("/chat", { replace: true });
  };

  return (
    <main className="auth-shell">
      <div className="auth-card max-w-md w-full">
        <div className="flex justify-center mb-6"><FluxaWordmark size="sm" /></div>
        <h1 className="text-2xl font-bold text-center">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {ready ? "Enter your new password below." : "Validating reset link..."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div className="relative">
            <Lock className="field-icon h-4 w-4" />
            <input type={show ? "text" : "password"} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required maxLength={72} disabled={!ready} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button type="submit" disabled={loading || !ready} className="btn-primary">
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPassword;
