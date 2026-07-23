import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, Users, BookOpen, CreditCard, Star, ClipboardList, GitBranch, BarChart3, TrendingUp, ArrowLeftRight, CheckCircle2, Shield, Eye, Clock, CheckCircle, Layers, Bell, BellOff, Banknote, LogOut, FileBarChart, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentApi, adminApi, journalApi, notificationsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
import AdminHappenings from "@/pages/admin/AdminHappenings";
import AdminJournalPayments from "@/pages/admin/AdminJournalPayments";
import AdminWithdrawals from "@/pages/admin/AdminWithdrawals";
import AdminPaymentReports from "@/pages/admin/AdminPaymentReports";
import AdminSupportTickets from "@/pages/admin/AdminSupportTickets";
import { Megaphone } from "lucide-react";
import { isModuleAllowed } from "@/lib/portalNav";

type AdminNavItem = { label: string; to: string; icon: JSX.Element; moduleKey?: string };

const navItems: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", moduleKey: "dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Paper Pipeline", to: "/admin/pipeline", moduleKey: "pipeline", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Journal Payments", to: "/admin/journal-payments", moduleKey: "pipeline", icon: <Banknote className="h-4 w-4" /> },
  { label: "Withdrawals", to: "/admin/withdrawals", moduleKey: "pipeline", icon: <LogOut className="h-4 w-4" /> },
  { label: "Analytics", to: "/admin/analytics", moduleKey: "analytics", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Workflow Designer", to: "/admin/workflow", moduleKey: "workflow", icon: <GitBranch className="h-4 w-4" /> },
  { label: "Content", to: "/admin/content", moduleKey: "content", icon: <FileText className="h-4 w-4" /> },
  { label: "Happenings", to: "/admin/happenings", moduleKey: "happenings", icon: <Megaphone className="h-4 w-4" /> },
  { label: "Review Queue", to: "/admin/reviews", moduleKey: "reviews", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Featured Users", to: "/admin/people", moduleKey: "people", icon: <Star className="h-4 w-4" /> },
  { label: "Digital Library", to: "/admin/library", moduleKey: "library", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Users & Roles", to: "/admin/users", moduleKey: "users", icon: <Users className="h-4 w-4" /> },
  { label: "Roles", to: "/admin/roles", moduleKey: "roles", icon: <Shield className="h-4 w-4" /> },
  { label: "Validate New Users", to: "/admin/validate-users", moduleKey: "validate_users", icon: <CheckCircle2 className="h-4 w-4" /> },
  { label: "Support Tickets", to: "/admin/support-tickets", moduleKey: "support_tickets", icon: <HelpCircle className="h-4 w-4" /> },
  // { label: "Billing", to: "/admin/billing", moduleKey: "billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Payment Reports", to: "/admin/payment-reports", moduleKey: "billing", icon: <FileBarChart className="h-4 w-4" /> },
  { label: "Switch to User Portal", to: "/portal/dashboard", icon: <ArrowLeftRight className="h-4 w-4" /> },
];

export default function AdminPortal() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ content: 0, inReview: 0, published: 0, featuredUsers: 0, users: 0, members: 0, pendingApprovals: 0, submittedJournals: 0 });
  const [recentJournals, setRecentJournals] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [analytics, journals, notifData] = await Promise.all([
          adminApi.getAnalytics(),
          journalApi.adminList({ limit: "200" }),
          notificationsApi.list({ limit: 20 }).catch(() => null),
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
        if (notifData) {
          setNotifications((notifData as any).notifications || []);
          setUnreadCount((notifData as any).unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to load admin stats", err);
        toast.error("Could not load dashboard data. Please refresh.");
      }
    })();
  }, []);

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground", in_review: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-info/10 text-info border-info/20", published: "bg-success/10 text-success border-success/20",
    archived: "bg-destructive/10 text-destructive border-destructive/20", changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
    withdrawn: "bg-gray-500/10 text-gray-600 border-gray-200", rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  function canAccess(moduleKey?: string) {
    if (!moduleKey) return true;
    if (user?.roles.includes("super_admin")) return true;
    return isModuleAllowed(moduleKey, user?.moduleAccess || {});
  }

  const filteredNavItems = navItems.filter((n) => canAccess(n.moduleKey));

  const AccessDenied = (
    <div className="rounded-xl border bg-card p-8 card-shadow flex flex-col items-center text-center gap-3">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <Shield className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h3 className="font-heading font-bold mb-1">Access Denied</h3>
        <p className="text-sm text-muted-foreground">Your role does not have permission for this admin module.</p>
      </div>
    </div>
  );

  const statCards = [
    { label: "Total Content", value: stats.content, icon: <Layers className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30", action: () => navigate("/admin/content") },
    { label: "Submitted Journals", value: stats.submittedJournals, icon: <FileText className="h-5 w-5" />, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30", action: () => navigate("/admin/pipeline") },
    { label: "In Review", value: stats.inReview, icon: <Eye className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30", action: () => navigate("/admin/reviews") },
    { label: "Published", value: stats.published, icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30", action: () => navigate("/admin/content") },
    { label: "Featured Users", value: stats.featuredUsers, icon: <Star className="h-5 w-5" />, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", action: () => navigate("/admin/people") },
    { label: "Active Members", value: stats.members, icon: <Users className="h-5 w-5" />, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30", action: () => navigate("/admin/billing") },
    { label: "Pending Approvals", value: stats.pendingApprovals, icon: <Clock className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30", action: () => navigate("/admin/validate-users") },
  ];

  return (
    <DashboardLayout navItems={filteredNavItems} title="Admin Console">
      <Routes>
        <Route path="/" element={canAccess("dashboard") ?
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border p-6 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-heading text-2xl font-bold">Welcome, {user?.profile?.full_name?.split(" ")[0] || "Admin"} 👋</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Here's an overview of your platform activity.</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate("/admin/analytics")} className="gap-1.5">
                  <TrendingUp className="h-4 w-4" /> Analytics
                </Button>
                <Button size="sm" onClick={() => navigate("/admin/validate-users")} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} Pending` : "Validations"}
                </Button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {statCards.map((s) => (
                <button key={s.label} onClick={s.action} className="rounded-xl border bg-card p-4 card-shadow text-left hover:border-primary/40 hover:shadow-md transition-all group">
                  <div className={`inline-flex p-2 rounded-lg ${s.bg} ${s.color} mb-3 group-hover:scale-110 transition-transform`}>
                    {s.icon}
                  </div>
                  <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3 px-0.5">Quick Actions</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { title: "Create Content", desc: "Add new articles, publications, pages", action: () => navigate("/admin/content"), btn: "Create", icon: <FileText className="h-5 w-5 text-blue-500" />, color: "border-blue-200 dark:border-blue-900" },
                  { title: "Review Queue", desc: "Review pending content submissions", action: () => navigate("/admin/reviews"), btn: "View Queue", icon: <ClipboardList className="h-5 w-5 text-amber-500" />, color: "border-amber-200 dark:border-amber-900" },
                  { title: "Validate New Users", desc: `Approve pending memberships (${stats.pendingApprovals} pending)`, action: () => navigate("/admin/validate-users"), btn: "Open", icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, color: "border-emerald-200 dark:border-emerald-900" },
                  { title: "Featured Users", desc: "Feature published users for the public page", action: () => navigate("/admin/people"), btn: "Manage", icon: <Star className="h-5 w-5 text-orange-500" />, color: "border-orange-200 dark:border-orange-900" },
                  { title: "Digital Library", desc: "Upload and manage library papers", action: () => navigate("/admin/library"), btn: "Manage", icon: <BookOpen className="h-5 w-5 text-violet-500" />, color: "border-violet-200 dark:border-violet-900" },
                  { title: "Manage Happenings", desc: "Update news and events on homepage", action: () => navigate("/admin/happenings"), btn: "Manage", icon: <Megaphone className="h-5 w-5 text-pink-500" />, color: "border-pink-200 dark:border-pink-900" },
                ].map((c) => (
                  <div key={c.title} className={`rounded-xl border ${c.color} bg-card p-5 card-shadow hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-muted/60">{c.icon}</div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{c.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{c.desc}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={c.action} className="w-full">{c.btn}</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications panel */}
            <div className="rounded-xl border bg-card card-shadow overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <h2 className="font-heading font-bold">Recent Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-white text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1"
                    onClick={async () => {
                      await notificationsApi.markAllRead().catch(() => null);
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                      setUnreadCount(0);
                    }}
                  >
                    <BellOff className="h-3 w-3" /> Mark all read
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((n: any) => (
                    <div
                      key={n._id}
                      className={`flex items-start gap-3 px-5 py-4 transition-colors ${n.read ? "opacity-60" : "bg-primary/5"}`}
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.read ? "bg-muted-foreground/30" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs shrink-0 h-7 px-2"
                          onClick={async () => {
                            await notificationsApi.markRead(n._id).catch(() => null);
                            setNotifications((prev) =>
                              prev.map((x) => x._id === n._id ? { ...x, read: true } : x)
                            );
                            setUnreadCount((c) => Math.max(0, c - 1));
                          }}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent journals table */}
            <div className="rounded-xl border bg-card card-shadow overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <h2 className="font-heading font-bold">Recent Journal Submissions</h2>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate("/admin/pipeline")} className="text-xs gap-1">
                  View all <TrendingUp className="h-3 w-3" />
                </Button>
              </div>
              {recentJournals.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No journal submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Title</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Institution</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                        <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJournals.map((item) => (
                        <tr key={item._id || item.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5 font-medium max-w-[200px] truncate">{item.title}</td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell text-sm">{item.institution || "—"}</td>
                          <td className="px-5 py-3.5"><Badge variant="outline" className={`text-xs ${statusColor[item.status]}`}>{item.status}</Badge></td>
                          <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">{new Date(item.createdAt || item.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        : AccessDenied} />
        <Route path="/pipeline" element={canAccess("pipeline") ? <AdminJournalPipeline /> : AccessDenied} />
        <Route path="/journal-payments" element={canAccess("pipeline") ? <AdminJournalPayments /> : AccessDenied} />
        <Route path="/withdrawals" element={canAccess("pipeline") ? <AdminWithdrawals /> : AccessDenied} />
        <Route path="/analytics" element={canAccess("analytics") ? <AdminAnalytics /> : AccessDenied} />
        <Route path="/workflow" element={canAccess("workflow") ? <AdminWorkflow /> : AccessDenied} />
        <Route path="/sub-admins" element={canAccess("sub_admins") ? <AdminSubAdmins /> : AccessDenied} />
        <Route path="/content" element={canAccess("content") ? <AdminContent /> : AccessDenied} />
        <Route path="/content/*" element={canAccess("content") ? <AdminContent /> : AccessDenied} />
        <Route path="/happenings" element={canAccess("happenings") ? <AdminHappenings /> : AccessDenied} />
        <Route path="/reviews" element={canAccess("reviews") ? <AdminReviews /> : AccessDenied} />
        <Route path="/people" element={canAccess("people") ? <AdminPeople /> : AccessDenied} />
        <Route path="/library" element={canAccess("library") ? <AdminLibrary /> : AccessDenied} />
        <Route path="/users" element={canAccess("users") ? <AdminUsers /> : AccessDenied} />
        <Route path="/roles" element={canAccess("roles") ? <AdminRoles /> : AccessDenied} />
        <Route path="/validate-users" element={canAccess("validate_users") ? <AdminValidateUsers /> : AccessDenied} />
        <Route path="/support-tickets" element={canAccess("support_tickets") ? <AdminSupportTickets /> : AccessDenied} />
        <Route path="/billing" element={canAccess("billing") ? <AdminBilling /> : AccessDenied} />
        <Route path="/payment-reports" element={canAccess("billing") ? <AdminPaymentReports /> : AccessDenied} />
      </Routes>
    </DashboardLayout>
  );
}
