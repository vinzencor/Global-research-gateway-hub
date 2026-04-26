import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, Users, BookOpen, CreditCard, Star, ClipboardList, GitBranch, UserCheck, BarChart3, TrendingUp, ArrowLeftRight, CheckCircle2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentApi, adminApi, journalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AdminContent from "@/pages/admin/AdminContent";
import AdminPeople from "@/pages/admin/AdminPeople";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminLibrary from "@/pages/admin/AdminLibrary";
import AdminWorkflow from "@/pages/admin/AdminWorkflow";
import AdminSubAdmins from "@/pages/admin/AdminSubAdmins";
import AdminJournalPipeline from "@/pages/admin/AdminJournalPipeline";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminValidateUsers from "@/pages/admin/AdminValidateUsers";
import AdminRoles from "@/pages/admin/AdminRoles";

type AdminNavItem = { label: string; to: string; icon: JSX.Element; moduleKey?: string };

const navItems: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", moduleKey: "dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Journal Pipeline", to: "/admin/pipeline", moduleKey: "pipeline", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Analytics", to: "/admin/analytics", moduleKey: "analytics", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Workflow Designer", to: "/admin/workflow", moduleKey: "workflow", icon: <GitBranch className="h-4 w-4" /> },
  { label: "Sub-Admins", to: "/admin/sub-admins", moduleKey: "sub_admins", icon: <UserCheck className="h-4 w-4" /> },
  { label: "Content", to: "/admin/content", moduleKey: "content", icon: <FileText className="h-4 w-4" /> },
  { label: "Review Queue", to: "/admin/reviews", moduleKey: "reviews", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Featured Users", to: "/admin/people", moduleKey: "people", icon: <Star className="h-4 w-4" /> },
  { label: "Digital Library", to: "/admin/library", moduleKey: "library", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Users & Roles", to: "/admin/users", moduleKey: "users", icon: <Users className="h-4 w-4" /> },
  { label: "Roles", to: "/admin/roles", moduleKey: "roles", icon: <Shield className="h-4 w-4" /> },
  { label: "Validate New Users", to: "/admin/validate-users", moduleKey: "validate_users", icon: <CheckCircle2 className="h-4 w-4" /> },
  { label: "Billing", to: "/admin/billing", moduleKey: "billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Switch to User Portal", to: "/portal/dashboard", icon: <ArrowLeftRight className="h-4 w-4" /> },
];

export default function AdminPortal() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ content: 0, inReview: 0, published: 0, featuredUsers: 0, users: 0, members: 0, pendingApprovals: 0, submittedJournals: 0 });
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [analytics, journals] = await Promise.all([
          adminApi.getAnalytics(),
          journalApi.adminList({ limit: "200" }),
        ]);
        const journalItems = journals?.items || journals || [];
        setStats({
          content: analytics?.totalContent || 0,
          inReview: analytics?.inReview || 0,
          published: analytics?.published || 0,
          featuredUsers: analytics?.featuredUsers || 0,
          users: 0,
          members: analytics?.activeMembers || 0,
          pendingApprovals: analytics?.pendingApprovals || 0,
          submittedJournals: journalItems.filter((j: any) => j.status === "submitted").length,
        });
        setRecentJournals(journalItems.slice(0, 6));
      } catch (err) {
        console.error("Failed to load admin stats", err);
      }
    })();
  }, []);

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground", in_review: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-info/10 text-info border-info/20", published: "bg-success/10 text-success border-success/20",
    archived: "bg-destructive/10 text-destructive border-destructive/20", changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  };

  function canAccess(moduleKey?: string) {
    if (!moduleKey) return true;
    if (user?.roles.includes("super_admin")) return true;
    return user?.moduleAccess?.[moduleKey] !== false;
  }

  const filteredNavItems = navItems.filter((n) => canAccess(n.moduleKey));

  const AccessDenied = (
    <div className="rounded-xl border bg-card p-6 card-shadow">
      <h3 className="font-heading font-bold mb-2">Access Restricted</h3>
      <p className="text-sm text-muted-foreground">Your role does not have permission for this admin module.</p>
    </div>
  );

  return (
    <DashboardLayout navItems={filteredNavItems} title="Admin Console">
      <Routes>
        <Route path="/" element={canAccess("dashboard") ?
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Content", value: stats.content, action: () => navigate("/admin/content") },
                { label: "Submitted Journals", value: stats.submittedJournals, action: () => navigate("/admin/pipeline") },
                { label: "In Review", value: stats.inReview, action: () => navigate("/admin/reviews") },
                { label: "Published", value: stats.published, action: () => navigate("/admin/content") },
                { label: "Featured Users", value: stats.featuredUsers, action: () => navigate("/admin/people") },
                { label: "Active Members", value: stats.members, action: () => navigate("/admin/billing") },
                { label: "Pending Approvals", value: stats.pendingApprovals, action: () => navigate("/admin/validate-users") },
              ].map((s) => (
                <button key={s.label} onClick={s.action} className="rounded-xl border bg-card p-5 card-shadow text-left hover:border-primary/40 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Create Content", desc: "Add new articles, publications, pages", action: () => navigate("/admin/content"), btn: "Create" },
                { title: "Review Queue", desc: "Review pending content submissions", action: () => navigate("/admin/reviews"), btn: "View Queue" },
                { title: "Validate New Users", desc: `Approve pending memberships and upgrades (${stats.pendingApprovals} pending).`, action: () => navigate("/admin/validate-users"), btn: "Open Validation" },
                { title: "Manage Featured Users", desc: "Feature published users for the public authors page", action: () => navigate("/admin/people"), btn: "Manage" },
                { title: "Digital Library", desc: "Upload and manage library papers", action: () => navigate("/admin/library"), btn: "Manage" },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border bg-card p-5 card-shadow">
                  <h3 className="font-heading font-bold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                  <Button size="sm" onClick={c.action}>{c.btn}</Button>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-card card-shadow overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-heading font-bold">Recent Journal Submissions</h2>
                <Button size="sm" variant="ghost" onClick={() => navigate("/admin/pipeline")}>View all</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Institution</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  </tr></thead>
                  <tbody>
                    {recentJournals.map((item) => (
                      <tr key={item._id || item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium max-w-[200px] truncate">{item.title}</td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">{item.institution || "-"}</td>
                        <td className="p-4"><Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge></td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(item.createdAt || item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        : AccessDenied} />
        <Route path="/pipeline" element={canAccess("pipeline") ? <AdminJournalPipeline /> : AccessDenied} />
        <Route path="/analytics" element={canAccess("analytics") ? <AdminAnalytics /> : AccessDenied} />
        <Route path="/workflow" element={canAccess("workflow") ? <AdminWorkflow /> : AccessDenied} />
        <Route path="/sub-admins" element={canAccess("sub_admins") ? <AdminSubAdmins /> : AccessDenied} />
        <Route path="/content" element={canAccess("content") ? <AdminContent /> : AccessDenied} />
        <Route path="/content/*" element={canAccess("content") ? <AdminContent /> : AccessDenied} />
        <Route path="/reviews" element={canAccess("reviews") ? <AdminReviews /> : AccessDenied} />
        <Route path="/people" element={canAccess("people") ? <AdminPeople /> : AccessDenied} />
        <Route path="/library" element={canAccess("library") ? <AdminLibrary /> : AccessDenied} />
        <Route path="/users" element={canAccess("users") ? <AdminUsers /> : AccessDenied} />
        <Route path="/roles" element={canAccess("roles") ? <AdminRoles /> : AccessDenied} />
        <Route path="/validate-users" element={canAccess("validate_users") ? <AdminValidateUsers /> : AccessDenied} />
        <Route path="/billing" element={canAccess("billing") ? <AdminBilling /> : AccessDenied} />
      </Routes>
    </DashboardLayout>
  );
}
