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
    <>
      {/* Visible Small Card UI */}
      <div className="flex flex-col rounded-2xl border bg-white shadow-md overflow-hidden h-[240px] hover:shadow-xl transition-all group">
        {/* Header */}
        <div className={`bg-gradient-to-br ${accentColor} p-6 text-white flex-1 flex flex-col justify-center relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
            <Shield className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-widest mb-3 backdrop-blur-sm w-fit border border-white/10">
              <FileText className="h-3 w-3" />
              {policy.badge || "Policy Document"}
            </div>
            <h2 className="font-heading font-bold text-xl md:text-2xl leading-tight mb-2 line-clamp-2">{policy.title}</h2>
            {policy.subtitle && <p className="text-white/80 text-xs leading-relaxed line-clamp-2">{policy.subtitle}</p>}
          </div>
        </div>

        {/* Footer / Actions */}
        <div className="p-4 bg-muted/10 border-t flex items-center justify-between shrink-0 h-[72px]">
          <div className="flex flex-col">
             <span className="text-xs font-bold text-foreground">Complete Handbook</span>
             <span className="text-[10px] text-muted-foreground">{policy.sections.length} Sections</span>
          </div>
          <Button onClick={handleDownloadPDF} disabled={downloading} size="sm" className="rounded-full font-bold gap-2 shadow-sm transition-transform hover:-translate-y-0.5">
            {downloading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Download className="h-3.5 w-3.5" /> Download PDF</>}
          </Button>
        </div>
      </div>

      {/* Hidden container for PDF generation ONLY */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px", width: "900px", zIndex: -1 }}>
        <div ref={cardRef} className="rounded-xl border bg-white text-black overflow-hidden shadow-none" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
          {/* Header */}
          <div className={`bg-gradient-to-r ${accentColor} p-8 text-white`}>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Official Policy Document</p>
                <h2 className="font-bold text-3xl leading-tight mt-1">{policy.title}</h2>
                {policy.subtitle && <p className="text-white/80 text-sm mt-2 leading-relaxed">{policy.subtitle}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">{policy.sections.length} Sections</span>
              {policy.lastUpdated && <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Updated: {policy.lastUpdated}</span>}
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-0 divide-y divide-border/40 bg-white">
            {policy.sections.map((section) => (
              <div key={section.number} className="py-6 first:pt-2 last:pb-2">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest shrink-0">{section.number}.</span>
                  <h3 className="font-bold text-lg leading-snug">{section.title}</h3>
                </div>
                <div className="pl-6">
                  <SectionBlock section={section} />
                  {section.subsections && (
                    <div className="mt-4 space-y-4">
                      {section.subsections.map((sub, si) => (
                        <div key={si} className="pl-3 border-l-2 border-primary/20">
                          <p className="text-xs font-bold text-primary/80 uppercase tracking-wide mb-1.5">{sub.title}</p>
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
          <div className="px-8 pb-6 pt-4 border-t text-center bg-white">
            <p className="text-xs text-muted-foreground/60">
              Official policy document. For queries, contact the editorial team via the Support page.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
