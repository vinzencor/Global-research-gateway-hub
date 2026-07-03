import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpCircle, Mail, MessageSquare, CreditCard, BookOpen, Settings, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supportApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const contactCategories = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "General Enquiries",
    description: "Questions about the platform, content, features, or partnerships.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Membership Support",
    description: "Help with plans, renewals, account access, and invoices.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Digital Library Support",
    description: "Assistance with access issues, entitlements, downloads, and content discovery.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: <Settings className="h-6 w-6" />,
    title: "Account Changes",
    description: "Request help updating your registered email or password.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ currentEmail: "", requestedEmail: "", passwordResetRequested: false, reason: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, currentEmail: user.email }));
    }
  }, [user?.email]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.currentEmail || !formData.reason) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setSending(true);
    try {
      await supportApi.createRequest({
        currentEmail: formData.currentEmail,
        requestedEmail: formData.requestedEmail || undefined,
        passwordResetRequested: formData.passwordResetRequested,
        reason: formData.reason,
      });
      toast.success("Your support request has been submitted.");
      setFormData({ currentEmail: user?.email || "", requestedEmail: "", passwordResetRequested: false, reason: "" });
    } catch (err: any) {
      toast.error(err?.message || "Could not submit support request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
            <Mail className="h-4 w-4" />
            Support & Contact
          </div>
          <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Support & Contact
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Submit an account support request if you need to change your registered email or reset your password.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-16 max-w-3xl mx-auto text-center space-y-6">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Use the form below to request an email update or password reset. Administrators review each request before making account changes.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Articles and News</strong> are items that the journal publishes for marketing purposes, either from our own archives, or new content that is intended to engage our audience.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Publications</strong> are items that go through the portal and vetting process, submitted by our patrons or researchers.
        </p>
      </section>

      {/* Contact Categories */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {contactCategories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-3xl border bg-card p-12 hover:shadow-2xl transition-all hover:border-primary/30 flex flex-col items-center text-center h-full min-h-[280px]"
              >
                <div className={`h-16 w-16 rounded-2xl ${cat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  {cat.icon}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors">{cat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Account Support Request</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tell us what needs to change and why. We will review and process the request if approved.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentEmail">Current Registered Email <span className="text-destructive">*</span></Label>
                <Input id="currentEmail" name="currentEmail" type="email" placeholder="you@example.com" value={formData.currentEmail} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedEmail">Requested New Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="requestedEmail" name="requestedEmail" type="email" placeholder="new-email@example.com" value={formData.requestedEmail} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name="passwordResetRequested"
                    checked={formData.passwordResetRequested}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border"
                  />
                  Password reset request
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for the request <span className="text-destructive">*</span></Label>
                <Textarea id="reason" name="reason" placeholder="Please explain why you need this change..." rows={5} value={formData.reason} onChange={handleChange} required />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={sending}>
                {sending ? "Sending..." : "Submit Support Request"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Direct Contact Block + FAQ Prompt */}
          <div className="space-y-8">
            <div className="rounded-3xl border bg-card p-8 space-y-4">
              <h3 className="font-heading font-bold text-xl">Other Ways to Reach Us</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You may also contact the support desk using the details provided below.
              </p>
              <a
                href="mailto:support@platform.org"
                className="flex items-center gap-3 p-4 rounded-2xl border bg-secondary/30 hover:border-primary/30 transition-all group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-sm">Email Support</p>
                  <p className="text-xs text-muted-foreground">support@platform.org</p>
                </div>
              </a>
            </div>

            <div className="rounded-3xl border bg-card p-8 space-y-4">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h3 className="font-heading font-bold text-xl">Need Quick Answers?</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Before submitting a request, review the most common account questions below.
              </p>
              {[
                { q: "How do I change my email address?", a: "Submit a support request with your current email and the new email you want to use." },
                { q: "How do I reset my password?", a: "Submit a support request and select the password reset option." },
                { q: "How long does review take?", a: "Requests are reviewed by administrators and processed after approval." },
                { q: "Can I log in with my old email after a change?", a: "No. The previous email remains reserved and only the latest email can be used to sign in." },
              ].map((item, i) => (
                <div key={i} className="border-t pt-4">
                  <p className="font-bold text-sm mb-1">{item.q}</p>
                  <p className="text-xs text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
