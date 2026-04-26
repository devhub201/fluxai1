import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { StatusBar } from "./StatusBar";

interface PhoneProps {
  children: ReactNode;
  className?: string;
  label?: string;
}

export const Phone = ({ children, className, label }: PhoneProps) => (
  <div className="flex flex-col items-center gap-3">
    <div className={cn("phone-frame flex flex-col", className)}>
      <StatusBar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
    {label && (
      <span className="text-xs text-muted-foreground/70 font-medium">{label}</span>
    )}
  </div>
);
