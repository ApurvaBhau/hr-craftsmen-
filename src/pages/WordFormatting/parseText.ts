import type { ExtractedContent } from "./types";

/** Parse raw text lines into structured paragraphs. */
export function parseRawText(raw: string): ExtractedContent["paragraphs"] {
  const lines = raw.split("\n").filter((l) => l.trim());
  return lines.map((line, i) => ({
    text: line.trim(),
    isHeading:
      i === 0 ||
      (line.length < 80 && line === line.toUpperCase()) ||
      line.endsWith(":"),
    isBullet:
      line.startsWith("•") ||
      line.startsWith("-") ||
      line.startsWith("*") ||
      /^\d+[.)]/.test(line),
  }));
}

/** Convert paragraphs to simple HTML for preview. */
export function paragraphsToHtml(
  paragraphs: ExtractedContent["paragraphs"]
): string {
  return paragraphs
    .map((p) => {
      if (p.isHeading) return `<h2>${escapeHtml(p.text)}</h2>`;
      if (p.isBullet) return `<li>${escapeHtml(p.text)}</li>`;
      return `<p>${escapeHtml(p.text)}</p>`;
    })
    .join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
