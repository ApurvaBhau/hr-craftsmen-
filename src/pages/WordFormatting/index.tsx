import { useState, useRef } from "react";
import { Upload, Download, FileText, ClipboardPaste, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Packer } from "docx";
import mammoth from "mammoth";
import type { ExtractedContent, FormatMode, InputMode } from "./types";
import { modeDescriptions } from "./types";
import { buildFormattedDoc } from "./docBuilder";
import { parseRawText, paragraphsToHtml } from "./parseText";

export default function WordFormatting() {
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [content, setContent] = useState<ExtractedContent | null>(null);
  const [mode, setMode] = useState<FormatMode>("professional");
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setPastedText("");
    setContent(null);
    setMode("professional");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processDocx = async (f: File) => {
    try {
      const arrayBuffer = await f.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const textResult = await mammoth.extractRawText({ arrayBuffer });
      const paragraphs = parseRawText(textResult.value);
      setContent({ paragraphs, rawHtml: result.value });
      toast.success(`Loaded: ${f.name} — ${paragraphs.length} paragraphs`);
    } catch {
      toast.error("Failed to read the file. Make sure it's a valid .docx.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".docx")) {
      toast.error("Please upload a .docx file");
      return;
    }
    setFile(f);
    await processDocx(f);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.name.endsWith(".docx")) {
      toast.error("Please drop a .docx file");
      return;
    }
    setFile(f);
    setInputMode("upload");
    await processDocx(f);
  };

  const handlePasteApply = () => {
    const trimmed = pastedText.trim();
    if (!trimmed) {
      toast.error("Please paste some text first");
      return;
    }
    const paragraphs = parseRawText(trimmed);
    const rawHtml = paragraphsToHtml(paragraphs);
    setContent({ paragraphs, rawHtml });
    toast.success(`Parsed ${paragraphs.length} paragraphs from pasted text`);
  };

  const handleDownload = async () => {
    if (!content) return;
    setGenerating(true);

    try {
      const doc = buildFormattedDoc(content.paragraphs, mode);
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName =
        inputMode === "upload" && file
          ? file.name
          : "document.docx";
      a.download = `${mode}_formatted_${baseName}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Formatted document downloaded!");
    } catch {
      toast.error("Failed to generate the formatted document.");
    }
    setGenerating(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Word Formatting</h1>
        {content && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        Upload a .docx file or paste text, pick a style, and download the
        formatted version.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Input mode tabs */}
          <Tabs
            value={inputMode}
            onValueChange={(v) => {
              setInputMode(v as InputMode);
              setContent(null);
              setFile(null);
              setPastedText("");
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1 gap-2">
                <FileText className="h-4 w-4" />
                Upload .docx
              </TabsTrigger>
              <TabsTrigger value="paste" className="flex-1 gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card
                className="border-dashed transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.setAttribute("data-dragging", "true");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.setAttribute("data-dragging", "false");
                }}
                onDrop={(e) => {
                  e.currentTarget.setAttribute("data-dragging", "false");
                  handleDrop(e);
                }}
              >
                <CardContent className="p-8">
                  <label className="flex flex-col items-center gap-3 cursor-pointer">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      {file ? file.name : "Click or drag & drop a .docx file"}
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".docx"
                      className="hidden"
                      onChange={handleUpload}
                    />
                  </label>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paste">
              <div className="space-y-3">
                <Textarea
                  placeholder="Paste your text here… Headings, bullets, and paragraphs will be detected automatically."
                  className="min-h-[180px] resize-y"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handlePasteApply}
                  disabled={!pastedText.trim()}
                >
                  <ClipboardPaste className="h-4 w-4 mr-2" />
                  Parse Text
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Formatting controls */}
          {content && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Formatting Style
                </label>
                <ToggleGroup
                  type="single"
                  value={mode}
                  onValueChange={(v) => v && setMode(v as FormatMode)}
                >
                  <ToggleGroupItem value="professional">
                    Professional
                  </ToggleGroupItem>
                  <ToggleGroupItem value="basic">Basic</ToggleGroupItem>
                  <ToggleGroupItem value="content">Content</ToggleGroupItem>
                </ToggleGroup>
                <p className="text-xs text-muted-foreground mt-2">
                  {modeDescriptions[mode]}
                </p>
              </div>

              <Button
                onClick={handleDownload}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Download Formatted .docx"}
              </Button>
            </>
          )}
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {content ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert max-h-[500px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: content.rawHtml }}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                Upload a .docx file or paste text to preview content here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
