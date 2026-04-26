import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const AccountCreated = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute inset-0 green-orb rounded-full blur-xl" />
            <div className="absolute inset-3 rounded-full border border-primary/40" />
            <div className="absolute inset-7 rounded-full border border-primary/20" />
            <div className="relative h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_hsl(var(--primary)/0.6)]">
              <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
            </div>
            {/* sparkles */}
            {[
              { c: "top-2 left-6", color: "bg-primary" },
              { c: "top-6 right-2", color: "bg-yellow-400" },
              { c: "bottom-6 left-0", color: "bg-primary" },
              { c: "bottom-2 right-6", color: "bg-yellow-400" },
            ].map((s, i) => (
              <span key={i} className={`absolute ${s.c} h-1.5 w-1.5 rounded-full ${s.color}`} />
            ))}
          </div>

          <h1 className="mt-8 text-2xl font-bold">Account Created!</h1>
          <p className="mt-3 text-center text-sm text-muted-foreground leading-relaxed">
            Welcome to Fluxa AI.<br />
            You&apos;re all set to explore the power<br />of AI.
          </p>
        </div>

        <Link to="/chat" className="btn-primary">Get Started</Link>
        <Link to="/chat" className="mt-3 block text-center text-sm text-muted-foreground">
          Go to Dashboard
        </Link>
      </div>
    </Phone>
  </div>
);

export default AccountCreated;
