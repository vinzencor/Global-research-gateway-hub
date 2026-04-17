// ChairmanVoiceCentered.tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Quote } from "lucide-react";

export function ChairmanVoice() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Full‑screen background image with overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Research laboratory"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/60 mix-blend-multiply" />
      </div>

      {/* Animated floating particles (optional) */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
            }}
            animate={{
              y: [null, "-30%", "30%", "-30%"],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Centered quote card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
        className="relative max-w-3xl mx-4 bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl border border-white/20"
      >
        <motion.div
          initial={{ rotate: -10, scale: 0 }}
          animate={isInView ? { rotate: 0, scale: 1 } : {}}
          transition={{ type: "spring", delay: 0.4 }}
          className="absolute -top-6 left-8 bg-primary text-white p-3 rounded-full shadow-lg"
        >
          <Quote className="h-6 w-6" />
        </motion.div>

        <motion.blockquote
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl lg:text-4xl font-heading font-medium leading-relaxed text-white mb-8 pt-4"
        >
          "Our mission is to empower researchers worldwide by providing
          a platform that accelerates discovery and fosters collaboration.
          I'm proud of the community we've built and excited for the
          innovations yet to come."
        </motion.blockquote>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-primary/30 border-2 border-white/50 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              alt="Dr. Rajiv Mehta"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-white">Dr. Rajiv Mehta</p>
            <p className="text-white/80">Chairman, ResearchJournal</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Subtle scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white/60 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
}