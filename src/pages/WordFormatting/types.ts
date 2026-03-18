export type FormatMode = "professional" | "basic" | "content";
export type InputMode = "upload" | "paste";

export interface ExtractedContent {
  paragraphs: { text: string; isHeading: boolean; isBullet: boolean }[];
  rawHtml: string;
}

export const modeDescriptions: Record<FormatMode, string> = {
  professional: "Corporate fonts, structured headings, proper spacing, blue accents",
  basic: "Clean readability, minimal styling, standard layout",
  content: "Formatted for blogs, policies, notices, HR circulars",
};
