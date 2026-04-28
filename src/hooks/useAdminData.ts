import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  chat_count: number;
  message_count: number;
};

export type AdminChat = {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type AdminMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

export type AdminAnnouncement = {
  key: string;
  title: string;
  body: string;
  created_at: string;
};

export const useAdminData = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [profilesRes, chatsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, avatar_url, created_at").order("created_at", { ascending: false }),
      supabase.from("chats").select("id, title, user_id, created_at, updated_at").order("updated_at", { ascending: false }),
      supabase.from("messages").select("id, chat_id, user_id, role, content, created_at").order("created_at", { ascending: false }).limit(500),
    ]);

    const chatList = (chatsRes.data ?? []) as AdminChat[];
    const messageList = (messagesRes.data ?? []) as AdminMessage[];

    const chatCountByUser = new Map<string, number>();
    chatList.forEach((c) => chatCountByUser.set(c.user_id, (chatCountByUser.get(c.user_id) ?? 0) + 1));
    const msgCountByUser = new Map<string, number>();
    messageList.forEach((m) => msgCountByUser.set(m.user_id, (msgCountByUser.get(m.user_id) ?? 0) + 1));

    const enriched: AdminUser[] = (profilesRes.data ?? []).map((p: any) => ({
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      chat_count: chatCountByUser.get(p.id) ?? 0,
      message_count: msgCountByUser.get(p.id) ?? 0,
    }));

    setUsers(enriched);
    setChats(chatList);
    setMessages(messageList);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { users, chats, messages, loading, refresh };
};

export const useAnnouncementsDB = () => {
  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value, updated_at")
      .like("key", "announcement:%")
      .order("updated_at", { ascending: false });
    const list: AdminAnnouncement[] = (data ?? []).map((row: any) => ({
      key: row.key,
      title: row.value?.title ?? "",
      body: row.value?.body ?? "",
      created_at: row.updated_at,
    }));
    setItems(list);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (title: string, body: string) => {
    const key = `announcement:${crypto.randomUUID()}`;
    const { error } = await supabase.from("app_settings").upsert({ key, value: { title, body } });
    if (!error) await refresh();
    return { error };
  };

  const remove = async (key: string) => {
    const { error } = await supabase.from("app_settings").delete().eq("key", key);
    if (!error) await refresh();
    return { error };
  };

  return { items, loading, add, remove, refresh };
};
