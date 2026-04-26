import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BookOpen, FileText, PenSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/contexts/AuthContext";
import { authApi, libraryApi, membershipApi } from "@/lib/api";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";

export default function PortalDashboard() {
  const { user } = useAuth();
  const [membership, setMembership] = useState<any>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [membershipRes, meRes, savedRes] = await Promise.all([
          membershipApi.getMy().catch(() => null),
          authApi.getMe().catch(() => null),
          libraryApi.getMySaved().catch(() => []),
        ]);

        const membershipsArray = Array.isArray((membershipRes as any)?.memberships)
          ? (membershipRes as any).memberships
          : Array.isArray((membershipRes as any)?.items)
          ? (membershipRes as any).items
          : Array.isArray(membershipRes)
          ? (membershipRes as any[])
          : [];

        const approvedFromList = membershipsArray.find((m: any) =>
          ["active", "renewal_due", "approved"].includes(String(m?.status || "").toLowerCase())
        );

        const membershipPayload =
          approvedFromList ||
          (membershipRes as any)?.membership ||
          (membershipRes as any)?.currentMembership ||
          (membershipRes as any)?.data?.membership ||
          ((membershipRes as any)?.id || (membershipRes as any)?._id || (membershipRes as any)?.plan
            ? (membershipRes as any)
            : null);

        const meMembership = (meRes as any)?.membership || null;

        const normalizedMembership = membershipPayload
          ? {
              ...membershipPayload,
              plan_id: membershipPayload?.plan?._id || membershipPayload?.plan || membershipPayload?.planId || null,
              membership_plans: {
                name: membershipPayload?.plan?.name || membershipPayload?.membership_plans?.name || null,
                price: Number(membershipPayload?.plan?.price || membershipPayload?.membership_plans?.price || 0),
                billing_period:
                  membershipPayload?.plan?.billingPeriod ||
                  membershipPayload?.membership_plans?.billing_period ||
                  null,
              },
              ends_at: membershipPayload?.endsAt || membershipPayload?.ends_at || null,
              status: membershipPayload?.status || null,
            }
          : meMembership && ["active", "renewal_due", "approved"].includes(String(meMembership?.status || "").toLowerCase())
          ? {
              plan_id: meMembership?.plan?._id || meMembership?.plan || meMembership?.planId || null,
              membership_plans: {
                name: meMembership?.plan?.name || "Active",
                price: Number(meMembership?.plan?.price || 0),
                billing_period: meMembership?.plan?.billingPeriod || null,
              },
              ends_at: meMembership?.endsAt || meMembership?.ends_at || null,
              status: meMembership?.status || "active",
            }
          : user?.membershipStatus && ["active", "renewal_due", "approved"].includes(String(user.membershipStatus).toLowerCase())
          ? {
              membership_plans: { name: "Active", price: 0, billing_period: null },
              ends_at: null,
              status: user.membershipStatus,
            }
          : (user?.roles || []).some((r) => ["member", "subscriber"].includes(String(r)))
          ? {
              membership_plans: { name: "Active", price: 0, billing_period: null },
              ends_at: null,
              status: "active",
            }
          : null;

        setMembership(normalizedMembership);
        const savedRows = Array.isArray((savedRes as any[]))
          ? (savedRes as any[])
          : Array.isArray((savedRes as any)?.items)
          ? (savedRes as any).items
          : Array.isArray((savedRes as any)?.saved)
          ? (savedRes as any).saved
          : [];
        setSavedCount(savedRows.length);
      } catch {
        setMembership(null);
        setSavedCount(0);
      }
    })();
  }, [user]);

  const allNavItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});

  return (
    <DashboardLayout navItems={allNavItems} title="My Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <h2 className="font-heading text-2xl font-bold mb-1">
            Welcome back, {user?.fullName?.split(" ")[0] || "Researcher"}!
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            {user?.institution && (
              <>
                <span className="text-muted-foreground/40 text-sm hidden sm:inline">|</span>
                <p className="text-muted-foreground text-sm">{user.institution}</p>
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
            <p className="text-sm text-muted-foreground">You don't have an active membership. <Link to="/portal/membership" className="text-primary hover:underline">View plans -&gt;</Link></p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-4">User Data</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Full Name</p>
              <p className="font-medium">{user?.fullName || "Not provided"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "N/A"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Institution</p>
              <p className="font-medium">{user?.institution || "Not provided"}</p>
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

