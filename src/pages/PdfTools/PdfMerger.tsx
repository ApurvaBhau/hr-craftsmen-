import { useState } from "react";
import { Upload, Merge, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

export default function PdfMerger() {
  const [files, setFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf"
    );
    if (newFiles.length === 0) {
      toast.error("Please upload PDF files");
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
    toast.success(`Added ${newFiles.length} file(s)`);
  };

  const removeFile = (index: number) =>
    setFiles((f) => f.filter((_, i) => i !== index));

  const moveFile = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= files.length) return;
    const arr = [...files];
    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
    setFiles(arr);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Need at least 2 PDFs to merge");
      return;
    }
    setMerging(true);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const pdf = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDFs merged successfully!");
    } catch {
      toast.error("Failed to merge PDFs");
    }
    setMerging(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Card className="border-dashed">
        <CardContent className="p-8">
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload PDFs (select multiple)
            </span>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 p-3 bg-muted rounded-lg"
            >
              <span className="flex-1 text-sm truncate font-medium">
                {i + 1}. {file.name}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => moveFile(i, -1)}
                disabled={i === 0}
                className="h-8 w-8"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => moveFile(i, 1)}
                disabled={i === files.length - 1}
                className="h-8 w-8"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeFile(i)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            onClick={handleMerge}
            disabled={merging || files.length < 2}
            className="w-full"
          >
            <Merge className="h-4 w-4 mr-2" />
            {merging ? "Merging..." : `Merge ${files.length} PDFs`}
          </Button>
        </div>
      )}
    </div>
  );
}
