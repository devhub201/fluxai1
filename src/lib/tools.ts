import { Code2, Image as ImageIcon, Globe, FileText, MessageSquare, FileSearch, Mail, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tool = {
  id: string;
  name: string;
  desc: string;
  credits: number;
  rating: number;
  icon: LucideIcon;
  color: string;
};

export const TOOLS: Tool[] = [
  { id: "code-generator", name: "Code Generator", desc: "Generate clean, efficient code for any language.", credits: 399, rating: 4.8, icon: Code2, color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30" },
  { id: "ai-image-generator", name: "AI Image Generator", desc: "Create stunning images from text descriptions.", credits: 299, rating: 4.7, icon: ImageIcon, color: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/30" },
  { id: "website-builder", name: "Website Builder", desc: "Full-stack websites in minutes — publish instantly.", credits: 499, rating: 4.9, icon: Globe, color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30" },
  { id: "script-writer", name: "Script Writer", desc: "Write engaging scripts for videos, ads, and more.", credits: 299, rating: 4.6, icon: FileText, color: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30" },
  { id: "prompt-generator", name: "Prompt Generator", desc: "Generate perfect prompts for any task.", credits: 199, rating: 4.5, icon: MessageSquare, color: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30" },
  { id: "text-summarizer", name: "Text Summarizer", desc: "Summarize long texts into key points.", credits: 149, rating: 4.7, icon: FileSearch, color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30" },
  { id: "email-writer", name: "Email Writer", desc: "Write professional emails for any purpose.", credits: 199, rating: 4.6, icon: Mail, color: "from-green-500/20 to-green-500/5 text-green-400 border-green-500/30" },
  { id: "marketing-copy", name: "Marketing Copy", desc: "Create compelling copy that converts.", credits: 249, rating: 4.8, icon: Megaphone, color: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/30" },
];

export const getTool = (id: string) => TOOLS.find((t) => t.id === id);
