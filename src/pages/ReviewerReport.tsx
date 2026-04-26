import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, BarChart2, Settings, CheckCircle, XCircle, Clock, TrendingUp, Award, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/legacyDb";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", to: "/reviewer", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Reviews", to: "/reviewer", icon: <FileText className="h-4 w-4" /> },
  { label: "Reports", to: "/reviewer/report", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Settings", to: "/reviewer/settings", icon: <Settings className="h-4 w-4" /> },
];

function MonthlyBar({ month, count, max }: { month: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-bold text-muted-foreground">{count}</span>
      <div className="w-8 bg-secondary rounded-t-sm overflow-hidden" style={{ height: "80px" }}>
        <div className="w-full bg-primary rounded-t-sm transition-all duration-700" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground">{month}</span>
    </div>
  );
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  accept: "Accept",
  minor_revisions: "Minor Revisions",
  major_revisions: "Major Revisions",
  reject: "Reject",
};

const RECOMMENDATION_COLORS: Record<string, string> = {
  accept: "bg-success/10 text-success border-success/20",
  minor_revisions: "bg-info/10 text-info border-info/20",
  major_revisions: "bg-warning/10 text-warning border-warning/20",
  reject: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ReviewerReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => { if (user) loadReport(); }, [user]);

  async function loadReport() {
    setLoading(true);
    const { data } = await db
      .from("reviews")
      .select("*, content_items(id, title, type)")
      .eq("reviewer_user_id", user!.id)
      .order("created_at", { ascending: false });

    const all = data || [];
    setReviews(all);

    const now = new Date();
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const count = all.filter(r => {
        const rd = new Date(r.submitted_at || r.created_at);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear() && r.status === "submitted";
      }).length;
      months.push({ month: label, count });
    }
    setMonthlyData(months);
    setLoading(false);
  }

  const submitted = reviews.filter(r => r.status === "submitted").length;
  const accepted = reviews.filter(r => r.status === "accepted").length;
  const declined = reviews.filter(r => r.status === "declined").length;
  const total = reviews.length;
  const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);
  const thisMonth = monthlyData[monthlyData.length - 1]?.count || 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.count || 0;
  const trend = thisMonth - lastMonth;

  // Recommendation breakdown from submitted reviews
  const submittedReviews = reviews.filter(r => r.status === "submitted");
  const recBreakdown: Record<string, number> = {};
  submittedReviews.forEach(r => {
    if (r.recommendation) recBreakdown[r.recommendation] = (recBreakdown[r.recommendation] || 0) + 1;
  });

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Reviewer Portal">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} title="Reviewer Portal">
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold">My Review Report</h2>
          </div>
          <p className="text-sm text-muted-foreground">{user?.profile?.full_name || user?.email} Â· Reviewer Â· All-time statistics</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: total, icon: <FileText className="h-5 w-5 text-primary" />, color: "text-primary" },
            { label: "Submitted", value: submitted, icon: <Award className="h-5 w-5 text-yellow-600" />, color: "text-yellow-600" },
            { label: "Completion Rate", value: `${completionRate}%`, icon: <CheckCircle className="h-5 w-5 text-success" />, color: "text-success" },
            { label: "This Month", value: thisMonth, icon: <TrendingUp className={`h-5 w-5 ${trend >= 0 ? "text-success" : "text-destructive"}`} />, color: trend >= 0 ? "text-success" : "text-destructive", sub: trend !== 0 ? `${trend > 0 ? "+" : ""}${trend} vs last month` : "Same as last month" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow">
              <div className="flex items-center gap-3 mb-2">{s.icon}<p className="text-xs text-muted-foreground">{s.label}</p></div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              {"sub" in s && s.sub && <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Monthly Bar Chart */}
          <div className="lg:col-span-2 rounded-xl border bg-card p-6 card-shadow">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold">Submitted Reviews (Last 6 Months)</h3>
            </div>
            <div className="flex items-end justify-around gap-2 pt-2">
              {monthlyData.map(m => <MonthlyBar key={m.month} month={m.month} count={m.count} max={maxMonthly} />)}
            </div>
          </div>

          {/* Status + Recommendation Breakdown */}
          <div className="rounded-xl border bg-card p-6 card-shadow space-y-5">
            <div>
              <h3 className="font-heading font-bold mb-3">Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  { label: "Submitted", count: submitted, color: "bg-success" },
                  { label: "Accepted (Pending)", count: accepted, color: "bg-blue-500" },
                  { label: "Declined", count: declined, color: "bg-destructive" },
                ].map(item => {
                  const pct = total > 0 ? (item.count / total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {Object.keys(recBreakdown).length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {Object.entries(recBreakdown).map(([rec, count]) => (
                    <div key={rec} className="flex items-center justify-between">
                      <Badge variant="outline" className={`text-xs ${RECOMMENDATION_COLORS[rec] || ""}`}>
                        {RECOMMENDATION_LABELS[rec] || rec}
                      </Badge>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submitted Reviews Table */}
        {submittedReviews.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold">Completed Reviews</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Paper</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Recommendation</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Submitted</th>
                </tr></thead>
                <tbody>
                  {submittedReviews.map(r => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium max-w-[200px] truncate">{r.content_items?.title || "â€”"}</td>
                      <td className="p-4 text-muted-foreground capitalize hidden sm:table-cell">{r.content_items?.type || "â€”"}</td>
                      <td className="p-4">
                        {r.recommendation ? (
                          <Badge variant="outline" className={`text-xs ${RECOMMENDATION_COLORS[r.recommendation] || ""}`}>
                            {RECOMMENDATION_LABELS[r.recommendation] || r.recommendation}
                          </Badge>
                        ) : "â€”"}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground hidden md:table-cell">
                        {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "â€”"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

