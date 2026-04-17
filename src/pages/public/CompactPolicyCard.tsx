import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, Shield } from "lucide-react";

export type PolicyPoint = string;
export type PolicyTable = { headers: string[]; rows: string[][] };
export type PolicySubsection = {
  title: string;
  body?: string;
  bullets?: PolicyPoint[];
  table?: PolicyTable;
  tags?: string[];
};
export type PolicySection = {
  number: string;
  title: string;
  body?: string;
  bullets?: PolicyPoint[];
  table?: PolicyTable;
  tags?: string[];
  subsections?: PolicySubsection[];
};
export type PolicyDoc = {
  title: string;
  subtitle?: string;
  badge?: string;
  lastUpdated?: string;
  sections: PolicySection[];
  filename?: string;
};

function Table({ data }: { data: PolicyTable }) {
  return (
    <div className="rounded-xl border overflow-hidden mt-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-secondary/60">
            {data.headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-bold uppercase tracking-wide text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-t border-border/30">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-xs font-medium">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag, i) => (
        <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">{tag}</span>
      ))}
    </div>
  );
}

function SectionBlock({ section }: { section: PolicySection | PolicySubsection; isTop?: boolean }) {
  return (
    <div className="space-y-2">
      {section.body && <p className="text-xs text-muted-foreground leading-relaxed">{section.body}</p>}
      {section.bullets && (
        <ul className="space-y-1">
          {section.bullets.map((b, bi) => (
            <li key={bi} className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
              <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {section.table && <Table data={section.table} />}
      {section.tags && <Tags tags={section.tags} />}
    </div>
  );
}

interface CompactPolicyCardProps {
  policy: PolicyDoc;
  accentColor?: string; // tailwind gradient classes
}

export default function CompactPolicyCard({ policy, accentColor = "from-primary to-indigo-600" }: CompactPolicyCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false, windowWidth: 900,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let remainingHeight = imgHeight;
      let posY = 10;
      while (remainingHeight > 0) {
        const sliceH = Math.min(remainingHeight, pageHeight - 20);
        const srcY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);
        const srcH = sliceH * (canvas.height / imgHeight);
        const slice = document.createElement("canvas");
        slice.width = canvas.width; slice.height = srcH;
        const ctx = slice.getContext("2d")!;
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        pdf.addImage(slice.toDataURL("image/png"), "PNG", 10, posY, imgWidth, sliceH);
        remainingHeight -= sliceH;
        if (remainingHeight > 0) { pdf.addPage(); posY = 10; }
      }
      pdf.save(`${policy.filename || policy.title.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs">
          <FileText className="h-3 w-3" />
          {policy.badge || "Policy Document"}
        </div>
        <Button onClick={handleDownloadPDF} disabled={downloading} size="sm" className="rounded-full font-bold gap-2 h-8 text-xs">
          {downloading ? <><Loader2 className="h-3 w-3 animate-spin" />Generating...</> : <><Download className="h-3 w-3" />Download PDF</>}
        </Button>
      </div>

      {/* Card */}
      <div ref={cardRef} className="rounded-2xl border bg-white text-foreground shadow-lg overflow-hidden" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${accentColor} p-6 text-white`}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Official Policy Document</p>
              <h2 className="font-bold text-xl leading-tight">{policy.title}</h2>
              {policy.subtitle && <p className="text-white/70 text-xs mt-1 leading-relaxed">{policy.subtitle}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-medium">{policy.sections.length} Sections</span>
            {policy.lastUpdated && <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-medium">Updated: {policy.lastUpdated}</span>}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-0 divide-y divide-border/40">
          {policy.sections.map((section) => (
            <div key={section.number} className="py-4 first:pt-2 last:pb-2">
              {/* Section header */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-[10px] font-bold text-primary/50 uppercase tracking-widest shrink-0">{section.number}.</span>
                <h3 className="font-bold text-sm leading-snug">{section.title}</h3>
              </div>
              {/* Section content */}
              <div className="pl-5">
                <SectionBlock section={section} />
                {/* Subsections */}
                {section.subsections && (
                  <div className="mt-2 space-y-3">
                    {section.subsections.map((sub, si) => (
                      <div key={si} className="pl-2 border-l-2 border-primary/20">
                        <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wide mb-1">{sub.title}</p>
                        <SectionBlock section={sub} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2 border-t text-center">
          <p className="text-[10px] text-muted-foreground/50">
            Official policy document. For queries, contact the editorial team via the Support page.
          </p>
        </div>
      </div>
    </div>
  );
}
