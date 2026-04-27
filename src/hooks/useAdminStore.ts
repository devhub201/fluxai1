import { useEffect, useState } from "react";
import { subscribeAdmin } from "@/lib/adminStore";

export const useAdminStore = () => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeAdmin(() => setTick((t) => t + 1));
    return () => {
      unsub;
    };
  }, []);
};
