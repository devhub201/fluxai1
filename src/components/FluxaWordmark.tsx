import logo from "@/assets/fluxa-logo.png";
import { Zap } from "lucide-react";

export const FluxaWordmark = ({ size = "lg" }: { size?: "lg" | "sm" }) => {
  const isLg = size === "lg";
  return (
    <div className="flex items-center justify-center gap-2">
      <img
        src={logo}
        alt="Fluxa AI logo"
        width={isLg ? 56 : 20}
        height={isLg ? 56 : 20}
        className={isLg ? "h-14 w-14" : "h-5 w-5"}
        loading="lazy"
      />
      <span
        className={
          isLg
            ? "text-3xl font-bold tracking-tight text-foreground"
            : "text-sm font-semibold text-foreground"
        }
      >
        Fluxa AI
      </span>
      <Zap
        className={isLg ? "h-6 w-6 text-primary fill-primary" : "h-3.5 w-3.5 text-primary fill-primary"}
        strokeWidth={2}
      />
    </div>
  );
};
