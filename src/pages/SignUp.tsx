import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FluxaWordmark } from "@/components/FluxaWordmark";

const schema = z
  .object({
    name: z.string().trim().min(1, "Name required").max(100),
    email: z.string().trim().email("Invalid email").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

const SignUp = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/chat`,
        data: { display_name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! You're signed in.");
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
          <h1 className="text-2xl font-bold text-center">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">Join Fluxa AI and supercharge your productivity</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="relative">
              <User className="field-icon h-4 w-4" />
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="field" required maxLength={100} autoComplete="name" />
            </div>
            <div className="relative">
              <Mail className="field-icon h-4 w-4" />
              <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required maxLength={255} autoComplete="email" />
            </div>
            <div className="relative">
              <Lock className="field-icon h-4 w-4" />
              <input type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required maxLength={72} autoComplete="new-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="field-icon h-4 w-4" />
              <input type={show ? "text" : "password"} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" required maxLength={72} autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/signin" className="text-primary font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default SignUp;
