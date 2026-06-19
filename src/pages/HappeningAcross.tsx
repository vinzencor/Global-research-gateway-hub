// HappeningAcrossResearchJournal.tsx
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBanner from "@/assets/new.png"; // placeholder – replace with your images

import { useQuery } from "@tanstack/react-query";
import { happeningsApi } from "@/lib/api";

export function HappeningAcross() {
  const { data: happenings = [], isLoading } = useQuery<any[]>({
    queryKey: ["happenings"],
    queryFn: happeningsApi.list,
  });
  return (
    <section className="container py-24">
      {/* Header with "View all" link */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="max-w-2xl">
            <h2 className="font-heading text-4xl font-bold mb-4 tracking-tight">
            Happening Across ResearchJournal
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
            From the latest conferences and community events to the courses and
            opportunities that can help you grow in your career.
            </p>
        </div>
        <Link
          to="/news"
          className="group inline-flex items-center text-primary font-bold hover:underline"
        >
          View all news
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Card grid – modern premium cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {happenings.map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -5 }}
            className="group flex flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-sm transition-all hover:shadow-2xl cursor-pointer"
          >
            {/* Image area */}
            <div className="relative h-64 overflow-hidden">
              <img
                src={item.imageUrl || heroBanner}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Content area */}
            <div className="flex-1 p-8 bg-primary">
              {item.category && (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3">
                  {item.category}
                </p>
              )}
              <h3 className="font-heading font-bold text-xl leading-tight text-white mb-6 group-hover:text-white/90 transition-colors">
                {item.title}
              </h3>
              
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-bold text-white/80">Read Article</span>
                <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm transition-transform group-hover:translate-x-2">
                    <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </div>
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
            )}
          </motion.div>
        ))}
      </div>
      
      {happenings.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          No happenings to display at the moment.
        </div>
      )}
      
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </section>
  );
}