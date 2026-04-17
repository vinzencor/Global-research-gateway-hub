import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Download,
  Filter,
  Globe,
  Library,
  Lock,
  Save,
  Search,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: <Search className="h-6 w-6" />,
    title: "Search with Precision",
    description: "Use structured search and filters to narrow results by topic, year, author, venue, and access type.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Review Before You Access",
    description: "See title, authors, abstract previews, and metadata before opening an item.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Save className="h-6 w-6" />,
    title: "Save What Matters",
    description: "Logged-in users can save content for easy return later.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Manage Access Clearly",
    description: "Open-access items are available immediately, while paid or member-only content is gated according to entitlement.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: "Export Citations",
    description: "Where enabled, citation export tools make it easier to use and reference content.",
    color: "bg-rose-500/10 text-rose-600",
  },
];

const accessOptions = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Open Access",
    description: "Certain items are made freely available for reading and download.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Library className="h-6 w-6" />,
    title: "Membership Access",
    description: "Some content becomes available through active membership entitlements.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: "Pay-Per-View Access",
    description: "Users may also be able to purchase access to individual items where applicable.",
    color: "bg-amber-500/10 text-amber-600",
  },
];

const filters = [
  "Publication year",
  "Author",
  "Subject or topic",
  "Venue",
  "Open access status",
  "Content type",
];

export default function DigitalLibraryPublic() {
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
              <BookOpen className="h-4 w-4" />
              Digital Library
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
              Explore the Digital Library
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Search, discover, save, and access publications and library items through a structured, user-friendly digital knowledge environment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/library/search">
                <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg group">
                  Search the Library
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg">
                  Become a Member
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            <h2 className="font-heading text-4xl font-bold tracking-tight">A Smarter Way to Access Content</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The Digital Library is built to help users quickly find the content that matters to them. Search by title, author, topic, year, venue, or access type. Review abstracts and metadata before opening a resource. Save items, export citations, and access downloads according to your membership or purchase entitlements.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-3xl bg-primary/5 border border-primary/10 p-10">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-6">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-3">Built for Discovery</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Whether you are looking for a specific paper, browsing new material, or building a personal list of useful resources, the Digital Library is designed to make the process efficient and rewarding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">What You Can Do in the Digital Library</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-3xl border bg-card p-6 hover:shadow-lg transition-all hover:border-primary/20"
              >
                <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="font-heading font-bold text-base mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Access Model */}
      <section className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Access Options</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The library supports multiple access routes so users can engage with content in the way that best fits their needs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {accessOptions.map((option, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-3xl border bg-card p-8 text-center hover:shadow-lg transition-all hover:border-primary/20"
            >
              <div className={`h-14 w-14 rounded-2xl ${option.color} flex items-center justify-center mb-6 mx-auto transition-transform group-hover:scale-110`}>
                {option.icon}
              </div>
              <h3 className="font-heading font-bold text-lg mb-3 group-hover:text-primary transition-colors">{option.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search Filters */}
      <section className="bg-secondary/30 py-24">
        <div className="container max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl font-bold tracking-tight mb-4">Filter by What Matters</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Users can refine library results through a set of practical filters.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filters.map((filter, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4"
              >
                <Filter className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{filter}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 md:p-20 text-center">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white leading-tight">
              Start Exploring
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Whether you are looking for a specific paper, browsing new material, or building a personal list of useful resources, the Digital Library is designed to make the process efficient and rewarding.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/library">
                <Button size="lg" variant="secondary" className="h-14 px-8 rounded-full font-bold text-lg">
                  Browse Library <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10">
                  Become a Member
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
