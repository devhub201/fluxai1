import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Smartphone, Monitor } from "lucide-react";

interface Props {
  files: Record<string, string>;
}

export function PreviewPane({ files }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "preview-ready") setReady(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (!ready || !iframeRef.current) return;
    iframeRef.current.contentWindow?.postMessage({ type: "files", files }, "*");
  }, [files, ready, nonce]);

  const reload = () => {
    setReady(false);
    setNonce((n) => n + 1);
  };

  const hasFiles = Object.keys(files).length > 0;

  return (
    <div className="flex h-full flex-col bg-muted/30">
      <div className="flex items-center justify-between border-b bg-background px-3 py-2">
        <div className="flex items-center gap-1 rounded-md border p-0.5">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">Live preview</div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={reload}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-auto p-2 sm:p-4">
        {!hasFiles ? (
          <div className="text-center text-sm text-muted-foreground">
            <p>Your app preview will appear here.</p>
            <p className="mt-1 text-xs">Describe what to build in the chat →</p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-lg border bg-white shadow-sm transition-all"
            style={{
              width: device === "mobile" ? 390 : "100%",
              height: device === "mobile" ? 720 : "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <iframe
              key={nonce}
              ref={iframeRef}
              src="/preview-shell.html"
              title="App preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
