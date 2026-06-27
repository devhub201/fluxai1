import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface BuilderProject {
  id: string;
  title: string;
}

export function useBuilderProject(projectId: string | undefined) {
  const [project, setProject] = useState<BuilderProject | null>(null);
  const [files, setFiles] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<BuilderMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const [{ data: proj }, { data: fileRows }, { data: msgRows }] = await Promise.all([
      supabase.from("builder_projects").select("id,title").eq("id", projectId).maybeSingle(),
      supabase.from("builder_files").select("path,content").eq("project_id", projectId),
      supabase.from("builder_messages").select("id,role,content,created_at").eq("project_id", projectId).order("created_at"),
    ]);
    if (proj) setProject(proj as BuilderProject);
    const map: Record<string, string> = {};
    (fileRows ?? []).forEach((r: any) => { map[r.path] = r.content; });
    setFiles(map);
    setMessages((msgRows ?? []) as BuilderMessage[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveFiles = useCallback(async (updates: Record<string, string>) => {
    if (!projectId) return;
    const rows = Object.entries(updates).map(([path, content]) => ({ project_id: projectId, path, content }));
    if (rows.length === 0) return;
    await supabase.from("builder_files").upsert(rows, { onConflict: "project_id,path" });
    setFiles((prev) => ({ ...prev, ...updates }));
  }, [projectId]);

  const addMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    if (!projectId) return null;
    const { data } = await supabase
      .from("builder_messages")
      .insert({ project_id: projectId, role, content })
      .select("id,role,content,created_at")
      .single();
    if (data) setMessages((m) => [...m, data as BuilderMessage]);
    return data;
  }, [projectId]);

  const renameProject = useCallback(async (title: string) => {
    if (!projectId) return;
    await supabase.from("builder_projects").update({ title }).eq("id", projectId);
    setProject((p) => (p ? { ...p, title } : p));
  }, [projectId]);

  return { project, files, messages, loading, refresh, saveFiles, addMessage, setFiles, setMessages, renameProject };
}
