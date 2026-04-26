import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

const VerifyEmail = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col px-6 pt-4 pb-6">
        <Link to="/signup" aria-label="Back" className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex justify-center mt-6">
          <div className="relative">
            <ShieldCheck className="h-20 w-20 text-muted-foreground/40" strokeWidth={1.2} />
            <span className="absolute -bottom-1 right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-phone">
              <Mail className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We&apos;ve sent a 6-digit code to<br />
            <span className="text-foreground">cubeX@gmail.com</span>
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {["4","2","7","1","9","6"].map((d, i) => (
            <div key={i} className="h-12 w-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-lg font-semibold">
              {d}
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Code expires in <span className="text-foreground font-medium">02:45</span>
        </p>

        <Link to="/success" className="btn-primary mt-6">Verify Email</Link>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Didn&apos;t receive the code? <span className="text-primary font-medium">Resend</span>
        </p>
      </div>
    </Phone>
  </div>
);

export default VerifyEmail;
