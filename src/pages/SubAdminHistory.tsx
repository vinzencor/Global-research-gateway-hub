import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { History, CheckCircle, AlertCircle, XCircle, RefreshCw, FileText, MessageSquare, Calendar, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { workflowApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getSubAdminNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";

const ACTION_META: Record<string, { color: string; icon: JSX.Element; label: string }> = {
  approved: { color: "bg-success/10 text-success border-success/20", icon: <CheckCircle className="h-3.5 w-3.5" />, label: "Approved" },
  changes_requested: { color: "bg-orange-500/10 text-orange-600 border-orange-200", icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Changes Requested" },
  rejected: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3.5 w-3.5" />, label: "Rejected" },
};

export default function SubAdminHistory() {
  const { user } = useAuth();
  const navItems = getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "changes_requested" | "rejected">("all");
  const [search, setSearch] = useState("");

  useEffect(() => { if (user) loadHistory(); }, [user]);

  async function loadHistory() {
    setLoading(true);
    try {
      const data: any = await workflowApi.getMyLogs();
      setLogs(Array.isArray(data) ? data : data?.items || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load review history");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs
      .filter((l) => filter === "all" || l.action === filter)
      .filter((l) => !q || (l.content?.title || "").toLowerCase().includes(q));
  }, [logs, filter, search]);

  // Group by day for a more readable timeline
  const grouped = useMemo(() => {
    const groups = new Map<string, any[]>();
    for (const log of filtered) {
      const key = log.actedAt ? new Date(log.actedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Unknown date";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(log);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  const counts = {
    all: logs.length,
    approved: logs.filter((l) => l.action === "approved").length,
    changes_requested: logs.filter((l) => l.action === "changes_requested").length,
    rejected: logs.filter((l) => l.action === "rejected").length,
  };

  return (
    <DashboardLayout navItems={navItems} title="Sub-Admin Portal">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold">Review History</h2>
            <p className="text-sm text-muted-foreground mt-0.5">A complete timeline of every review action you've taken.</p>
          </div>
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "approved", label: "Approved", count: counts.approved, color: "text-success", bg: "bg-success/10" },
            { key: "changes_requested", label: "Changes Requested", count: counts.changes_requested, color: "text-orange-600", bg: "bg-orange-500/10" },
            { key: "rejected", label: "Rejected", count: counts.rejected, color: "text-destructive", bg: "bg-destructive/10" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(filter === s.key ? "all" : (s.key as any))}
              className={`rounded-xl border ${s.bg} p-4 text-center transition-all hover:scale-[1.02] ${filter === s.key ? "ring-2 ring-primary" : ""}`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap">
            {(["all", "approved", "changes_requested", "rejected"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {f === "all" ? "All Actions" : ACTION_META[f].label}
                {" "}
                <span className="opacity-70">({counts[f]})</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by paper title..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-card py-16 text-center text-muted-foreground">
            <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No review history yet</p>
            <p className="text-sm mt-1">Your completed review actions will appear here once you approve, request changes, or reject a paper.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, dayLogs]) => (
              <div key={day} className="space-y-3">
                <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-1 z-10">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{day}</p>
                </div>
                <div className="relative pl-6 space-y-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {dayLogs.map((log: any) => {
                    const meta = ACTION_META[log.action] || { color: "", icon: <FileText className="h-3.5 w-3.5" />, label: log.action };
                    return (
                      <div key={log._id} className="relative rounded-xl border bg-card p-4 card-shadow hover:border-primary/30 transition-colors">
                        <div className={`absolute -left-6 top-5 h-3 w-3 rounded-full border-2 border-background ${meta.color.includes("success") ? "bg-success" : meta.color.includes("destructive") ? "bg-destructive" : "bg-orange-500"}`} />
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{log.content?.title || "Untitled (content removed)"}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="capitalize">{log.contentModel === "JournalSubmission" ? "Journal" : log.content?.type || "Content"}</span>
                              <span>Stage {(log.stageIndex ?? 0) + 1}</span>
                              <span>{log.actedAt ? new Date(log.actedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-xs gap-1 shrink-0 ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </Badge>
                        </div>
                        {log.comment && (
                          <div className="mt-3 pt-3 border-t flex items-start gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{log.comment}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
