import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Save, Type, Pencil, Eraser, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Trash2, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { PDFDocument, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

type Tool = "select" | "text" | "draw";

interface TextAnnotation {
  id: string;
  text: string;
  page: number;
  x: number; // percentage of page width
  y: number; // percentage of page height
  fontSize: number;
}

interface DrawPath {
  page: number;
  points: { x: number; y: number }[];
}

export default function PdfEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [tool, setTool] = useState<Tool>("select");
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [drawPaths, setDrawPaths] = useState<DrawPath[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Match overlay canvas size
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = viewport.width;
      overlayCanvasRef.current.height = viewport.height;
    }

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Draw existing draw paths for this page on overlay
    renderOverlay(pageNum);
  }, [pdfDoc, scale]);

  const renderOverlay = useCallback((pageNum: number) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw paths
    const pagePaths = drawPaths.filter((p) => p.page === pageNum);
    for (const path of pagePaths) {
      if (path.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const firstPt = path.points[0];
      ctx.moveTo(firstPt.x * overlay.width, firstPt.y * overlay.height);
      for (let i = 1; i < path.points.length; i++) {
        const pt = path.points[i];
        ctx.lineTo(pt.x * overlay.width, pt.y * overlay.height);
      }
      ctx.stroke();
    }

    // Draw text annotation markers
    const pageAnnotations = annotations.filter((a) => a.page === pageNum);
    for (const ann of pageAnnotations) {
      const x = ann.x * overlay.width;
      const y = ann.y * overlay.height;
      ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
      ctx.fillRect(x - 2, y - ann.fontSize * scale, ctx.measureText(ann.text).width + 8, ann.fontSize * scale + 4);
      ctx.fillStyle = "#1d4ed8";
      ctx.font = `${ann.fontSize * scale}px sans-serif`;
      ctx.fillText(ann.text, x, y);
    }
  }, [annotations, drawPaths, scale]);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, renderPage]);

  useEffect(() => {
    renderOverlay(currentPage);
  }, [currentPage, renderOverlay]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || f.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setFile(f);
    setAnnotations([]);
    setDrawPaths([]);
    setCurrentPage(1);

    try {
      const bytes = await f.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
      setPdfDoc(doc);
      setPageCount(doc.numPages);
      toast.success(`Loaded: ${f.name} (${doc.numPages} pages)`);
    } catch {
      toast.error("Failed to load PDF");
    }
  };

  const getRelativeCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: ((e.clientX - rect.left) * scaleX) / canvas.width,
      y: ((e.clientY - rect.top) * scaleY) / canvas.height,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "text") return;
    const { x, y } = getRelativeCoords(e);
    const id = crypto.randomUUID();
    setAnnotations((prev) => [
      ...prev,
      { id, text: "Text", page: currentPage, x, y, fontSize: 14 },
    ]);
    setEditingAnnotation(id);
    setTool("select");
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool !== "draw") return;
    setIsDrawing(true);
    const { x, y } = getRelativeCoords(e);
    setDrawPaths((prev) => [...prev, { page: currentPage, points: [{ x, y }] }]);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== "draw") return;
    const { x, y } = getRelativeCoords(e);
    setDrawPaths((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last) {
        last.points.push({ x, y });
      }
      return updated;
    });
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "draw") handleDrawStart(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "draw") handleDrawMove(e);
  };

  const handleMouseUp = () => {
    if (tool === "draw") handleDrawEnd();
  };

  const updateAnnotation = (id: string, text: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, text } : a))
    );
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (editingAnnotation === id) setEditingAnnotation(null);
  };

  const clearDrawings = () => {
    setDrawPaths((prev) => prev.filter((p) => p.page !== currentPage));
  };

  const handleSave = async () => {
    if (!file) return;
    if (annotations.length === 0 && drawPaths.length === 0) {
      toast.error("No annotations or drawings to save");
      return;
    }
    setSaving(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pages = pdf.getPages();

      // Apply text annotations
      for (const ann of annotations) {
        const page = pages[ann.page - 1];
        if (!page) continue;
        const { width, height } = page.getSize();
        page.drawText(ann.text, {
          x: ann.x * width,
          y: height - ann.y * height,
          size: ann.fontSize,
          color: rgb(0, 0, 0),
        });
      }

      // Apply drawings
      for (const path of drawPaths) {
        const page = pages[path.page - 1];
        if (!page || path.points.length < 2) continue;
        const { width, height } = page.getSize();

        for (let i = 1; i < path.points.length; i++) {
          const prev = path.points[i - 1];
          const curr = path.points[i];
          page.drawLine({
            start: { x: prev.x * width, y: height - prev.y * height },
            end: { x: curr.x * width, y: height - curr.y * height },
            thickness: 1.5,
            color: rgb(0.937, 0.267, 0.267), // red
          });
        }
      }

      const saved = await pdf.save();
      const blob = new Blob(
        [saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength) as ArrayBuffer],
        { type: "application/pdf" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edited_${file.name}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF saved with edits!");
    } catch {
      toast.error("Failed to save PDF");
    }
    setSaving(false);
  };

  const currentAnnotations = annotations.filter((a) => a.page === currentPage);

  return (
    <div className="space-y-4">
      {!pdfDoc ? (
        <Card className="border-dashed">
          <CardContent className="p-8">
            <label className="flex flex-col items-center gap-3 cursor-pointer">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload a PDF
              </span>
              <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
            </label>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup type="single" value={tool} onValueChange={(v) => v && setTool(v as Tool)}>
              <ToggleGroupItem value="select" aria-label="Select">
                <MousePointer className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="text" aria-label="Add Text">
                <Type className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="draw" aria-label="Draw">
                <Pencil className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="h-6 w-px bg-border mx-1" />

            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-14 text-center">{(scale * 100).toFixed(0)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setScale((s) => Math.min(3, s + 0.25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {pageCount}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))} disabled={currentPage >= pageCount}>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="ml-auto flex gap-2">
              {tool === "draw" && (
                <Button variant="outline" size="sm" onClick={clearDrawings}>
                  <Eraser className="h-4 w-4 mr-1" /> Clear drawings
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save & Download"}
              </Button>
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-muted-foreground">
            {tool === "text" && "Click on the PDF to place text."}
            {tool === "draw" && "Click and drag on the PDF to draw."}
            {tool === "select" && "Select a tool above to start editing."}
          </p>

          {/* PDF Canvas */}
          <div ref={containerRef} className="overflow-auto border rounded-lg bg-muted/30 max-h-[65vh]">
            <div className="relative inline-block">
              <canvas ref={canvasRef} className="block" />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 block"
                style={{ cursor: tool === "text" ? "crosshair" : tool === "draw" ? "crosshair" : "default" }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Annotations List */}
          {currentAnnotations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Text annotations on this page</Label>
              {currentAnnotations.map((ann) => (
                <div key={ann.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <Input
                    value={ann.text}
                    onChange={(e) => updateAnnotation(ann.id, e.target.value)}
                    className="flex-1 h-8 text-sm"
                    autoFocus={editingAnnotation === ann.id}
                    onFocus={() => setEditingAnnotation(ann.id)}
                    onBlur={() => setEditingAnnotation(null)}
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteAnnotation(ann.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload new */}
          <div className="pt-2">
            <label className="text-xs text-muted-foreground cursor-pointer hover:underline">
              Upload a different PDF
              <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
