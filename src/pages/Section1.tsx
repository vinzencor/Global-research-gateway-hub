// PathToResearchJournalEnhanced.tsx (updated)
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Users,
  GraduationCap,
  HeartHandshake,
  UserPlus,
  UserCog,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the content for each category
const categoryContent = {
  default: {
    title: "Global Publishing Platform",
    description:
      "Our trusted, peer-reviewed content appears in over 200 highly ranked journals and more than 2,000 conferences. The ResearchJournal digital library provides global visibility for new work and pioneering research.",
    buttonText: "Start Publishing",
    buttonLink: "/publish",
    icon: <Users className="h-6 w-6" />,
  },
  "Industry Professionals": {
    title: "For Industry Leaders",
    description:
      "Stay ahead with cutting-edge research, standards, and networking opportunities. Access the latest technical resources and connect with peers who are shaping the future of technology.",
    buttonText: "Explore Resources",
    buttonLink: "/industry",
    icon: <Briefcase className="h-6 w-6" />,
  },
  "Authors & Researchers": {
    title: "Publish and Ignite",
    description:
      "Reach a global audience with your research. ResearchJournal offers comprehensive author tools, rapid publication, and unparalleled visibility through our digital library ecosystem.",
    buttonText: "Submit Manuscript",
    buttonLink: "/submit",
    icon: <Sparkles className="h-6 w-6" />,
  },
  "Students": {
    title: "Start Your Journey",
    description:
      "Access exclusive student resources, scholarships, competitions, and mentorship programs. Build your network and jumpstart your career with ResearchJournal.",
    buttonText: "Join as a Student",
    buttonLink: "/students",
    icon: <GraduationCap className="h-6 w-6" />,
  },
  Volunteers: {
    title: "Lead the Impact",
    description:
      "Volunteer opportunities across ResearchJournal let you lead projects, organize events, and shape the direction of the profession while developing high-level leadership skills.",
    buttonText: "Get Involved",
    buttonLink: "/volunteer",
    icon: <HeartHandshake className="h-6 w-6" />,
  },
  "New Members": {
    title: "Welcome to the Elite",
    description:
      "As a new member, you have access to a world of exclusive benefits: publications, conferences, and a global network of world-class professionals.",
    buttonText: "Explore Benefits",
    buttonLink: "/members",
    icon: <UserPlus className="h-6 w-6" />,
  },
};

const categories = Object.keys(categoryContent).filter(c => c !== 'default') as Array<keyof typeof categoryContent>;

export function Section1() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof categoryContent>("default");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const currentContent = categoryContent[activeCategory];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 md:py-32"
    >
      {/* Dynamic Background Decorations */}
      <div className="absolute inset-0 z-0 bg-secondary/30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left column */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
                <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                    The Global Community for <span className="text-primary italic">Technology Professionals</span>
                </h2>
                <p className="text-xl text-muted-foreground font-medium">
                    Find your unique path at ResearchJournal and join a legacy of excellence.
                </p>
            </div>

            <div className="space-y-3">
              {categories.map((category) => {
                const isActive = activeCategory === category;
                const icon = categoryContent[category]?.icon || <Users />;
                return (
                  <motion.button
                    key={category}
                    onMouseEnter={() => setActiveCategory(category)}
                    className={`group w-full text-left p-6 rounded-2xl transition-all duration-300 flex items-center gap-4 border ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
                        : "bg-card hover:bg-white text-foreground border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <div className={`p-3 rounded-xl transition-colors ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                      {icon}
                    </div>
                    <span className="font-bold text-lg tracking-tight">{category}</span>
                    <ArrowRight className={`ml-auto h-5 w-5 transition-transform ${isActive ? "translate-x-0" : "-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Right column – Interactive Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="sticky top-32"
          >
            <div className="glass rounded-[3rem] p-10 md:p-16 border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="h-8 w-8" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest">
                        Focus Area
                    </div>
                    <h3 className="font-heading text-4xl font-bold leading-tight">
                        {currentContent.title}
                    </h3>
                  </div>

                  <p className="text-xl text-muted-foreground leading-relaxed font-light">
                    {currentContent.description}
                  </p>

                  <div className="pt-4">
                    <Link to={currentContent.buttonLink}>
                      <Button size="lg" className="h-16 px-8 rounded-2xl font-bold text-lg group shadow-xl shadow-primary/20">
                        {currentContent.buttonText}
                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-2" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}