import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Globe,
  Library,
  Lightbulb,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

const values = [
  {
    icon: <Star className="h-6 w-6" />,
    title: "Quality",
    description: "We value well-structured, relevant, and meaningful content.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Credibility",
    description: "We support review-led publishing and transparent attribution.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Accessibility",
    description: "We believe users should be able to discover and access knowledge with ease.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Recognition",
    description: "We highlight the people behind the work — authors, reviewers, editors, and contributors.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Scalability",
    description: "We are building with growth in mind, from individual users to institutional participation.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

const offerings = [
  "Public-facing editorial and publication pages",
  "Contributor and reviewer directories",
  "Digital library search and access control",
  "Membership plans and billing management",
  "Structured review and publishing workflows",
  "Admin tools for content, people, permissions, and analytics",
];

export default function About() {
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
              <Lightbulb className="h-4 w-4" />
              About Our Platform
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              About Our Platform
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A modern publishing and knowledge-access ecosystem designed to connect content, credibility, and community.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="font-heading text-4xl font-bold tracking-tight">Who We Are</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are building a unified platform that brings together public publishing, member services, digital library access, and expert-led review workflows in one place. Our aim is to make valuable knowledge easier to publish, easier to trust, and easier to access.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By combining content management, contributor visibility, review structures, and digital access tools, we support a higher standard of professional and scholarly engagement online.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-primary/5 border border-primary/10 p-10 space-y-6"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-2xl font-bold">Our Purpose</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our purpose is to support the creation, validation, and distribution of meaningful knowledge. We believe strong content deserves strong systems — systems that help people discover work, understand who created it, see how it was reviewed, and access it in ways that are transparent and structured.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">What We Offer</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our platform supports a complete digital knowledge journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {offerings.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 rounded-2xl border bg-card p-6 hover:border-primary/30 transition-all"
              >
                <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm font-medium leading-relaxed">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="container py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="font-heading text-4xl font-bold tracking-tight">Why It Matters</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            In today's digital environment, content alone is not enough. Users want discoverability, trust, relevance, and easy access. Contributors want visibility. Reviewers want recognition. Administrators need control. Members want a smooth experience.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our platform is designed to meet all of those needs in a connected and scalable way.
          </p>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Our Values</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-3xl border bg-card p-6 hover:shadow-lg transition-all hover:border-primary/20 text-center"
              >
                <div className={`h-12 w-12 rounded-2xl ${value.color} flex items-center justify-center mb-4 mx-auto transition-transform group-hover:scale-110`}>
                  {value.icon}
                </div>
                <h3 className="font-heading font-bold text-base mb-2 group-hover:text-primary transition-colors">{value.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{value.description}</p>
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
              Building the Future of Digital Knowledge Platforms
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Our vision is to create a trusted, flexible, and professional environment where content publishing, review workflows, membership access, and digital discovery work together seamlessly.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/publications">
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full font-bold text-lg">
                  Explore Publications <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10">
                  View Membership
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
