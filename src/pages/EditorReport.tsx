import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, ClipboardList, Settings, BarChart2, CheckCircle, XCircle, Clock, TrendingUp, Award, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/legacyDb";
import { useAuth } from "@/contexts/AuthContext";
import { editorNavItems } from "./EditorDashboard";

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

export default function EditorReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; count: number }[]>([]);

  useEffect(() => { if (user) loadReport(); }, [user]);

  async function loadReport() {
    setLoading(true);
    const { data } = await db
      .from("workflow_logs")
      .select("id, action, comment, acted_at, content_id, content_items(id, title, type)")
      .eq("acted_by", user!.id)
      .order("acted_at", { ascending: false });

    const all = data || [];
    setLogs(all);

    const now = new Date();
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short" });
      const count = all.filter(l => {
        const ld = new Date(l.acted_at);
        return ld.getMonth() === d.getMonth() && ld.getFullYear() === d.getFullYear();
      }).length;
      months.push({ month: label, count });
    }
    setMonthlyData(months);
    setLoading(false);
  }

  const approved = logs.filter(l => l.action === "approved").length;
  const changesReq = logs.filter(l => l.action === "changes_requested").length;
  const rejected = logs.filter(l => l.action === "rejected").length;
  const total = logs.length;
  const score = approved * 10 + changesReq * 5 + rejected * 3;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const maxMonthly = Math.max(...monthlyData.map(m => m.count), 1);
  const thisMonth = monthlyData[monthlyData.length - 1]?.count || 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.count || 0;
  const trend = thisMonth - lastMonth;

  if (loading) return (
    <DashboardLayout navItems={editorNavItems} title="Editor Portal">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={editorNavItems} title="Editor Portal">
      <div className="space-y-6">
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            <h2 className="font-heading text-2xl font-bold">My Performance Report</h2>
          </div>
          <p className="text-sm text-muted-foreground">{user?.profile?.full_name || user?.email} Â· Editor Â· All-time statistics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Reviews", value: total, icon: <ClipboardList className="h-5 w-5 text-primary" />, color: "text-primary" },
            { label: "Total Score", value: `${score} pts`, icon: <Award className="h-5 w-5 text-yellow-600" />, color: "text-yellow-600" },
            { label: "Approval Rate", value: `${approvalRate}%`, icon: <CheckCircle className="h-5 w-5 text-success" />, color: "text-success" },
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
          <div className="lg:col-span-2 rounded-xl border bg-card p-6 card-shadow">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold">Monthly Activity (Last 6 Months)</h3>
            </div>
            <div className="flex items-end justify-around gap-2 pt-2">
              {monthlyData.map(m => <MonthlyBar key={m.month} month={m.month} count={m.count} max={maxMonthly} />)}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 card-shadow">
            <h3 className="font-heading font-bold mb-4">Action Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: "Approved", count: approved, color: "bg-success", textColor: "text-success", pts: 10 },
                { label: "Changes Requested", count: changesReq, color: "bg-orange-500", textColor: "text-orange-600", pts: 5 },
                { label: "Rejected", count: rejected, color: "bg-destructive", textColor: "text-destructive", pts: 3 },
              ].map(item => {
                const pct = total > 0 ? (item.count / total) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-sm font-bold ${item.textColor}`}>{item.count}</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(pct)}% Â· +{item.count * item.pts} pts</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t flex justify-between">
              <span className="text-sm font-medium">Total Score</span>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">{score} pts</Badge>
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold">Recent Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Paper</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Action</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Comment</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                </tr></thead>
                <tbody>
                  {logs.slice(0, 10).map(log => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium max-w-[200px] truncate">{log.content_items?.title || "â€”"}</td>
                      <td className="p-4 hidden sm:table-cell">
                        <Badge variant="outline" className={`text-xs ${log.action === "approved" ? "bg-success/10 text-success border-success/20" : log.action === "changes_requested" ? "bg-orange-500/10 text-orange-600 border-orange-200" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                          {log.action?.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell"><span className="line-clamp-1">{log.comment || "â€”"}</span></td>
                      <td className="p-4 text-xs text-muted-foreground">{new Date(log.acted_at).toLocaleDateString()}</td>
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

