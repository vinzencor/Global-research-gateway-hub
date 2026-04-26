import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  Globe,
  Award,
  ArrowRight,
  FileText,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  CheckCircle,
  Library,
  Star,
  CreditCard,
} from "lucide-react";
import heroBanner from "@/assets/videoo.mp4";
import { HappeningAcross } from "./HappeningAcross";
import { Section1 } from "./Section1";
import { ChairmanVoice } from "./ChairmanVoice";
import { Separator } from "./Separator";
import { Section2 } from "./Section2";
import { db } from "@/lib/legacyDb";

const categoryStats = [
  { label: "Total Papers", value: "12,000+", icon: <FileText className="h-5 w-5" /> },
  { label: "Active Researchers", value: "5,000+", icon: <Users className="h-5 w-5" /> },
  { label: "Global Reach", value: "80+ Nations", icon: <Globe className="h-5 w-5" /> },
  { label: "Recognition", value: "Q1 Impact", icon: <Award className="h-5 w-5" /> },
];

const heroSlides = [
  {
    tag: "Knowledge. Credibility. Access.",
    heading: "Advancing Knowledge. Connecting Experts. Expanding Access.",
    description:
      "A unified platform for publications, expert-led review, digital knowledge access, and professional membershipâ€”built for researchers, practitioners, authors, reviewers, and institutions.",
    buttonText: "Join as a Member",
    buttonLink: "/membership",
    secondaryText: "Explore the Digital Library",
    secondaryLink: "/library",
  },
  {
    tag: "Scholarly Excellence",
    heading: "Advancing Research Through Global Innovation",
    description:
      "Discover trusted publications, search valuable resources, connect with leading contributors, and access a growing ecosystem of scholarly and professional content.",
    buttonText: "Browse Publications",
    buttonLink: "/publications",
    secondaryText: "Explore the Digital Library",
    secondaryLink: "/library",
  },
  {
    tag: "Knowledge Discovery",
    heading: "Explore Cutting-Edge Scientific Journals",
    description:
      "A premier platform for researchers, scholars, and academics to publish, review, and discover groundbreaking work from leading contributors worldwide.",
    buttonText: "Search the Library",
    buttonLink: "/library",
    secondaryText: "View Membership Plans",
    secondaryLink: "/membership",
  },
];

const platformFeatures = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Publish Meaningful Work",
    description: "Structured workflows that support authors from submission to publication with quality review at every stage.",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    icon: <CheckCircle className="h-6 w-6" />,
    title: "Review and Validate",
    description: "Expert-led review processes that reinforce quality, credibility, and transparency across all published content.",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    icon: <Library className="h-6 w-6" />,
    title: "Access Premium Resources",
    description: "Members gain expanded access to the digital library, download entitlements, and exclusive content discovery tools.",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Highlight the Experts",
    description: "Author and reviewer profiles connect readers with the people behind the work, reinforcing recognition and credibility.",
    color: "bg-indigo-500/10 text-indigo-600",
  },
];

const membershipPlans = [
  {
    title: "Student Plan",
    description: "Best suited for learners and early-stage professionals seeking guided access to essential resources.",
    badge: "Get Started",
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
  },
];

