import { useEffect, useState } from "react";
import { journalApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, CheckCircle, RotateCcw, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  accepted: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminJournalPipeline() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data: any = await journalApi.adminList({ limit: "500" });
      setJournals(data?.items || data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load journals");
      setJournals([]);
    }
    setLoading(false);
  }

  async function publishJournal(id: string) {
    try {
      const form = new FormData();
      form.append("status", "published");
      await journalApi.update(id, form);
      setJournals(prev => prev.map(j => (j._id || j.id) === id ? { ...j, status: "published" } : j));
      toast.success("Journal published!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish");
    }
  }

  const filtered = journals.filter(j => filter === "all" || j.status === filter || (!j.status && filter === "draft"));
  const stats = {
    submitted: journals.filter(j => j.status === "submitted").length,
    in_review: journals.filter(j => j.status === "in_review").length,
    changes_requested: journals.filter(j => j.status === "changes_requested").length,
    accepted: journals.filter(j => j.status === "accepted").length,
    published: journals.filter(j => j.status === "published").length,
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-heading text-xl font-bold">Journal Pipeline</h2></div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Submitted", value: stats.submitted, icon: <Clock className="h-4 w-4 text-blue-500" /> },
          { label: "In Review", value: stats.in_review, icon: <RotateCcw className="h-4 w-4 text-warning" /> },
          { label: "Changes Req.", value: stats.changes_requested, icon: <RotateCcw className="h-4 w-4 text-orange-500" /> },
          { label: "Accepted", value: stats.accepted, icon: <CheckCircle className="h-4 w-4 text-success" /> },
          { label: "Published", value: stats.published, icon: <CheckCircle className="h-4 w-4 text-green-700" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            {s.icon}
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "submitted", "in_review", "changes_requested", "accepted", "published", "rejected"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">{f.replace("_", " ")}</Button>
        ))}
      </div>

      {/* Journal List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Journal Title</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Workflow Progress</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Author</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No journals found for this filter</td></tr>}
            {filtered.map(j => {
              const ws = j.status || "draft";
              const jid = j._id || j.id;
              
              const currentStage = (j.currentStageIndex || 0) + 1;
              const totalStages = j.totalStages || 0;
              const progressPct = totalStages > 0 ? (j.status === 'published' ? 100 : (currentStage / (totalStages + 1)) * 100) : 0;
              
              return (
                <tr key={jid} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium max-w-[200px]"><p className="truncate">{j.title}</p></td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground">{j.institution || "-"}</td>
                  <td className="p-4"><Badge variant="outline" className={STATUS_COLORS[ws]}>{ws.replace("_", " ")}</Badge></td>
                  <td className="p-4">
                    {totalStages > 0 ? (
                      <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                          <span>{j.status === 'published' ? 'Completed' : `Stage ${currentStage}/${totalStages}`}</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${j.status === 'published' ? 'bg-green-500' : 'bg-primary'}`} 
                            style={{ width: `${progressPct}%` }} 
                          />
                        </div>
                        {j.workflowTemplate && <p className="text-[10px] text-muted-foreground truncate">{j.workflowTemplate.name}</p>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No workflow</span>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{new Date(j.createdAt || j.created_at).toLocaleDateString()}</td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{j.authorUser?.fullName || j.authorUser?.email || "-"}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {ws === "accepted" && (
                        <Button size="sm" onClick={() => publishJournal(jid)} className="text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Publish</Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


