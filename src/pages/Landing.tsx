import { Link } from "react-router-dom";
import { FluxaWordmark } from "@/components/FluxaWordmark";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Code2, Image as ImageIcon, Globe2, Sparkles, Shield, Zap } from "lucide-react";
import logo from "@/assets/fluxa-logo.png";

const Landing = () => {
  const { user } = useAuth();

  return (
    <main className="min-h-screen w-full" style={{ background: "var(--page-bg)" }}>
      {/* Nav */}
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <FluxaWordmark size="sm" />
        <nav className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <Link to="/chat" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/signin" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Sign in
              </Link>
              <Link to="/signup" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-8 pt-12 sm:pt-20 pb-20 max-w-4xl mx-auto text-center">
        <img src={logo} alt="Fluxa AI" width={96} height={96} className="h-20 w-20 sm:h-24 sm:w-24 mx-auto mb-6 drop-shadow-[0_0_40px_hsl(var(--primary)/0.3)]" />
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Your AI Co-pilot for<br />
          <span className="text-primary">Work, Code, Learn &amp; More</span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Fluxa AI is a smart, multilingual assistant that writes code, drafts content, explains anything, and helps you ship faster.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={user ? "/chat" : "/signup"} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors">
            {user ? "Continue chatting" : "Create free account"} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/signin" className="h-12 px-8 rounded-xl border border-border bg-transparent text-foreground font-semibold text-sm inline-flex items-center justify-center hover:bg-surface-2 transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-8 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon={<Code2 className="h-5 w-5" />} title="Code generation" desc="Generate full components, debug, and refactor across 30+ languages." />
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Natural conversation" desc="Hindi, English, Hinglish — Fluxa replies in your language." />
          <Feature icon={<ImageIcon className="h-5 w-5" />} title="Smart explanations" desc="Long docs summarized, complex topics broken down step by step." />
          <Feature icon={<Globe2 className="h-5 w-5" />} title="Web-style answers" desc="Markdown formatting, code blocks, lists — easy to read." />
          <Feature icon={<Zap className="h-5 w-5" />} title="Streaming replies" desc="See answers appear token by token, no waiting." />
          <Feature icon={<Shield className="h-5 w-5" />} title="Private by default" desc="Each user's chats are isolated with row-level security." />
        </div>
      </section>

      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fluxa AI · Built on Lovable
      </footer>
    </main>
  );
};

const Feature = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="rounded-2xl border border-border bg-card/50 p-5">
    <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-3">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default Landing;
