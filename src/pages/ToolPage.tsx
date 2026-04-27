import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Zap } from "lucide-react";
import { getTool } from "@/lib/tools";
import { useCredits } from "@/hooks/useCredits";
import { useState } from "react";

export default function ToolPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tool = getTool(id ?? "");
  const { credits, spend } = useCredits();
  const [unlocked, setUnlocked] = useState(false);

  if (!tool) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">Tool not found.</p>
          <button onClick={() => navigate("/store")} className="text-primary text-sm">Back to Store</button>
        </div>
      </div>
    );
  }

  const Icon = tool.icon;

  const handleUse = () => {
    if (spend(tool.credits)) setUnlocked(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-10 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">
            <Zap className="h-3.5 w-3.5 fill-primary" /> {credits} credits
          </span>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${tool.color} border flex items-center justify-center mb-4`}>
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tool.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">{tool.desc}</p>

          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="inline-flex items-center gap-1 text-primary"><Zap className="h-4 w-4 fill-primary" />{tool.credits} credits</span>
            <span className="inline-flex items-center gap-1 text-yellow-400"><Star className="h-4 w-4 fill-yellow-400" />{tool.rating}</span>
          </div>

          <button
            onClick={handleUse}
            className="mt-6 w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4 fill-current" /> Use Tool
          </button>
        </div>

        {unlocked && (
          <div className="rounded-2xl bg-card border border-primary/40 p-5">
            <div className="text-sm font-semibold mb-2">{tool.name} — Workspace</div>
            <p className="text-xs text-muted-foreground mb-3">
              Tool unlocked. Describe what you want to generate.
            </p>
            <textarea
              placeholder={`Ask ${tool.name}...`}
              className="w-full min-h-32 rounded-xl bg-surface-2 border border-border/60 p-3 text-sm outline-none focus:border-primary/60"
            />
            <button className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary/15 border border-primary/40 text-primary text-sm font-semibold hover:bg-primary/20">
              Generate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
