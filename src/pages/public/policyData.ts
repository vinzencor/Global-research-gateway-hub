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

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISHING POLICY & ETHICS CHARTER
// ─────────────────────────────────────────────────────────────────────────────
export const publishingEthicsPolicy: PolicyDoc = {
  title: "Publishing Policy & Ethics Charter",
  subtitle: "Principles, responsibilities, and enforceable standards for all published content.",
  badge: "Ethics Charter Document",
  lastUpdated: "January 2025",
  filename: "Publishing-Policy-and-Ethics-Charter",
  sections: [
    {
      number: "1",
      title: "Statement of Purpose",
      body: "This charter defines the principles, responsibilities, and enforceable standards governing all content published on the platform. It applies to Authors, Reviewers, Editors, Members, and Platform Administrators.",
      bullets: ["Accurate", "Credible", "Ethically produced", "Professionally reviewed"],
    },
    {
      number: "2",
      title: "Core Ethical Principles",
      subsections: [
        { title: "2.1 Integrity", bullets: ["Truthful", "Original", "Free from manipulation"] },
        { title: "2.2 Transparency", bullets: ["Clear attribution of authorship", "Disclosure of review participation", "Visibility of editorial decisions"] },
        { title: "2.3 Accountability", bullets: ["Submission, review, and publication are logged, traceable, and auditable"] },
        { title: "2.4 Fairness", bullets: ["Evaluated on merit, quality, and relevance — not identity, affiliation, or bias"] },
        { title: "2.5 Confidentiality", bullets: ["Unpublished content may not be shared, reused, or discussed externally"] },
      ],
    },
    {
      number: "3",
      title: "Authorship Policy",
      subsections: [
        { title: "3.1 Authorship Criteria", bullets: ["Made a significant intellectual contribution", "Approved the final submission", "Accepts responsibility for the content"] },
        { title: "3.2 Prohibited Practices", bullets: ["Ghostwriting", "Honorary authorship", "Undisclosed contributors"], tags: ["Strictly prohibited"] },
        { title: "3.3 Author Responsibility", bullets: ["Accuracy of claims", "Data integrity", "Proper citation"] },
      ],
    },
    {
      number: "4",
      title: "Plagiarism & Originality Policy",
      subsections: [
        { title: "4.1 Zero-Tolerance Policy", bullets: ["Direct plagiarism", "Paraphrased plagiarism without attribution", "Duplicate submissions"], tags: ["Zero tolerance"] },
        { title: "4.2 Detection & Action", bullets: ["All submissions may be screened", "If detected → submission rejected immediately", "Author may be suspended or banned"] },
      ],
    },
    {
      number: "5",
      title: "Data Integrity & Research Ethics",
      body: "Authors must ensure data is accurate and verifiable, with no fabrication or falsification and transparent methodologies.",
      subsections: [
        { title: "Prohibited", bullets: ["Manipulated results", "Selective reporting", "Misleading conclusions"] },
      ],
    },
    {
      number: "6",
      title: "Conflict of Interest Policy",
      subsections: [
        { title: "6.1 Mandatory Disclosure", bullets: ["Financial interests", "Institutional affiliations", "Personal relationships"] },
        { title: "6.2 Reviewer Conflicts", bullets: ["Must decline if personally knowing the author", "Must decline if recently collaborated", "Must decline if competing interests exist"] },
        { title: "6.3 Editorial Conflicts", bullets: ["Editors must recuse themselves where bias may exist"] },
      ],
    },
    {
      number: "7",
      title: "Peer Review Ethics",
      subsections: [
        { title: "7.1 Reviewer Obligations", bullets: ["Provide objective evaluation", "Maintain confidentiality", "Avoid bias"] },
        { title: "7.2 Misconduct by Reviewers", bullets: ["Using unpublished content", "Delaying reviews intentionally", "Non-constructive feedback"], tags: ["Consequences: removal & blacklisting"] },
      ],
    },
    {
      number: "8",
      title: "Editorial Responsibility",
      body: "Editors are responsible for fair decision-making, reviewer selection, and ethical compliance.",
      subsections: [
        { title: "Editors must", bullets: ["Avoid bias", "Ensure transparency", "Justify decisions"] },
      ],
    },
    {
      number: "9",
      title: "Publication Integrity",
      subsections: [
        { title: "9.1 Acceptance Criteria", bullets: ["Meets quality thresholds", "Passes ethical checks", "Completes review process"] },
        { title: "9.2 Transparency in Publication", bullets: ["Author names", "Reviewer attribution (optional)", "Review status"] },
      ],
    },
    {
      number: "10",
      title: "Retraction & Correction Policy",
      subsections: [
        { title: "10.1 Retraction Conditions", bullets: ["Plagiarism discovered", "Data found to be false", "Ethical violations confirmed"] },
        { title: "10.2 Correction Policy", bullets: ["Minor issues may result in corrections or updated versions"] },
        { title: "10.3 Retraction Transparency", bullets: ["Retracted content remains visible (if required)", "Clearly marked as retracted"] },
      ],
    },
    {
      number: "11",
      title: "Misconduct & Violations",
      subsections: [
        { title: "11.1 Types", bullets: ["Plagiarism", "Data fabrication", "Undisclosed conflicts", "Reviewer bias", "Misuse of platform"] },
        {
          title: "11.2 Severity Levels",
          table: {
            headers: ["Level", "Description", "Action"],
            rows: [["Minor", "Formatting / minor errors", "Warning"], ["Moderate", "Policy violations", "Suspension"], ["Severe", "Ethical breach", "Ban"]],
          },
        },
      ],
    },
    {
      number: "12",
      title: "Enforcement Framework",
      body: "Enforcement is consistent, documented, and non-negotiable.",
      bullets: ["Reject submissions", "Suspend accounts", "Permanently ban users", "Remove content"],
    },
    {
      number: "13",
      title: "Appeals Process",
      subsections: [
        { title: "13.1 Eligibility", bullets: ["Clear evidence of error", "Process violation occurred"] },
        { title: "13.2 Process", bullets: ["Submission of appeal", "Internal review", "Final decision"], tags: ["All appeal decisions are binding and final"] },
      ],
    },
    {
      number: "14",
      title: "Intellectual Property & Usage",
      subsections: [
        { title: "14.1 Ownership", bullets: ["Authors retain ownership unless otherwise specified"] },
        { title: "14.2 Platform Rights", bullets: ["Host", "Display", "Distribute content"] },
        { title: "14.3 User Restrictions", bullets: ["Must not redistribute paid content", "Must not misuse intellectual property"] },
      ],
    },
    {
      number: "15",
      title: "Confidentiality & Data Protection",
      bullets: ["Secure data handling", "Restricted access", "Privacy compliance"],
    },
    { number: "16", title: "Platform Neutrality", body: "The platform does not endorse individual content and ensures neutrality in all publishing decisions." },
    { number: "17", title: "Continuous Improvement", body: "Policies are periodically reviewed, updated as needed, and aligned with evolving standards." },
    { number: "18", title: "Compliance Requirement", body: "By using the platform, all participants agree to comply with all policies, adhere to ethical standards, and accept enforcement actions." },
    { number: "19", title: "Final Statement", body: "This charter ensures the platform operates as a credible, accountable, and high-quality publishing ecosystem. All participants contribute to maintaining its integrity." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EDITORIAL & DECISION FRAMEWORK
// ─────────────────────────────────────────────────────────────────────────────
export const editorialDecisionPolicy: PolicyDoc = {
  title: "Editorial & Decision Framework",
  subtitle: "Governing how submissions are evaluated, reviewed, decided, and approved for publication.",
  badge: "Editorial Framework Document",
  lastUpdated: "January 2025",
  filename: "Editorial-and-Decision-Framework",
  sections: [
    {
      number: "1",
      title: "Overview",
      body: "This framework governs how submissions are evaluated, reviewed, decided, and approved for publication. All decisions are structured, consistent, defensible, and auditable. No content is published without passing through this framework.",
    },
    {
      number: "2",
      title: "Editorial Hierarchy",
      subsections: [
        {
          title: "2.1 Roles & Authority Levels",
          table: {
            headers: ["Role", "Authority"],
            rows: [["Reviewer", "Evaluation & scoring"], ["Senior Reviewer (optional)", "Secondary validation"], ["Editor", "Decision-making authority"], ["Chief Editor / Super Admin", "Final override authority"]],
          },
        },
        { title: "2.2 Decision Ownership", bullets: ["Reviewers → recommend", "Editors → decide", "Chief Editor → override (rare cases)"] },
      ],
    },
    {
      number: "3",
      title: "End-to-End Decision Flow",
      subsections: [
        { title: "Step 1: Submission Intake", bullets: ["Author submits content", "System performs validation", "Editor performs initial screening"] },
        { title: "Step 2: Initial Editorial Screening", bullets: ["Evaluates relevance, structure, plagiarism risk, minimum quality"], tags: ["Desk Reject if low quality / incomplete / irrelevant"] },
        { title: "Step 3: Reviewer Assignment", bullets: ["1–3 reviewers assigned", "Criteria: expertise match, availability, performance score"] },
        { title: "Step 4: Review Phase", bullets: ["Reviewers submit scores, comments, and recommendation"] },
        { title: "Step 5: Decision Aggregation", bullets: ["Editor consolidates reviewer scores, comments, and quality thresholds"] },
        { title: "Step 6: Editorial Decision", bullets: ["Final decision issued by Editor"] },
      ],
    },
    {
      number: "4",
      title: "Decision Logic Model",
      subsections: [
        {
          title: "4.1 Weighted Scoring System",
          table: {
            headers: ["Factor", "Weight"],
            rows: [["Reviewer Score", "60%"], ["Editor Evaluation", "30%"], ["Submission Quality Indicators", "10%"]],
          },
        },
        { title: "4.2 Multi-Reviewer Averaging", body: "Final Score = Average of reviewer scores weighted by reviewer credibility." },
        {
          title: "4.3 Reviewer Credibility Weight",
          table: {
            headers: ["Reviewer Level", "Weight"],
            rows: [["High-rated (>4.5)", "1.2×"], ["Average (3.5–4.5)", "1.0×"], ["Low (<3.5)", "0.8×"]],
          },
        },
      ],
    },
    {
      number: "5",
      title: "Decision Thresholds",
      table: {
        headers: ["Final Score", "Decision"],
        rows: [["≥ 135", "Accept"], ["115–134", "Minor Revision"], ["95–114", "Major Revision"], ["70–94", "Conditional Reject"], ["< 70", "Reject"]],
      },
    },
    {
      number: "6",
      title: "Editorial Override Conditions",
      body: "Editor may override if: reviewer bias detected, scoring inconsistency, strong disagreement, or ethical concerns arise.",
      subsections: [
        { title: "Override Rules", bullets: ["Must be documented", "Must include justification", "Logged in audit system"] },
      ],
    },
    {
      number: "7",
      title: "Conflict Resolution Mechanism",
      subsections: [
        {
          title: "7.1 Reviewer Disagreement",
          table: {
            headers: ["Scenario", "Action"],
            rows: [["Score difference >25%", "Assign additional reviewer"], ["Conflicting recommendations", "Editor evaluates manually"]],
          },
        },
        { title: "7.2 Tie-Breaking", bullets: ["Editor decision is final", "May consult Senior Reviewer"] },
      ],
    },
    {
      number: "8",
      title: "Revision Cycle Framework",
      subsections: [
        { title: "8.1 Minor Revision", bullets: ["Small corrections", "No re-review required"] },
        { title: "8.2 Major Revision", bullets: ["Structural changes", "Re-review required"] },
        { title: "8.3 Revision Limits", bullets: ["Maximum 2 major revision cycles"], tags: ["Failure to comply → rejection"] },
        { title: "8.4 Author Response Requirement", bullets: ["Respond to each reviewer comment", "Provide change summary"] },
      ],
    },
    {
      number: "9",
      title: "Desk Rejection Policy",
      body: "Submissions may be rejected without review if: low quality, incomplete, plagiarism detected, or irrelevant topic.",
      subsections: [
        { title: "Benefits", bullets: ["Reduces reviewer workload", "Improves system efficiency"] },
      ],
    },
    {
      number: "10",
      title: "Ethical Escalation Protocol",
      body: "Triggered when plagiarism suspected, data manipulation detected, or conflict of interest identified.",
      subsections: [
        { title: "Actions", bullets: ["Immediate hold", "Internal investigation", "Decision: reject / blacklist / escalate"] },
      ],
    },
    {
      number: "11",
      title: "Publication Approval Rules",
      bullets: ["✔ Approved status", "✔ All revisions completed", "✔ Ethical compliance verified", "✔ Metadata complete"],
    },
    {
      number: "12",
      title: "Audit & Traceability",
      body: "Every step is logged: submission timestamp, reviewer assignment, review submission, editorial decision, publication date.",
      subsections: [
        { title: "Audit ensures", bullets: ["Accountability", "Transparency", "Dispute resolution"] },
      ],
    },
    {
      number: "13",
      title: "Appeals Framework",
      subsections: [
        { title: "13.1 Author Appeals", bullets: ["Allowed only if strong justification provided", "Factual error in review"] },
        { title: "13.2 Process", bullets: ["Secondary editorial review", "Optional new reviewer assignment", "Final decision issued"], tags: ["Appeal decision is binding and final"] },
      ],
    },
    {
      number: "14",
      title: "Reviewer Accountability in Decisions",
      body: "Reviewer influence depends on score consistency, past accuracy, and quality of feedback.",
      subsections: [
        { title: "Poor Reviewer Impact", bullets: ["Reduced weighting", "Removal from system"] },
      ],
    },
    {
      number: "15",
      title: "Editorial Performance Metrics",
      bullets: ["Decision consistency", "Turnaround time", "Rejection accuracy", "Reviewer management"],
    },
    {
      number: "16",
      title: "Time-Based SLAs",
      table: {
        headers: ["Stage", "Timeline"],
        rows: [["Initial Screening", "2–3 days"], ["Review Assignment", "2 days"], ["Review Completion", "7–14 days"], ["Decision", "3–5 days"], ["Revision Review", "7–10 days"]],
      },
    },
    {
      number: "17",
      title: "System Integrity Safeguards",
      bullets: ["Blind review (optional)", "Reviewer anonymity controls", "Duplicate detection", "Audit logs"],
    },
    {
      number: "18",
      title: "Publication Integrity Enforcement",
      bullets: ["Platform may retract content", "Issue corrections", "Flag disputed work"],
    },
    {
      number: "19",
      title: "Final Decision Authority",
      body: "Final authority lies with the Editor (primary) and Chief Editor (override only). No automated system can publish without editorial approval.",
    },
    {
      number: "20",
      title: "Final Declaration",
      body: "All participants agree: decisions are based on structured evaluation, editorial authority is final, and compliance is mandatory.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSION CHECKLIST
// ─────────────────────────────────────────────────────────────────────────────
export const submissionChecklistPolicy: PolicyDoc = {
  title: "Submission Checklist",
  subtitle: "Mandatory pre-submission validation framework all authors must complete before submitting content.",
  badge: "Author Submission Guide",
  lastUpdated: "January 2025",
  filename: "Submission-Checklist",
  sections: [
    {
      number: "1",
      title: "Overview",
      body: "This checklist serves three purposes: ensure submissions meet minimum quality thresholds, reduce rejection rates during initial screening, and standardize content quality. Submissions failing this checklist may be rejected immediately, returned without review, or flagged for revision.",
    },
    {
      number: "2",
      title: "Submission Gatekeeping Logic",
      body: "Before submission, the system evaluates:",
      bullets: ["Structure completeness", "Content quality indicators", "Ethical compliance", "Formatting standards", "Citation strength"],
      tags: ["Only submissions passing minimum thresholds proceed to review"],
    },
    {
      number: "A",
      title: "Section A — Author & Profile Validation",
      subsections: [
        { title: "Mandatory Checks", bullets: ["✔ Full name provided", "✔ Valid email address", "✔ Affiliation / Organization listed", "✔ Designation specified", "✔ Country specified", "✔ Profile completed (minimum 80%)"] },
        { title: "Disqualifiers", bullets: ["✘ Fake or unverifiable identity", "✘ Incomplete profile", "✘ Missing affiliation (for research papers)"] },
      ],
    },
    {
      number: "B",
      title: "Section B — Document Structure Validation",
      subsections: [
        { title: "Required Sections", bullets: ["✔ Title", "✔ Abstract", "✔ Keywords", "✔ Introduction", "✔ Problem Statement", "✔ Literature Review / Context", "✔ Methodology / Approach", "✔ Analysis / Findings", "✔ Discussion", "✔ Conclusion", "✔ References"] },
        { title: "Structure Quality Checks", bullets: ["✔ Logical flow between sections", "✔ No section duplication", "✔ Clear headings hierarchy"] },
        { title: "Automatic Rejection Triggers", bullets: ["✘ Missing core sections", "✘ Abstract too short (<100 words)", "✘ No references"] },
      ],
    },
    {
      number: "C",
      title: "Section C — Content Quality Self-Assessment",
      subsections: [
        { title: "C.1 Originality", bullets: ["✔ Original work", "✔ Not published elsewhere", "✔ Not under review elsewhere"], tags: ["Fail: ✘ Any duplication detected"] },
        { title: "C.2 Technical Depth", bullets: ["✔ Structured reasoning", "✔ Models / frameworks / data included", "✔ Domain expertise demonstrated"], tags: ["Fail: ✘ Generic or superficial content"] },
        { title: "C.3 Clarity", bullets: ["✔ Clearly written", "✔ No ambiguity", "✔ Logical progression"] },
        { title: "C.4 Problem Definition", bullets: ["✔ Clearly defined", "✔ Relevant", "✔ Non-trivial"] },
        { title: "C.5 Solution Strength", bullets: ["✔ Approach well explained", "✔ Justification provided", "✔ Limitations acknowledged"] },
      ],
    },
    {
      number: "D",
      title: "Section D — Citation & Reference Validation",
      subsections: [
        {
          title: "Minimum Reference Requirements",
          table: {
            headers: ["Type", "Minimum References"],
            rows: [["Research Paper", "25"], ["Review Paper", "40"], ["Technical Paper", "15"], ["Article", "5"]],
          },
        },
        { title: "Quality Checks", bullets: ["✔ Majority from credible sources", "✔ Recent references included", "✔ Proper citation format"] },
        { title: "Red Flags", bullets: ["✘ No citations", "✘ Majority low-quality sources", "✘ Excessive self-citation (>20%)"] },
      ],
    },
    {
      number: "E",
      title: "Section E — Ethical Compliance",
      subsections: [
        { title: "Mandatory Declarations", bullets: ["✔ No plagiarism", "✔ No fabricated data", "✔ No copyright violation", "✔ All authors contributed"] },
        { title: "Conflict of Interest", bullets: ["✔ Disclosed (if applicable)", "✔ No undisclosed bias"] },
        { title: "Disqualifiers", bullets: ["✘ Plagiarism detected", "✘ Undisclosed conflicts", "✘ Misleading data"] },
      ],
    },
    {
      number: "F",
      title: "Section F — Formatting & Technical Validation",
      subsections: [
        { title: "Document Standards", bullets: ["✔ Clean formatting", "✔ Consistent headings", "✔ Proper spacing"] },
        { title: "Figures & Tables", bullets: ["✔ Clearly labeled", "✔ Referenced in text", "✔ High quality"] },
        { title: "Metadata Completeness", bullets: ["✔ Title", "✔ Abstract", "✔ Keywords", "✔ Author details"] },
      ],
    },
    {
      number: "G",
      title: "Section G — Review Readiness Check",
      subsections: [
        { title: "Authors must confirm", bullets: ["✔ Ready for expert review", "✔ All sections complete", "✔ Feedback is welcome"] },
        { title: "Common Rejection Indicators", bullets: ["✘ Draft-level content", "✘ Incomplete reasoning", "✘ Poor language quality"] },
      ],
    },
    {
      number: "H",
      title: "Section H — Self-Scoring",
      subsections: [
        {
          title: "Score Your Paper (1–10 each)",
          table: {
            headers: ["Criteria", "Score (1–10)"],
            rows: [["Originality", ""], ["Technical Depth", ""], ["Clarity", ""], ["Relevance", ""], ["Structure", ""], ["Citations", ""], ["Practical Value", ""]],
          },
        },
        {
          title: "Score Interpretation",
          table: {
            headers: ["Score", "Meaning"],
            rows: [["8–10", "Strong submission"], ["6–7", "Needs improvement"], ["< 6", "Likely rejection"]],
          },
        },
        { title: "Minimum Submission Threshold", bullets: ["✔ Average score ≥ 7 to proceed", "✘ < 7 → revise before submission"] },
      ],
    },
    {
      number: "I",
      title: "Section I — Final Validation Checklist",
      bullets: ["✔ All sections complete", "✔ Content proofread", "✔ References verified", "✔ Formatting clean", "✔ Ethical compliance ensured", "✔ Self-score ≥ 7"],
    },
    {
      number: "J",
      title: "Section J — Author Declaration",
      bullets: ["This work is original", "All data is accurate", "All authors approve submission", "Guidelines have been followed", "Submission is ready for review"],
    },
    {
      number: "13",
      title: "Automated System Actions",
      subsections: [
        { title: "Pass", bullets: ["→ Sent to review queue"] },
        { title: "Partial Fail", bullets: ["→ Returned with required fixes"] },
        { title: "Fail", bullets: ["→ Rejected before review"] },
      ],
    },
    {
      number: "14",
      title: "Quality Control Impact",
      body: "This checklist ensures:",
      bullets: ["60–80% reduction in low-quality submissions", "Faster review cycles", "Higher acceptance quality", "Better reviewer experience"],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWER HANDBOOK
// ─────────────────────────────────────────────────────────────────────────────
export const reviewerHandbookPolicy: PolicyDoc = {
  title: "Reviewer Handbook",
  subtitle: "Roles, responsibilities, evaluation standards, scoring systems, and ethical obligations for all reviewers.",
  badge: "Reviewer Reference Document",
  lastUpdated: "January 2025",
  filename: "Reviewer-Handbook",
  sections: [
    {
      number: "1",
      title: "Overview",
      body: "The Reviewer Handbook defines the roles, responsibilities, evaluation standards, scoring systems, and ethical obligations of reviewers on the platform. All reviews are structured, auditable, and performance-tracked.",
      bullets: ["Maintaining content quality", "Ensuring technical accuracy", "Validating originality and contribution", "Strengthening publications before release"],
    },
    {
      number: "2",
      title: "Role of a Reviewer",
      body: "A reviewer is responsible for objectively evaluating submitted content, identifying strengths and weaknesses, recommending improvements, and advising editorial decisions.",
      tags: ["A reviewer is not responsible for rewriting the paper — but must provide clear, actionable feedback"],
    },
    {
      number: "3",
      title: "Reviewer Eligibility & Onboarding",
      subsections: [
        { title: "3.1 Minimum Requirements", bullets: ["Have domain expertise", "Demonstrate prior work (publications or industry experience)", "Maintain a verified profile"] },
        { title: "3.2 Profile Requirements", bullets: ["Full Name", "Affiliation / Organization", "Designation", "Country", "ORCID / LinkedIn / Scholar (preferred)", "Expertise Areas (minimum 3–5)", "Keywords (5–10)"] },
        { title: "3.3 Approval Process", bullets: ["Status: Pending → Approved → Suspended"], tags: ["Approval granted by Admin/Editor after evaluation"] },
      ],
    },
    {
      number: "4",
      title: "Review Assignment Workflow",
      subsections: [
        { title: "Step 1: Invitation", bullets: ["Reviewer receives: Title, Abstract, Keywords, Deadline, Conflict of interest declaration"] },
        { title: "Step 2: Decision", bullets: ["Accept", "Decline (with reason: Outside expertise / Conflict of interest / Time constraints)", "Request Extension"] },
        { title: "Step 3: Conflict of Interest Declaration", bullets: ["No personal or professional conflict", "No recent collaboration with authors", "Ability to remain unbiased"], tags: ["Failure to disclose = serious violation"] },
      ],
    },
    {
      number: "5",
      title: "Review Evaluation Framework",
      body: "All reviews must follow a structured evaluation model.",
      subsections: [
        {
          title: "5.1 Core Evaluation Criteria (Scored 1–10)",
          table: {
            headers: ["Category", "Description"],
            rows: [
              ["Originality", "Novelty and uniqueness"],
              ["Relevance", "Importance to the field"],
              ["Technical Depth", "Engineering / analytical rigor"],
              ["Research Quality", "Methodological soundness"],
              ["Literature Integration", "Use of references"],
              ["Problem Definition", "Clarity of problem"],
              ["Solution Strength", "Quality of approach"],
              ["Evidence & Validation", "Data / proof"],
              ["Clarity of Writing", "Readability"],
              ["Structure", "Logical organization"],
              ["Practical Application", "Real-world value"],
              ["Innovation Impact", "Potential influence"],
              ["Citation Potential", "Likelihood of being cited"],
              ["Journal Fit", "Alignment with platform"],
            ],
          },
        },
        {
          title: "5.2 Advanced Technical Evaluation",
          table: {
            headers: ["Category", "Description"],
            rows: [
              ["Conceptual Framework", "Strength of theory"],
              ["Systems Design", "Architecture quality"],
              ["Scalability", "Enterprise applicability"],
              ["Reliability", "Handling failures"],
              ["Security", "Risk awareness"],
              ["Compliance", "Regulatory alignment"],
              ["Automation", "Modern practices"],
              ["Future Scope", "Research potential"],
            ],
          },
        },
        { title: "5.3 Research Rigor Indicators", bullets: ["Hypothesis Strength", "Methodological Rigor", "Analytical Depth", "Data Integrity", "Replicability"] },
      ],
    },
    {
      number: "6",
      title: "Scoring System",
      subsections: [
        { title: "6.1 Total Score Calculation", body: "Total Score: /150. Average Score derived across all categories." },
        {
          title: "6.2 Score Interpretation",
          table: {
            headers: ["Score Range", "Outcome"],
            rows: [["135–150", "Exceptional"], ["115–134", "Strong Accept"], ["95–114", "Accept with Revisions"], ["70–94", "Major Revision"], ["< 70", "Reject"]],
          },
        },
      ],
    },
    {
      number: "7",
      title: "Review Structure (Mandatory Format)",
      subsections: [
        { title: "Section 1: Summary", bullets: ["Brief explanation of paper in reviewer's own words"] },
        { title: "Section 2: Strengths", bullets: ["Key contributions", "Strong aspects"] },
        { title: "Section 3: Weaknesses", bullets: ["Gaps", "Inconsistencies", "Missing elements"] },
        { title: "Section 4: Required Revisions", bullets: ["Clear, actionable instructions"] },
        { title: "Section 5: Comments to Authors", bullets: ["Constructive feedback"] },
        { title: "Section 6: Confidential Comments to Editor", bullets: ["Concerns not shared with author", "Ethical issues", "Plagiarism suspicion"] },
        { title: "Section 7: Final Recommendation", bullets: ["Accept", "Minor Revision", "Major Revision", "Reject"] },
      ],
    },
    {
      number: "8",
      title: "Reviewer Conduct & Ethics",
      subsections: [
        { title: "8.1 Confidentiality", bullets: ["Manuscripts must not be shared", "No external discussion"] },
        { title: "8.2 Objectivity", bullets: ["No bias", "No personal judgment of author"] },
        { title: "8.3 Integrity", bullets: ["No use of unpublished content", "No idea appropriation"] },
        { title: "8.4 Professional Behavior", bullets: ["Respectful language", "Constructive criticism"] },
      ],
    },
    {
      number: "9",
      title: "Timelines & Deadlines",
      subsections: [
        { title: "Standard Expectations", bullets: ["Accept/Decline: within 3 days", "Review submission: within 7–14 days"] },
        { title: "Late Reviews", bullets: ["Flagged automatically", "Repeated delays impact reviewer score"] },
      ],
    },
    {
      number: "10",
      title: "Reviewer Performance Metrics",
      body: "Each reviewer is evaluated based on:",
      subsections: [
        {
          title: "Performance Weights",
          table: {
            headers: ["Metric", "Weight"],
            rows: [["Review Quality", "40%"], ["Timeliness", "30%"], ["Editor Rating", "30%"]],
          },
        },
        { title: "10.1 Score Formula", body: "Reviewer Score = (Quality × 0.4) + (Timeliness × 0.3) + (Editor Rating × 0.3)" },
        {
          title: "10.2 Performance Categories",
          table: {
            headers: ["Score", "Status"],
            rows: [["> 4.5", "Top Reviewer"], ["3.5–4.5", "Active Reviewer"], ["< 3.5", "Under Review"], ["< 3.0", "Removal Risk"]],
          },
        },
      ],
    },
    {
      number: "11",
      title: "Reviewer Dashboard",
      bullets: ["Pending Invitations", "Active Reviews", "Completed Reviews", "Performance Metrics"],
    },
    {
      number: "12",
      title: "Multi-Round Review Process",
      body: "If revisions are required, reviewer receives revised manuscript, author responses, and change highlights.",
      subsections: [
        { title: "Reviewer must", bullets: ["Evaluate improvements", "Confirm compliance", "Submit final recommendation"] },
      ],
    },
    {
      number: "13",
      title: "Conflict of Interest Policy",
      body: "Reviewer must decline if: personal relationship with author, financial interest, or recent collaboration.",
      subsections: [
        { title: "Failure to Disclose Results In", bullets: ["Immediate removal", "Blacklist"], tags: ["Zero tolerance"] },
      ],
    },
    {
      number: "14",
      title: "Misconduct & Violations",
      subsections: [
        { title: "Violations include", bullets: ["Biased reviews", "Incomplete reviews", "Plagiarism oversight negligence", "Confidentiality breach"] },
        { title: "Penalties", bullets: ["Warning", "Suspension", "Permanent removal"] },
      ],
    },
    {
      number: "15",
      title: "Reviewer Recognition & Incentives",
      subsections: [
        { title: "Optional Recognition", bullets: ["Certificates", "Public recognition page"] },
        { title: "Reviewer Badges", bullets: ["Top Reviewer", "Fast Reviewer", "Outstanding Reviewer"] },
      ],
    },
    {
      number: "16",
      title: "Reviewer Database (Editor Tool)",
      body: "Editors can filter reviewers by:",
      bullets: ["Expertise", "Keywords", "Past reviews", "Performance score", "Availability"],
    },
    {
      number: "17",
      title: "Audit & Transparency",
      body: "All actions are logged: assignment, acceptance, submission, and decision.",
      subsections: [
        { title: "Ensures", bullets: ["Accountability", "Traceability"] },
      ],
    },
    {
      number: "18",
      title: "Final Declaration",
      body: "By accepting a review, the reviewer confirms:",
      bullets: ["No conflict of interest", "Confidentiality compliance", "Objective evaluation", "Adherence to timelines"],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTHOR GUIDELINES
// ─────────────────────────────────────────────────────────────────────────────
export const authorGuidelinesPolicy: PolicyDoc = {
  title: "Author Guidelines",
  subtitle: "Mandatory requirements, expectations, and evaluation criteria for all platform submissions.",
  badge: "Author Reference Document",
  lastUpdated: "January 2025",
  filename: "Author-Guidelines",
  sections: [
    {
      number: "1",
      title: "Overview",
      body: "The Author Guidelines define the mandatory requirements, expectations, and evaluation criteria for all submissions. All authors are required to comply fully. Submissions that fail to meet these standards will not proceed to review or publication.",
    },
    {
      number: "2",
      title: "Scope of Acceptable Submissions",
      subsections: [
        {
          title: "2.1 Accepted Content Types",
          table: {
            headers: ["Type", "Requirements"],
            rows: [
              ["Research Papers", "Original research with structured methodology; must demonstrate novelty"],
              ["Review Papers", "Comprehensive literature synthesis; must provide critical insights, not just summaries"],
              ["Technical Frameworks / White Papers", "Industry-focused, implementation-oriented; must include architecture or models"],
              ["Analytical Articles", "Insight-driven with structured reasoning; must go beyond opinion"],
            ],
          },
        },
        {
          title: "2.2 Subject Relevance",
          bullets: ["Align with defined platform domains", "Demonstrate clear relevance to the intended audience", "Address a defined problem, gap, or question"],
          tags: ["Generic, opinion-based without structure, or promotional submissions will be rejected"],
        },
      ],
    },
    {
      number: "3",
      title: "Mandatory Submission Structure",
      body: "All submissions must follow a strict structural format.",
      subsections: [
        {
          title: "3.1 Required Sections",
          bullets: [
            "1. Title — Clear, specific, descriptive; avoid vague phrasing",
            "2. Abstract (150–300 words) — Must include: problem, approach, key findings, conclusion",
            "3. Keywords (5–10) — Must reflect core themes; used for indexing",
            "4. Introduction — Background, problem framing, importance of topic",
            "5. Problem Statement — Clearly defined, specific, measurable where applicable",
            "6. Literature Review — Must reference relevant prior work; not superficial",
            "7. Methodology / Approach — Detailed, replicable or logically sound",
            "8. Analysis / Findings — Must include data (if applicable), reasoning, models or frameworks",
            "9. Discussion — Interpretation of findings, implications and limitations",
            "10. Conclusion — Clear summary of contributions; must not repeat abstract verbatim",
            "11. References — Properly formatted; must meet citation standards",
          ],
        },
        {
          title: "3.2 Optional Sections (Recommended)",
          bullets: ["Case Studies", "Diagrams / Architecture", "Appendices", "Supplementary Data"],
        },
      ],
    },
    {
      number: "4",
      title: "Content Quality Standards",
      subsections: [
        {
          title: "4.1 Originality",
          bullets: ["Entirely original", "Not published elsewhere", "Not under review elsewhere"],
          tags: ["Prohibited: plagiarism, AI-generated content without meaningful input, duplicate submissions"],
        },
        {
          title: "4.2 Technical Depth",
          bullets: ["Demonstrate domain understanding", "Include structured reasoning or analysis", "Avoid surface-level explanations"],
          tags: ["Insufficient depth indicators: generic explanations, no examples or models, no supporting references"],
        },
        { title: "4.3 Clarity & Readability", bullets: ["Logically structured", "Clear and professional language", "Avoid ambiguity and redundancy"] },
        { title: "4.4 Practical Value", bullets: ["Provide actionable insights", "Include real-world applications", "Demonstrate relevance beyond theory"] },
      ],
    },
    {
      number: "5",
      title: "Citation & Reference Standards",
      subsections: [
        {
          title: "5.1 Minimum Requirements",
          table: {
            headers: ["Content Type", "Minimum References"],
            rows: [["Research Paper", "25–50"], ["Review Paper", "40–80"], ["Technical Paper", "15–30"], ["Article", "5–15"]],
          },
        },
        {
          title: "5.2 Source Quality",
          bullets: ["Preferred: Peer-reviewed journals, IEEE / ACM / Elsevier, Government or institutional reports"],
          tags: ["Avoid: Blogs (unless critical), unverified sources, outdated references >10 years (unless foundational)"],
        },
        {
          title: "5.3 Citation Format",
          bullets: ["Accepted: IEEE or APA", "Must be consistent throughout", "Properly formatted and cross-referenced"],
        },
        { title: "5.4 Self-Citation Policy", bullets: ["Must not exceed 20% of total references", "Must be relevant"] },
      ],
    },
    {
      number: "6",
      title: "Ethical Standards",
      subsections: [
        { title: "6.1 Plagiarism Policy", bullets: ["Zero tolerance for direct copying, improper paraphrasing, citation omission"], tags: ["All submissions may be subject to plagiarism checks"] },
        { title: "6.2 Data Integrity", bullets: ["Ensure data accuracy", "Avoid manipulation", "Provide sources where applicable"] },
        { title: "6.3 Conflict of Interest", bullets: ["Disclose financial interests", "Disclose affiliations", "Disclose relationships that may bias the work"] },
        { title: "6.4 Authorship Integrity", bullets: ["All listed authors must have contributed significantly", "All authors must approve the final submission"], tags: ["Ghostwriting and honorary authorship are prohibited"] },
      ],
    },
    {
      number: "7",
      title: "Formatting & Technical Requirements",
      subsections: [
        { title: "7.1 Document Format", bullets: ["PDF or structured editor submission", "Clear headings and hierarchy", "Standard fonts and spacing"] },
        { title: "7.2 Figures & Tables", bullets: ["Must be high quality", "Properly labeled", "Referenced in text"] },
        { title: "7.3 Metadata Requirements", bullets: ["Title", "Abstract", "Keywords", "Author details", "Category"] },
      ],
    },
    {
      number: "8",
      title: "Submission Process",
      subsections: [
        {
          title: "8.1 Steps",
          bullets: ["1. Author submits manuscript", "2. Initial screening (format + compliance)", "3. Review assignment", "4. Review process", "5. Editorial decision", "6. Revision (if required)", "7. Final approval", "8. Publication"],
        },
        {
          title: "8.2 Screening Criteria",
          bullets: ["Structure is incomplete", "Plagiarism detected", "Topic is irrelevant", "Quality is insufficient"],
          tags: ["Submissions may be rejected before review if any condition is met"],
        },
      ],
    },
    {
      number: "9",
      title: "Review Outcomes",
      subsections: [
        {
          title: "Possible Decisions",
          table: {
            headers: ["Decision", "Condition"],
            rows: [["Accept", "Meets all standards"], ["Minor Revision", "Small improvements required"], ["Major Revision", "Significant changes required"], ["Reject", "Does not meet standards"]],
          },
        },
      ],
    },
    {
      number: "10",
      title: "Revision Policy",
      body: "Authors must respond to reviewer comments, submit revised versions within timelines, and clearly indicate changes made.",
      tags: ["Failure to revise may result in rejection"],
    },
    {
      number: "11",
      title: "Author Responsibilities Post-Publication",
      bullets: ["Accuracy of content", "Responding to corrections", "Addressing post-publication issues"],
    },
    {
      number: "12",
      title: "Enforcement & Penalties",
      body: "Violations may result in:",
      bullets: ["Immediate rejection", "Publication withdrawal", "Author suspension", "Permanent ban"],
      tags: ["Severe misconduct may be publicly documented"],
    },
    {
      number: "13",
      title: "Final Declaration",
      body: "By submitting content, the author confirms:",
      bullets: ["Originality of work", "Compliance with guidelines", "Willingness to undergo review", "Acceptance of editorial decisions"],
    },
  ],
};
