import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from "docx";
import type { ExtractedContent, FormatMode } from "./types";

export function buildFormattedDoc(
  paragraphs: ExtractedContent["paragraphs"],
  mode: FormatMode
): Document {
  const children = paragraphs.map((p) => buildParagraph(p, mode));

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: mode === "professional" ? "Calibri" : mode === "content" ? "Georgia" : "Arial",
            size: mode === "content" ? 24 : 22,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });
}

function buildParagraph(
  p: ExtractedContent["paragraphs"][number],
  mode: FormatMode
): Paragraph {
  const text = p.isBullet
    ? p.text.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "")
    : p.text;

  if (p.isHeading) return headingParagraph(text, mode);
  if (p.isBullet) return bulletParagraph(text, mode);
  return bodyParagraph(text, mode);
}

function headingParagraph(text: string, mode: FormatMode): Paragraph {
  const isTitle = text.length < 60;

  switch (mode) {
    case "professional":
      return new Paragraph({
        heading: isTitle ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        border: isTitle
          ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2563EB", space: 4 } }
          : undefined,
        children: [
          new TextRun({
            text,
            bold: true,
            font: "Georgia",
            size: isTitle ? 32 : 26,
            color: "1E3A5F",
          }),
        ],
      });

    case "content":
      return new Paragraph({
        heading: isTitle ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text,
            bold: true,
            font: "Georgia",
            size: isTitle ? 36 : 28,
            color: "1A202C",
          }),
        ],
      });

    default:
      return new Paragraph({
        heading: isTitle ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text,
            bold: true,
            size: isTitle ? 28 : 24,
          }),
        ],
      });
  }
}

function bulletParagraph(text: string, mode: FormatMode): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        font: mode === "professional" ? "Calibri" : mode === "content" ? "Georgia" : "Arial",
        size: mode === "content" ? 24 : 22,
      }),
    ],
  });
}

function bodyParagraph(text: string, mode: FormatMode): Paragraph {
  switch (mode) {
    case "professional":
      return new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 60, after: 60, line: 360 },
        children: [new TextRun({ text, font: "Calibri", size: 22 })],
      });

    case "content":
      return new Paragraph({
        spacing: { before: 120, after: 120, line: 400 },
        children: [new TextRun({ text, font: "Georgia", size: 24, color: "4A5568" })],
      });

    default:
      return new Paragraph({
        spacing: { before: 40, after: 40, line: 320 },
        children: [new TextRun({ text, size: 22 })],
      });
  }
}
