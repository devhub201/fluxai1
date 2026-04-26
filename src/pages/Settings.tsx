import { Phone } from "@/components/Phone";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Mail, CreditCard, Sun, Languages, Bell, Database, HelpCircle, MessageSquare, Info, ChevronRight, LogOut } from "lucide-react";

const Settings = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Phone>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
          <Link to="/chat" aria-label="Back" className="text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold flex-1 text-center pr-5">Settings</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <Section title="Account">
            <Row icon={<User className="h-4 w-4 text-primary" />} label="Profile" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
            <Row icon={<Mail className="h-4 w-4 text-primary" />} label="Email" value="cubeX@gmail.com" />
            <Row icon={<CreditCard className="h-4 w-4 text-primary" />} label="Subscription" value={<span className="text-primary font-medium">Fluxa AI Premium</span>} />
          </Section>

          <Section title="App">
            <Row icon={<Sun className="h-4 w-4 text-primary" />} label="Appearance" value="Dark" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />} />
            <Row icon={<Languages className="h-4 w-4 text-primary" />} label="Language" value="English" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground ml-1" />} />
            <Row icon={<Bell className="h-4 w-4 text-primary" />} label="Notifications" trailing={
              <span className="h-5 w-9 rounded-full bg-primary flex items-center px-0.5 justify-end">
                <span className="h-4 w-4 rounded-full bg-white" />
              </span>
            } />
            <Row icon={<Database className="h-4 w-4 text-primary" />} label="Data & Storage" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          </Section>

          <Section title="Support">
            <Row icon={<HelpCircle className="h-4 w-4 text-primary" />} label="Help & FAQ" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
            <Row icon={<MessageSquare className="h-4 w-4 text-primary" />} label="Contact Us" trailing={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
            <Row icon={<Info className="h-4 w-4 text-primary" />} label="About Fluxa AI" value="v1.0.0" />
          </Section>

          <Link to="/" className="w-full h-11 rounded-xl border border-destructive/50 bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" /> Log Out
          </Link>
        </div>
      </div>
    </Phone>
  </div>
);

const Section = ({ title, children }: any) => (
  <div>
    <h3 className="text-xs font-semibold text-muted-foreground mb-2">{title}</h3>
    <div className="rounded-xl bg-surface-2 border border-border divide-y divide-border/50">{children}</div>
  </div>
);

const Row = ({ icon, label, value, trailing }: any) => (
  <div className="flex items-center gap-3 px-3 py-3 text-sm">
    {icon}
    <span className="flex-1 text-foreground">{label}</span>
    {value && <span className="text-muted-foreground text-xs">{value}</span>}
    {trailing}
  </div>
);

export default Settings;
