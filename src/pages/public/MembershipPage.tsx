import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Bell,
  Zap,
  Lock,
} from "lucide-react";

const benefits = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Expanded Content Access",
    description: "Gain access to member-entitled content and resources within the Digital Library.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Centralized Billing",
    description: "Track invoices, renewals, and payment history in one place.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Simplified Access",
    description: "Reduce friction when exploring premium resources and downloadable content.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "Member Dashboard Experience",
    description: "Manage your profile, membership status, purchases, and saved items through your account.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "Priority Communication",
    description: "Receive relevant updates, reminders, and important notifications related to your account and plan.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

const plans = [
  {
    title: "Student Plan",
    description: "Best suited for learners and early-stage professionals seeking guided access to essential resources.",
    badge: "Get Started",
    highlight: false,
  },
  {
    title: "Individual Plan",
    description: "Ideal for independent professionals and regular users who want broader access and a streamlined digital experience.",
    badge: "Most Popular",
    highlight: true,
  },
  {
    title: "Professional Plan",
    description: "Designed for advanced users, contributors, and high-engagement members who need deeper access and stronger platform value.",
    badge: "Full Access",
    highlight: false,
  },
];

const faqs = [
  {
    q: "What happens after I purchase a plan?",
    a: "Your membership is activated based on your successful payment, and your access is updated in your account.",
  },
  {
    q: "Can I renew my membership later?",
    a: "Yes. Renewal reminders and account-based billing visibility help you maintain uninterrupted access.",
  },
  {
    q: "Will I receive an invoice?",
    a: "Yes. Invoices and payment records are available within your membership and billing section.",
  },
  {
    q: "Does membership include library access?",
    a: "Access depends on the plan and entitlement structure attached to that plan.",
  },
];

export default function MembershipPage() {
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <CreditCard className="h-4 w-4" />
              Membership
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              Membership That Gives You More Access
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Choose a membership plan that fits your needs and unlock premium access, billing support, invoices, and a richer platform experience.
            </p>
            <Link to="/register">
              <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg group">
                Become a Member
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Membership Matters */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <h2 className="font-heading text-4xl font-bold tracking-tight">Why Membership Matters</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Membership is designed for users who want deeper access, better continuity, and a more valuable experience on the platform. Depending on your plan, membership can unlock access to digital library content, simplify purchases, centralize invoices, and provide a stronger long-term relationship with the platform.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl bg-primary/5 border border-primary/10 p-10">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-6">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Secure, Structured Access</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every plan provides transparent access rights, clear billing records, and a member experience tailored to your level of engagement with the platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Membership Benefits */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Membership Benefits</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-3xl border bg-card p-6 hover:shadow-lg transition-all hover:border-primary/20"
              >
                <div className={`h-12 w-12 rounded-2xl ${benefit.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {benefit.icon}
                </div>
                <h3 className="font-heading font-bold text-base mb-2 group-hover:text-primary transition-colors">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans */}
      <section className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Choose Your Plan</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative rounded-3xl border p-8 flex flex-col transition-all ${plan.highlight ? "bg-primary text-white border-primary shadow-2xl scale-105" : "bg-card hover:border-primary/30 hover:shadow-lg"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-primary text-xs font-bold shadow">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.highlight ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                  {plan.badge}
                </span>
              </div>
              <h3 className={`font-heading text-2xl font-bold mb-4 ${plan.highlight ? "text-white" : ""}`}>{plan.title}</h3>
              <p className={`text-sm leading-relaxed flex-1 ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>{plan.description}</p>
              <div className="mt-8">
                <Link to="/register">
                  <Button
                    className={`w-full rounded-full font-bold ${plan.highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                    variant={plan.highlight ? "secondary" : "outline"}
                    size="lg"
                  >
                    Select Your Membership
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Purchase / Renewal Section */}
      <section className="bg-secondary/30 py-24">
        <div className="container max-w-3xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-4xl font-bold tracking-tight">Simple Purchase and Renewal Process</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Purchasing or renewing your membership is designed to be straightforward. Select your preferred plan, complete checkout securely, and receive immediate confirmation of activation where applicable. Your invoice and membership details will be available in your account for easy reference.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Membership Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="rounded-2xl border bg-card p-6"
              >
                <div className="flex items-start gap-4">
                  <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-heading font-bold mb-2">{faq.q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container py-24">
        <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 md:p-20 text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white leading-tight">
              Unlock More from the Platform
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Join as a member to access more content, manage your billing in one place, and enjoy a more complete digital experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full font-bold text-lg">
                  Join Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/support">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10">
                  Contact Support
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
