// Parser for <lov-file path="...">...</lov-file> blocks streamed from the AI.

export type ParsedFile = { path: string; content: string };

const OPEN = /<lov-file\s+path="([^"]+)"\s*>/g;

export function parseLovFiles(text: string): { files: ParsedFile[]; narrative: string } {
  const files: ParsedFile[] = [];
  let narrative = "";
  let lastEnd = 0;
  OPEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = OPEN.exec(text))) {
    narrative += text.slice(lastEnd, m.index);
    const path = m[1];
    const close = text.indexOf("</lov-file>", m.index);
    if (close === -1) {
      // Streaming partial — stop, don't consume.
      lastEnd = m.index;
      break;
    }
    const content = text.slice(m.index + m[0].length, close);
    files.push({ path, content });
    lastEnd = close + "</lov-file>".length;
    OPEN.lastIndex = lastEnd;
  }
  narrative += text.slice(lastEnd);
  // Strip narrative of any orphan close tags
  narrative = narrative.replace(/<\/?lov-file[^>]*>/g, "").trim();
  return { files, narrative };
}
