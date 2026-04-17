// DocumentMilestone.tsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroBanner from "@/assets/new.jpeg"; // or any suitable background image

export function Section2() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary/70 py-20 md:py-28">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column – text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-white space-y-6"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Driving Technical Innovation
            </p>
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              ResearchJournal Digital Library Reaches 7 Million Documents
            </h2>
            <p className="text-lg text-white/90 leading-relaxed max-w-xl">
              ResearchJournal Digital Library is your gateway to trusted research—journals,
              conferences, standards, eBooks, and educational courses—now with more than
              7 million documents to help you fuel imagination, build from previous
              research, and inspire new ideas.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/subscribe">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-primary px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-shadow inline-flex items-center gap-2"
                >
                  Learn More and Subscribe
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
              <Link to="/publish">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                >
                  Get Published
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Right column – large 7M stat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center lg:justify-end"
          >
            <div className="text-center">
              <span className="font-heading font-bold text-8xl md:text-9xl lg:text-[10rem] text-white leading-none">
                7M
              </span>
              <p className="text-white/80 text-xl mt-2">Documents & Growing</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}