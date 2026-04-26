import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, ClipboardList, Settings, BarChart2, CheckCircle, Clock, XCircle, GitBranch, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/legacyDb";
import { useAuth } from "@/contexts/AuthContext";

export const editorNavItems = [
  { label: "Dashboard", to: "/editor", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Review Queue", to: "/reviewer/stage", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Reports", to: "/editor/report", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Settings", to: "/editor/settings", icon: <Settings className="h-4 w-4" /> },
];

export default function EditorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ stages: 0, pending: 0, inReview: 0, approved: 0, changesRequested: 0, rejected: 0, total: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [myStages, setMyStages] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
    // Get workflow stages assigned to this editor
    const { data: stages } = await db
      .from("workflow_stages")
      .select("id, stage_name, order_index, template_id")
      .eq("assigned_user_id", user!.id);

    setMyStages(stages || []);
    const stageCount = stages?.length || 0;

    let pendingCount = 0;
    let inReviewCount = 0;
    let pendingItems: any[] = [];

    if (stages && stages.length > 0) {
      const templateIds = stages.map((s: any) => s.template_id);
      const { data: items } = await db
        .from("content_items")
        .select("id, title, type, workflow_status, current_stage_index, workflow_template_id, created_at")
        .in("workflow_template_id", templateIds)
        .in("workflow_status", ["submitted", "in_review"]);

      (items || []).forEach((item: any) => {
        const atMyStage = stages.some(
          (s: any) => s.template_id === item.workflow_template_id && s.order_index === item.current_stage_index
        );
        if (atMyStage) {
          if (item.workflow_status === "submitted") pendingCount++;
          else inReviewCount++;
          pendingItems.push(item);
        }
      });
    }
    setPendingReviews(pendingItems.slice(0, 5));

    // Review history from workflow_logs
    const { data: allLogsData } = await db
      .from("workflow_logs")
      .select("id, action, acted_at, content_id")
      .eq("acted_by", user!.id)
      .order("acted_at", { ascending: false });

    const allLogs = allLogsData || [];
    const approved = allLogs.filter((l: any) => l.action === "approved").length;
    const changesReq = allLogs.filter((l: any) => l.action === "changes_requested").length;
    const rejected = allLogs.filter((l: any) => l.action === "rejected").length;

    setStats({ stages: stageCount, pending: pendingCount, inReview: inReviewCount, approved, changesRequested: changesReq, rejected, total: allLogs.length });
    setRecentLogs(allLogs.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <DashboardLayout navItems={editorNavItems} title="Editor Portal">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={editorNavItems} title="Editor Portal">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <h2 className="font-heading text-2xl font-bold mb-1">
            Welcome, {user?.profile?.full_name?.split(" ")[0] || "Editor"}!
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Assigned Stages", value: stats.stages, icon: <GitBranch className="h-5 w-5 text-primary" />, color: "text-primary" },
            { label: "Pending Review", value: stats.pending, icon: <Clock className="h-5 w-5 text-warning" />, color: "text-warning" },
            { label: "Currently In Review", value: stats.inReview, icon: <ClipboardList className="h-5 w-5 text-blue-500" />, color: "text-blue-500" },
            { label: "Total Reviewed", value: stats.total, icon: <CheckCircle className="h-5 w-5 text-success" />, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow flex items-center gap-4">
              <div className="shrink-0">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5 card-shadow text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Approved (total)</p>
          </div>
          <div className="rounded-xl border bg-card p-5 card-shadow text-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-500">
              {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground">Approval Rate</p>
          </div>
          <div className="rounded-xl border bg-card p-5 card-shadow flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">Ready to review?</p>
            <Button onClick={() => navigate("/reviewer/stage")} className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Open Review Queue
            </Button>
          </div>
        </div>

        {/* My Assigned Stages */}
        {myStages.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-heading font-bold">My Assigned Workflow Stages</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Set by the Admin in the Workflow Designer</p>
            </div>
            <div className="divide-y">
              {myStages.map((s: any) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {s.order_index + 1}
                    </span>
                    <span className="font-medium text-sm">{s.stage_name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Assigned</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Items at My Stages */}
        {pendingReviews.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-heading font-bold">Pending at My Stages</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate("/reviewer/stage")}>View all</Button>
            </div>
            <div className="divide-y">
              {pendingReviews.map((item: any) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.type} Â· {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                    {item.workflow_status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-heading font-bold">Recent Review Activity</h3>
            </div>
            <div className="divide-y">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {log.action === "approved" && <CheckCircle className="h-4 w-4 text-success" />}
                    {log.action === "changes_requested" && <XCircle className="h-4 w-4 text-orange-500" />}
                    {log.action === "rejected" && <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm capitalize">{log.action?.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.acted_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
