import { Phone } from "@/components/Phone";
import { ChatLayout } from "@/components/Chat";
import { MessageCircle, Smartphone, Camera, HardDrive, Cloud } from "lucide-react";
import { Link } from "react-router-dom";

const UploadSheet = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <ChatLayout>
        <div className="h-full relative">
          {/* dimmed background — empty state */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 opacity-40 pointer-events-none">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 green-orb rounded-full blur-xl" />
              <div className="relative h-14 w-14 rounded-2xl bg-surface-2 border border-primary/40 flex items-center justify-center">
                <MessageCircle className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="mt-4 text-base font-bold">How can I help you today?</h2>
          </div>

          {/* bottom sheet */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card border-t border-border p-2">
            <div className="mx-auto h-1 w-10 rounded-full bg-border my-2" />
            <div className="divide-y divide-border/50">
              <SheetItem icon={<Smartphone className="h-4 w-4 text-primary" />} label="Upload from device" />
              <SheetItem icon={<Camera className="h-4 w-4 text-primary" />} label="Take a photo" />
              <SheetItem icon={<HardDrive className="h-4 w-4 text-primary" />} label="Upload from Drive" />
              <SheetItem icon={<Cloud className="h-4 w-4 text-primary" />} label="Upload from Dropbox" />
            </div>
            <Link to="/chat" className="mt-2 block w-full text-center py-3 text-sm font-medium text-foreground">
              Cancel
            </Link>
          </div>
        </div>
      </ChatLayout>
    </Phone>
  </div>
);

const SheetItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-foreground hover:bg-surface-2 transition-colors">
    {icon}{label}
  </button>
);

export default UploadSheet;
