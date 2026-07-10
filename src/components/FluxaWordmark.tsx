import { Sparkles } from "lucide-react";

export function FluxaWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-base", md: "text-xl", lg: "text-2xl" }[size];
  return (
    <div className={`flex items-center gap-2 font-display font-semibold ${sizes}`}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-lg shadow-primary/30"
           style={{ background: "var(--gradient-primary)" }}>
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      Lumo AI
    </div>
  );
}
