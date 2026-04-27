import { Code2, Image as ImageIcon, Globe, FileText, MessageSquare, FileSearch, Mail, Megaphone, Zap, Star } from "lucide-react";

const tools = [
  { name: "Code Generator", desc: "Generate clean, efficient code for any language.", credits: 399, rating: 4.8, icon: Code2, color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30" },
  { name: "AI Image Generator", desc: "Create stunning images from text descriptions.", credits: 299, rating: 4.7, icon: ImageIcon, color: "from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/30" },
  { name: "Website Builder", desc: "Build complete websites with AI in minutes.", credits: 499, rating: 4.9, icon: Globe, color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30" },
  { name: "Script Writer", desc: "Write engaging scripts for videos, ads, and more.", credits: 299, rating: 4.6, icon: FileText, color: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30" },
  { name: "Prompt Generator", desc: "Generate perfect prompts for any task.", credits: 199, rating: 4.5, icon: MessageSquare, color: "from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/30" },
  { name: "Text Summarizer", desc: "Summarize long texts into key points.", credits: 149, rating: 4.7, icon: FileSearch, color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30" },
  { name: "Email Writer", desc: "Write professional emails for any purpose.", credits: 199, rating: 4.6, icon: Mail, color: "from-green-500/20 to-green-500/5 text-green-400 border-green-500/30" },
  { name: "Marketing Copy", desc: "Create compelling copy that converts.", credits: 249, rating: 4.8, icon: Megaphone, color: "from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/30" },
];

export default function Tools() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-10 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">All <span className="text-primary">Tools</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Browse every Fluxa AI tool in one place.</p>
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map((t) => (
            <div key={t.name} className="rounded-2xl bg-card border border-border p-3 hover:border-primary/40 transition-colors">
              <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${t.color} border flex items-center justify-center mb-3`}>
                <t.icon className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold leading-tight">{t.name}</div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.desc}</p>
              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="inline-flex items-center gap-1 text-primary"><Zap className="h-3.5 w-3.5 fill-primary" />{t.credits}</span>
                <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-3.5 w-3.5 fill-yellow-400" />{t.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
