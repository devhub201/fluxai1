import { Signal, Wifi, BatteryFull } from "lucide-react";

export const StatusBar = () => (
  <div className="status-bar">
    <span>9:41</span>
    <div className="flex items-center gap-1.5 text-foreground">
      <Signal className="h-3.5 w-3.5" />
      <Wifi className="h-3.5 w-3.5" />
      <BatteryFull className="h-4 w-4" />
    </div>
  </div>
);
