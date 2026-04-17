import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, LayoutDashboard, LogOut, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/supabase";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Publications", to: "/publications" },
  { label: "Library", to: "/library" },
  { label: "Membership", to: "/membership" },
  { label: "Authors", to: "/authors" },
  { label: "Reviewers", to: "/reviewers" },
  { label: "Standards", to: "/standards" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  const dashboardPath = user
    ? isAdmin(user.roles) ? "/admin"
    : user.roles.includes("sub_admin") ? "/reviewer/stage"
    : user.roles.includes("reviewer") ? "/reviewer"
    : user.roles.includes("author") ? "/author"
    : "/portal/dashboard"
    : "/login";

  return (
    <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
            scrolled 
            ? "py-3 bg-background/80 backdrop-blur-xl border-b shadow-sm" 
            : "py-5 bg-transparent"
        }`}
    >
      <div className="container flex h-12 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className={`hidden sm:inline font-heading text-xl font-bold tracking-tight transition-colors ${scrolled ? "text-foreground" : "text-foreground md:text-white"}`}>
            ResearchJournal
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link 
                key={link.label} 
                to={link.to} 
                className={`px-4 py-2 text-sm font-semibold transition-all rounded-full hover:bg-primary/10 ${
                    scrolled 
                    ? "text-muted-foreground hover:text-primary" 
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64 group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${scrolled ? "text-muted-foreground" : "text-white/60 group-focus-within:text-white"}`} />
            <Input 
                placeholder="Search research..." 
                className={`pl-10 h-10 text-sm rounded-full border-0 transition-all ${
                    scrolled 
                    ? "bg-secondary text-foreground" 
                    : "bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20"
                }`} 
            />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={`h-10 px-2 rounded-full hover:bg-white/10 ${scrolled ? "text-foreground" : "text-white"}`}>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background shadow-md">
                    {user.profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="ml-2 hidden sm:inline max-w-[100px] truncate text-sm font-bold">
                    {user.profile?.full_name?.split(' ')[0] || "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl">
                <DropdownMenuItem onClick={() => navigate(dashboardPath)} className="rounded-xl h-10 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 mr-3" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/portal/profile")} className="rounded-xl h-10 cursor-pointer">
                  <User className="h-4 w-4 mr-3" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl h-10 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-3" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
                <Button 
                    variant={scrolled ? "default" : "secondary"} 
                    size="sm" 
                    className="h-10 px-6 rounded-full font-bold shadow-lg"
                >
                    Login
                </Button>
            </Link>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            className={`lg:hidden rounded-full ${scrolled ? "text-foreground" : "text-white"}`} 
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden border-t bg-background overflow-hidden"
            >
                <div className="container py-6 space-y-2">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.label} 
                            to={link.to} 
                            className="block px-4 py-3 text-lg font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all" 
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="pt-4 flex gap-4">
                        {user ? (
                        <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => { setMobileOpen(false); navigate(dashboardPath); }}>Dashboard</Button>
                        ) : (
                        <Link to="/login" className="flex-1"><Button className="w-full h-12 rounded-xl font-bold">Login</Button></Link>
                        )}
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
