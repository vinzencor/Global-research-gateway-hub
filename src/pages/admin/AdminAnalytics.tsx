import { useEffect, useState } from "react";
import { journalApi, workflowApi } from "@/lib/api";
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Globe, RefreshCw, FileText, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MonthBucket { month: string; count: number; }
interface StageStats { name: string; approved: number; rejected: number; changes: number; total: number; }

const ACTION_COLOR: Record<string, string> = {
  approved: "text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200",
  rejected: "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200",
  changes_requested: "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200",
  submitted: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200",
};

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [journalsData, logsData]: [any, any] = await Promise.all([
        journalApi.adminList({ limit: "2000" }),
        workflowApi.getAllLogs(),
      ]);
      setJournals(journalsData?.items || journalsData || []);
      setLogs(Array.isArray(logsData) ? logsData : logsData?.items || []);
      setLastRefresh(new Date());
    } catch (err: any) {
      toast.error(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  // ── Derived metrics from real JournalSubmission data ─────────────────────────
  const total = journals.length;
  const published = journals.filter(j => j.status === "published").length;
  const inReview = journals.filter(j => ["submitted", "in_review"].includes(j.status)).length;
  const changesReq = journals.filter(j => j.status === "changes_requested").length;
  const rejected = journals.filter(j => j.status === "rejected").length;
  const accepted = journals.filter(j => j.status === "accepted").length;
  const withdrawn = journals.filter(j => j.status === "withdrawn").length;
  const draft = journals.filter(j => !j.status || j.status === "draft").length;

  const publishRate = total > 0 ? Math.round((published / total) * 100) : 0;
  const approvalRate = total > 0 ? Math.round(((published + accepted) / total) * 100) : 0;
  const inReviewRate = total > 0 ? Math.round((inReview / total) * 100) : 0;
  const changesRate = total > 0 ? Math.round((changesReq / total) * 100) : 0;

  // Monthly buckets (last 6 months) based on journal submission date
  const monthBuckets: MonthBucket[] = (() => {
    const buckets: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = 0;
    }
    journals.forEach(j => {
      const key = (j.createdAt || j.created_at || "")?.slice(0, 7);
      if (key && key in buckets) buckets[key]++;
    });
    return Object.entries(buckets).map(([month, count]) => ({ month: month.slice(5), count }));
  })();
  const maxMonth = Math.max(...monthBuckets.map(b => b.count), 1);

  // Per-stage stats — derived from workflow logs' populated stage field
  const stageStats: StageStats[] = (() => {
    const map = new Map<string, StageStats>();
    for (const log of logs) {
      const stageName = log.stage?.stageName || log.stageName || `Stage ${(log.stageIndex ?? 0) + 1}`;
      if (!map.has(stageName)) map.set(stageName, { name: stageName, approved: 0, rejected: 0, changes: 0, total: 0 });
      const s = map.get(stageName)!;
      s.total++;
      if (log.action === "approved") s.approved++;
      else if (log.action === "rejected") s.rejected++;
      else if (log.action === "changes_requested") s.changes++;
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  const recentActivity = logs.slice(0, 10);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Journal Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {total === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">No journal submissions yet. Stats will populate as authors submit papers.</p>
        </div>
      )}

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

      {/* Rate bars + Monthly chart */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Performance rates */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h3 className="font-heading font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Performance Rates
          </h3>
          {[
            { label: "Publication Rate", value: publishRate, color: "bg-green-500" },
            { label: "Overall Approval Rate", value: approvalRate, color: "bg-primary" },
            { label: "Pending / In-Progress", value: inReviewRate, color: "bg-amber-400" },
            { label: "Changes Requested", value: changesRate, color: "bg-orange-400" },
          ].map(r => (
            <div key={r.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${r.color} transition-all duration-700`} style={{ width: `${r.value}%` }} />
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
                <span className="text-xs font-medium">{b.count > 0 ? b.count : ""}</span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all duration-700"
                  style={{ height: `${(b.count / maxMonth) * 100}%`, minHeight: b.count > 0 ? "8px" : "2px", opacity: b.count === 0 ? 0.2 : 1 }}
                />
                <span className="text-xs text-muted-foreground">{b.month}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Monthly submission count</p>
        </div>
      </div>

      {/* Status Breakdown + Stage Performance */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" /> Status Breakdown
          </h3>
          <div className="space-y-2">
            {[
              { label: "Published", count: published, color: "bg-green-500" },
              { label: "In Review", count: inReview, color: "bg-amber-400" },
              { label: "Changes Requested", count: changesReq, color: "bg-orange-400" },
              { label: "Accepted (awaiting publish)", count: accepted, color: "bg-blue-400" },
              { label: "Rejected", count: rejected, color: "bg-red-400" },
              { label: "Withdrawn", count: withdrawn, color: "bg-gray-400" },
              { label: "Draft", count: draft, color: "bg-muted-foreground" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full shrink-0 ${s.color}`} />
                <span className="text-sm flex-1">{s.label}</span>
                <span className="font-semibold text-sm w-6 text-right">{s.count}</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden ml-1">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${total > 0 ? (s.count / total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage performance */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Stage Performance
          </h3>
          {stageStats.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No review activity yet. Stats will appear once reviewers start actioning papers.
            </p>
          ) : (
            <div className="space-y-3">
              {stageStats.map(s => (
                <div key={s.name} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">{s.name}</p>
                    <span className="text-xs text-muted-foreground">{s.total} actions</span>
                  </div>
                  <div className="flex gap-3 text-xs flex-wrap">
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3 w-3" /> {s.approved} approved</span>
                    <span className="flex items-center gap-1 text-orange-500"><RefreshCw className="h-3 w-3" /> {s.changes} changes</span>
                    <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> {s.rejected} rejected</span>
                  </div>
                  {s.total > 0 && (
                    <div className="mt-2 flex h-1.5 rounded-full overflow-hidden gap-px">
                      <div className="bg-green-500 transition-all" style={{ width: `${(s.approved / s.total) * 100}%` }} />
                      <div className="bg-orange-400 transition-all" style={{ width: `${(s.changes / s.total) * 100}%` }} />
                      <div className="bg-red-400 transition-all" style={{ width: `${(s.rejected / s.total) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-5 border-b bg-muted/20">
          <h3 className="font-heading font-bold">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest review actions taken across all workflows</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No review activity recorded yet.</div>
        ) : (
          <div className="divide-y">
            {recentActivity.map((log, i) => (
              <div key={log._id || i} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                <Badge variant="outline" className={`text-xs shrink-0 capitalize ${ACTION_COLOR[log.action] || ""}`}>
                  {log.action?.replace(/_/g, " ")}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.content?.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.actedBy?.fullName || "Reviewer"} · {log.stage?.stageName || `Stage ${(log.stageIndex ?? 0) + 1}`}
                    {log.comment ? ` · "${log.comment.slice(0, 60)}${log.comment.length > 60 ? "…" : ""}"` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                  {log.actedAt ? new Date(log.actedAt).toLocaleDateString() : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
