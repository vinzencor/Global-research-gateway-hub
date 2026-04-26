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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/50 pt-24 pb-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container relative z-10 text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <Library className="h-4 w-4" />
              Digital Library
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
              A Unified Gateway to Knowledge
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8 font-light">
              Search, discover, and access a growing ecosystem of scholarly publications, technical frameworks, and professional insights through our structured digital environment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/library">
                <Button size="lg" className="h-16 px-10 rounded-full font-bold text-lg group shadow-xl shadow-primary/20">
                  Enter Library
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full font-bold text-lg border-primary/20 hover:bg-primary/5 text-primary">
                  View Access Plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-8">
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight">Structured Discovery at Scale</h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-light">
              The Digital Library is built to help users quickly find the content that matters to them. Search by title, author, topic, year, venue, or access type. Review abstracts and metadata before opening a resource. Save items, export citations, and access downloads according to your membership or purchase entitlements.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-[3rem] bg-primary/5 border border-primary/10 p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Search className="h-32 w-32" />
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-8">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-2xl font-bold mb-4">Built for Discovery</h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Whether you are looking for a specific paper, browsing new material, or building a personal library of useful resources, our platform is designed to make the process efficient and rewarding.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/50 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Library Capabilities</h2>
            <p className="text-lg text-muted-foreground font-light">Advanced tools designed to enhance your research and content exploration experience.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group rounded-[2rem] border bg-card p-8 hover:shadow-2xl transition-all hover:border-primary/20"
              >
                <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Access Model */}
      <section className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Flexible Access Options</h2>
          <p className="text-xl text-muted-foreground leading-relaxed font-light">
            Supporting multiple access routes so you can engage with content in the way that best fits your needs.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {accessOptions.map((option, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-[2.5rem] border bg-card p-10 text-center hover:shadow-2xl transition-all hover:border-primary/20"
            >
              <div className={`h-16 w-16 rounded-2xl ${option.color} flex items-center justify-center mb-8 mx-auto transition-transform group-hover:scale-110`}>
                {option.icon}
              </div>
              <h3 className="font-heading font-bold text-2xl mb-4 group-hover:text-primary transition-colors">{option.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-light">{option.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Search Filters */}
      <section className="bg-secondary/50 py-24">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">Refined Search Parameters</h2>
            <p className="text-lg text-muted-foreground font-light">
              Narrow down millions of documents with precision using our integrated filter system.
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
                className="flex items-center gap-4 rounded-2xl border bg-card p-5 hover:border-primary/30 transition-all hover:translate-y-[-2px] group"
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Filter className="h-4 w-4" />
                </div>
                <span className="text-base font-medium">{filter}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative rounded-[4rem] bg-primary overflow-hidden p-12 md:p-24 text-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-black rounded-full blur-[100px]" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="font-heading text-4xl md:text-6xl font-bold text-white leading-tight">
              Ready to Explore?
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Millions of documents, thousands of expert contributors, and one seamless search experience. Start your journey into the Digital Library today.
            </p>
            <div className="flex flex-wrap justify-center gap-6 pt-6">
              <Link to="/library">
                <Button size="lg" variant="secondary" className="h-16 px-10 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-transform">
                  Enter Library Now
                </Button>
              </Link>
              <Link to="/membership">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10 backdrop-blur-md">
                  View Access Plans
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
