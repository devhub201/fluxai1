import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const CodeBlock = ({ className, children }: { className?: string; children: any }) => {
  const [copied, setCopied] = useState(false);
  const lang = (className ?? "").replace(/^language-/, "") || "text";
  const code = String(children ?? "").replace(/\n$/, "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border bg-[#0a0e14]">
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider bg-surface-2 border-b border-border text-muted-foreground">
        <span>{lang}</span>
        <button onClick={copy} className="flex items-center gap-1 hover:text-primary transition-colors">
          {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-[13px] leading-relaxed font-mono"><code>{code}</code></pre>
    </div>
  );
};
