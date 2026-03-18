import { useState } from "react";
import { Upload, FileDown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export default function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState([70]);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ original: number; compressed: number } | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setResult(null);
      toast.success(`Loaded: ${f.name} (${formatSize(f.size)})`);
    } else {
      toast.error("Please upload a PDF file");
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setCompressing(true);
    setResult(null);

    try {
      const bytes = await file.arrayBuffer();
      const srcDoc = await pdfjsLib.getDocument({ data: bytes }).promise;
      const totalPages = srcDoc.numPages;
      const newPdf = await PDFDocument.create();

      for (let i = 1; i <= totalPages; i++) {
        setProgress(`Processing page ${i} of ${totalPages}...`);
        const page = await srcDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        // Render page to canvas
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        // Convert to JPEG with quality setting
        const jpegQuality = quality[0] / 100;
        const jpegDataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
        const jpegBytes = await fetch(jpegDataUrl).then((r) => r.arrayBuffer());

        // Embed into new PDF
        const jpegImage = await newPdf.embedJpg(new Uint8Array(jpegBytes));
        const newPage = newPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      setProgress("Saving...");

      // Strip metadata
      newPdf.setTitle("");
      newPdf.setAuthor("");
      newPdf.setSubject("");
      newPdf.setKeywords([]);
      newPdf.setProducer("");
      newPdf.setCreator("");

      const compressed = await newPdf.save({ useObjectStreams: true });
      const originalSize = file.size;
      const compressedSize = compressed.byteLength;

      setResult({ original: originalSize, compressed: compressedSize });

      const blob = new Blob(
        [compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength) as ArrayBuffer],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compressed_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);

      const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      if (compressedSize < originalSize) {
        toast.success(`Compressed! ${savedPercent}% smaller`);
      } else {
        toast.info("Compressed file is similar in size — try lowering the quality.");
      }
    } catch (err) {
      console.error("Compression error:", err);
      toast.error("Failed to compress PDF");
    }
    setCompressing(false);
    setProgress("");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Card className="border-dashed">
        <CardContent className="p-8">
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? `${file.name} (${formatSize(file.size)})` : "Click to upload a PDF"}
            </span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>
        </CardContent>
      </Card>

      {file && (
        <div className="space-y-4">
          <div>
            <Label>Image Quality: {quality[0]}%</Label>
            <Slider
              value={quality}
              onValueChange={setQuality}
              min={10}
              max={100}
              step={5}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower quality = smaller file. 50-70% is a good balance.
            </p>
          </div>

          <Button onClick={handleCompress} disabled={compressing} className="w-full">
            <FileDown className="h-4 w-4 mr-2" />
            {compressing ? progress || "Compressing..." : "Compress & Download"}
          </Button>

          {result && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original</span>
                  <span className="font-medium">{formatSize(result.original)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compressed</span>
                  <span className="font-medium">{formatSize(result.compressed)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Reduction</span>
                  <span className="font-medium">
                    {result.compressed < result.original
                      ? `${((1 - result.compressed / result.original) * 100).toFixed(1)}%`
                      : "0% — try lower quality"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Pages are re-rendered as compressed JPEG images. Text in the output
              will not be selectable. For best results, use 50–70% quality.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
