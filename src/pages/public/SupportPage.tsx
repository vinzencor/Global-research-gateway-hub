import { useState } from "react";
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
    title: "Technical Assistance",
    description: "Support for login issues, account problems, or unexpected errors.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", type: "", message: "" });
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Your message has been sent. We will respond as soon as possible.");
      setFormData({ name: "", email: "", subject: "", type: "", message: "" });
    }, 1200);
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
            We are here to help with memberships, access, billing, digital library questions, and general platform enquiries.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-16 max-w-3xl mx-auto text-center">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Whether you need help with your account, have a billing question, want support with library access, or need assistance navigating the platform, our team is here to assist you.
        </p>
      </section>

      {/* Contact Categories */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {contactCategories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-3xl border bg-card p-6 hover:shadow-lg transition-all hover:border-primary/20"
              >
                <div className={`h-12 w-12 rounded-2xl ${cat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {cat.icon}
                </div>
                <h3 className="font-heading font-bold text-base mb-2 group-hover:text-primary transition-colors">{cat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Send Us a Message</h2>
            <p className="text-muted-foreground leading-relaxed">
              Complete the contact form and our team will respond to your enquiry as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input id="name" name="name" placeholder="Your full name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="Brief subject of your enquiry" value={formData.subject} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Enquiry Type</Label>
                <Select value={formData.type} onValueChange={val => setFormData(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select enquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Enquiry</SelectItem>
                    <SelectItem value="membership">Membership Support</SelectItem>
                    <SelectItem value="library">Digital Library Support</SelectItem>
                    <SelectItem value="technical">Technical Assistance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                <Textarea id="message" name="message" placeholder="Please describe your enquiry in detail..." rows={5} value={formData.message} onChange={handleChange} required />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          {/* Direct Contact Block + FAQ Prompt */}
          <div className="space-y-8">
            <div className="rounded-3xl border bg-card p-8 space-y-4">
              <h3 className="font-heading font-bold text-xl">Other Ways to Reach Us</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You may also contact the relevant team using the details provided below for faster support where applicable.
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
                Before contacting support, you may also wish to review our common questions related to membership, digital access, payments, and user accounts.
              </p>
              {[
                { q: "How do I access member-only content?", a: "Active members can access entitled library content through their account dashboard." },
                { q: "How do I renew my membership?", a: "Renewal options are available directly in your membership section within your account." },
                { q: "Where can I find my invoices?", a: "Invoices and payment history are available in the billing section of your account." },
                { q: "How do I reset my password?", a: "Use the Forgot Password link on the login page to receive a reset email." },
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
