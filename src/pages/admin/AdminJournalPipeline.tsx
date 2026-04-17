import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, CheckCircle, XCircle, RotateCcw, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  approved: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminJournalPipeline() {
  const [journals, setJournals] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [jRes, tRes] = await Promise.all([
      supabase.from("content_items").select("id,title,type,status,workflow_status,current_stage_index,workflow_template_id,author_user_id,created_at,access_mode").order("created_at", { ascending: false }),
      supabase.from("workflow_templates").select("id, name, workflow_stages(id, stage_name, order_index, assigned_user_email, assigned_user_id)"),
    ]);
    const items = jRes.data || [];
    setJournals(items);
    setTemplates(tRes.data || []);
    // Load recent logs for each item
    if (items.length > 0) {
      const ids = items.map((j: any) => j.id);
      const { data: logData } = await supabase.from("workflow_logs").select("*").in("content_id", ids).order("acted_at", { ascending: false });
      const grouped: Record<string, any[]> = {};
      (logData || []).forEach((l: any) => { grouped[l.content_id] = grouped[l.content_id] || []; grouped[l.content_id].push(l); });
      setLogs(grouped);
    }
    setLoading(false);
  }

  async function publishJournal(id: string) {
    const item = journals.find((j) => j.id === id);
    const accessMode = item?.access_mode || "open_access";
    const { error } = await supabase.from("content_items").update({ status: "published", workflow_status: "published", access_mode: accessMode, visibility: accessMode } as any).eq("id", id);
    if (error) { toast.error("Failed to publish"); return; }
    setJournals(prev => prev.map(j => j.id === id ? { ...j, status: "published", workflow_status: "published", access_mode: accessMode } : j));
    toast.success("Journal published!");
  }

  function getTemplate(id: string) { return templates.find(t => t.id === id); }
  function getCurrentStage(j: any) {
    const t = getTemplate(j.workflow_template_id);
    if (!t) return null;
    const sorted = [...(t.workflow_stages || [])].sort((a: any, b: any) => a.order_index - b.order_index);
    return sorted[j.current_stage_index] || null;
  }

  const filtered = journals.filter(j => filter === "all" || j.workflow_status === filter || (!j.workflow_status && filter === "draft"));
  const stats = {
    submitted: journals.filter(j => j.workflow_status === "submitted").length,
    in_review: journals.filter(j => j.workflow_status === "in_review").length,
    changes_requested: journals.filter(j => j.workflow_status === "changes_requested").length,
    approved: journals.filter(j => j.workflow_status === "approved").length,
    published: journals.filter(j => j.workflow_status === "published" || j.status === "published").length,
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
          { label: "Approved", value: stats.approved, icon: <CheckCircle className="h-4 w-4 text-success" /> },
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
        {["all", "submitted", "in_review", "changes_requested", "approved", "published", "rejected"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">{f.replace("_", " ")}</Button>
        ))}
      </div>

      {/* Journal List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Journal Title</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Workflow Status</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Access</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Current Stage</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Last Action</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No journals found for this filter</td></tr>}
            {filtered.map(j => {
              const stage = getCurrentStage(j);
              const lastLog = (logs[j.id] || [])[0];
              const ws = j.workflow_status || "draft";
              return (
                <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium max-w-[200px]"><p className="truncate">{j.title}</p><p className="text-xs text-muted-foreground mt-0.5 capitalize">{j.type}</p></td>
                  <td className="p-4 hidden md:table-cell"><Badge variant="outline" className={STATUS_COLORS[ws]}>{ws.replace("_", " ")}</Badge></td>
                  <td className="p-4 hidden md:table-cell"><Badge variant="outline" className="capitalize">{(j.access_mode || "open_access").replace(/_/g, " ")}</Badge></td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {stage ? <><span className="font-medium text-foreground">{stage.stage_name}</span><br />{stage.assigned_user_email || "Unassigned"}</> : <span>—</span>}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {lastLog ? <><span className="capitalize font-medium">{lastLog.action}</span><br />{new Date(lastLog.acted_at).toLocaleDateString()}</> : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {ws === "approved" && j.status !== "published" && (
                        <Button size="sm" onClick={() => publishJournal(j.id)} className="text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Publish</Button>
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

