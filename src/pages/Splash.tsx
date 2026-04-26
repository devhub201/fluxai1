import { Phone } from "@/components/Phone";
import { FluxaWordmark } from "@/components/FluxaWordmark";
import { Link } from "react-router-dom";
import logo from "@/assets/fluxa-logo.png";

const Splash = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="relative flex-1 flex flex-col items-center px-6 pt-8 pb-8">
        {/* subtle wave decoration */}
        <svg
          className="absolute left-0 right-0 top-1/2 -translate-y-1/4 w-full opacity-60 pointer-events-none"
          viewBox="0 0 320 200"
          fill="none"
        >
          <path d="M0 120 Q80 60 160 120 T320 120" stroke="hsl(var(--primary))" strokeOpacity="0.35" strokeWidth="1" />
          <path d="M0 140 Q80 80 160 140 T320 140" stroke="hsl(var(--primary))" strokeOpacity="0.25" strokeWidth="1" />
          <path d="M0 160 Q80 100 160 160 T320 160" stroke="hsl(var(--primary))" strokeOpacity="0.18" strokeWidth="1" />
        </svg>

        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <img
            src={logo}
            alt="Fluxa AI logo"
            width={120}
            height={120}
            className="h-28 w-28 mb-6 drop-shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
          />
          <FluxaWordmark />
          <p className="mt-4 text-center text-sm text-muted-foreground leading-relaxed">
            Your AI Co-pilot for
            <br />
            Work, Code, Learn &amp; More
          </p>
        </div>

        <div className="w-full space-y-3 relative z-10">
          <Link to="/signin" className="btn-primary">Sign In</Link>
          <Link to="/signup" className="btn-outline">Create Account</Link>
          <p className="pt-3 text-center text-[11px] text-muted-foreground">
            By continuing, you agree to our
            <br />
            <span className="text-primary">Terms of Service</span> and{" "}
            <span className="text-primary">Privacy Policy</span>
          </p>
        </div>
      </div>
    </Phone>
  </div>
);

export default Splash;
