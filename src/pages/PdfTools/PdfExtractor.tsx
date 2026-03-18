import { useState } from "react";
import { Upload, FileDown, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

export default function PdfExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [extracting, setExtracting] = useState(false);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    try {
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const count = pdf.getPageCount();
      setFile(f);
      setPdfBytes(bytes);
      setTotalPages(count);
      setSelected(new Set());
      toast.success(`Loaded: ${f.name} (${count} pages)`);
    } catch {
      toast.error("Failed to load PDF");
    }
  };

  const togglePage = (page: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(page) ? next.delete(page) : next.add(page);
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(Array.from({ length: totalPages }, (_, i) => i));
    setSelected(all);
  };

  const selectNone = () => setSelected(new Set());

  const handleExtract = async () => {
    if (!pdfBytes || selected.size === 0) return;
    setExtracting(true);
    try {
      const srcPdf = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();
      const sortedPages = Array.from(selected).sort((a, b) => a - b);
      const copied = await newPdf.copyPages(srcPdf, sortedPages);
      copied.forEach((page) => newPdf.addPage(page));

      const bytes = await newPdf.save();
      const blob = new Blob(
        [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `extracted_${file?.name || "pages.pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Extracted ${selected.size} page(s)`);
    } catch {
      toast.error("Failed to extract pages");
    }
    setExtracting(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Card className="border-dashed">
        <CardContent className="p-8">
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? `${file.name} (${totalPages} pages)` : "Click to upload a PDF"}
            </span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>
        </CardContent>
      </Card>

      {totalPages > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Select pages ({selected.size} of {totalPages})
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={selectNone}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => togglePage(i)}
                className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs font-medium transition-colors ${
                  selected.has(i)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {selected.has(i) ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            onClick={handleExtract}
            disabled={extracting || selected.size === 0}
            className="w-full"
          >
            <FileDown className="h-4 w-4 mr-2" />
            {extracting ? "Extracting..." : `Extract ${selected.size} Page(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
