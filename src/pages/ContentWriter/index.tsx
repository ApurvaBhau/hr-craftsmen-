import { useState } from "react";
import { Wand2, Copy, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const templates = [
  { value: "offer-letter", label: "Offer Letter", fields: ["candidateName", "position", "salary", "startDate"] },
  { value: "hr-policy", label: "HR Policy", fields: ["policyTitle", "department"] },
  { value: "event-announcement", label: "Event Announcement", fields: ["eventName", "date", "venue"] },
  { value: "internal-email", label: "Internal Email", fields: ["subject", "recipientGroup"] },
  { value: "job-description", label: "Job Description", fields: ["jobTitle", "department", "experience"] },
];

const tones = ["Professional", "Friendly", "Formal", "Motivational"];

const fieldLabels: Record<string, string> = {
  candidateName: "Candidate Name",
  position: "Position",
  salary: "Salary / Package",
  startDate: "Start Date",
  policyTitle: "Policy Title",
  department: "Department",
  eventName: "Event Name",
  date: "Date",
  venue: "Venue",
  subject: "Subject",
  recipientGroup: "Recipient Group",
  jobTitle: "Job Title",
  experience: "Experience Required",
};

export default function ContentWriter() {
  const [template, setTemplate] = useState("");
  const [tone, setTone] = useState("Professional");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTemplate = templates.find((t) => t.value === template);

  const handleGenerate = async () => {
    if (!template) {
      toast.error("Please select a template");
      return;
    }
    setLoading(true);
    setOutput("");

    try {
      const { data, error } = await supabase.functions.invoke("content-writer", {
        body: { template, tone, fields },
      });

      if (error) throw error;
      setOutput(data.content || "No content generated.");
      toast.success("Content generated!");
    } catch (err: any) {
      console.error("Content generation error:", err);
      toast.error(err?.message || "Failed to generate content. Please try again.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Content Writer</h1>
      <p className="text-muted-foreground mb-6">AI-powered HR content generation</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label>Content Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate?.fields.map((field) => (
            <div key={field}>
              <Label>{fieldLabels[field] || field}</Label>
              <Input
                value={fields[field] || ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field]: e.target.value }))
                }
                placeholder={`Enter ${fieldLabels[field]?.toLowerCase() || field}`}
              />
            </div>
          ))}

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" /> Generate Content
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Generated Content</CardTitle>
            {output && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {output ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{output}</div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Select a template, fill in the details, and click Generate to create
                AI-powered HR content.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
