import { LumoShell } from "@/components/lumo/LumoShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Site { id: string; name?: string; subdomain?: string; custom_domain?: string | null; created_at: string; }

export default function Deployments() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("published_sites").select("*").order("created_at", { ascending: false });
      setSites((data ?? []) as Site[]);
      setLoading(false);
    })();
  }, []);

  return (
    <LumoShell title="Deployments">
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold">Custom Domain</h3>
        <p className="mt-1 text-xs text-muted-foreground">Connect your own domain to a deployed site.</p>
        <div className="mt-3 flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.com" className="bg-surface-2 border-border" />
          <Button onClick={() => toast.success("Domain queued — DNS pending verification.")} className="bg-gradient-to-r from-primary to-primary-glow">Add Domain</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3 text-sm font-semibold">Live Sites</div>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : sites.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <Rocket className="mx-auto mb-2 h-8 w-8 text-primary" />
            No deployments yet. Publish a project to see it here.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sites.map((s) => {
              const url = s.custom_domain || `${s.subdomain || s.id}.lumo.app`;
              return (
                <li key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="font-medium">{s.name || s.subdomain || "Untitled Site"}</div>
                    <div className="text-xs text-muted-foreground">{url}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Live</span>
                    <a href={`https://${url}`} target="_blank" rel="noreferrer"
                      className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </LumoShell>
  );
}
