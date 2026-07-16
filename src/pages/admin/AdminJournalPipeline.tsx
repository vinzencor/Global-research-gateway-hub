import { useEffect, useState } from "react";
import { journalApi, workflowApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BarChart3, CheckCircle, RotateCcw, Clock, Eye, FileText, Download, User, Calendar, Building, XCircle, AlertCircle, History, LogOut, ShieldCheck, Paperclip, GitBranch } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
const fullFileUrl = (url?: string) => (url ? (url.startsWith("http") ? url : `${API_BASE}${url}`) : null);

const LOG_ACTION_META: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  submitted: { label: "Submitted", color: "bg-blue-500", icon: <FileText className="h-3 w-3 text-white" /> },
  approved: { label: "Approved", color: "bg-green-600", icon: <CheckCircle className="h-3 w-3 text-white" /> },
  changes_requested: { label: "Changes Requested", color: "bg-orange-500", icon: <AlertCircle className="h-3 w-3 text-white" /> },
  rejected: { label: "Rejected", color: "bg-destructive", icon: <XCircle className="h-3 w-3 text-white" /> },
  resubmitted: { label: "Resubmitted", color: "bg-blue-500", icon: <FileText className="h-3 w-3 text-white" /> },
  reassigned: { label: "Reassigned", color: "bg-indigo-500", icon: <GitBranch className="h-3 w-3 text-white" /> },
  changes_review_approved: { label: "Change Request Approved", color: "bg-green-600", icon: <CheckCircle className="h-3 w-3 text-white" /> },
  changes_review_declined: { label: "Change Request Declined", color: "bg-orange-500", icon: <XCircle className="h-3 w-3 text-white" /> },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested_awaiting_admin: "bg-red-500/10 text-red-700 border-red-200",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  accepted: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  rejected_pending_reassignment: "bg-amber-500/10 text-amber-700 border-amber-200",
  withdrawn: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export default function AdminJournalPipeline() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [publishDates, setPublishDates] = useState<Record<string, string>>({});
  const [showView, setShowView] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [reviewLogs, setReviewLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [stages, setStages] = useState<any[]>([]);

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

  async function openView(j: any) {
    setViewItem(j);
    setShowView(true);
    setReviewLogs([]);
    setStages([]);
    const id = j._id || j.id;
    const templateId = j.workflowTemplate?._id || j.workflowTemplate;
    setLoadingLogs(true);
    try {
      const [logs, stageList]: [any, any] = await Promise.all([
        id ? workflowApi.getContentLogs(id) : Promise.resolve([]),
        templateId ? workflowApi.getStages(templateId) : Promise.resolve([]),
      ]);
      setReviewLogs(Array.isArray(logs) ? logs : []);
      setStages(Array.isArray(stageList) ? stageList : []);
    } catch {
      setReviewLogs([]);
      setStages([]);
    } finally {
      setLoadingLogs(false);
    }
  }

  async function publishPaper(id: string) {
    try {
      const selectedDate = publishDates[id];
      if (!selectedDate) {
        toast.error("Please set a manual publish date before publishing");
        return;
      }
      const form = new FormData();
      form.append("status", "published");
      form.append("publishDate", selectedDate);
      await journalApi.update(id, form);
      setJournals(prev => prev.map(j => (j._id || j.id) === id ? { ...j, status: "published", publishDate: selectedDate } : j));
      toast.success("Paper published!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish");
    }
  }

  async function decideChangeRequest(item: any, decision: "approve" | "decline") {
    const id = item._id || item.id;
    if (decision === "decline" && !window.confirm("Decline this change request? The paper goes back to the same reviewer instead of the author.")) return;
    try {
      const form = new FormData();
      form.append("changeRequestDecision", decision);
      await journalApi.update(id, form);
      toast.success(decision === "approve" ? "Change request approved and sent to the author." : "Declined — sent back to the same reviewer.");
      setShowView(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record decision");
    }
  }

  const filtered = journals.filter(j => filter === "all" || j.status === filter || (!j.status && filter === "draft"));
  const stats = {
    submitted: journals.filter(j => j.status === "submitted").length,
    in_review: journals.filter(j => j.status === "in_review").length,
    changes_requested_awaiting_admin: journals.filter(j => j.status === "changes_requested_awaiting_admin").length,
    changes_requested: journals.filter(j => j.status === "changes_requested").length,
    accepted: journals.filter(j => j.status === "accepted").length,
    published: journals.filter(j => j.status === "published").length,
    withdrawn: journals.filter(j => j.status === "withdrawn").length,
    rejected: journals.filter(j => j.status === "rejected").length,
    rejected_pending_reassignment: journals.filter(j => j.status === "rejected_pending_reassignment").length,
  };

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-heading text-xl font-bold">Paper Pipeline</h2></div>

      {/* Action Required alert — reviewer change requests awaiting admin decision */}
      {stats.changes_requested_awaiting_admin > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              Action Required: {stats.changes_requested_awaiting_admin} change request{stats.changes_requested_awaiting_admin > 1 ? "s" : ""} awaiting your review
            </p>
            <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
              A reviewer requested changes. Approve to forward it to the author, or decline to send it back to the same reviewer.
            </p>
          </div>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-3">
        {[
          { label: "Submitted", value: stats.submitted, icon: <Clock className="h-4 w-4 text-blue-500" /> },
          { label: "In Review", value: stats.in_review, icon: <RotateCcw className="h-4 w-4 text-warning" /> },
          { label: "Needs Admin Review", value: stats.changes_requested_awaiting_admin, icon: <AlertCircle className="h-4 w-4 text-red-600" /> },
          { label: "Changes Req.", value: stats.changes_requested, icon: <RotateCcw className="h-4 w-4 text-orange-500" /> },
          { label: "Accepted", value: stats.accepted, icon: <CheckCircle className="h-4 w-4 text-success" /> },
          { label: "Published", value: stats.published, icon: <CheckCircle className="h-4 w-4 text-green-700" /> },
          { label: "Withdrawn", value: stats.withdrawn, icon: <RotateCcw className="h-4 w-4 text-gray-500" /> },
          { label: "Rejected", value: stats.rejected, icon: <RotateCcw className="h-4 w-4 text-red-500" /> },
          { label: "Needs Reassignment", value: stats.rejected_pending_reassignment, icon: <AlertCircle className="h-4 w-4 text-amber-500" /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            {s.icon}
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "submitted", "in_review", "changes_requested_awaiting_admin", "changes_requested", "accepted", "published", "rejected", "rejected_pending_reassignment", "withdrawn"].map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)} className="capitalize text-xs">{f.replace(/_/g, " ")}</Button>
        ))}
      </div>

      {/* Paper List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/50">
            <th className="text-left p-4 font-medium text-muted-foreground">Paper Title</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Workflow Progress</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Views</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Copies</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Author</th>
            <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">Publish Date</th>
            <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No papers found for this filter</td></tr>}
            {filtered.map(j => {
              const ws = j.status || "draft";
              const jid = j._id || j.id;
              const currentStage = (j.currentStageIndex || 0) + 1;
              const totalStages = j.totalStages || 0;
              const progressPct = totalStages > 0 ? (j.status === 'published' ? 100 : (currentStage / (totalStages + 1)) * 100) : 0;

              return (
                <tr
                  key={jid}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openView(j)}
                >
                  <td className="p-4 font-medium max-w-[200px]"><p className="truncate hover:text-primary transition-colors">{j.title}</p></td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground">{j.institution || "-"}</td>
                  <td className="p-4"><Badge variant="outline" className={STATUS_COLORS[ws]}>{ws.replace(/_/g, " ")}</Badge></td>
                  <td className="p-4">
                    {totalStages > 0 ? (
                      <div className="space-y-1.5 min-w-[120px]">
                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                          <span>{j.status === 'published' ? 'Completed' : j.status === 'accepted' ? 'Awaiting Super Admin Publish' : `Stage ${currentStage}/${totalStages}`}</span>
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
                   <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{j.viewCount || 0}</td>
                   <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{j.copyCount || 0}</td>
                   <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{new Date(j.createdAt || j.created_at).toLocaleDateString()}</td>
                   <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">{j.authorUser?.fullName || j.authorUser?.email || "-"}</td>
                   <td className="p-4 hidden xl:table-cell text-xs text-muted-foreground">{j.publishDate ? new Date(j.publishDate).toLocaleDateString() : "Not set"}</td>
                  <td className="p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Button variant="ghost" size="sm" onClick={() => openView(j)} title="View Details"><Eye className="h-3 w-3" /></Button>
                      {ws === "accepted" && (
                        <>
                          <input
                            type="date"
                            className="h-8 rounded-md border px-2 text-xs bg-background"
                            value={publishDates[jid] || ""}
                            onChange={(e) => setPublishDates((prev) => ({ ...prev, [jid]: e.target.value }))}
                          />
                          <Button size="sm" onClick={() => publishPaper(jid)} className="text-xs"><CheckCircle className="h-3 w-3 mr-1" /> Publish</Button>
                        </>
                      )}
                      {ws === "withdrawn" && j.withdrawalReason && (
                        <span className="text-xs text-muted-foreground italic max-w-[160px] truncate" title={j.withdrawalReason}>
                          Reason: {j.withdrawalReason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── View Details Modal ─── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl leading-tight pr-6">{viewItem?.title}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-5 py-2">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground font-semibold mr-1">Views:</span>
                  <span className="font-bold">{viewItem.viewCount || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold mr-1">Copies:</span>
                  <span className="font-bold">{viewItem.copyCount || 0}</span>
                </div>
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`capitalize ${STATUS_COLORS[viewItem.status || "draft"]}`}>
                  {(viewItem.status || "draft").replace(/_/g, " ")}
                </Badge>
                {viewItem.category && <Badge variant="secondary" className="capitalize">{viewItem.category}</Badge>}
              </div>

              {/* Author */}
              {viewItem.authorUser && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><User className="h-3 w-3" />Author</p>
                  <p className="text-sm">{viewItem.authorUser.fullName || viewItem.authorUser.email}</p>
                  {viewItem.authorUser.email && <p className="text-xs text-muted-foreground">{viewItem.authorUser.email}</p>}
                </div>
              )}

              {/* Institution */}
              {viewItem.institution && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><Building className="h-3 w-3" />Institution</p>
                  <p className="text-sm">{viewItem.institution}</p>
                </div>
              )}

              {/* Co-Authors */}
              {Array.isArray(viewItem.coAuthors) && viewItem.coAuthors.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><User className="h-3 w-3" />Co-Authors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewItem.coAuthors.map((c: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                {(viewItem.createdAt || viewItem.created_at) && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Submitted</p>
                    <p className="text-sm">{new Date(viewItem.createdAt || viewItem.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                )}
                {viewItem.publishDate && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Publish Date</p>
                    <p className="text-sm">{new Date(viewItem.publishDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                )}
              </div>

              {/* Workflow pipeline — every stage, ending with the Super Admin publish step */}
              {viewItem.workflowTemplate && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Workflow: {viewItem.workflowTemplate.name}
                  </p>
                  <ol className="space-y-2">
                    {[...stages].sort((a, b) => a.orderIndex - b.orderIndex).map((s) => {
                      const done = viewItem.status === "accepted" || viewItem.status === "published" || s.orderIndex < (viewItem.currentStageIndex || 0);
                      const current = !done && s.orderIndex === (viewItem.currentStageIndex || 0);
                      return (
                        <li key={s._id || s.id} className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-green-600" : current ? "bg-primary" : "bg-muted"}`}>
                            {done ? <CheckCircle className="h-3.5 w-3.5 text-white" /> : <span className={`text-[10px] font-bold ${current ? "text-primary-foreground" : "text-muted-foreground"}`}>{s.orderIndex + 1}</span>}
                          </span>
                          <span className="text-sm">
                            {s.stageName}
                            {s.assignedUser?.fullName && <span className="text-xs text-muted-foreground"> — {s.assignedUser.fullName}</span>}
                          </span>
                          {current && <Badge variant="outline" className="text-[10px] ml-1">In Progress</Badge>}
                        </li>
                      );
                    })}
                    {/* Final step is always the super admin's manual publish action */}
                    <li className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${viewItem.status === "published" ? "bg-green-600" : viewItem.status === "accepted" ? "bg-primary" : "bg-muted"}`}>
                        {viewItem.status === "published" ? <CheckCircle className="h-3.5 w-3.5 text-white" /> : <ShieldCheck className={`h-3.5 w-3.5 ${viewItem.status === "accepted" ? "text-primary-foreground" : "text-muted-foreground"}`} />}
                      </span>
                      <span className="text-sm font-medium">Super Admin — Publish</span>
                      {viewItem.status === "accepted" && <Badge variant="outline" className="text-[10px] ml-1 border-primary text-primary">Awaiting Publish</Badge>}
                      {viewItem.status === "published" && <Badge variant="outline" className="text-[10px] ml-1 bg-green-600/10 text-green-700 border-green-200">Published</Badge>}
                    </li>
                  </ol>
                </div>
              )}

              {/* Abstract */}
              {viewItem.abstract && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Abstract</p>
                  <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{viewItem.abstract}</p>
                </div>
              )}

              {/* Review History / Pipeline Timeline */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <History className="h-3 w-3" />Review History
                </p>

                {/* Rejection / changes-requested counts */}
                {reviewLogs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                      Changes Requested: {reviewLogs.filter((l) => l.action === "changes_requested").length}×
                    </Badge>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Rejected: {reviewLogs.filter((l) => l.action === "rejected").length}×
                    </Badge>
                  </div>
                )}

                {loadingLogs ? (
                  <div className="flex justify-center py-6"><Clock className="h-5 w-5 animate-spin opacity-30" /></div>
                ) : reviewLogs.length === 0 && viewItem.status !== "withdrawn" ? (
                  <p className="text-xs text-muted-foreground italic">No review actions recorded yet.</p>
                ) : (
                  <ol className="relative border-l-2 border-muted pl-4 space-y-4">
                    {[...reviewLogs].reverse().map((log: any) => {
                      const meta = LOG_ACTION_META[log.action] || { label: log.action, color: "bg-muted-foreground", icon: <History className="h-3 w-3 text-white" /> };
                      return (
                        <li key={log._id} className="relative">
                          <span className={`absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full ${meta.color}`}>
                            {meta.icon}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold">{meta.label}</span>
                            {log.stage?.stageName && (
                              <Badge variant="secondary" className="text-[10px]">{log.stage.stageName}</Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {log.actedBy?.fullName || log.actedBy?.email || "Unknown"} · {new Date(log.actedAt).toLocaleString()}
                            </span>
                          </div>
                          {log.comment && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted/40 rounded-md p-2">{log.comment}</p>
                          )}
                        </li>
                      );
                    })}

                    {/* Withdrawal always shown as the final step in the pipeline */}
                    {viewItem.status === "withdrawn" && (
                      <li className="relative">
                        <span className="absolute -left-[22px] flex h-5 w-5 items-center justify-center rounded-full bg-gray-500">
                          <LogOut className="h-3 w-3 text-white" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">Withdrawn</span>
                          {viewItem.withdrawnAt && (
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(viewItem.withdrawnAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {viewItem.withdrawalReason && (
                          <p className="text-xs text-destructive mt-1 bg-destructive/10 rounded-md p-2">{viewItem.withdrawalReason}</p>
                        )}
                      </li>
                    )}
                  </ol>
                )}
              </div>

              {/* Documents: manuscript + supporting/supplementary file */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />Documents
                </p>
                <div className="flex flex-wrap gap-2">
                  {fullFileUrl(viewItem.manuscriptUrl || viewItem.pdfUrl || viewItem.pdf_url) ? (
                    <>
                      <Button asChild size="sm">
                        <a href={fullFileUrl(viewItem.manuscriptUrl || viewItem.pdfUrl || viewItem.pdf_url)!} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />View Manuscript
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={fullFileUrl(viewItem.manuscriptUrl || viewItem.pdfUrl || viewItem.pdf_url)!} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" />Download Manuscript
                        </a>
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No manuscript uploaded.</p>
                  )}
                  {fullFileUrl(viewItem.supplementaryFileUrl) && (
                    <Button asChild size="sm" variant="outline">
                      <a href={fullFileUrl(viewItem.supplementaryFileUrl)!} target="_blank" rel="noopener noreferrer">
                        <Paperclip className="h-4 w-4 mr-2" />Supporting Document
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
            {viewItem?.status === "changes_requested_awaiting_admin" && (
              <>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => decideChangeRequest(viewItem, "decline")}>
                  <XCircle className="h-4 w-4 mr-2" />Decline (back to reviewer)
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => decideChangeRequest(viewItem, "approve")}>
                  <CheckCircle className="h-4 w-4 mr-2" />Approve (send to author)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
