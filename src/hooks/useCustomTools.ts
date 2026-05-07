import { useCallback, useEffect, useState } from "react";
import { Sparkles, Wand2, Gamepad2, Globe, Code2, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tool } from "@/lib/tools";

const iconMap: Record<string, LucideIcon> = { Sparkles, Wand2, Gamepad2, Globe, Code2 };

export type CustomToolRow = {
  tool_id: string;
  name: string;
  description: string;
  credits: number;
  icon: string;
  suggestions: unknown;
  placeholder: string;
};

export const rowToTool = (row: CustomToolRow): Tool => ({
  id: row.tool_id,
  name: row.name,
  desc: row.description,
  credits: Number(row.credits ?? 5),
  rating: 4.8,
  icon: iconMap[row.icon] ?? Sparkles,
  color: "from-primary/20 to-primary/5 text-primary border-primary/30",
});

export const useCustomTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_tools")
      .select("tool_id,name,description,credits,icon,suggestions,placeholder")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setTools(((data ?? []) as CustomToolRow[]).map(rowToTool));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tools, loading, refresh };
};