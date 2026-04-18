import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Bell, FileText, PenSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, isAdmin, isReviewer } from "@/lib/supabase";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

export default function PortalDashboard() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase
        .from("memberships")
        .select("*, membership_plans(name, price, billing_period)")
        .eq("user_id", user.id)
        .in("status", ["active", "renewal_due", "approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("memberships")
        .select("*, membership_plans(name, price, billing_period)")
        .eq("user_id", user.id)
        .in("status", ["pending_verification", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("invoices")
        .select("membership_id,status")
        .eq("user_id", user.id)
        .not("membership_id", "is", null)
        .limit(50),
      supabase.from("saved_library_items").select("library_item_id", { count: "exact" }).eq("user_id", user.id),
    ]).then(([approvedMem, pendingMem, invoiceRows, saved]) => {
      const approved = approvedMem.data || null;
      const pending = pendingMem.data || null;
      const paidMembershipIds = new Set(
        ((invoiceRows.data || []) as any[])
          .filter((inv: any) => inv?.status === "paid" && !!inv?.membership_id)
          .map((inv: any) => inv.membership_id)
      );

      const displayMembership = approved || ((pending?.id && paidMembershipIds.has(pending.id)) ? { ...pending, status: "approved" } : null);

      setMembership(displayMembership);
      setSavedCount(saved.count || 0);
    });
  }, [user]);

  const adminLinks = isAdmin(user?.roles || []) ? [{ label: "Admin Console", to: "/admin" }] : [];
  const reviewerLinks = isReviewer(user?.roles || []) ? [{ label: "Reviewer Portal", to: "/reviewer" }] : [];
  const allNavItems = [
    ...navItems,
    ...adminLinks.map(l => ({ label: l.label, to: l.to, icon: <ShieldCheck className="h-4 w-4" /> })),
    ...reviewerLinks.map(l => ({ label: l.label, to: l.to, icon: <Bell className="h-4 w-4" /> })),
  ];

  return (
    <DashboardLayout navItems={allNavItems} title="My Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <h2 className="font-heading text-2xl font-bold mb-1">
            Welcome back, {user?.profile?.full_name?.split(" ")[0] || "Researcher"}!
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {user?.profile?.institution && (
              <>
                <span className="text-muted-foreground/40 text-sm hidden sm:inline">·</span>
                <p className="text-muted-foreground text-sm">{user.profile.institution}</p>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Membership", value: membership ? membership.membership_plans?.name : "None", sub: membership ? "Active" : "No active plan" },
            { label: "Saved Items", value: savedCount, sub: "In your library" },
            { label: "My Roles", value: user?.roles?.length || 0, sub: user?.roles?.join(", ") || "registered_user" },
            { label: "Account", value: "Active", sub: user?.email || "" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow">
              <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
              <p className="text-xl font-bold truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Admin Access Card */}
        {isAdmin(user?.roles || []) && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 card-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold">Admin Console Access</h3>
                <p className="text-sm text-muted-foreground">You have administrative privileges. Manage users, billing, and system settings.</p>
              </div>
            </div>
            <Link to="/admin">
              <Button className="font-bold">Enter Admin Portal</Button>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link to="/submit-paper">
              <Button className="flex items-center gap-2"><PenSquare className="h-4 w-4" /> Submit a Journal</Button>
            </Link>
            <Link to="/author">
              <Button variant="outline" className="flex items-center gap-2"><FileText className="h-4 w-4" /> My Submissions</Button>
            </Link>
            <Link to="/publications">
              <Button variant="outline" className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Browse Publications</Button>
            </Link>
          </div>
        </div>

        {/* Membership status card */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold">Membership Status</h3>
            <Link to="/portal/membership"><Button size="sm" variant="outline">{membership ? "Manage" : "Upgrade"}</Button></Link>
          </div>
          {membership ? (
            <div className="flex items-center gap-3">
              <Badge className="bg-success/10 text-success border-success/20">{membership.membership_plans?.name} Plan</Badge>
              <span className="text-sm text-muted-foreground">Expires: {membership.ends_at ? new Date(membership.ends_at).toLocaleDateString() : "N/A"}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">You don't have an active membership. <Link to="/portal/membership" className="text-primary hover:underline">View plans →</Link></p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-4">User Data</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{user?.profile?.full_name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Institution</p>
              <p className="font-medium">{user?.profile?.institution || "Not provided"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Roles</p>
              <p className="font-medium">{(user?.roles || ["registered_user"]).join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
