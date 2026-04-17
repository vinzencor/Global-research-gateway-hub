import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Users,
  Eye,
  BarChart3,
  MessageSquare,
  Lock,
  Loader2,
} from "lucide-react";

const policyData = {
  title: "Peer Review Policy",
  lastUpdated: "January 2025",
  sections: [
    {
      number: "1",
      title: "Overview",
      icon: <Eye className="h-4 w-4" />,
      content: "The platform follows a structured, multi-stage peer review process to ensure that all published content meets defined standards of quality, originality, technical rigor, relevance, and ethical integrity. All eligible submissions undergo formal evaluation by qualified reviewers prior to publication, unless explicitly categorized as non-reviewed content (e.g., announcements).",
      bullets: null,
    },
    {
      number: "2",
      title: "Objectives of Peer Review",
      icon: <CheckCircle className="h-4 w-4" />,
      content: "The peer review process is designed to:",
      bullets: [
        "Validate the quality and originality of submissions",
        "Identify gaps, errors, and inconsistencies",
        "Improve clarity and structure",
        "Ensure alignment with publication standards",
        "Maintain the credibility of the platform",
        "Peer review is a quality control mechanism, not a formality.",
      ],
    },
    {
      number: "3",
      title: "Types of Review",
      icon: <BarChart3 className="h-4 w-4" />,
      content: "The platform may apply different review models depending on content type:",
      subsections: [
        {
          title: "3.1 Editorial Review",
          points: ["Conducted by internal editorial team", "Applied to articles, announcements, or non-research content", "Focuses on clarity, structure, and relevance"],
        },
        {
          title: "3.2 Single-Reviewer Peer Review",
          points: ["One domain expert evaluates the submission", "Used for standard technical or analytical submissions"],
        },
        {
          title: "3.3 Multi-Reviewer Peer Review",
          points: ["Two or more reviewers assigned", "Used for research papers, high-impact submissions, and complex technical content"],
        },
        {
          title: "3.4 Re-Review (Revision Rounds)",
          points: ["Applied when revisions are required", "Original reviewers may reassess updated submissions"],
        },
      ],
    },
    {
      number: "4",
      title: "Reviewer Selection",
      icon: <Users className="h-4 w-4" />,
      content: "Reviewers are selected based on:",
      bullets: [
        "Subject-matter expertise",
        "Demonstrated experience",
        "Past review performance",
        "Availability",
      ],
      extra: "The platform maintains a reviewer database with performance tracking, ensuring that only qualified reviewers are assigned.",
    },
    {
      number: "5",
      title: "Conflict of Interest Policy",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: "Reviewers must decline assignments if:",
      bullets: [
        "They have a personal relationship with the author",
        "They have collaborated recently",
        "They have financial or institutional conflicts",
      ],
      extra: "Failure to disclose conflicts results in removal from reviewer pool and potential blacklisting.",
    },
    {
      number: "6",
      title: "Review Process (Step-by-Step)",
      icon: <CheckCircle className="h-4 w-4" />,
      content: null,
      steps: [
        { step: "Step 1", title: "Submission Screening", desc: "Initial evaluation by Editor. Non-compliant submissions are rejected without review." },
        { step: "Step 2", title: "Reviewer Assignment", desc: "1–3 reviewers assigned based on complexity." },
        { step: "Step 3", title: "Review Evaluation", desc: "Reviewers assess originality, technical depth, clarity, methodology, relevance, and citation quality." },
        { step: "Step 4", title: "Review Submission", desc: "Reviewers provide structured scores, detailed comments, and a recommendation." },
        { step: "Step 5", title: "Editorial Decision", desc: "Editor evaluates reviewer feedback, scoring thresholds, and compliance status." },
        { step: "Step 6", title: "Author Notification", desc: "Author receives decision outcome, reviewer comments, and revision instructions (if applicable)." },
      ],
    },
    {
      number: "7",
      title: "Review Criteria",
      icon: <BarChart3 className="h-4 w-4" />,
      content: "All submissions are evaluated against structured criteria, including:",
      bullets: [
        "Originality and contribution",
        "Clarity and structure",
        "Technical rigor",
        "Research quality",
        "Practical relevance",
        "Citation strength",
      ],
      extra: "Each criterion is scored and contributes to the final decision.",
    },
    {
      number: "8",
      title: "Decision Outcomes",
      icon: <FileText className="h-4 w-4" />,
      content: "Possible decisions include:",
      decisions: [
        { outcome: "Accept", desc: "Submission meets all standards and is approved for publication.", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700" },
        { outcome: "Minor Revision", desc: "Small improvements required before publication.", color: "bg-blue-500/10 border-blue-500/20 text-blue-700" },
        { outcome: "Major Revision", desc: "Significant changes required; subject to re-review.", color: "bg-amber-500/10 border-amber-500/20 text-amber-700" },
        { outcome: "Reject", desc: "Submission does not meet required standards.", color: "bg-red-500/10 border-red-500/20 text-red-700" },
      ],
    },
    {
      number: "9",
      title: "Review Timelines",
      icon: <Clock className="h-4 w-4" />,
      content: "Typical timelines (may vary based on complexity):",
      timelines: [
        { stage: "Initial Screening", duration: "2–3 days" },
        { stage: "Reviewer Assignment", duration: "2 days" },
        { stage: "Review Completion", duration: "7–14 days" },
        { stage: "Decision", duration: "3–5 days" },
      ],
    },
    {
      number: "10",
      title: "Reviewer Responsibilities",
      icon: <Users className="h-4 w-4" />,
      content: "Reviewers are required to:",
      bullets: [
        "Provide objective, unbiased evaluations",
        "Maintain confidentiality",
        "Submit reviews within deadlines",
        "Provide constructive feedback",
      ],
    },
    {
      number: "11",
      title: "Confidentiality",
      icon: <Lock className="h-4 w-4" />,
      content: "All submitted content is treated as confidential. Reviewers and editors must not:",
      bullets: [
        "Share manuscripts",
        "Use unpublished data",
        "Disclose review details",
      ],
    },
    {
      number: "12",
      title: "Ethical Compliance",
      icon: <Shield className="h-4 w-4" />,
      content: "The review process enforces plagiarism detection, ethical compliance checks, and conflict of interest declarations. Submissions violating ethical standards are rejected.",
      bullets: null,
    },
    {
      number: "13",
      title: "Editorial Oversight",
      icon: <Eye className="h-4 w-4" />,
      content: "Editors are responsible for ensuring fair evaluation, resolving reviewer disagreements, and making final decisions. Editorial decisions are documented, justified, and auditable.",
      bullets: null,
    },
    {
      number: "14",
      title: "Reviewer Accountability",
      icon: <BarChart3 className="h-4 w-4" />,
      content: "Reviewer performance is monitored based on quality of reviews, timeliness, and consistency. Reviewers who fail to meet standards may be deprioritized or removed.",
      bullets: null,
    },
    {
      number: "15",
      title: "Appeals Process",
      icon: <MessageSquare className="h-4 w-4" />,
      content: "Authors may appeal decisions only if a procedural error occurred or there is clear evidence of incorrect evaluation. Appeals are reviewed internally and subject to final editorial decision.",
      bullets: null,
    },
    {
      number: "16",
      title: "Transparency & Disclosure",
      icon: <Eye className="h-4 w-4" />,
      content: "Where applicable, published content may display:",
      bullets: [
        "Author attribution",
        "Reviewer attribution (optional)",
        "Review status",
      ],
    },
    {
      number: "17",
      title: "Limitations of Peer Review",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: "While the platform maintains strict standards, peer review does not guarantee absolute accuracy, relies on expert judgment, and is subject to limitations of available knowledge.",
      bullets: null,
    },
    {
      number: "18",
      title: "Final Statement",
      icon: <Shield className="h-4 w-4" />,
      content: "The peer review process is central to maintaining the platform's credibility, reliability, and professional integrity. All participants are expected to respect and uphold the standards of this process.",
      bullets: null,
    },
  ],
};

export default function PeerReviewPolicyCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadPDF() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 900,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let posY = 10;
      let remainingHeight = imgHeight;

      // Draw image across multiple pages if needed
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - 20);
        const sourceY = (imgHeight - remainingHeight) * (canvas.height / imgHeight);
        const sourceH = sliceHeight * (canvas.height / imgHeight);

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);

        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 10, posY, imgWidth, sliceHeight);
        remainingHeight -= sliceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          posY = 10;
        }
      }

      pdf.save("Peer-Review-Policy.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs">
            <FileText className="h-3 w-3" />
            Platform Policy Document
          </div>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="rounded-full font-bold gap-2"
          size="sm"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>

      {/* Policy Card */}
      <div
        ref={cardRef}
        className="rounded-3xl border bg-white text-foreground shadow-xl overflow-hidden"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-primary to-indigo-600 p-8 md:p-10 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">Official Policy Document</p>
              <h2 className="font-bold text-2xl md:text-3xl">{policyData.title}</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">18 Sections</span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Multi-Stage Process</span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Last Updated: {policyData.lastUpdated}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 md:p-10 space-y-8">
          {policyData.sections.map((section, idx) => (
            <motion.div
              key={section.number}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              viewport={{ once: true }}
              className="border-b border-border/40 pb-8 last:border-0 last:pb-0"
            >
              {/* Section Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  {section.icon}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-primary/50 uppercase tracking-widest block">Section {section.number}</span>
                  <h3 className="font-bold text-lg leading-tight">{section.title}</h3>
                </div>
              </div>

              {/* Content */}
              {section.content && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 ml-11">{section.content}</p>
              )}

              {/* Simple Bullets */}
              {section.bullets && (
                <ul className="ml-11 space-y-1.5 mb-3">
                  {section.bullets.map((b, bi) => (
                    <li key={bi} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {/* Extra text */}
              {(section as any).extra && (
                <p className="text-sm text-muted-foreground leading-relaxed ml-11 mt-2 italic">{(section as any).extra}</p>
              )}

              {/* Subsections */}
              {(section as any).subsections && (
                <div className="ml-11 grid sm:grid-cols-2 gap-4 mt-2">
                  {(section as any).subsections.map((sub: any, si: number) => (
                    <div key={si} className="rounded-2xl border bg-secondary/30 p-4">
                      <p className="font-bold text-xs text-primary/80 mb-2">{sub.title}</p>
                      <ul className="space-y-1">
                        {sub.points.map((p: string, pi: number) => (
                          <li key={pi} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="h-1 w-1 rounded-full bg-primary mt-1.5 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Step-by-step */}
              {(section as any).steps && (
                <div className="ml-11 space-y-3 mt-2">
                  {(section as any).steps.map((step: any, si: number) => (
                    <div key={si} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                        {si + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{step.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Decision Outcomes */}
              {(section as any).decisions && (
                <div className="ml-11 grid sm:grid-cols-2 gap-3 mt-2">
                  {(section as any).decisions.map((d: any, di: number) => (
                    <div key={di} className={`rounded-2xl border p-4 ${d.color}`}>
                      <p className="font-bold text-sm mb-1">{d.outcome}</p>
                      <p className="text-xs leading-relaxed opacity-80">{d.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Timelines */}
              {(section as any).timelines && (
                <div className="ml-11 mt-2 rounded-2xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary/50">
                        <th className="text-left px-4 py-2 font-bold text-xs uppercase tracking-wide text-muted-foreground">Stage</th>
                        <th className="text-left px-4 py-2 font-bold text-xs uppercase tracking-wide text-muted-foreground">Typical Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(section as any).timelines.map((t: any, ti: number) => (
                        <tr key={ti} className="border-t border-border/30">
                          <td className="px-4 py-2.5 text-sm font-medium">{t.stage}</td>
                          <td className="px-4 py-2.5 text-sm text-muted-foreground">{t.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}

          {/* Footer of card */}
          <div className="mt-6 pt-6 border-t border-dashed text-center">
            <p className="text-xs text-muted-foreground/60 font-medium">
              This document is an official policy of the platform and is subject to periodic review and update.
              <br />For queries, contact the editorial team via the Support page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