export default function Index() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentPubs, setRecentPubs] = useState<any[]>([]);
  const [authorMap, setAuthorMap] = useState<Record<string, string>>({});

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadRecent() {
      const { data } = await db
        .from("content_items")
        .select("id, title, slug, type, summary, cover_image_url, created_at, author_user_id")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);

      const items = data || [];
      setRecentPubs(items);

      const authorIds = Array.from(new Set(items.map((i: any) => i.author_user_id).filter(Boolean)));
      if (authorIds.length > 0) {
        const { data: profiles } = await db
          .from("profiles")
          .select("id, full_name")
          .in("id", authorIds);
        const map: Record<string, string> = {};
        (profiles || []).forEach((p: any) => { map[p.id] = p.full_name; });
        setAuthorMap(map);
      }
    }
    loadRecent();
  }, []);

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary selection:text-white">
      <Header />

      {/* Premium Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Video with Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <video
            src={heroBanner}
            autoPlay
            loop
            muted
            className="w-full h-full object-cover scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
        </div>

        <div className="container relative z-10 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md text-primary font-medium text-sm">
                  <Sparkles className="h-4 w-4" />
                  {heroSlides[currentSlide].tag}
                </div>

                <h1 className="font-heading text-5xl md:text-7xl font-bold leading-[1.1] text-white tracking-tight">
                  {heroSlides[currentSlide].heading}
                </h1>

                <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light max-w-xl">
                  {heroSlides[currentSlide].description}
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Link to={heroSlides[currentSlide].buttonLink}>
                    <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg group shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                      {heroSlides[currentSlide].buttonText}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to={heroSlides[currentSlide].secondaryLink}>
                    <Button variant="outline" size="lg" className="h-14 px-8 rounded-full font-bold text-lg text-white border-white/20 hover:bg-white/10 backdrop-blur-sm">
                      {heroSlides[currentSlide].secondaryText}
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                  Discover trusted publications, search valuable resources, connect with leading contributors, and access a growing ecosystem of scholarly and professional content.
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Visual Element / Floating Cards */}
            <div className="hidden lg:block relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative z-10"
              >
                <div className="glass rounded-[2rem] p-8 shadow-2xl relative overflow-hidden border-white/10 group">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]" />

                  <div className="relative space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                            <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                          </div>
                        ))}
                        <div className="h-10 w-10 rounded-full border-2 border-background bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                          +50k
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-20 bg-primary rounded-full" />
                      <h3 className="font-heading text-2xl font-bold">Platform Community</h3>
                      <p className="text-muted-foreground text-sm">Real-time peer review metrics and researcher impact scores across 12,000+ publications.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                        <TrendingUp className="h-5 w-5 text-primary mb-2" />
                        <div className="text-xl font-bold">94%</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Growth</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50">
                        <Shield className="h-5 w-5 text-emerald-500 mb-2" />
                        <div className="text-xl font-bold">Zero</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Fraud Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="mt-20 flex items-center gap-6">
            <div className="flex gap-2">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? "w-12 bg-primary" : "w-4 bg-white/20 hover:bg-white/40"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={prevSlide} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={nextSlide} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Integrated Stats Bar */}
      <div className="relative z-20 -mt-12 container">
        <div className="glass rounded-[2rem] p-8 md:p-12 shadow-2xl overflow-hidden border-white/10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 items-center">
            {categoryStats.map((stat, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold font-heading">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Intro Section */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
              <Sparkles className="h-4 w-4" />
              Intro Section
            </div>
            <p className="text-2xl text-foreground font-light leading-relaxed">
              We bring together editorial publishing, expert review, digital library access, and professional membership within one seamless platform. Whether you are here to read, publish, review, or grow your professional standing, our platform is designed to make high-value content easier to discover, trust, and use.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our ecosystem supports a modern knowledge journey: publish meaningful work, review and validate content, access premium resources, and highlight expert contributors.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/about">
                <Button variant="outline" className="rounded-full h-12 px-8 font-bold text-base border-primary/20 hover:bg-primary/5 text-primary">
                  Learn More About Our Vision <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border"
          >
            <img 
              src="main2.webp" 
              alt="Knowledge Innovation" 
              className="w-full h-full object-cover aspect-[4/3] transition-transform duration-700 hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </motion.div>
        </div>
      </section>

      <HappeningAcross />

      <div className="container px-4">
        <Separator className="opacity-10" />
      </div>

      <div className="container px-4">
        <Separator className="opacity-10" />
      </div>

      {/* Section Six â€” Publication Types */}
      <section className="container py-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-6">Diverse Publication Types</h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Our platform supports a wide range of content, ensuring that every piece of research, analysis, and framework finds its appropriate place and audience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Research Papers", desc: "Original research with structured methodology and analysis. Must demonstrate novelty and measurable contribution.", icon: <FileText className="h-6 w-6" />, color: "bg-primary/10 text-primary" },
            { title: "Review Papers", desc: "Comprehensive synthesis of existing literature. Must provide critical insights, not just summaries.", icon: <BookOpen className="h-6 w-6" />, color: "bg-emerald-500/10 text-emerald-600" },
            { title: "Technical Frameworks", desc: "Industry-focused, implementation-oriented documents including architecture, models, or frameworks.", icon: <Zap className="h-6 w-6" />, color: "bg-amber-500/10 text-amber-600" },
            { title: "Analytical Articles", desc: "Insight-driven pieces with structured reasoning and depth beyond mere opinion.", icon: <TrendingUp className="h-6 w-6" />, color: "bg-indigo-500/10 text-indigo-600" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-[2rem] border bg-card hover:border-primary/30 hover:shadow-2xl transition-all"
            >
              <div className={`h-14 w-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              <h3 className="font-heading font-bold text-xl mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <ChairmanVoice />

      {/* Section Seven â€” Professional Membership */}
      <section className="bg-secondary/50 py-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary rounded-full blur-[150px]" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative rounded-[3rem] overflow-hidden shadow-2xl h-[400px]"
            >
              <img src="membership_promo.png" alt="Collaborative Community" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            </motion.div>

            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
                <Users className="h-4 w-4" />
                Expert Community
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">Join a Global Network of Knowledge Leaders</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Membership is your key to a professional community of researchers, practitioners, and reviewers. Unlock exclusive benefits, expanded library access, and professional recognition.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/membership">
                  <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg group">
                    Explore Membership Benefits
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Library Promo */}
      <section className="container py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
              <BookOpen className="h-4 w-4" />
              Digital Discovery
            </div>
            <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">Unparalleled Access to Digital Knowledge</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Our Digital Library is a state-of-the-art gateway to millions of documents. Search with precision, discover new insights, and build your personal repository of high-value resources.
            </p>
            <Link to="/library">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-lg border-primary/20 hover:bg-primary/5 text-primary group">
                Enter Digital Library <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:order-1 relative rounded-[3rem] overflow-hidden shadow-2xl h-[500px]"
          >
            <img src="library_feature.png" alt="Digital Library Interface" className="w-full h-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Dynamic Recent Publications */}
      <section className="bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="container py-24 relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-heading text-4xl font-bold mb-4 tracking-tight">Latest Articles & Insights</h2>
              <p className="text-muted-foreground text-lg">Stay updated with the latest articles, commentary, announcements, and topical insights published on our platform.</p>
            </div>
            <Link to="/publications">
              <Button variant="outline" className="rounded-full px-6 border-primary/20 hover:bg-primary/5 text-primary font-bold">
                Read Latest Articles
              </Button>
            </Link>
          </div>

          {recentPubs.length === 0 ? (
            <div className="text-center py-20 glass rounded-3xl border-border/50">
              <FileText className="h-16 w-16 mx-auto mb-6 text-primary/20" />
              <p className="text-xl text-muted-foreground">Synthesizing latest content for you...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {recentPubs.map((pub, i) => {
                const authorName = pub.author_user_id ? authorMap[pub.author_user_id] : null;
                return (
                  <motion.div
                    key={pub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={`/publications/${pub.slug}`}
                      className="group flex flex-col h-full bg-card rounded-3xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all hover:shadow-2xl"
                    >
                      <div className="relative aspect-video overflow-hidden">
                        {pub.cover_image_url ? (
                          <img src={pub.cover_image_url} alt={pub.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                            {pub.type}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h3 className="font-heading font-bold text-xl mb-4 text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {pub.title}
                        </h3>
                        <div className="mt-auto space-y-4">
                          {authorName && (
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                              </div>
                              <span className="text-sm font-medium">{authorName}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pt-4 border-t">
                            <span className="flex items-center gap-2 tracking-wide uppercase">
                              <Calendar className="h-3 w-3" />
                              {new Date(pub.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </span>
                            <span className="text-primary font-bold">Read More â†’</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Publications Section */}
      <section className="container py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <h2 className="font-heading text-4xl font-bold mb-4 tracking-tight">Featured Publications</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Explore selected publications that reflect quality, relevance, and practical value across key subject areas.
            </p>
          </div>
          <Link to="/publications">
            <Button variant="ghost" className="text-primary font-bold hover:bg-primary/5">
              Browse All Publications <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {recentPubs.length === 0 ? (
            [1, 2, 3].map(i => (
              <div key={i} className="rounded-3xl border bg-card p-8 space-y-4 animate-pulse">
                <div className="h-40 rounded-2xl bg-secondary" />
                <div className="h-4 w-3/4 bg-secondary rounded" />
                <div className="h-3 w-1/2 bg-secondary rounded" />
              </div>
            ))
          ) : (
            recentPubs.map((pub, i) => (
              <motion.div key={pub.id} whileHover={{ y: -8 }} className="group relative rounded-3xl border bg-card overflow-hidden transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                <div className="aspect-video overflow-hidden">
                  {pub.cover_image_url ? (
                    <img src={pub.cover_image_url} alt={pub.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-heading font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{pub.title}</h3>
                  {pub.summary && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{pub.summary}</p>}
                  <Link to={`/publications/${pub.slug}`}>
                    <Button size="sm" variant="outline" className="rounded-full w-full font-bold">
                      View Publication <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Membership Promo Section */}
      <section className="bg-secondary/30 relative overflow-hidden">
        <div className="container py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm">
                <CreditCard className="h-4 w-4" />
                Membership
              </div>
              <h2 className="font-heading text-4xl md:text-5xl font-bold leading-tight tracking-tight">Become a Member</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Membership gives you access to premium content, billing history, invoices, and an expanded digital experience tailored to your plan. Choose the level that fits your goals and unlock more value from the platform.
              </p>
              <Link to="/membership">
                <Button size="lg" className="h-14 px-8 rounded-full font-bold text-lg group">
                  View Membership Plans
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-4">
              {membershipPlans.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`rounded-2xl border p-6 transition-all ${plan.highlight ? "bg-primary text-white border-primary shadow-xl" : "bg-card hover:border-primary/30"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-heading font-bold text-lg ${plan.highlight ? "text-white" : ""}`}>{plan.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${plan.highlight ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>{plan.badge}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${plan.highlight ? "text-white/80" : "text-muted-foreground"}`}>{plan.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="container py-24">
        <div className="relative rounded-[3rem] bg-primary overflow-hidden p-12 md:p-24 text-center">
          {/* Abstract Decorations */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[80px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="font-heading text-4xl md:text-6xl font-bold text-white leading-tight">
              Unlock More from the Platform
            </h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Join as a member to access more content, manage your billing in one place, and enjoy a more complete digital experience.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="h-16 px-10 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform">
                  Join Now
                </Button>
              </Link>
              <Link to="/support">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full font-bold text-lg border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
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
