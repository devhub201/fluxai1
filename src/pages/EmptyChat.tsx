import { Phone } from "@/components/Phone";
import { ChatLayout } from "@/components/Chat";
import { MessageCircle, Code2, Image as ImageIcon, Globe2, FileText } from "lucide-react";

const EmptyChat = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <ChatLayout>
        <div className="h-full flex flex-col items-center justify-center px-6 pb-2">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <div className="absolute inset-0 green-orb rounded-full blur-xl" />
            <div className="absolute inset-2 rounded-full border border-primary/40" />
            <div className="absolute inset-6 rounded-full border border-primary/25" />
            <div className="relative h-16 w-16 rounded-2xl bg-surface-2 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
              <MessageCircle className="h-8 w-8 text-primary" strokeWidth={1.8} />
            </div>
          </div>
          <h2 className="mt-6 text-lg font-bold text-center">How can I help you today?</h2>
          <p className="mt-2 text-xs text-center text-muted-foreground leading-relaxed">
            Ask me anything or use tools<br />to get started.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 w-full">
            <ToolPill icon={<Code2 className="h-3.5 w-3.5" />} label="Code Generator" />
            <ToolPill icon={<ImageIcon className="h-3.5 w-3.5" />} label="Image Generator" />
            <ToolPill icon={<Globe2 className="h-3.5 w-3.5" />} label="Website Builder" />
            <ToolPill icon={<FileText className="h-3.5 w-3.5" />} label="Summarizer" />
          </div>
        </div>
      </ChatLayout>
    </Phone>
  </div>
);

const ToolPill = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="h-10 rounded-full border border-border bg-surface-2 flex items-center justify-center gap-2 text-xs text-foreground">
    {icon}{label}
  </button>
);

export default EmptyChat;
