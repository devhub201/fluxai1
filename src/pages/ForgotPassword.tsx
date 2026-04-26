import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPassword = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <Link to="/signin" aria-label="Back" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold">Forgot Password?</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Enter your email and we&apos;ll send you<br />a link to reset your password
          </p>
        </div>
        <div className="mt-6 relative">
          <Mail className="field-icon h-4 w-4" />
          <input type="email" placeholder="Email address" className="field" />
        </div>
        <Link to="/verify" className="btn-primary mt-4">Send Reset Link</Link>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Remember your password? <Link to="/signin" className="text-primary font-medium">Sign in</Link>
        </p>

        {/* glowing envelope illustration */}
        <div className="mt-auto flex items-center justify-center pt-10 pb-2">
          <div className="relative">
            <div className="absolute inset-0 -m-10 green-orb rounded-full blur-2xl" />
            <div className="relative w-24 h-16 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
              <Mail className="h-9 w-9 text-foreground" strokeWidth={1.4} />
              <span className="absolute -bottom-2 -right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-primary-foreground" fill="currentColor">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Phone>
  </div>
);

export default ForgotPassword;
