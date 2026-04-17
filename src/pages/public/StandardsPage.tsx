import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, AlertTriangle, FileText } from "lucide-react";
import CompactPolicyCard from "./CompactPolicyCard";
import { standardsFrameworkPolicy } from "./policyData";
import PeerReviewPolicyCard from "./PeerReviewPolicyCard";

const sections = [
  {
    id: "s1",
    number: "Section 1",
    title: "Foundational Principles",
    body: null,
    points: [
      { title: "Integrity", desc: "All content must be original, verifiable, and free from manipulation, plagiarism, or misrepresentation." },
      { title: "Transparency", desc: "Authorship, review participation, and editorial decisions must be clearly attributable unless anonymity is explicitly enforced." },
      { title: "Accountability", desc: "Every action—submission, review, approval, publication—is logged and traceable." },
      { title: "Quality Control", desc: "Content must meet defined thresholds across structure, clarity, technical depth, and relevance." },
      { title: "Reproducibility & Verifiability", desc: "Where applicable, claims, data, and methodologies must be reproducible or logically defensible." },
    ],
  },
  {
    id: "s2",
    number: "Section 2",
    title: "Author Requirements & Responsibilities",
    body: null,
    subsections: [
      { title: "2.1 Eligibility Criteria", points: ["Demonstrate subject-matter familiarity", "Provide accurate professional identification", "Maintain a complete and verifiable profile", "Disclose affiliations and conflicts of interest"] },
      { title: "2.2 Content Standards — Originality", points: ["Must not be plagiarized, duplicated, or AI-spun without value addition", "Must contribute new insight, synthesis, or analysis", "Must align with platform domains and subject areas", "Must go beyond superficial explanation", "Must include structured reasoning, models, frameworks, or analysis"] },
      { title: "2.3 Citation Standards", points: ["Minimum reference count based on paper type", "Preference for high-impact sources (IEEE, ACM, Elsevier, etc.)", "Proper citation format (APA / IEEE depending on category)", "No excessive self-citation (>15–20%)"] },
      { title: "2.4 Ethical Requirements", points: ["Disclose conflicts of interest", "Avoid data fabrication or manipulation", "Ensure no copyright violations", "Avoid defamatory or misleading content"] },
      { title: "2.5 Accountability", points: ["Accuracy of content", "Claims made", "Data integrity", "Responding to reviewer feedback"] },
    ],
  },
  {
    id: "s3",
    number: "Section 3",
    title: "Publication Quality Standards",
    subsections: [
      { title: "3.1 Minimum Quality Threshold", points: ["Originality", "Clarity", "Technical depth", "Relevance", "Structure", "Citation strength"] },
      { title: "3.2 Classification of Content", points: ["Research Papers", "Review Papers", "Technical Frameworks", "White Papers", "Articles / Commentary"] },
      { title: "3.3 Review Requirement", points: ["Editorially reviewed", "Peer-reviewed (single or multi-reviewer)", "Exempt (only for announcements/news)"] },
      { title: "3.4 Display Transparency", points: ["Author(s)", "Reviewer(s)", "Review status (Reviewed / Peer Reviewed)", "Publication date", "Version history (if enabled)"] },
    ],
  },
  {
    id: "s4",
    number: "Section 4",
    title: "Reviewer Responsibilities & Evaluation Standards",
    subsections: [
      { title: "4.1 Eligibility", points: ["Have domain expertise", "Maintain an approved profile", "Declare conflicts of interest"] },
      { title: "4.2 Review Expectations", points: ["Structured: use defined evaluation criteria", "Provide scores and reasoning", "Objective: based on content quality, not author identity", "Constructive: provide actionable feedback"] },
      { title: "4.3 Mandatory Review Criteria", points: ["Originality", "Technical quality", "Clarity", "Methodology", "Relevance", "Citation strength"] },
      { title: "4.4 Reviewer Conduct", points: ["Maintain confidentiality", "Avoid bias", "Complete reviews within timelines", "Not misuse unpublished content"] },
    ],
  },
  {
    id: "s5",
    number: "Section 5",
    title: "Editor Roles & Decision Authority",
    subsections: [
      { title: "5.1 Responsibilities", points: ["Assigning reviewers", "Evaluating reviews", "Making final decisions", "Ensuring policy compliance"] },
      { title: "5.2 Decision Authority", points: ["Approve", "Request revisions", "Reject", "Escalate for further review"] },
      { title: "5.3 Decision Criteria", points: ["Reviewer recommendations", "Scoring thresholds", "Publication fit", "Ethical compliance"] },
    ],
  },
  {
    id: "s6",
    number: "Section 6",
    title: "Platform Governance & Operational Standards",
    subsections: [
      { title: "6.1 Content Governance", points: ["Role-based access control (RBAC)", "Structured workflows", "Approval gates before publishing"] },
      { title: "6.2 Moderation", points: ["Remove content", "Suspend accounts", "Enforce policy violations"] },
      { title: "6.3 Data & Storage Standards", points: ["Secure storage of documents and media", "Access-controlled downloads", "Audit logs for access and actions"] },
    ],
  },
  {
    id: "s7",
    number: "Section 7",
    title: "Member Conduct & Usage Policies",
    subsections: [
      { title: "7.1 Account Usage", points: ["Maintain accurate information", "Not share accounts", "Comply with access policies"] },
      { title: "7.2 Content Access", points: ["Not illegally distribute paid content", "Not bypass access controls", "Not misuse downloaded materials"] },
      { title: "7.3 Billing Integrity", points: ["Payments must be valid and traceable", "Fraudulent transactions lead to suspension"] },
    ],
  },
  {
    id: "s8",
    number: "Section 8",
    title: "Ethics, Compliance & Integrity Framework",
    subsections: [
      { title: "8.1 Plagiarism Policy — Zero tolerance for:", points: ["Direct plagiarism", "Paraphrased plagiarism without attribution", "Duplicate submissions"] },
      { title: "8.2 Conflict of Interest", points: ["Financial interests", "Institutional affiliations", "Personal relationships impacting objectivity"] },
      { title: "8.3 Misconduct Handling", points: ["Investigation", "Content removal", "Blacklisting of users"] },
      { title: "8.4 Retractions & Corrections", points: ["Errors must be corrected transparently", "Major violations result in retraction notices"] },
    ],
  },
  {
    id: "s9",
    number: "Section 9",
    title: "Technical Submission & Formatting Requirements",
    subsections: [
      { title: "9.1 Document Requirements", points: ["Structured formatting", "Clear headings", "Consistent citation format", "Readable layout"] },
      { title: "9.2 Media Standards", points: ["High-quality figures and tables", "Properly labeled diagrams", "No misleading visuals"] },
      { title: "9.3 Metadata Requirements", points: ["Title", "Abstract", "Keywords", "Author details", "Publication date"] },
    ],
  },
  {
    id: "s10",
    number: "Section 10",
    title: "Enforcement & Compliance Mechanism",
    subsections: [
      { title: "10.1 Monitoring", points: ["Submissions", "Reviews", "Publishing actions", "User behavior"] },
      { title: "10.2 Violations Handling", points: ["Minor (warnings)", "Moderate (restrictions)", "Severe (removal / bans)"] },
      { title: "10.3 Appeals Process", points: ["Request review of decisions", "Submit clarification or correction", "Escalate to editorial board"] },
    ],
  },
];

