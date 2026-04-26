import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, ClipboardList, Settings, History, CheckCircle, XCircle, RefreshCw, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/legacyDb";
import { useAuth } from "@/contexts/AuthContext";
import { getSubAdminNavItemsForRoles } from "@/lib/portalNav";

const ACTION_COLORS: Record<string, string> = {
  approved: "bg-success/10 text-success border-success/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function SubAdminHistory() {
  const { user } = useAuth();
  const navItems = getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "approved" | "changes_requested" | "rejected">("all");

  useEffect(() => { if (user) loadHistory(); }, [user]);

  async function loadHistory() {
    setLoading(true);
    const { data } = await db
      .from("workflow_logs")
      .select("id, action, comment, acted_at, content_id, stage_index, content_items(id, title, type)")
      .eq("acted_by", user!.id)
      .order("acted_at", { ascending: false });
    setLogs(data || []);
    setLoading(false);
  }

  const filtered = filter === "all" ? logs : logs.filter(l => l.action === filter);

  return (
    <DashboardLayout navItems={navItems} title="Sub-Admin Portal">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading text-xl font-bold">Review History</h2>
            <p className="text-sm text-muted-foreground mt-0.5">All your past review actions across all workflow stages</p>
          </div>
          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "approved", "changes_requested", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {f === "all" ? "All Actions" : f === "changes_requested" ? "Changes Requested" : f.charAt(0).toUpperCase() + f.slice(1)}
              {" "}
              <span className="opacity-70">({f === "all" ? logs.length : logs.filter(l => l.action === f).length})</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No review history yet</p>
              <p className="text-sm mt-1">Your completed review actions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Paper / Content</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Comment</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Stage</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium max-w-[200px] truncate">
                          {log.content_items?.title || "â€”"}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground capitalize hidden sm:table-cell">
                        {log.content_items?.type || "â€”"}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-xs ${ACTION_COLORS[log.action] || ""}`}>
                          <span className="flex items-center gap-1">
                            {log.action === "approved" && <CheckCircle className="h-3 w-3" />}
                            {(log.action === "changes_requested" || log.action === "rejected") && <XCircle className="h-3 w-3" />}
                            {log.action?.replace("_", " ")}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        <span className="line-clamp-1 max-w-[200px]">{log.comment || "â€”"}</span>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        Stage {(log.stage_index || 0) + 1}
                      </td>
                      <td className="p-4 text-muted-foreground hidden lg:table-cell text-xs">
                        {new Date(log.acted_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        {logs.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Approved", count: logs.filter(l => l.action === "approved").length, color: "text-success", bg: "bg-success/10" },
              { label: "Changes Requested", count: logs.filter(l => l.action === "changes_requested").length, color: "text-orange-600", bg: "bg-orange-500/10" },
              { label: "Rejected", count: logs.filter(l => l.action === "rejected").length, color: "text-destructive", bg: "bg-destructive/10" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.bg} p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

