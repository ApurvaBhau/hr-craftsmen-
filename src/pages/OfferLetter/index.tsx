import { useState, useEffect } from "react";
import { FileDown, Eye, Edit3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import jsPDF from "jspdf";

function formatDate(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatDateLong(date: Date) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function numberToWords(num: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num === 0) return "Zero";
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
}

function getDefaultBody(name: string, position: string, salary: number, salaryWords: string, date: string) {
  const firstName = name.split(" ")[0] || "Candidate";
  return `Dear Mr. ${firstName},

We are pleased to offer you the position of ${position} at Chandigarh University. We are confident that your skills and experience will make a significant contribution to our Institution. You will be working with a dynamic team of professionals who are passionate about achieving excellence in their fields, and we believe that you will contribute significantly to the growth and success of the university.

Your monthly stipend will be Rs. ${salary.toLocaleString("en-IN")}/- (Rupees ${salaryWords} only), subject to statutory deductions.

You are required to report to the Human Resource Department, Chandigarh University, Gharuan, on or before ${date}, post which this offer will become null and void.

During your work tenure, you will have the opportunity to gain hands-on experience in various HR functions, work closely with experienced professionals, and develop essential skills for your career growth.

To accept this offer, please send us an acceptance acknowledgement over the email within 24 hours of receiving the offer letter.

Your detailed appointment and guidelines will be provided to you on your joining day.

We look forward to welcoming you to Chandigarh University and working with you to achieve our shared goals.`;
}

export default function OfferLetter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [preview, setPreview] = useState(false);
  const [editContent, setEditContent] = useState(false);
  const [customBody, setCustomBody] = useState("");
  const [headerImgData, setHeaderImgData] = useState<string | null>(null);
  const [naacImgData, setNaacImgData] = useState<string | null>(null);

  const today = formatDate(new Date());
  const todayLong = formatDateLong(new Date());
  const salaryNum = parseInt(salary.replace(/,/g, "")) || 0;
  const salaryWords = salaryNum > 0 ? numberToWords(salaryNum) : "";
  const firstName = name.split(" ")[0] || "Candidate";

  // Preload images as base64 for jsPDF
  useEffect(() => {
    const loadImg = (src: string, cb: (data: string) => void) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext("2d")?.drawImage(img, 0, 0);
        cb(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.src = src;
    };
    loadImg("/images/cu-header.png", setHeaderImgData);
    loadImg("/images/naac-badge.png", setNaacImgData);
  }, []);

  const bodyText = editContent && customBody
    ? customBody
    : getDefaultBody(name || "[Name]", position || "[Position]", salaryNum || 0, salaryWords || "[Amount in Words]", todayLong);

  const handleResetContent = () => {
    setCustomBody(getDefaultBody(name, position, salaryNum, salaryWords, todayLong));
  };

  const handleToggleEdit = (checked: boolean) => {
    setEditContent(checked);
    if (checked && !customBody) {
      setCustomBody(getDefaultBody(name || "[Name]", position || "[Position]", salaryNum, salaryWords || "[Amount]", todayLong));
    }
  };

  const handleGeneratePDF = () => {
    if (!name || !email || !position || !salary) {
      toast.error("Please fill in all fields");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const marginL = 25;
    const marginR = 25;
    const contentWidth = pageWidth - marginL - marginR;
    let y = 15;

    // Page border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.rect(10, 8, pageWidth - 20, pageHeight - 16);

    // Header logos
    if (headerImgData) {
      doc.addImage(headerImgData, "PNG", marginL, y, 65, 18);
    }
    if (naacImgData) {
      // vertical line before NAAC
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(pageWidth - marginR - 42, y + 1, pageWidth - marginR - 42, y + 17);
      doc.addImage(naacImgData, "PNG", pageWidth - marginR - 38, y + 1, 38, 16);
    }
    y += 24;

    // Black horizontal line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.line(marginL, y, pageWidth - marginR, y);
    y += 10;

    // Candidate info block - bold name
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(name, marginL, y);
    y += 5.5;

    // Email - "Email:" label + blue underlined email
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text("Email: ", marginL, y);
    const emailLabelWidth = doc.getTextWidth("Email: ");
    doc.setTextColor(0, 0, 200);
    doc.text(email, marginL + emailLabelWidth, y);
    const emailWidth = doc.getTextWidth(email);
    doc.setDrawColor(0, 0, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL + emailLabelWidth, y + 0.5, marginL + emailLabelWidth + emailWidth, y + 0.5);
    y += 5.5;

    // Phone
    if (phone) {
      doc.setTextColor(0, 0, 0);
      doc.setFont("times", "normal");
      doc.text("Phone: ", marginL, y);
      const phoneLabelWidth = doc.getTextWidth("Phone: ");
      doc.setFont("times", "bold");
      doc.text(phone, marginL + phoneLabelWidth, y);
      y += 7;
    } else {
      y += 1.5;
    }

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text(`Date: ${today}`, marginL, y);
    y += 12;

    // Subject
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.text("Subject: Offer Letter", marginL, y);
    y += 10;

    // Body - justified text
    const lines = bodyText.split("\n");
    doc.setFontSize(11);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        y += 4;
        continue;
      }

      // Check for bold patterns like **text** or specific bold phrases
      if (trimmed.startsWith("Dear ")) {
        doc.setFont("times", "bold");
        doc.text(trimmed, marginL, y);
        doc.setFont("times", "normal");
        y += 7;
        continue;
      }

      // Render paragraph with inline bold for position and salary
      const wrapped = doc.splitTextToSize(trimmed, contentWidth);
      for (const wline of wrapped) {
        // Check if line contains bold markers
        const boldParts = parseBoldSegments(wline, position, salaryNum, salaryWords, todayLong);
        let xPos = marginL;
        for (const seg of boldParts) {
          doc.setFont("times", seg.bold ? "bold" : "normal");
          doc.text(seg.text, xPos, y);
          xPos += doc.getTextWidth(seg.text);
        }
        y += 5.5;
      }
      y += 2;
    }

    // Sign off
    y += 4;
    doc.setFont("times", "normal");
    doc.text("With Best Wishes,", marginL, y);
    y += 10;
    doc.setFont("times", "normal");
    doc.text(" HR Department", marginL, y);
    y += 5.5;
    doc.text("Chandigarh University", marginL, y);

    doc.save(`Offer_Letter_${name.replace(/\s+/g, "_")}.pdf`);
    toast.success("Offer letter PDF downloaded!");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Offer Letter Generator</h1>
      <p className="text-muted-foreground mb-6">
        Generate Chandigarh University offer letters with the official template
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nilesh Bansal" />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. nileshbansal24@gmail.com" />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9728207891" />
              </div>
              <div>
                <Label>Position / Role</Label>
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. HR Intern" />
              </div>
              <div>
                <Label>Monthly Stipend (₹)</Label>
                <Input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 8000" />
              </div>

              {/* Edit content toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-muted-foreground" />
                  <Label className="cursor-pointer">Edit letter content</Label>
                </div>
                <Switch checked={editContent} onCheckedChange={handleToggleEdit} />
              </div>

              {editContent && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Customize the body text below</Label>
                    <Button variant="ghost" size="sm" onClick={handleResetContent} className="h-7 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" /> Reset
                    </Button>
                  </div>
                  <Textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    rows={12}
                    className="text-xs leading-relaxed font-mono"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => setPreview(true)} variant="outline" className="flex-1" disabled={!name || !position || !salary}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </Button>
                <Button onClick={handleGeneratePDF} className="flex-1" disabled={!name || !email || !position || !salary}>
                  <FileDown className="h-4 w-4 mr-2" /> Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview - exact template replica */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Letter Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {preview && name && position && salary ? (
              <div className="bg-white text-black mx-4 mb-4 overflow-auto max-h-[70vh]" style={{ border: "2px solid #000" }}>
                <div className="p-10 min-w-[500px]" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: "12.5px", lineHeight: "1.7" }}>
                  {/* Header with logos */}
                  <div className="flex items-start justify-between mb-0">
                    <img src="/images/cu-header.png" alt="Chandigarh University" className="h-14 object-contain" />
                    <div className="flex items-center gap-2">
                      <div className="w-px h-12 bg-black" />
                      <img src="/images/naac-badge.png" alt="NAAC A+" className="h-12 object-contain" />
                    </div>
                  </div>

                   {/* Black line */}
                  <div className="h-[3px] bg-black mt-3 mb-6" />

                  {/* Candidate info */}
                  <div className="mb-1">
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-sm">
                       Email: <a href={`mailto:${email}`} className="text-blue-700 underline">{email}</a>
                    </p>
                    {phone && <p className="text-sm">Phone: <span className="font-bold">{phone}</span></p>}
                  </div>

                  <p className="font-bold text-sm mt-3 mb-6">Date: {today}</p>

                  {/* Subject */}
                  <p className="font-bold text-sm mb-4">Subject: Offer Letter</p>

                  {/* Body */}
                  <div className="text-sm space-y-3 text-justify">
                    {bodyText.split("\n").map((para, i) => {
                      const trimmed = para.trim();
                      if (!trimmed) return <div key={i} className="h-1" />;

                      if (trimmed.startsWith("Dear ")) {
                        return <p key={i} className="font-bold">{trimmed}</p>;
                      }

                      // Bold the position, salary and date inline
                      return (
                        <p key={i}>
                          {highlightBold(trimmed, position, salaryNum, salaryWords, todayLong)}
                        </p>
                      );
                    })}
                  </div>

                  {/* Sign off */}
                  <div className="mt-8 text-sm">
                    <p>With Best Wishes,</p>
                    <div className="mt-4">
                      <p className="ml-1"> HR Department</p>
                      <p>Chandigarh University</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm p-4">
                Fill in the candidate details and click Preview to see the exact offer letter template before downloading.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Highlight specific terms as bold in the preview */
function highlightBold(
  text: string,
  position: string,
  salary: number,
  salaryWords: string,
  dateLong: string
): React.ReactNode {
  const boldTerms: string[] = [];
  if (position) boldTerms.push(position);
  if (salary > 0) {
    boldTerms.push(`Rs. ${salary.toLocaleString("en-IN")}/-`);
    boldTerms.push(`(Rupees ${salaryWords} only)`);
  }
  if (dateLong) boldTerms.push(dateLong);

  if (boldTerms.length === 0) return text;

  // Build regex from bold terms
  const escaped = boldTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    boldTerms.includes(part) ? (
      <strong key={i}>{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/** Parse bold segments for PDF rendering */
function parseBoldSegments(
  text: string,
  position: string,
  salary: number,
  salaryWords: string,
  dateLong: string
): { text: string; bold: boolean }[] {
  const boldTerms: string[] = [];
  if (position) boldTerms.push(position);
  if (salary > 0) {
    boldTerms.push(`Rs. ${salary.toLocaleString("en-IN")}/-`);
    boldTerms.push(`(Rupees ${salaryWords} only)`);
  }
  if (dateLong) boldTerms.push(dateLong);

  if (boldTerms.length === 0) return [{ text, bold: false }];

  const escaped = boldTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(regex);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      bold: boldTerms.includes(part),
    }));
}
