import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FluxaWordmark } from "@/components/FluxaWordmark";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/chat", { replace: true });
  };

  return (
    <main className="auth-shell">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="auth-card">
          <div className="flex justify-center mb-6"><FluxaWordmark size="sm" /></div>
          <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">Sign in to continue to Fluxa AI</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <Mail className="field-icon h-4 w-4" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required maxLength={255} autoComplete="email" />
            </div>
            <div className="relative">
              <Lock className="field-icon h-4 w-4" />
              <input type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required maxLength={72} autoComplete="current-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-right">
              <Link to="/forgot" className="text-sm font-medium text-primary">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-primary font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default SignIn;
