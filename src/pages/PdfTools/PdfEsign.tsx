import { useState, useRef } from "react";
import { Upload, Pen, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PDFDocument } from "pdf-lib";

export default function PdfEsign() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [signPage, setSignPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setFile(f);
    const bytes = await f.arrayBuffer();
    const pdf = await PDFDocument.load(bytes);
    setPageCount(pdf.getPageCount());
    toast.success(`Loaded: ${f.name}`);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      const { x, y } = getCanvasCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      const { x, y } = getCanvasCoords(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleSign = async () => {
    if (!file || !canvasRef.current) return;
    setSaving(true);
    try {
      const sigData = canvasRef.current.toDataURL("image/png");
      const sigBytes = await fetch(sigData).then((r) => r.arrayBuffer());
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const sigImage = await pdf.embedPng(sigBytes);
      const page = pdf.getPages()[signPage - 1];
      if (page) {
        const { width } = page.getSize();
        page.drawImage(sigImage, {
          x: width - 200,
          y: 50,
          width: 150,
          height: 50,
        });
      }
      const saved = await pdf.save();
      const blob = new Blob([saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength) as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF signed successfully!");
    } catch {
      toast.error("Failed to sign PDF");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <Card className="border-dashed">
        <CardContent className="p-8">
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? `${file.name} (${pageCount} pages)` : "Click to upload a PDF"}
            </span>
            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          </label>
        </CardContent>
      </Card>

      {file && (
        <>
          <div>
            <Label>Sign on page</Label>
            <Input
              type="number"
              min={1}
              max={pageCount}
              value={signPage}
              onChange={(e) => setSignPage(+e.target.value)}
              className="w-24"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Draw your signature</Label>
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                <Eraser className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="border rounded-lg bg-card cursor-crosshair w-full max-w-md"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
            />
          </div>

          <Button onClick={handleSign} disabled={saving}>
            <Pen className="h-4 w-4 mr-2" />
            {saving ? "Signing..." : "Sign & Download"}
          </Button>
        </>
      )}
    </div>
  );
}
