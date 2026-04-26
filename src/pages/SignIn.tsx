import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, Github, Apple } from "lucide-react";

const SignIn = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <Link to="/" aria-label="Back" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to Fluxa AI</p>
        </div>

        <form className="mt-7 space-y-3">
          <div className="relative">
            <Mail className="field-icon h-4 w-4" />
            <input type="email" placeholder="Email address" className="field" />
          </div>
          <div className="relative">
            <Lock className="field-icon h-4 w-4" />
            <input type="password" placeholder="Password" className="field" />
            <Eye className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <div className="pt-1">
            <Link to="/forgot" className="text-sm font-medium text-primary">Forgot password?</Link>
          </div>
          <button type="button" className="btn-primary mt-4">Sign In</button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            <GoogleIcon key="g" />,
            <Github key="gh" className="h-5 w-5 text-foreground" />,
            <Apple key="a" className="h-5 w-5 text-foreground fill-foreground" />,
          ].map((icon, i) => (
            <button
              key={i}
              type="button"
              className="h-12 rounded-xl border border-border bg-surface-2 flex items-center justify-center hover:bg-surface transition-colors"
              aria-label="Social sign-in"
            >
              {icon}
            </button>
          ))}
        </div>

        <p className="mt-auto pt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">Create one</Link>
        </p>
      </div>
    </Phone>
  </div>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.5 6.6 2.5 12s4.2 9.6 9.5 9.6c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"/>
    <path fill="#34A853" d="M3.9 7.4l3.2 2.3C8 7.9 9.8 6.8 12 6.8c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 4.1 14.6 3.2 12 3.2 8.3 3.2 5.1 5.4 3.9 7.4z" opacity=".0"/>
  </svg>
);

export default SignIn;
