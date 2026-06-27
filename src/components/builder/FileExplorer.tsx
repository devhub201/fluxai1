import { useState } from "react";
import { FileCode2, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  files: Record<string, string>;
  activePath: string | null;
  onSelect: (path: string) => void;
}

interface Node {
  name: string;
  path: string;
  children?: Record<string, Node>;
  isFile?: boolean;
}

function buildTree(paths: string[]): Node {
  const root: Node = { name: "", path: "", children: {} };
  for (const p of paths) {
    const parts = p.replace(/^\//, "").split("/");
    let cur = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc += "/" + part;
      cur.children = cur.children || {};
      if (!cur.children[part]) {
        cur.children[part] = { name: part, path: acc, isFile: i === parts.length - 1 };
      }
      cur = cur.children[part];
    });
  }
  return root;
}

function TreeNode({ node, depth, activePath, onSelect }: { node: Node; depth: number; activePath: string | null; onSelect: (p: string) => void }) {
  const [open, setOpen] = useState(depth < 2);
  if (node.isFile) {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs hover:bg-accent",
          activePath === node.path && "bg-accent text-accent-foreground",
        )}
        style={{ paddingLeft: depth * 12 + 8 }}
      >
        <FileCode2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }
  const kids = node.children ? Object.values(node.children).sort((a, b) => Number(!!a.isFile) - Number(!!b.isFile) || a.name.localeCompare(b.name)) : [];
  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs font-medium hover:bg-accent"
          style={{ paddingLeft: depth * 12 + 8 }}
        >
          {open ? <FolderOpen className="h-3.5 w-3.5 opacity-70" /> : <Folder className="h-3.5 w-3.5 opacity-70" />}
          <span className="truncate">{node.name}</span>
        </button>
      )}
      {(open || !node.name) && kids.map((c) => <TreeNode key={c.path} node={c} depth={depth + (node.name ? 1 : 0)} activePath={activePath} onSelect={onSelect} />)}
    </div>
  );
}

export function FileExplorer({ files, activePath, onSelect }: Props) {
  const paths = Object.keys(files).sort();
  if (paths.length === 0) {
    return <div className="p-3 text-xs text-muted-foreground">No files yet.</div>;
  }
  const tree = buildTree(paths);
  return (
    <div className="py-1">
      <TreeNode node={tree} depth={0} activePath={activePath} onSelect={onSelect} />
    </div>
  );
}
