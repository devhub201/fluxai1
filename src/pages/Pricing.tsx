import { Link } from "react-router-dom";
import { LumoLogo } from "@/components/lumo/LumoLogo";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
  { name: "Free", price: { m: 0, y: 0 }, desc: "For hobby projects",
    features: ["1 Project", "Community Support", "Lumo Subdomain", "Basic Templates"] },
  { name: "Pro", price: { m: 19, y: 15 }, desc: "For individual builders", popular: true,
    features: ["Unlimited Projects", "Custom Domain", "Advanced Templates", "Priority Support", "AI Credits"] },
  { name: "Team", price: { m: 49, y: 39 }, desc: "For growing teams",
    features: ["Everything in Pro", "Team Members", "Shared Projects", "Advanced Analytics", "Priority Support"] },
  { name: "Enterprise", price: { m: null, y: null }, desc: "For large organizations",
    features: ["Everything in Team", "SSO & SCIM", "Custom Solutions", "Dedicated Support"] },
];

export default function Pricing() {
  const [cycle, setCycle] = useState<"m" | "y">("m");
  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <LumoLogo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/signin">Sign in</Link></Button>
          <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary-glow"><Link to="/signup">Get Started</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">Pricing</h1>
          <p className="mt-2 text-muted-foreground">Choose the perfect plan for your needs.</p>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
            <button onClick={() => setCycle("m")} className={`rounded-full px-4 py-1.5 text-xs ${cycle === "m" ? "bg-primary text-white" : "text-muted-foreground"}`}>Monthly</button>
            <button onClick={() => setCycle("y")} className={`rounded-full px-4 py-1.5 text-xs ${cycle === "y" ? "bg-primary text-white" : "text-muted-foreground"}`}>Yearly · Save 20%</button>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.name} className={`relative rounded-2xl border bg-card p-6 ${p.popular ? "border-primary shadow-xl shadow-primary/20" : "border-border"}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-3 py-0.5 text-[10px] font-semibold text-white">Most Popular</div>}
              <div className="text-sm font-medium text-muted-foreground">{p.name}</div>
              <div className="mt-2 text-3xl font-semibold">
                {p.price.m === null ? "Custom" : `$${p.price[cycle]}`}
                {p.price.m !== null && <span className="text-sm font-normal text-muted-foreground"> /month</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <Button asChild className={`mt-6 w-full ${p.popular ? "bg-gradient-to-r from-primary to-primary-glow" : ""}`} variant={p.popular ? "default" : "outline"}>
                <Link to="/signup">{p.name === "Enterprise" ? "Contact Sales" : p.name === "Free" ? "Get Started" : "Start Free Trial"}</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
