import { Phone } from "@/components/Phone";
import { ChatLayout } from "@/components/Chat";
import { Code2, Image as ImageIcon, Globe2, Wand2, FileText, ChevronDown, MessageSquare, Calendar, Cpu, Hash, Trash2, Download } from "lucide-react";

const PopularTools = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <ChatLayout>
        <div className="h-full overflow-y-auto px-4 py-3 space-y-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />

          {/* Popular Tools */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Popular Tools</h3>
            <div className="grid grid-cols-3 gap-2">
              <ToolCard icon={<Code2 className="h-5 w-5 text-primary" />} label={["Code","Generator"]} />
              <ToolCard icon={<ImageIcon className="h-5 w-5 text-primary" />} label={["AI Image","Generator"]} />
              <ToolCard icon={<Globe2 className="h-5 w-5 text-primary" />} label={["Website","Writer"]} />
              <ToolCard icon={<Wand2 className="h-5 w-5 text-primary" />} label={["Prompt","Generator"]} />
              <ToolCard icon={<Wand2 className="h-5 w-5 text-primary" />} label={["Prompt","Generator"]} />
              <ToolCard icon={<FileText className="h-5 w-5 text-primary" />} label={["Summarizer"]} />
            </div>
          </div>

          {/* Model */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Model</h3>
            <div className="rounded-xl bg-surface-2 border border-border px-3 py-3 flex items-center gap-3">
              <span className="h-8 w-8 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                <Globe2 className="h-4 w-4 text-primary" />
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">GPT-4o</div>
                <div className="text-[11px] text-muted-foreground">Best for most tasks</div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Conversation Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Conversation Info</h3>
            <div className="rounded-xl bg-surface-2 border border-border divide-y divide-border/60">
              <InfoRow icon={<MessageSquare className="h-4 w-4 text-primary" />} label="Messages" value="24" />
              <InfoRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Created" value="Today, 11:28 AM" />
              <InfoRow icon={<Cpu className="h-4 w-4 text-primary" />} label="Model" value="GPT-4o" />
              <InfoRow icon={<Hash className="h-4 w-4 text-primary" />} label="Tokens Used" value="1,245" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button className="h-10 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" /> Clear Chat
              </button>
              <button className="h-10 rounded-xl border border-primary/40 bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-2">
                <Download className="h-4 w-4" /> Export Chat
              </button>
            </div>
          </div>
        </div>
      </ChatLayout>
    </Phone>
  </div>
);

const ToolCard = ({ icon, label }: { icon: React.ReactNode; label: string[] }) => (
  <button className="aspect-square rounded-xl bg-surface-2 border border-border flex flex-col items-center justify-center gap-1.5 p-2">
    {icon}
    <div className="text-[11px] font-medium text-center leading-tight">
      {label.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  </button>
);

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 px-3 py-3">
    {icon}
    <span className="flex-1 text-sm text-foreground">{label}</span>
    <span className="text-sm text-muted-foreground">{value}</span>
  </div>
);

export default PopularTools;
