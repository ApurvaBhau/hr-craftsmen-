import { useState } from "react";
import { Calculator, Copy, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const categories = [
  "HR Analytics",
  "Payroll Logic",
  "Attendance Tracking",
  "Performance Metrics",
];

const examples = [
  "Calculate attendance percentage excluding weekends",
  "Sum total overtime hours for the month",
  "VLOOKUP employee name from ID across sheets",
  "Calculate leave balance from annual quota minus used leaves",
  "IF condition for performance rating based on score ranges",
];

export default function ExcelFormula() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [result, setResult] = useState<{ formula: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!query.trim()) {
      toast.error("Please describe what you need");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("excel-formula", {
        body: { query, category },
      });

      if (error) throw error;
      setResult({ formula: data.formula, explanation: data.explanation });
      toast.success("Formula generated!");
    } catch (err: any) {
      console.error("Formula generation error:", err);
      toast.error(err?.message || "Failed to generate formula. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.formula);
      toast.success("Formula copied!");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Excel Formula Generator</h1>
      <p className="text-muted-foreground mb-6">
        Describe what you need in plain English
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Badge
                key={c}
                variant={category === c ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setCategory(category === c ? "" : c)}
              >
                {c}
              </Badge>
            ))}
          </div>

          <Textarea
            placeholder="e.g., Calculate attendance percentage excluding weekends"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[120px]"
          />

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" /> Generate Formula
              </>
            )}
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Try these examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(ex)}
                  className="block w-full text-left text-sm text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Result</CardTitle>
            {result && (
              <Button size="icon" variant="ghost" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    FORMULA
                  </p>
                  <code className="block p-3 bg-muted rounded-lg text-sm font-mono break-all">
                    {result.formula}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    EXPLANATION
                  </p>
                  <p className="text-sm leading-relaxed">{result.explanation}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Your formula will appear here. Try one of the example prompts to get
                started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
