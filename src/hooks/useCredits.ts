import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

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

export const useCredits = () => {
  const [state, setLocal] = useState<State>(current);

  useEffect(() => {
    listeners.add(setLocal);
    checkDailyReset();
    const interval = setInterval(() => checkDailyReset(), 60 * 1000);
    return () => {
      listeners.delete(setLocal);
      clearInterval(interval);
    };
  }, []);

  const spend = useCallback((amount: number) => {
    checkDailyReset(true);
    if (current.credits < amount) {
      toast.error("Not enough credits");
      return false;
    }
    const next = Math.max(0, current.credits - amount);
    setState({ ...current, credits: next });
    toast.success(`Credits used (-${amount})`);
    return true;
  }, []);

  return { credits: state.credits, spend };
};
