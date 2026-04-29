import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { addLog } from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "fluxa_credits_v1";
const DAILY_AMOUNT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

type State = { credits: number; lastClaim: number };

const read = (): State => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { credits: DAILY_AMOUNT, lastClaim: Date.now() };
};

const write = (s: State) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));

const listeners = new Set<(s: State) => void>();
let current: State = read();

const setState = (next: State) => {
  current = next;
  write(next);
  listeners.forEach((l) => l(next));
};

const checkDailyReset = (silent = false) => {
  const now = Date.now();
  if (now - current.lastClaim >= DAY_MS) {
    setState({ credits: DAILY_AMOUNT, lastClaim: now });
    if (!silent) toast.success("Daily credits added ⚡");
    return true;
  }
  return false;
};

// Server-granted bonus credits (admin-issued, unlimited)
const bonusListeners = new Set<(n: number) => void>();
let bonusCurrent = 0;
let bonusRowId: string | null = null;

const fetchBonus = async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    bonusCurrent = 0;
    bonusRowId = null;
    bonusListeners.forEach((l) => l(0));
    return;
  }
  const email = (user.email ?? "").toLowerCase();
  const { data } = await supabase
    .from("user_credits")
    .select("id, balance")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  bonusRowId = (data as any)?.id ?? null;
  bonusCurrent = Number((data as any)?.balance ?? 0);
  bonusListeners.forEach((l) => l(bonusCurrent));
};

const spendBonus = async (amount: number): Promise<boolean> => {
  if (!bonusRowId || bonusCurrent < amount) return false;
  const next = bonusCurrent - amount;
  const { error } = await supabase
    .from("user_credits")
    .update({ balance: next })
    .eq("id", bonusRowId);
  if (error) return false;
  bonusCurrent = next;
  bonusListeners.forEach((l) => l(bonusCurrent));
  return true;
};

export const useCredits = () => {
  const [state, setLocal] = useState<State>(current);
  const [bonus, setBonus] = useState<number>(bonusCurrent);

  useEffect(() => {
    listeners.add(setLocal);
    bonusListeners.add(setBonus);
    checkDailyReset();
    fetchBonus();
    const interval = setInterval(() => checkDailyReset(), 60 * 1000);
    const bonusInterval = setInterval(() => fetchBonus(), 30 * 1000);
    const { data: sub } = supabase.auth.onAuthStateChange(() => fetchBonus());
    return () => {
      listeners.delete(setLocal);
      bonusListeners.delete(setBonus);
      clearInterval(interval);
      clearInterval(bonusInterval);
      sub.subscription.unsubscribe();
    };
  }, []);

  const spend = useCallback(async (amount: number) => {
    checkDailyReset(true);
    const total = current.credits + bonusCurrent;
    if (total < amount) {
      toast.error("Not enough credits");
      return false;
    }
    // Spend from daily first
    const fromDaily = Math.min(current.credits, amount);
    const remaining = amount - fromDaily;
    if (fromDaily > 0) {
      setState({ ...current, credits: current.credits - fromDaily });
    }
    if (remaining > 0) {
      const ok = await spendBonus(remaining);
      if (!ok) {
        // rollback daily
        if (fromDaily > 0) setState({ ...current, credits: current.credits + fromDaily });
        toast.error("Could not deduct credits");
        return false;
      }
    }
    addLog({ type: "credit", message: `Credits used`, amount: -amount });
    toast.success(`Credits used (-${amount})`);
    return true;
  }, []);

  return { credits: state.credits + bonus, dailyCredits: state.credits, bonusCredits: bonus, spend };
};
