// Admin localStorage data layer (client-only, dummy SaaS data)
import { TOOLS as DEFAULT_TOOLS, type Tool } from "./tools";

export const ADMIN_EMAIL = "anujgupta20010@gmail.com";

const KEYS = {
  session: "fluxa_admin_session_v1",
  tools: "fluxa_admin_tools_v1",
  users: "fluxa_admin_users_v1",
  announcements: "fluxa_admin_announcements_v1",
  logs: "fluxa_admin_logs_v1",
  metrics: "fluxa_admin_metrics_v1",
};

export type AdminSession = { email: string; loggedInAt: number };
export type AdminUser = {
  id: string;
  username: string;
  email: string;
  credits: number;
  joinedAt: number;
};
export type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
};
export type LogEntry = {
  id: string;
  type: "tool" | "credit" | "system";
  message: string;
  user?: string;
  amount?: number;
  createdAt: number;
};

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
const write = <T>(key: string, value: T) =>
  localStorage.setItem(key, JSON.stringify(value));

const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());
export const subscribeAdmin = (fn: () => void) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

// ---------- Session ----------
export const getSession = (): AdminSession | null =>
  read<AdminSession | null>(KEYS.session, null);
export const setSession = (s: AdminSession | null) => {
  if (s) write(KEYS.session, s);
  else localStorage.removeItem(KEYS.session);
  emit();
};
export const isAdminLoggedIn = () =>
  getSession()?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

// ---------- Tools ----------
type StoredTool = Pick<Tool, "id" | "name" | "desc" | "credits" | "rating">;
export const getTools = (): StoredTool[] => {
  const stored = read<StoredTool[] | null>(KEYS.tools, null);
  if (stored && stored.length) return stored;
  const seed = DEFAULT_TOOLS.map(({ id, name, desc, credits, rating }) => ({
    id,
    name,
    desc,
    credits,
    rating,
  }));
  write(KEYS.tools, seed);
  return seed;
};
export const saveTools = (tools: StoredTool[]) => {
  write(KEYS.tools, tools);
  emit();
};
export const addTool = (t: Omit<StoredTool, "id"> & { id?: string }) => {
  const tools = getTools();
  const id = t.id || t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  tools.push({ id, name: t.name, desc: t.desc, credits: t.credits, rating: t.rating ?? 4.5 });
  saveTools(tools);
  addLog({ type: "system", message: `Tool added: ${t.name}` });
};
export const updateTool = (id: string, patch: Partial<StoredTool>) => {
  const tools = getTools().map((x) => (x.id === id ? { ...x, ...patch } : x));
  saveTools(tools);
  addLog({ type: "system", message: `Tool updated: ${id}` });
};
export const deleteTool = (id: string) => {
  const tools = getTools().filter((x) => x.id !== id);
  saveTools(tools);
  addLog({ type: "system", message: `Tool deleted: ${id}` });
};

// ---------- Users (dummy) ----------
const seedUsers = (): AdminUser[] => [
  { id: "u1", username: "@cube.exe", email: "cube@fluxa.ai", credits: 12450, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 14 },
  { id: "u2", username: "@fluxa_user", email: "fluxa@fluxa.ai", credits: 9876, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 12 },
  { id: "u3", username: "@dev_king", email: "dev@fluxa.ai", credits: 8765, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 10 },
  { id: "u4", username: "@smart_ai", email: "smart@fluxa.ai", credits: 6543, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 7 },
  { id: "u5", username: "@ai_wizard", email: "wizard@fluxa.ai", credits: 5678, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 5 },
  { id: "u6", username: "@future_wizard", email: "future@fluxa.ai", credits: 3210, joinedAt: Date.now() - 1000 * 60 * 60 * 24 * 3 },
];
export const getUsers = (): AdminUser[] => {
  const stored = read<AdminUser[] | null>(KEYS.users, null);
  if (stored && stored.length) return stored;
  const seed = seedUsers();
  write(KEYS.users, seed);
  return seed;
};
export const saveUsers = (u: AdminUser[]) => {
  write(KEYS.users, u);
  emit();
};
export const addCreditsToUser = (id: string, amount: number) => {
  const users = getUsers().map((u) =>
    u.id === id ? { ...u, credits: u.credits + amount } : u
  );
  saveUsers(users);
  const u = users.find((x) => x.id === id);
  addLog({ type: "credit", message: `Added ${amount} credits`, user: u?.username, amount });
};
export const resetUserCredits = (id: string) => {
  const users = getUsers().map((u) => (u.id === id ? { ...u, credits: 0 } : u));
  saveUsers(users);
  const u = users.find((x) => x.id === id);
  addLog({ type: "credit", message: `Reset credits to 0`, user: u?.username, amount: 0 });
};

// ---------- Announcements ----------
export const getAnnouncements = (): Announcement[] =>
  read<Announcement[]>(KEYS.announcements, []);
export const addAnnouncement = (title: string, body: string) => {
  const list = getAnnouncements();
  list.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: Date.now(),
  });
  write(KEYS.announcements, list);
  addLog({ type: "system", message: `Announcement: ${title}` });
  emit();
  window.dispatchEvent(new Event("fluxa:announcements"));
};
export const deleteAnnouncement = (id: string) => {
  write(KEYS.announcements, getAnnouncements().filter((a) => a.id !== id));
  emit();
  window.dispatchEvent(new Event("fluxa:announcements"));
};

// ---------- Logs ----------
export const getLogs = (): LogEntry[] => read<LogEntry[]>(KEYS.logs, []);
export const addLog = (entry: Omit<LogEntry, "id" | "createdAt">) => {
  const logs = getLogs();
  logs.unshift({
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  });
  write(KEYS.logs, logs.slice(0, 200));
  emit();
};

// ---------- Metrics ----------
export const getMetrics = () => {
  const users = getUsers();
  const tools = getTools();
  const logs = getLogs();
  const totalCredits = users.reduce((s, u) => s + u.credits, 0);
  const toolUses = logs.filter((l) => l.type === "tool").length + 98765;
  const revenue = Math.round(totalCredits * 0.018);
  return {
    totalUsers: users.length + 12839, // include "real" base
    totalCredits,
    toolUses,
    revenue,
  };
};

// Static chart data (stable)
export const userGrowthData = [
  { day: "May 14", value: 4200 },
  { day: "May 15", value: 5300 },
  { day: "May 16", value: 6100 },
  { day: "May 17", value: 7800 },
  { day: "May 18", value: 6900 },
  { day: "May 19", value: 8400 },
  { day: "May 20", value: 9600 },
];
export const creditsUsageData = [
  { day: "May 14", value: 120000 },
  { day: "May 15", value: 132000 },
  { day: "May 16", value: 158000 },
  { day: "May 17", value: 142000 },
  { day: "May 18", value: 110000 },
  { day: "May 19", value: 124000 },
  { day: "May 20", value: 160000 },
];
