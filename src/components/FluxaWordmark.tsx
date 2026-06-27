import { Sparkles } from "lucide-react";

export function FluxaWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }[size];
  return (
    <div className={`flex items-center gap-2 font-semibold ${sizes}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </div>
      Lovable Builder
    </div>
  );
}
