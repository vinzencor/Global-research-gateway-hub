import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Globe, RefreshCw, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MonthBucket { month: string; count: number; }
interface StageStats { name: string; approved: number; rejected: number; changes: number; }

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [jRes, lRes, sRes] = await Promise.all([
      supabase.from("content_items").select("id, title, type, status, workflow_status, created_at, author_user_id").order("created_at", { ascending: true }),
      supabase.from("workflow_logs").select("*").order("acted_at", { ascending: false }),
      supabase.from("workflow_stages").select("id, stage_name, template_id"),
    ]);
    setJournals(jRes.data || []);
    setLogs(lRes.data || []);
    setStages(sRes.data || []);
    setLastRefresh(new Date());
    setLoading(false);
  }

  // ── Derived metrics ──────────────────────────────────────────────────────
  const total = journals.length;
  const published = journals.filter(j => j.workflow_status === "published" || j.status === "published").length;
  const inReview = journals.filter(j => ["submitted", "in_review"].includes(j.workflow_status)).length;
  const changesReq = journals.filter(j => j.workflow_status === "changes_requested").length;
  const rejected = journals.filter(j => j.workflow_status === "rejected").length;
  const approved = journals.filter(j => j.workflow_status === "approved").length;
  const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;
  const approvalRate = total > 0 ? Math.round(((published + approved) / total) * 100) : 0;

  // Monthly buckets (last 6 months)
  const monthBuckets: MonthBucket[] = (() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    journals.forEach(j => {
      const key = j.created_at?.slice(0, 7);
      if (key && key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([month, count]) => ({ month: month.slice(5), count }));
  })();
  const maxMonth = Math.max(...monthBuckets.map(b => b.count), 1);

  // Per-stage stats
  const stageStats: StageStats[] = stages.map(s => ({
    name: s.stage_name,
    approved: logs.filter(l => l.stage_id === s.id && l.action === "approved").length,
    rejected: logs.filter(l => l.stage_id === s.id && l.action === "rejected").length,
    changes: logs.filter(l => l.stage_id === s.id && l.action === "changes_requested").length,
  }));

  // Recent activity (last 10 logs)
  const recentActivity = logs.slice(0, 10);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Journal Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Submissions", value: total, icon: <FileText className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Published", value: published, icon: <Globe className="h-5 w-5 text-green-600" />, bg: "bg-green-50 dark:bg-green-950/20" },
          { label: "In Review", value: inReview, icon: <Clock className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Rejected", value: rejected, icon: <XCircle className="h-5 w-5 text-red-500" />, bg: "bg-red-50 dark:bg-red-950/20" },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 flex items-center gap-3 ${k.bg}`}>
            {k.icon}
            <div>
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-bold">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Rate + Monthly Chart Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Rates */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-heading font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Performance Rates</h3>
          {[
            { label: "Publication Rate", value: publishRate, color: "bg-green-500" },
            { label: "Overall Approval Rate", value: approvalRate, color: "bg-primary" },
            { label: "Pending / In-Progress", value: total > 0 ? Math.round((inReview / total) * 100) : 0, color: "bg-amber-400" },
            { label: "Changes Requested", value: total > 0 ? Math.round((changesReq / total) * 100) : 0, color: "bg-orange-400" },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${r.color} transition-all`} style={{ width: `${r.value}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-4">Submissions (Last 6 Months)</h3>
          <div className="flex items-end gap-2 h-36">
            {monthBuckets.map(b => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-foreground">{b.count > 0 ? b.count : ""}</span>
                <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${(b.count / maxMonth) * 100}%`, minHeight: b.count > 0 ? "8px" : "2px", opacity: b.count === 0 ? 0.2 : 1 }} />
                <span className="text-xs text-muted-foreground">{b.month}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Monthly submission count</p>
        </div>
      </div>

      {/* Status Breakdown Donut (CSS) */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Status Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: "Published", count: published, color: "bg-green-500" },
              { label: "In Review", count: inReview, color: "bg-amber-400" },
              { label: "Changes Requested", count: changesReq, color: "bg-orange-400" },
              { label: "Approved (pending publish)", count: approved, color: "bg-blue-400" },
              { label: "Rejected", count: rejected, color: "bg-red-400" },
              { label: "Draft", count: journals.filter(j => !j.workflow_status || j.workflow_status === "draft").length, color: "bg-muted-foreground" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full shrink-0 ${s.color}`} />
                <span className="text-sm flex-1">{s.label}</span>
                <span className="font-semibold text-sm">{s.count}</span>
                <span className="text-xs text-muted-foreground w-8 text-right">{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage performance */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-4">Stage Performance</h3>
          {stageStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No stages configured yet. Set up a workflow to see stage stats.</p>
          ) : (
            <div className="space-y-3">
              {stageStats.map(s => (
                <div key={s.name} className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">{s.name}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> {s.approved} approved</span>
                    <span className="flex items-center gap-1 text-orange-500"><RefreshCw className="h-3 w-3" /> {s.changes} changes</span>
                    <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> {s.rejected} rejected</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b">
          <h3 className="font-heading font-bold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest actions taken by reviewers in the workflow</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No activity recorded yet.</div>
        ) : (
          <div className="divide-y">
            {recentActivity.map(log => {
              const actionColor = log.action === "approved" || log.action === "published" ? "text-green-600 bg-green-50 dark:bg-green-950/20"
                : log.action === "rejected" ? "text-red-600 bg-red-50 dark:bg-red-950/20"
                : log.action === "changes_requested" ? "text-orange-600 bg-orange-50 dark:bg-orange-950/20"
                : "text-blue-600 bg-blue-50 dark:bg-blue-950/20";
              return (
                <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <Badge variant="outline" className={`text-xs shrink-0 capitalize ${actionColor}`}>{log.action?.replace("_", " ")}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.comment || "No comment provided"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Stage {(log.stage_index || 0) + 1} · {new Date(log.acted_at).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

