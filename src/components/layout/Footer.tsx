import { Link } from "react-router-dom";
import { Sparkles, Linkedin, Twitter, Github, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const col1 = [
    { label: "About", to: "/about" },
    { label: "Membership", to: "/membership" },
    { label: "Digital Library", to: "/library" },
    { label: "Publications", to: "/publications" },
    { label: "Articles & News", to: "/publications" },
    { label: "Events", to: "/" },
  ];

  const col2 = [
    { label: "Standards", to: "/standards" },
    { label: "Authors", to: "/authors" },
    { label: "Reviewers", to: "/reviewers" },
    { label: "Support", to: "/support" },
    { label: "Login", to: "/login" },
    { label: "Sign Up", to: "/register" },
  ];

  return (
    <footer className="bg-secondary/20 border-t border-border/50">
      <div className="container py-20 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-16">
          {/* Brand block */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight">
                KnowledgeHub
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              A unified platform for publishing, digital access, membership, and expert-led content visibility.
            </p>
            <p className="text-xs text-muted-foreground/60 font-medium italic">
              Join the platform. Explore trusted content. Connect with experts.
            </p>
            <div className="flex gap-4">
              {[Twitter, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm mb-6 uppercase tracking-[0.15em] text-foreground/80">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              {col1.map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-muted-foreground hover:text-primary transition-colors inline-block">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm mb-6 uppercase tracking-[0.15em] text-foreground/80">Community</h4>
            <ul className="space-y-4 text-sm font-medium">
              {col2.map(item => (
                <li key={item.label}>
                  <Link to={item.to} className="text-muted-foreground hover:text-primary transition-colors inline-block">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm mb-6 uppercase tracking-[0.15em] text-foreground/80">Support & Contact</h4>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-medium">Have questions or need assistance with your account or access?</p>
              <a
                href="mailto:support@platform.org"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-border/50 text-sm font-bold text-primary shadow-sm hover:shadow-md transition-all group"
              >
                <Mail className="h-4 w-4" />
                Contact Support
              </a>
              <div className="pt-4 space-y-2 text-xs text-muted-foreground/60">
                <p>Support available Mon–Fri</p>
                <p>Response within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-muted-foreground font-medium">
            © {currentYear} KnowledgeHub. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
            <Link to="/policy/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/policy/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
            <Link to="/policy/membership-terms" className="hover:text-primary transition-colors">Membership Terms</Link>
            <Link to="/policy/refund" className="hover:text-primary transition-colors">Refund Policy</Link>
            <Link to="/support" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
