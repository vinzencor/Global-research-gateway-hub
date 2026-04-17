import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

const policies: Record<string, { title: string; updatedDate: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    updatedDate: "January 2025",
    sections: [
      {
        heading: "Introduction",
        body: "We are committed to protecting your personal data and handling user information responsibly, transparently, and securely. This Privacy Policy explains how we collect, use, store, and protect your information when you use our platform.",
      },
      {
        heading: "Information We Collect",
        body: "We collect information that you provide directly to us, including your name, email address, password, and profile details. We may also collect usage data, access logs, and device information when you interact with the platform.",
      },
      {
        heading: "How We Use Your Information",
        body: "We use your information to provide and improve the platform, process transactions, communicate with you about your account and membership, send relevant updates, and maintain security and integrity.",
      },
      {
        heading: "Data Retention",
        body: "We retain your personal data for as long as your account is active or as required to provide our services. You may request deletion of your data in accordance with applicable data protection regulations.",
      },
      {
        heading: "Your Rights",
        body: "Depending on your jurisdiction, you may have rights to access, correct, delete, or port your personal data. Contact our support team to make a data rights request.",
      },
      {
        heading: "Contact Us",
        body: "For any privacy-related questions or concerns, please contact us via the Support page or email us directly.",
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    updatedDate: "January 2025",
    sections: [
      {
        heading: "Acceptance of Terms",
        body: "By accessing and using this platform, you agree to comply with the terms governing content access, account use, digital purchases, and platform conduct. If you do not agree to these terms, you must not use the platform.",
      },
      {
        heading: "Account Responsibilities",
        body: "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must not share accounts or allow unauthorized access.",
      },
      {
        heading: "Content Access",
        body: "Access to content is governed by your subscription or purchase rights. Members may not share, redistribute, or reproduce content accessed through the platform in violation of applicable copyright and licensing terms.",
      },
      {
        heading: "Prohibited Conduct",
        body: "You must not engage in fraud, abuse, or any behavior that disrupts the platform or harms other users. The platform reserves the right to suspend or terminate accounts for violations.",
      },
      {
        heading: "Intellectual Property",
        body: "All platform content, design elements, and software are protected by intellectual property laws. You may not reproduce or use platform content without express permission.",
      },
      {
        heading: "Changes to Terms",
        body: "We may update these terms from time to time. Continued use of the platform after updates constitutes acceptance of the revised terms.",
      },
    ],
  },
  "membership-terms": {
    title: "Membership Terms",
    updatedDate: "January 2025",
    sections: [
      {
        heading: "Overview",
        body: "Membership plans, entitlements, renewals, billing conditions, and access rights are governed by the membership terms published on this platform. By purchasing a membership, you agree to these terms.",
      },
      {
        heading: "Plan Selection & Activation",
        body: "Membership is activated upon successful payment confirmation. The specific entitlements and access rights associated with your plan are defined at the point of purchase.",
      },
      {
        heading: "Renewals",
        body: "Memberships are subject to renewal at the end of each term. Renewal reminders will be communicated in advance. It is your responsibility to manage renewals through your account dashboard.",
      },
      {
        heading: "Changes to Plans",
        body: "We may modify, update, or discontinue membership plans with reasonable notice. Existing memberships will be honoured for the current billing period.",
      },
      {
        heading: "Account Requirements",
        body: "An active account is required to maintain membership access. Membership is non-transferable and tied to the account under which it was purchased.",
      },
      {
        heading: "Termination",
        body: "Membership may be terminated for violation of platform policies. In such cases, access rights will be revoked and refunds will be governed by the applicable Refund Policy.",
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    updatedDate: "January 2025",
    sections: [
      {
        heading: "Overview",
        body: "Refund eligibility, if applicable, is subject to the nature of the transaction, plan purchased, and platform policy. We encourage you to review your plan details before completing a purchase.",
      },
      {
        heading: "Eligibility",
        body: "Refunds may be considered in cases where content was inaccessible due to a platform error, or where a purchase was made in error and access has not been used. Requests must be submitted promptly after the purchase.",
      },
      {
        heading: "Non-Refundable Transactions",
        body: "Memberships that have been activated and accessed, pay-per-view content that has been downloaded, and purchases where the refund window has passed are generally not eligible for refunds.",
      },
      {
        heading: "Process",
        body: "To request a refund, contact our support team with your account details and transaction reference. All requests will be reviewed on a case-by-case basis.",
      },
      {
        heading: "Timeline",
        body: "Approved refunds will be processed within 7–14 business days, subject to your payment provider's processing times.",
      },
      {
        heading: "Contact",
        body: "For any refund-related enquiries, please reach out through the Support & Contact page.",
      },
    ],
  },
};

export default function PolicyPage() {
  const { type } = useParams<{ type: string }>();
  const policy = type ? policies[type] : null;

  if (!policy) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-24 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="font-heading text-2xl font-bold mb-2">Policy Not Found</h1>
          <p className="text-muted-foreground mb-6">The policy you are looking for does not exist.</p>
          <Link to="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-16">
        <div className="container relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
            <FileText className="h-4 w-4" />
            Platform Policy
          </div>
          <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight mb-4">{policy.title}</h1>
          <p className="text-muted-foreground text-sm">Last updated: {policy.updatedDate}</p>
        </div>
      </section>

      {/* Content */}
      <section className="container py-16">
        <div className="max-w-3xl mx-auto space-y-10">
          {policy.sections.map((section, i) => (
            <div key={i} className="space-y-3">
              <h2 className="font-heading text-xl font-bold">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.body}</p>
              {i < policy.sections.length - 1 && <div className="h-px bg-border mt-6" />}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-12 pb-24">
        <div className="max-w-3xl mx-auto rounded-3xl border bg-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading font-bold text-lg mb-1">Have Questions?</h3>
            <p className="text-sm text-muted-foreground">Our support team is here to help clarify any policy details.</p>
          </div>
          <Link to="/support">
            <Button className="rounded-full px-6 font-bold shrink-0">
              Contact Support <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
