import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Eye, User, Github, Apple } from "lucide-react";

const SignUp = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <Link to="/" aria-label="Back" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Join Fluxa AI and supercharge<br />your productivity
          </p>
        </div>

        <form className="mt-6 space-y-3">
          <Field icon={<User className="h-4 w-4" />} placeholder="Full name" />
          <Field icon={<Mail className="h-4 w-4" />} placeholder="Email address" />
          <Field icon={<Lock className="h-4 w-4" />} placeholder="Password" type="password" trailing={<Eye className="h-4 w-4 text-muted-foreground" />} />
          <Field icon={<Lock className="h-4 w-4" />} placeholder="Confirm password" type="password" trailing={<Eye className="h-4 w-4 text-muted-foreground" />} />
          <Link to="/verify" className="btn-primary mt-2">Create Account</Link>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or continue with</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <SocialBtn><GoogleG /></SocialBtn>
          <SocialBtn><Github className="h-5 w-5" /></SocialBtn>
          <SocialBtn><Apple className="h-5 w-5 fill-foreground" /></SocialBtn>
        </div>
        <p className="mt-auto pt-5 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/signin" className="text-primary font-medium">Sign in</Link>
        </p>
      </div>
    </Phone>
  </div>
);

const Field = ({ icon, placeholder, type = "text", trailing }: any) => (
  <div className="relative">
    <span className="field-icon">{icon}</span>
    <input type={type} placeholder={placeholder} className="field" />
    {trailing && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{trailing}</span>}
  </div>
);

const SocialBtn = ({ children }: any) => (
  <button type="button" aria-label="Social" className="h-12 rounded-xl border border-border bg-surface-2 flex items-center justify-center text-foreground">
    {children}
  </button>
);

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.5 6.6 2.5 12s4.2 9.6 9.5 9.6c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"/>
  </svg>
);

export default SignUp;
