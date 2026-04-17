import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Users, FileText, CheckCircle, XCircle, Award, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SCORE_APPROVED = 10;
const SCORE_CHANGES = 5;
const SCORE_REJECTED = 3;

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 card-shadow">
      <div className="flex items-center gap-3 mb-2">{icon}<p className="text-xs text-muted-foreground">{label}</p></div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminReport() {
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [subAdminStats, setSubAdminStats] = useState<any[]>([]);
  const [reviewerStats, setReviewerStats] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalUsers: 0, totalContent: 0, published: 0, inReview: 0,
    totalWorkflowActions: 0, totalPeerReviews: 0,
    submitted: 0, declined: 0,
  });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
    // Overall stats
    const [allContent, published, inReview, profiles, allWorkflowLogs, allReviews] = await Promise.all([
      supabase.from("content_items").select("id", { count: "exact" }),
      supabase.from("content_items").select("id", { count: "exact" }).eq("status", "published"),
      supabase.from("content_items").select("id", { count: "exact" }).eq("status", "in_review"),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("workflow_logs").select("id, action, acted_by, acted_at"),
      supabase.from("reviews").select("id, status, recommendation, reviewer_user_id, submitted_at"),
    ]);

    setOverallStats({
      totalUsers: profiles.count || 0,
      totalContent: allContent.count || 0,
      published: published.count || 0,
      inReview: inReview.count || 0,
      totalWorkflowActions: allWorkflowLogs.data?.length || 0,
      totalPeerReviews: allReviews.data?.length || 0,
      submitted: allReviews.data?.filter(r => r.status === "submitted").length || 0,
      declined: allReviews.data?.filter(r => r.status === "declined").length || 0,
    });

    // Sub-admin stats via workflow_logs
    const { data: subAdminRole } = await supabase.from("roles").select("id").eq("name", "sub_admin").single();
    const { data: editorRole } = await supabase.from("roles").select("id").eq("name", "editor").single();
    const roleIds = [subAdminRole?.id, editorRole?.id].filter(Boolean);
    if (roleIds.length > 0) {
      const { data: saRows } = await supabase.from("user_roles").select("user_id, roles(name)").in("role_id", roleIds);
      const saIds = (saRows || []).map((u: any) => u.user_id);
      if (saIds.length > 0) {
        const { data: saProfiles } = await supabase.from("profiles").select("id, full_name, institution").in("id", saIds);
        const { data: saLogs } = await supabase.from("workflow_logs").select("action, acted_by").in("acted_by", saIds);
        const roleMap: Record<string, string> = {};
        (saRows || []).forEach((r: any) => { roleMap[r.user_id] = r.roles?.name || "sub_admin"; });

        const saStats = (saProfiles || []).map((p: any) => {
          const logs = (saLogs || []).filter((l: any) => l.acted_by === p.id);
          const approved = logs.filter((l: any) => l.action === "approved").length;
          const changes = logs.filter((l: any) => l.action === "changes_requested").length;
          const rejected = logs.filter((l: any) => l.action === "rejected").length;
          const total = logs.length;
          const score = approved * SCORE_APPROVED + changes * SCORE_CHANGES + rejected * SCORE_REJECTED;
          return { ...p, role: roleMap[p.id] || "sub_admin", approved, changes, rejected, total, score };
        }).sort((a, b) => b.score - a.score);
        setSubAdminStats(saStats);
      }
    }

    // Reviewer stats via reviews table
    const { data: revRole } = await supabase.from("roles").select("id").eq("name", "reviewer").single();
    if (revRole?.id) {
      const { data: revRows } = await supabase.from("user_roles").select("user_id").eq("role_id", revRole.id);
      const revIds = (revRows || []).map((u: any) => u.user_id);
      if (revIds.length > 0) {
        const { data: revProfiles } = await supabase.from("profiles").select("id, full_name, institution").in("id", revIds);
        const revMap: Record<string, any[]> = {};
        (allReviews.data || []).forEach((r: any) => {
          if (!revMap[r.reviewer_user_id]) revMap[r.reviewer_user_id] = [];
          revMap[r.reviewer_user_id].push(r);
        });
        const revStats = (revProfiles || []).map((p: any) => {
          const reviews = revMap[p.id] || [];
          const submitted = reviews.filter(r => r.status === "submitted").length;
          const declined = reviews.filter(r => r.status === "declined").length;
          const total = reviews.length;
          const rate = total > 0 ? Math.round((submitted / total) * 100) : 0;
          return { ...p, total, submitted, declined, completionRate: rate };
        }).sort((a, b) => b.submitted - a.submitted);
        setReviewerStats(revStats);
      }
    }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
  );

  const maxScore = Math.max(...subAdminStats.map(s => s.score), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-6 w-6 text-primary" />
          <div>
            <h2 className="font-heading text-xl font-bold">Platform Reports</h2>
            <p className="text-sm text-muted-foreground">Total aggregated reports across all users</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="sub_admin">Sub-Admins & Editors</SelectItem>
              <SelectItem value="reviewer">Reviewers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={overallStats.totalUsers} icon={<Users className="h-5 w-5 text-primary" />} color="text-primary" />
        <StatCard label="Total Content" value={overallStats.totalContent} icon={<FileText className="h-5 w-5 text-blue-500" />} color="text-blue-500" />
        <StatCard label="Published" value={overallStats.published} icon={<CheckCircle className="h-5 w-5 text-success" />} color="text-success" />
        <StatCard label="In Review" value={overallStats.inReview} icon={<Award className="h-5 w-5 text-warning" />} color="text-warning" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Workflow Actions" value={overallStats.totalWorkflowActions} icon={<BarChart2 className="h-5 w-5 text-purple-500" />} color="text-purple-500" />
        <StatCard label="Peer Reviews Assigned" value={overallStats.totalPeerReviews} icon={<FileText className="h-5 w-5 text-orange-500" />} color="text-orange-500" />
        <StatCard label="Reviews Submitted" value={overallStats.submitted} icon={<CheckCircle className="h-5 w-5 text-success" />} color="text-success" />
        <StatCard label="Reviews Declined" value={overallStats.declined} icon={<XCircle className="h-5 w-5 text-destructive" />} color="text-destructive" />
      </div>

      {/* Sub-Admin & Editor Performance */}
      {(roleFilter === "all" || roleFilter === "sub_admin") && subAdminStats.length > 0 && (
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-bold">Sub-Admin & Editor Performance</h3>
            <Badge variant="outline" className="ml-auto text-xs">{subAdminStats.length} users</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Role</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Score</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Approved</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Changes</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Rejected</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Progress</th>
              </tr></thead>
              <tbody>
                {subAdminStats.map((sa, i) => (
                  <tr key={sa.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-gray-300 text-gray-700" : i === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{sa.full_name || "—"}</p>
                          {sa.institution && <p className="text-xs text-muted-foreground">{sa.institution}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs capitalize">{sa.role.replace("_", " ")}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">{sa.score} pts</Badge>
                    </td>
                    <td className="p-4 text-success font-bold hidden md:table-cell">{sa.approved}</td>
                    <td className="p-4 text-orange-600 font-bold hidden md:table-cell">{sa.changes}</td>
                    <td className="p-4 text-destructive font-bold hidden lg:table-cell">{sa.rejected}</td>
                    <td className="p-4 font-medium">{sa.total}</td>
                    <td className="p-4 hidden lg:table-cell min-w-[120px]">
                      <MiniBar pct={maxScore > 0 ? (sa.score / maxScore) * 100 : 0} color="bg-primary" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reviewer Performance */}
      {(roleFilter === "all" || roleFilter === "reviewer") && reviewerStats.length > 0 && (
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className="p-5 border-b flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-bold">Reviewer Performance</h3>
            <Badge variant="outline" className="ml-auto text-xs">{reviewerStats.length} reviewers</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Reviewer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Total Assigned</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Declined</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Completion Rate</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Progress</th>
              </tr></thead>
              <tbody>
                {reviewerStats.map((rv) => (
                  <tr key={rv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{rv.full_name || "—"}</p>
                        {rv.institution && <p className="text-xs text-muted-foreground">{rv.institution}</p>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-primary">{rv.total}</td>
                    <td className="p-4 font-bold text-success">{rv.submitted}</td>
                    <td className="p-4 font-bold text-destructive hidden md:table-cell">{rv.declined}</td>
                    <td className="p-4 hidden lg:table-cell">
                      <Badge variant="outline" className={`text-xs ${rv.completionRate >= 70 ? "bg-success/10 text-success border-success/20" : rv.completionRate >= 40 ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                        {rv.completionRate}%
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell min-w-[120px]">
                      <MiniBar pct={rv.completionRate} color={rv.completionRate >= 70 ? "bg-success" : rv.completionRate >= 40 ? "bg-warning" : "bg-destructive"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subAdminStats.length === 0 && reviewerStats.length === 0 && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <BarChart2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No data available yet</p>
          <p className="text-sm mt-1">Report data will appear as users complete reviews and workflow actions</p>
        </div>
      )}
    </div>
  );
}
