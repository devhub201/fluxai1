import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Sparkles } from "lucide-react";

type SiteFile = { path: string; content: string };

export default function PublishedSite() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [html, setHtml] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Fluxa Site");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("published_sites")
        .select("title, files")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!active) return;
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const files = (data.files as SiteFile[]) ?? [];
      const preview =
        files.find((f) => f.path.toLowerCase().endsWith("preview.html")) ??
        files.find((f) => f.path.toLowerCase().endsWith("index.html")) ??
        files[0];
      setTitle(data.title || "Fluxa Site");
      document.title = data.title || "Fluxa Site";
      setHtml(preview?.content ?? "<h1 style='font-family:sans-serif;padding:40px'>Empty site</h1>");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Site not found</h1>
          <p className="text-muted-foreground text-sm">This site doesn't exist or is unpublished.</p>
          <Link to="/" className="text-primary text-sm inline-flex items-center gap-1">
            <ExternalLink className="h-4 w-4" /> Visit Fluxa AI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <iframe
        title={title}
        srcDoc={html ?? ""}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
      />
      <a
        href="/"
        className="fixed bottom-4 right-4 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground shadow-lg z-50"
      >
        <Sparkles className="h-3 w-3 text-primary" /> Built with Fluxa AI
      </a>
    </div>
  );
}
