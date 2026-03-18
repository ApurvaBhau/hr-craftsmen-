import { useState, useRef } from "react";
import { Upload, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const conversions = [
  { from: "PNG", to: "JPG", supported: true },
  { from: "SVG", to: "JPG", supported: true },
  { from: "JPG", to: "PNG", supported: true },
  { from: "DOCX", to: "PDF", supported: false },
  { from: "PDF", to: "Word", supported: false },
  { from: "PDF", to: "CSV", supported: false },
  { from: "XLSX", to: "CSV", supported: false },
];

const acceptMap: Record<string, string> = {
  PNG: ".png",
  JPG: ".jpg,.jpeg",
  SVG: ".svg",
  DOCX: ".docx",
  PDF: ".pdf",
  XLSX: ".xlsx",
};

export default function FileConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState("");
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedConversion = conversions.find(
    (c) => `${c.from}-${c.to}` === conversionType
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      toast.success(`Selected: ${f.name}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) {
      setFile(f);
      toast.success(`Selected: ${f.name}`);
    }
  };

  const handleConvert = async () => {
    if (!file || !selectedConversion) return;

    if (!selectedConversion.supported) {
      toast.error("This conversion will be available in a future update.");
      return;
    }

    setConverting(true);
    setProgress(20);

    try {
      if (["PNG", "JPG", "SVG"].includes(selectedConversion.from)) {
        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            setProgress(60);
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d")!;

            if (selectedConversion.to === "JPG") {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            setProgress(80);

            const mimeType =
              selectedConversion.to === "PNG" ? "image/png" : "image/jpeg";
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const ext = selectedConversion.to.toLowerCase();
                  const downloadUrl = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = downloadUrl;
                  a.download = `converted.${ext}`;
                  a.click();
                  URL.revokeObjectURL(downloadUrl);
                  setProgress(100);
                  toast.success("File converted successfully!");
                  resolve();
                } else {
                  reject(new Error("Conversion failed"));
                }
              },
              mimeType,
              0.92
            );
          };
          img.onerror = () => reject(new Error("Failed to load image"));
          img.src = url;
        });

        URL.revokeObjectURL(url);
      }
    } catch {
      toast.error("Conversion failed");
    }

    setConverting(false);
    setTimeout(() => setProgress(0), 1500);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">File Converter</h1>
      <p className="text-muted-foreground mb-6">
        Convert files between formats quickly
      </p>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Conversion Type</label>
          <Select value={conversionType} onValueChange={setConversionType}>
            <SelectTrigger>
              <SelectValue placeholder="Select conversion..." />
            </SelectTrigger>
            <SelectContent>
              {conversions.map((c) => (
                <SelectItem
                  key={`${c.from}-${c.to}`}
                  value={`${c.from}-${c.to}`}
                >
                  {c.from} → {c.to} {!c.supported && "(Coming soon)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card
          className="border-dashed cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {file ? file.name : "Drop your file here or click to browse"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : selectedConversion
                      ? `Accepts ${acceptMap[selectedConversion.from]} files`
                      : "Select a conversion type first"}
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={selectedConversion ? acceptMap[selectedConversion.from] : undefined}
              className="hidden"
              onChange={handleUpload}
            />
          </CardContent>
        </Card>

        {progress > 0 && <Progress value={progress} className="h-2" />}

        <Button
          onClick={handleConvert}
          disabled={!file || !conversionType || converting}
          className="w-full"
          size="lg"
        >
          {converting ? (
            "Converting..."
          ) : (
            <>
              <FileType className="h-4 w-4 mr-2" />
              Convert{" "}
              {selectedConversion
                ? `${selectedConversion.from} → ${selectedConversion.to}`
                : "File"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
