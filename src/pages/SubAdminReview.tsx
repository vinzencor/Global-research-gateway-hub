import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClipboardList, FileText, RefreshCw, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { workflowApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getSubAdminNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  approved: "bg-success/10 text-success border-success/20",
};

export default function SubAdminReview() {
  const { user } = useAuth();
  const navItems = getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessMode, setAccessMode] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  // Changes request modal state
  const [changesModal, setChangesModal] = useState<any>(null);
  const [changesComment, setChangesComment] = useState("");

  useEffect(() => { if (user) loadAssignments(); }, [user]);

  async function loadAssignments() {
    setLoading(true);
    try {
      const data: any = await workflowApi.getMyQueue();
      setAssignments(data || []);
    } catch (err: any) {
      toast.error("Failed to load review queue");
      setAssignments([]);
    }
    setLoading(false);
  }

  async function act(item: any, action: "approved" | "changes_requested" | "rejected", comment?: string) {
    const id = item._id || item.id;
    setActing(id);
    const selectedAccessMode = accessMode[id] || item.accessMode || "open_access";

    try {
      // Pass individual positional parameters, NOT an object
      await workflowApi.reviewAction(
        id,
        action,
        comment || "",
        selectedAccessMode
      );

      if (action === "approved") {
        toast.success("Approved and moved to next stage!");
      } else if (action === "changes_requested") {
        toast.success("Changes requested - sent back to author.");
      } else {
        toast.success("Journal rejected.");
      }
      setAssignments(prev => prev.filter(a => (a._id || a.id) !== id));
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setActing(null);
    }
  }

  function openChangesModal(item: any) {
    setChangesModal(item);
    setChangesComment("");
  }

  function submitChangesRequest() {
    if (!changesComment.trim()) {
      toast.error("Please provide feedback for the author.");
      return;
    }
    act(changesModal, "changes_requested", changesComment);
    setChangesModal(null);
  }

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Stage Review Queue">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} title="Stage Review Queue">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">These items are at your assigned review stage. Review each and take action.</p>
          <Button variant="outline" size="sm" onClick={loadAssignments} className="gap-2">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>

        {assignments.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No items pending your review</p>
            <p className="text-sm">You'll see submissions here when they reach your stage in the workflow.</p>
          </div>
        )}

        {assignments.map(item => {
          const id = item._id || item.id;
          const status = item.workflowStatus || item.status;
          const manuscriptFullUrl = item.manuscriptUrl
            ? (item.manuscriptUrl.startsWith("http") ? item.manuscriptUrl : `${API_BASE}${item.manuscriptUrl}`)
            : null;

          return (
            <div key={id} className="rounded-xl border bg-card p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase">{item.itemType || 'article'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    By {item.authorUser?.fullName || 'Unknown Author'}
                    {item.authorUser?.institution && ` - ${item.authorUser.institution}`}
                    {" - "}Submitted {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                  </p>
                  <Badge variant="outline" className={`mt-2 text-xs ${STATUS_COLORS[status] || ""}`}>
                    {status?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground text-right bg-muted/30 p-2 rounded-lg">
                  <p className="font-bold text-foreground">Current Stage</p>
                  <p className="text-primary font-medium">Stage {(item.currentStageIndex || 0) + 1}</p>
                </div>
              </div>

              {(item.summary || item.abstract) && (
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs font-medium mb-1 text-muted-foreground uppercase tracking-wider">Abstract / Summary</p>
                  <p className="text-sm line-clamp-3 text-muted-foreground leading-relaxed">{item.summary || item.abstract}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Access Mode (if publishing at final stage)</label>
                <Select value={accessMode[id] || item.accessMode || "open_access"} onValueChange={(v) => setAccessMode((prev) => ({ ...prev, [id]: v }))}>
                  <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open_access">Open Access</SelectItem>
                    <SelectItem value="members_only">Members Only</SelectItem>
                    <SelectItem value="pay_per_view">Pay-per-view</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 flex-wrap pt-2 border-t">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => act(item, "approved")}
                  disabled={acting === id}
                >
                  <CheckCircle className="h-4 w-4" /> Approve and Move Next
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-400 text-orange-600 hover:bg-orange-50 gap-2"
                  onClick={() => openChangesModal(item)}
                  disabled={acting === id}
                >
                  <AlertCircle className="h-4 w-4" /> Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/5 gap-2"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reject this journal? This action cannot be undone.")) {
                      act(item, "rejected");
                    }
                  }}
                  disabled={acting === id}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>

                {manuscriptFullUrl && (
                  <Button variant="ghost" size="sm" className="ml-auto text-xs" asChild>
                    <a href={manuscriptFullUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> View Manuscript
                    </a>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Changes Request Modal */}
      <Dialog open={!!changesModal} onOpenChange={(o) => { if (!o) setChangesModal(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Journal</p>
              <p className="font-semibold">{changesModal?.title}</p>
            </div>
            <div className="space-y-2">
              <Label>Feedback for the Author *</Label>
              <Textarea
                value={changesComment}
                onChange={e => setChangesComment(e.target.value)}
                placeholder="Describe what changes are needed (e.g., 'Abstract needs more clarity', 'Missing references in section 3')..."
                rows={5}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">This message will be shown to the author on their submissions dashboard.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesModal(null)}>Cancel</Button>
            <Button
              onClick={submitChangesRequest}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Send Changes Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
