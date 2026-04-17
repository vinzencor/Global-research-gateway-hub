import type { PolicyDoc } from "./CompactPolicyCard";

export const standardsFrameworkPolicy: PolicyDoc = {
  title: "Standards & Frameworks",
  subtitle: "Platform governance, enforcement layers, and compliance architecture.",
  badge: "Governance Policy Document",
  lastUpdated: "January 2025",
  filename: "Standards-and-Frameworks-Policy",
  sections: [
    {
      number: "1",
      title: "Governance Statement",
      body: "This platform operates under a multi-layered Standards & Frameworks system governing content creation, submission validation, peer review, editorial decision-making, publication, and post-publication control. These frameworks are binding, enforceable, and continuously monitored. No content, user, or action exists outside this system.",
    },
    {
      number: "2",
      title: "Framework Architecture",
      body: "The platform is structured across five core enforcement layers:",
      subsections: [
        { title: "Layer 1 — Author Standards Framework", bullets: ["Eligibility", "Structure", "Content quality", "Ethical compliance"] },
        { title: "Layer 2 — Submission Validation Framework", bullets: ["Rejects non-compliant submissions", "Enforces minimum thresholds", "Reduces reviewer burden"] },
        { title: "Layer 3 — Review & Evaluation Framework", bullets: ["Structured scoring", "Objective assessment", "Measurable quality"] },
        { title: "Layer 4 — Editorial Decision Framework", bullets: ["Final decision logic", "Reviewer weighting", "Conflict resolution"] },
        { title: "Layer 5 — Ethics & Compliance Framework", bullets: ["Misconduct detection", "Penalties", "Retractions"] },
      ],
    },
    {
      number: "3",
      title: "Non-Negotiable Standards",
      body: "The following are absolute requirements:",
      subsections: [
        { title: "3.1 Structural Compliance", bullets: ["Follow defined format", "Include all mandatory sections", "Meet minimum completeness"], tags: ["Failure = automatic rejection"] },
        { title: "3.2 Quality Thresholds", bullets: ["Meet scoring benchmarks", "Demonstrate depth", "Include valid references"], tags: ["Failure = no review eligibility"] },
        { title: "3.3 Ethical Compliance", bullets: ["Zero tolerance for plagiarism", "No data manipulation", "No undisclosed conflicts"], tags: ["Violation = immediate enforcement action"] },
        { title: "3.4 Review Integrity", bullets: ["Reviews must be structured", "Reviews must be unbiased", "Reviews must be complete"], tags: ["Failure = review invalidation"] },
        { title: "3.5 Editorial Authority", bullets: ["Final decisions rest with the Editor", "Decisions are binding", "Decisions are not negotiable"] },
      ],
    },
    {
      number: "4",
      title: "Quantitative Quality Framework",
      body: "All submissions are evaluated using structured scoring models.",
      subsections: [
        {
          title: "4.1 Core Scoring (Mandatory)",
          table: {
            headers: ["Category", "Weight"],
            rows: [["Originality", "High"], ["Technical Depth", "High"], ["Clarity", "Medium"], ["Relevance", "High"], ["Structure", "Medium"], ["Citations", "Medium"]],
          },
        },
        {
          title: "4.2 Acceptance Thresholds",
          table: {
            headers: ["Score", "Outcome"],
            rows: [["≥ 135", "Accept"], ["115–134", "Minor Revision"], ["95–114", "Major Revision"], ["< 95", "Reject"]],
          },
        },
        { title: "4.3 Submission Gate Threshold", bullets: ["Self-score ≥ 7 (author stage)", "Pass all validation checks"], tags: ["Else → blocked"] },
      ],
    },
    {
      number: "5",
      title: "Enforcement Mechanisms",
      subsections: [
        { title: "5.1 Automated Controls", bullets: ["Submission validation", "Plagiarism detection", "Structure checks"] },
        { title: "5.2 Manual Controls", bullets: ["Reviewer evaluation", "Editorial screening", "Audit review"] },
        { title: "5.3 System Controls", bullets: ["Role-based permissions (RBAC)", "Action logging", "Decision traceability"] },
      ],
    },
    {
      number: "6",
      title: "Decision Control Framework",
      subsections: [
        {
          title: "6.1 Authority Model",
          table: {
            headers: ["Stage", "Authority"],
            rows: [["Submission", "System + Editor"], ["Review", "Reviewer"], ["Decision", "Editor"], ["Override", "Chief Editor"]],
          },
        },
        { title: "6.2 Decision Inputs", bullets: ["Reviewer scores", "Reviewer comments", "Editorial judgment", "Compliance status"] },
        { title: "6.3 Override Conditions", bullets: ["Reviewer inconsistency", "Ethical concern", "Scoring anomaly"], tags: ["Must be justified, documented & auditable"] },
      ],
    },
    {
      number: "7",
      title: "Conflict Resolution Framework",
      subsections: [
        { title: "Reviewer Conflicts", bullets: ["Reviewer must decline assignment"] },
        { title: "Reviewer Disagreement", bullets: ["Additional reviewer assigned"] },
        { title: "Editorial Conflict", bullets: ["Escalated to Chief Editor"] },
      ],
      tags: ["All conflicts resolved through structured escalation — not negotiation"],
    },
    {
      number: "8",
      title: "Review Governance Framework",
      subsections: [
        { title: "8.1 Mandatory Criteria", bullets: ["Originality", "Technical rigor", "Clarity", "Relevance", "Structure"] },
        { title: "8.2 Review Validity", bullets: ["All criteria scored", "Comments provided", "Recommendation justified"], tags: ["Invalid reviews are discarded"] },
        { title: "8.3 Reviewer Accountability", bullets: ["Reviewers are scored and monitored", "Performance is weighted"], tags: ["Low-quality reviewers → removed"] },
      ],
    },
    {
      number: "9",
      title: "Revision Governance",
      subsections: [
        {
          title: "9.1 Revision Types",
          table: { headers: ["Type", "Requirement"], rows: [["Minor", "No re-review"], ["Major", "Mandatory re-review"]] },
        },
        { title: "9.2 Revision Limits", bullets: ["Max 2 major revisions"], tags: ["Non-compliance → rejection"] },
        { title: "9.3 Author Obligations", bullets: ["Respond to each reviewer comment", "Justify all changes made"] },
      ],
    },
    {
      number: "10",
      title: "Publication Control Framework",
      bullets: ["Approved", "Fully compliant", "Ethical clearance verified", "Metadata complete"],
      tags: ["No Exceptions — no manual bypasses of review, approval, or compliance checks"],
    },
    {
      number: "11",
      title: "Post-Publication Governance",
      body: "The platform retains authority to issue corrections, retract content, and flag disputed work.",
      subsections: [
        { title: "Retraction Triggers", bullets: ["Plagiarism", "False data", "Ethical violation"] },
      ],
    },
    {
      number: "12",
      title: "Audit & Traceability Framework",
      body: "All actions are recorded — submission, review, decision, and publication.",
      subsections: [
        { title: "Audit Guarantees", bullets: ["Accountability", "Dispute resolution", "System integrity"] },
      ],
    },
    {
      number: "13",
      title: "Misconduct Framework",
      subsections: [
        {
          title: "13.1 Categories",
          table: {
            headers: ["Type", "Examples"],
            rows: [["Author Misconduct", "Plagiarism, fabrication"], ["Reviewer Misconduct", "Bias, confidentiality breach"], ["Editorial Misconduct", "Unfair decisions"]],
          },
        },
        {
          title: "13.2 Penalties",
          table: {
            headers: ["Severity", "Action"],
            rows: [["Minor", "Warning"], ["Moderate", "Suspension"], ["Severe", "Permanent Ban"]],
          },
        },
      ],
    },
    {
      number: "14",
      title: "System Integrity Controls",
      bullets: ["Access control (RBAC)", "Audit logs", "Review traceability", "Validation checkpoints"],
    },
    {
      number: "15",
      title: "Compliance Enforcement Rule",
      body: "All users must comply fully with frameworks, accept enforcement actions, and operate within defined boundaries.",
    },
    {
      number: "16",
      title: "Zero-Tolerance Violations",
      body: "Immediate action for:",
      bullets: ["Plagiarism", "Data falsification", "Identity fraud", "Reviewer misconduct"],
    },
    {
      number: "17",
      title: "Final Authority Statement",
      body: "The platform operates under centralized editorial authority. All decisions are final, binding, and not subject to negotiation.",
    },
    {
      number: "18",
      title: "Institutional Positioning Statement",
      body: "This Standards & Frameworks system ensures the platform operates as a structured publishing ecosystem, a controlled review environment, and a quality-driven knowledge system — not an open or unregulated content platform.",
    },
    {
      number: "19",
      title: "Final Declaration",
      body: "By participating in the platform, all users agree to adhere to all frameworks, maintain ethical standards, and accept enforcement outcomes.",
    },
  ],
};