export default function StandardsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
            <Shield className="h-4 w-4" />
            Governance Framework
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Standards & Governance Framework
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A comprehensive set of publishing, review, ethical, and operational standards designed to ensure quality, credibility, and accountability across all content and participants.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-16 max-w-4xl mx-auto">
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>This platform operates under a structured and enforceable standards framework governing authors, reviewers, editors, publications, and members. These standards are designed to ensure that all published content meets defined expectations of quality, integrity, clarity, and relevance.</p>
              <p>Unlike open publishing environments, this platform enforces multi-layer validation, role-based accountability, and traceable review workflows to maintain consistency and trust.</p>
              <p className="font-medium text-foreground">All participants—whether authors, reviewers, editors, or members—are expected to adhere to these standards. Non-compliance may result in rejection, removal of content, suspension of privileges, or permanent restriction from the platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* All Sections */}
      <section className="container pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {sections.map((section, si) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              viewport={{ once: true }}
              className="rounded-3xl border bg-card p-8 space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">{section.number}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <h2 className="font-heading text-2xl font-bold">{section.title}</h2>
              
              {section.points && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {section.points.map((point, pi) => (
                    <div key={pi} className="rounded-2xl border bg-secondary/30 p-4">
                      <p className="font-bold text-sm mb-1">{point.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{point.desc}</p>
                    </div>
                  ))}
                </div>
              )}

              {section.subsections && (
                <div className="space-y-6">
                  {section.subsections.map((sub, si2) => (
                    <div key={si2}>
                      <h3 className="font-heading font-bold text-base mb-3 text-primary/80">{sub.title}</h3>
                      <ul className="space-y-2">
                        {sub.points.map((point, pi) => (
                          <li key={pi} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {/* Why Standards Matter */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary/20 bg-primary/5 p-8 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">Section 11</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <h2 className="font-heading text-2xl font-bold">Why These Standards Exist</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Without strong standards, publishing platforms degrade into content repositories with no quality assurance. These standards ensure that:
            </p>
            <ul className="space-y-2">
              {[
                "Readers trust what they read",
                "Authors are held to meaningful expectations",
                "Reviewers contribute value, not just formality",
                "Editors maintain consistency",
                "The platform builds long-term credibility",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              These are not optional guidelines—they are enforced rules designed to maintain a high-quality ecosystem.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Documents Section */}
      <section className="container pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Section divider header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="h-px flex-1 bg-border" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-card shadow-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Downloadable Policy Documents</span>
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Two-column grid — expands to full-width stacked on mobile */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Card 1 — Peer Review Policy (existing large card, wrapped in compact shell) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <PeerReviewPolicyCard />
            </motion.div>

            {/* Card 2 — Standards & Frameworks */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <CompactPolicyCard
                policy={standardsFrameworkPolicy}
                accentColor="from-violet-600 to-indigo-700"
              />
            </motion.div>
          </div>

          <p className="text-xs text-muted-foreground/50 text-center mt-8">
            More policy documents will be added here as they are published.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-8 pb-24">
        <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 md:p-16 text-center max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white leading-tight">
              Work Within a Structured and Credible Publishing Ecosystem
            </h2>
            <p className="text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
              Whether you are an author, reviewer, editor, or member, these standards define how the platform operates and how quality is maintained. By participating, you agree to uphold these principles and contribute to a system built on integrity and accountability.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/publications">
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full font-bold text-lg">
                  Explore Related Publications <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/support">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10">
                  Contact Us for Clarifications
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
