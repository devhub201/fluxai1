import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FluxaWordmark } from "@/components/FluxaWordmark";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) { toast.error("Enter a valid email"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Reset link sent. Check your email.");
  };

  return (
    <main className="auth-shell">
      <div className="w-full max-w-md">
        <Link to="/signin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="auth-card">
          <div className="flex justify-center mb-6"><FluxaWordmark size="sm" /></div>
          <h1 className="text-2xl font-bold text-center">Forgot Password?</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">Enter your email and we'll send you a link to reset your password</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <Mail className="field-icon h-4 w-4" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required maxLength={255} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Remember your password? <Link to="/signin" className="text-primary font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
