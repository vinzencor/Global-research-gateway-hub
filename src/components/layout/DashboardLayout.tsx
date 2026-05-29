import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, ChevronDown, ExternalLink, ChevronRight, Home, ShieldCheck, Bell } from "lucide-react";
import { useState } from "react";
import { useAuth, isAdmin, isReviewer, isSubAdmin } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  const initials = user?.profile?.full_name
    ? user.profile.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : user?.email?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-300 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group min-w-0">
            <img src="/Logo.png" alt="Logo" className="h-8 w-auto object-contain shrink-0 transition-transform group-hover:scale-105" />
            <div className="min-w-0">
              <p className="font-heading font-bold text-xs tracking-tight leading-tight truncate">{title}</p>
              <p className="text-[10px] text-sidebar-foreground/50 leading-tight truncate">Admin Console</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to + "/"));
            const prevIsSeparator = idx > 0 && item.to.includes("portal");
            return (
              <div key={item.label}>
                {prevIsSeparator && idx > 0 && (
                  <div className="my-2 border-t border-sidebar-border/50" />
                )}
                <Link
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <span className={cn("shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Sidebar footer — user info */}
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 lg:px-6 shadow-sm">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Home className="h-3 w-3" />
              <span>Home</span>
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-semibold">{title}</span>
          </div>
          <h1 className="font-heading text-base font-bold sm:hidden truncate">{title}</h1>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Visit Site
              </a>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col items-start max-w-[130px]">
                    <span className="text-xs font-semibold leading-tight truncate">{user?.profile?.full_name || user?.email}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight truncate">{user?.roles?.[0]?.replace(/_/g, " ")}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg">
                <div className="px-3 py-2.5 border-b">
                  <p className="text-sm font-semibold truncate">{user?.profile?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <DropdownMenuItem onClick={() => navigate("/portal/profile")} className="gap-2">
                    <User className="h-4 w-4" /> My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/portal/dashboard")} className="gap-2">
                    <Home className="h-4 w-4" /> User Dashboard
                  </DropdownMenuItem>
                </div>

                {user && (isAdmin(user.roles) || isSubAdmin(user.roles) || isReviewer(user.roles)) && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="py-1">
                      {isAdmin(user.roles) && (
                        <DropdownMenuItem onClick={() => navigate("/admin")} className="gap-2">
                          <ShieldCheck className="h-4 w-4" /> Admin Console
                        </DropdownMenuItem>
                      )}
                      {(isSubAdmin(user.roles) || isReviewer(user.roles)) && (
                        <DropdownMenuItem onClick={() => navigate(isSubAdmin(user.roles) ? "/sub-admin" : "/reviewer")} className="gap-2">
                          <Bell className="h-4 w-4" /> {isSubAdmin(user.roles) ? "Sub-Admin Portal" : "Reviewer Portal"}
                        </DropdownMenuItem>
                      )}
                    </div>
                  </>
                )}

                <DropdownMenuSeparator />
                <div className="py-1">
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
