import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileEdit, Minimize2, Merge, Pen, Scissors } from "lucide-react";
import PdfEditor from "./PdfEditor";
import PdfCompressor from "./PdfCompressor";
import PdfMerger from "./PdfMerger";
import PdfEsign from "./PdfEsign";
import PdfExtractor from "./PdfExtractor";

export default function PdfTools() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">PDF Tools</h1>
      <p className="text-muted-foreground mb-6">
        Edit, compress, merge, and sign PDF documents — all in your browser.
      </p>

      <Tabs defaultValue="editor">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">
            <FileEdit className="h-4 w-4 mr-1.5" /> Editor
          </TabsTrigger>
          <TabsTrigger value="compressor">
            <Minimize2 className="h-4 w-4 mr-1.5" /> Compressor
          </TabsTrigger>
          <TabsTrigger value="merger">
            <Merge className="h-4 w-4 mr-1.5" /> Merger
          </TabsTrigger>
          <TabsTrigger value="esign">
            <Pen className="h-4 w-4 mr-1.5" /> E-Sign
          </TabsTrigger>
          <TabsTrigger value="extractor">
            <Scissors className="h-4 w-4 mr-1.5" /> Extractor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <PdfEditor />
        </TabsContent>
        <TabsContent value="compressor">
          <PdfCompressor />
        </TabsContent>
        <TabsContent value="merger">
          <PdfMerger />
        </TabsContent>
        <TabsContent value="esign">
          <PdfEsign />
        </TabsContent>
        <TabsContent value="extractor">
          <PdfExtractor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
