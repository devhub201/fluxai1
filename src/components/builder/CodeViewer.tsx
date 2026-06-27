interface Props {
  path: string | null;
  content: string | null;
}

export function CodeViewer({ path, content }: Props) {
  if (!path) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Select a file</div>;
  }
  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-mono text-muted-foreground">{path}</div>
      <pre className="flex-1 overflow-auto p-3 text-xs leading-relaxed font-mono">
        <code>{content ?? ""}</code>
      </pre>
    </div>
  );
}
