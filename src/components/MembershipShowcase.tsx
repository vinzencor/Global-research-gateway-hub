import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Star, Zap, GraduationCap, Building2, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PlanDetail {
  text: string;
  included: boolean;
}

interface MembershipPlan {
  id: string;
  title: string;
  category: string;
  description: string;
  price: string;
  icon: React.ReactNode;
  badge: string;
  highlight?: boolean;
  colorTheme: string;
  borderColor: string;
  glowColor: string;
  textColor: string;
  details: PlanDetail[];
}

export default function MembershipShowcase() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>("individual");

  const plans: MembershipPlan[] = [
    {
      id: "student",
      title: "Student Plan",
      category: "Academic",
      description: "Tailored for verified students and early-stage academic researchers building their foundation.",
      price: "₹1,800",
      icon: <GraduationCap className="h-6 w-6 text-blue-500" />,
      badge: "Academic Starter",
      colorTheme: "from-blue-600 to-cyan-500",
      borderColor: "group-hover:from-blue-500 group-hover:to-cyan-400",
      glowColor: "rgba(59, 130, 246, 0.15)",
      textColor: "text-blue-500",
      details: [
        { text: "View papers on the website", included: true },
        { text: "Access to the digital library", included: true },
        { text: "Cite any section of a paper for a ready-made reference", included: true },
        { text: "See how many times a paper has been cited", included: true },
        { text: "Downloads", included: false },
        { text: "Free paper submission", included: false },
        { text: "Access to reviewer application", included: false },
      ],
    },
    {
      id: "individual",
      title: "Individual Plan",
      category: "Standard",
      description: "Designed for independent researchers, authors, and professionals needing consistent reference materials.",
      price: "₹7,500",
      icon: <Zap className="h-6 w-6 text-indigo-500" />,
      badge: "Most Popular",
      highlight: true,
      colorTheme: "from-indigo-600 to-purple-500",
      borderColor: "group-hover:from-indigo-500 group-hover:to-purple-400",
      glowColor: "rgba(99, 102, 241, 0.2)",
      textColor: "text-indigo-500",
      details: [
        { text: "All Student plan benefits", included: true },
        { text: "Apply as a reviewer", included: true },
        { text: "Author eligibility", included: true },
        { text: "Citations allowed", included: true },
        { text: "Pay to publish or gain authorship", included: true },
        { text: "Downloads", included: false },
        { text: "Profile featuring", included: false },
      ],
    },
    {
      id: "professional",
      title: "Professional Plan",
      category: "Enterprise",
      description: "Full access suite for active reviewers, publishing authors, and advanced research professionals.",
      price: "₹15,000",
      icon: <Star className="h-6 w-6 text-amber-500" />,
      badge: "Full Access",
      colorTheme: "from-amber-600 to-orange-500",
      borderColor: "group-hover:from-amber-500 group-hover:to-orange-400",
      glowColor: "rgba(245, 158, 11, 0.2)",
      textColor: "text-amber-500",
      details: [
        { text: "All Student plan benefits", included: true },
        { text: "Apply as a reviewer", included: true },
        { text: "Author eligibility", included: true },
        { text: "Citations allowed", included: true },
        { text: "Pay to publish or gain authorship", included: true },
        { text: "Priority publication access", included: true },
        { text: "Downloads", included: false },
        { text: "Profile featuring", included: false },
      ],
    },
    {
      id: "institutional",
      title: "Institutional Plan",
      category: "Institution",
      description: "Built for universities, libraries, and organizations supporting multiple researchers at once.",
      price: "₹48,500",
      icon: <Building2 className="h-6 w-6 text-emerald-500" />,
      badge: "Best for Institutions",
      colorTheme: "from-emerald-600 to-teal-500",
      borderColor: "group-hover:from-emerald-500 group-hover:to-teal-400",
      glowColor: "rgba(16, 185, 129, 0.2)",
      textColor: "text-emerald-500",
      details: [
        { text: "All Student plan benefits", included: true },
        { text: "Apply as a reviewer", included: true },
        { text: "Author eligibility", included: true },
        { text: "Citations allowed", included: true },
        { text: "Pay to publish or gain authorship", included: true },
        { text: "Discounted institutional review rates", included: true },
        { text: "Downloads", included: false },
        { text: "Profile featuring", included: false },
      ],
    },
  ];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];

  return (
    <div className="space-y-12">
      {/* Plans Carousel Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
        {plans.map((plan, idx) => {
          const isSelected = plan.id === selectedPlanId;
          const price = plan.price;
          const subText = "/year";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8, scale: isSelected ? 1.05 : 1.02 }}
              onClick={() => setSelectedPlanId(plan.id)}
              className={cn(
                "group relative cursor-pointer rounded-[2.5rem] p-[2px] transition-all duration-500 overflow-hidden shadow-lg",
                isSelected
                  ? "bg-gradient-to-r from-primary via-indigo-500 to-purple-500 shadow-2xl shadow-primary/20 scale-105 z-10"
                  : "bg-gradient-to-b from-border/80 to-border/20 hover:from-border-hover"
              )}
            >
              {/* Card Outer Shifting Glow Effect */}
              {isSelected && (
                <div
                  className="absolute inset-0 opacity-40 blur-[30px] rounded-[2.5rem] -z-10 transition-all duration-500"
                  style={{ backgroundColor: plan.glowColor }}
                />
              )}

              {/* Inner card layout */}
              <div className="h-full bg-card rounded-[2.4rem] p-8 md:p-10 flex flex-col justify-between relative overflow-hidden">
                {/* Highlight Tag */}
                {plan.highlight && (
                  <div className="absolute top-0 right-0">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary to-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-[1.5rem] shadow-sm">
                      <Sparkles className="h-3 w-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center shadow-sm">
                      {plan.icon}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                        {plan.category}
                      </span>
                      <h3 className="font-heading text-2xl font-bold text-foreground">{plan.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6 h-12 overflow-hidden">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold font-heading tracking-tight text-foreground">
                        {price}
                      </span>
                      <span className="text-muted-foreground font-medium text-sm">{subText}</span>
                    </div>
                  </div>
                </div>

                {/* Selection Slider Indicators */}
                <div className="mt-8 space-y-4">
                  <Button
                    className={cn(
                      "w-full h-12 rounded-full font-bold text-sm tracking-wide transition-all duration-300",
                      isSelected
                        ? "bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg hover:shadow-xl hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-secondary/70 border border-border/40"
                    )}
                  >
                    {isSelected ? "Selected Plan" : "Select & Configure"}
                  </Button>

                  <div className="text-center">
                    <span className="text-xs text-primary font-semibold hover:underline cursor-pointer inline-flex items-center gap-1">
                      {isSelected ? "Viewing Details Below" : "Click to view features"}
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Plan Details Panel (Dynamic and Animated based on Selected Plan) */}
      <div className="max-w-5xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlanId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="rounded-[2.5rem] border bg-gradient-to-br from-card to-secondary/30 p-8 md:p-12 shadow-2xl relative overflow-hidden"
          >
            {/* Visual accent background block */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex flex-col lg:flex-row justify-between gap-8 mb-8 pb-6 border-b border-border/40">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Sparkles className="h-3 w-3" />
                  What's included in {selectedPlan.title}
                </div>
                <h4 className="font-heading text-3xl font-bold">Comprehensive Plan Breakdown</h4>
                <p className="text-sm text-muted-foreground">
                  Here is the detailed summary of access, download limits, and support you receive.
                </p>
              </div>

              <div className="flex items-center lg:justify-end">
                <Link to="/register">
                  <Button size="lg" className="rounded-full h-14 px-8 font-bold text-base shadow-lg shadow-primary/20">
                    Get Started with {selectedPlan.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Feature List (Grid with items and ticks) */}
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
              {selectedPlan.details.map((detail, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-start gap-4 p-3 rounded-2xl transition-colors duration-200",
                    detail.included ? "hover:bg-primary/5" : "opacity-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      detail.included ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {detail.included ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] font-bold">✕</span>
                    )}
                  </div>
                  <div>
                    <p className={cn("text-sm font-semibold", detail.included ? "text-foreground" : "text-muted-foreground line-through")}>
                      {detail.text}
                    </p>
                    {detail.included && detail.text.toLowerCase().includes("digital library") && (
                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                        Digital Library Enabled
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comparison Callout footer */}
            <div className="mt-8 p-6 rounded-3xl bg-secondary/60 border border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Need a custom multi-user license beyond the standard Institutional plan? Reach out and we'll tailor a package for your organization.
                </span>
              </div>
              <Link to="/support" className="shrink-0 text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Contact Institution Licensing
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
