import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClipboardList, CheckCircle, Clock, XCircle, GitBranch, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { workflowApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getSubAdminNavItemsForRoles } from "@/lib/portalNav";

export default function SubAdminPortal() {
  const { user } = useAuth();
  const subAdminNavItems = getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, inReview: 0, approved: 0, changesRequested: 0, rejected: 0, queueSize: 0 });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch items currently in my queue from the backend
      const queue: any = await workflowApi.getMyQueue();
      const pendingCount = (queue || []).filter((i: any) => (i.workflowStatus || i.status) === 'submitted').length;
      const inReviewCount = (queue || []).filter((i: any) => (i.workflowStatus || i.status) === 'in_review').length;

      // Fetch my lifetime stats
      let approved = 0, changesRequested = 0, rejected = 0;
      try {
        const score: any = await workflowApi.getMyScore();
        approved = score?.approvals || 0;
        changesRequested = score?.changesRequested || 0;
        rejected = score?.rejections || 0;
      } catch {}

      setStats({
        pending: pendingCount,
        inReview: inReviewCount,
        approved,
        changesRequested,
        rejected,
        queueSize: (queue || []).length,
      });
    } catch {
      // Silently handle — dashboard just shows 0s
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <DashboardLayout navItems={subAdminNavItems} title="Sub-Admin Portal">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={subAdminNavItems} title="Sub-Admin Portal">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-8 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-1">
                Welcome back, {user?.profile?.full_name?.split(" ")[0] || "Sub-Admin"}!
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button onClick={() => navigate("/reviewer/stage")} size="lg" className="gap-2 shadow-lg shadow-primary/20">
              <ClipboardList className="h-4 w-4" /> Open Review Queue
            </Button>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Items In My Queue", value: stats.queueSize, icon: <GitBranch className="h-5 w-5 text-primary" />, color: "text-primary" },
            { label: "Pending Review", value: stats.pending, icon: <Clock className="h-5 w-5 text-warning" />, color: "text-warning" },
            { label: "Currently In Review", value: stats.inReview, icon: <ClipboardList className="h-5 w-5 text-blue-500" />, color: "text-blue-500" },
            { label: "Total Approved", value: stats.approved, icon: <CheckCircle className="h-5 w-5 text-success" />, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 rounded-lg bg-muted/50">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="flex items-center gap-2 px-1">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-heading font-bold">Review Performance</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Approved</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-500">{stats.changesRequested}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Changes Req.</p>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rejected</p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold">Ready to start reviewing?</p>
            <p className="text-xs text-muted-foreground">You have {stats.pending + stats.inReview} items waiting in your queue.</p>
          </div>
          <Button onClick={() => navigate("/reviewer/stage")} size="lg" className="shrink-0 shadow-lg shadow-primary/20">
            Open Review Queue
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
