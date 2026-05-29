import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText, ClipboardCheck, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_ORIGIN, reviewsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalNavItemsForRoles, getSubAdminNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  assigned: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-info/10 text-info border-info/20",
  submitted: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
};

const redactAuthor = (name: string) => {
  if (!name) return "Redacted";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => (part.length <= 1 ? "*" : `${part[0]}${"*".repeat(Math.max(2, part.length - 1))}`))
    .join(" ");
};

export default function ReviewerPortal() {
  const { user } = useAuth();
  const navItems = user?.roles?.includes("sub_admin") || user?.roles?.includes("super_admin")
    ? getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {})
    : getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});

  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState<any>(null);
  const [recommendation, setRecommendation] = useState("accept");
  const [commentsEditor, setCommentsEditor] = useState("");
  const [commentsAuthor, setCommentsAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewReview, setPreviewReview] = useState<any>(null);

  useEffect(() => {
    if (user) loadReviews();
  }, [user]);

  async function loadReviews() {
    setLoading(true);
    try {
      const data: any = await reviewsApi.getMyReviews();
      setReviews(data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load assigned papers");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPaper(reviewId: string) {
    try {
      await reviewsApi.selectPaper(reviewId);
      toast.success("Paper selected successfully");
      await loadReviews();
    } catch (err: any) {
      toast.error(err?.message || "Failed to select this paper");
    }
  }

  async function handleDecline(reviewId: string) {
    try {
      await reviewsApi.decline(reviewId);
      toast.success("Paper declined");
      await loadReviews();
    } catch (err: any) {
      toast.error(err?.message || "Failed to decline");
    }
  }

  function openReviewForm(review: any) {
    setShowReviewForm(review);
    setRecommendation(review.recommendation || "accept");
    setCommentsEditor(review.commentsToEditor || "");
    setCommentsAuthor(review.commentsToAuthor || "");
  }

  async function handleSubmitReview() {
    if (!showReviewForm) return;
    if (!commentsEditor.trim()) {
      toast.error("Comments to editor are required");
      return;
    }

    setSaving(true);
    try {
      await reviewsApi.submit(showReviewForm._id || showReviewForm.id, {
        recommendation,
        commentsToEditor: commentsEditor,
        commentsToAuthor: commentsAuthor,
      });
      toast.success("Review submitted successfully");
      setShowReviewForm(null);
      await loadReviews();
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    } finally {
      setSaving(false);
    }
  }

  const pendingSelection = useMemo(() => reviews.filter((r) => r.status === "assigned"), [reviews]);
  const activeReview = useMemo(() => reviews.filter((r) => r.status === "accepted"), [reviews]);
  const submitted = useMemo(() => reviews.filter((r) => r.status === "submitted"), [reviews]);
  const declined = useMemo(() => reviews.filter((r) => r.status === "declined"), [reviews]);

  const getDisplayAuthor = (content: any) =>
    content?.originalAuthorName || content?.authorUser?.fullName || "Unknown";

  const getPreviewUrl = (content: any) => {
    if (!content?.manuscriptUrl) return "";
    return `${API_ORIGIN}${content.manuscriptUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`;
  };

  return (
    <DashboardLayout navItems={navItems} title="Reviewer Portal">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-xl font-bold">Reviewer Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your assigned papers and submit reviews below.</p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1">
          {user?.profile?.full_name || user?.email}
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Assigned", value: pendingSelection.length, icon: <FileText className="h-5 w-5" />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
          { label: "Selected / Active", value: activeReview.length, icon: <Clock className="h-5 w-5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Submitted", value: submitted.length, icon: <CheckCircle className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Declined", value: declined.length, icon: <XCircle className="h-5 w-5" />, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 card-shadow flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`p-2.5 rounded-lg ${s.bg} ${s.color} shrink-0`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden mb-6">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </div>
          <h2 className="font-heading font-bold">Assigned Papers</h2>
          <span className="ml-auto text-xs text-muted-foreground">Select only one to review</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
        ) : pendingSelection.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No papers waiting for selection</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {pendingSelection.map((review) => {
              const content = review.content || {};
              const reviewId = review._id || review.id;
              return (
                <div key={reviewId} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{content.title || "Untitled"}</p>
                    <Badge variant="outline" className={statusColor[review.status] || ""}>{review.status}</Badge>
                    <Badge variant="secondary">{content.type || "paper"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Author: {redactAuthor(getDisplayAuthor(content))}</p>
                  <p className="text-sm text-muted-foreground">{content.abstract || content.summary || "No abstract available"}</p>
                  <div className="flex gap-2 pt-1">
                    {!!content.manuscriptUrl && (
                      <Button size="sm" variant="outline" onClick={() => setPreviewReview(review)}>
                        <Eye className="h-4 w-4 mr-1" /> Preview First Page
                      </Button>
                    )}
                    <Button size="sm" onClick={() => handleSelectPaper(reviewId)}>Select This Paper</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDecline(reviewId)}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30">
            <ClipboardCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="font-heading font-bold">My Active & Submitted Reviews</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No review history found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Paper</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews
                  .filter((r) => r.status !== "assigned")
                  .map((review) => {
                    const content = review.content || {};
                    const reviewId = review._id || review.id;
                    return (
                      <tr key={reviewId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium max-w-[220px] truncate">{content.title || "-"}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Author: {redactAuthor(getDisplayAuthor(content))}</div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{content.type || "paper"}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          {review.dueDate ? new Date(review.dueDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4"><Badge variant="outline" className={statusColor[review.status] || ""}>{review.status}</Badge></td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {!!content.manuscriptUrl && (
                              <Button size="sm" variant="outline" onClick={() => setPreviewReview(review)}>
                                <Eye className="h-4 w-4 mr-1" /> Preview
                              </Button>
                            )}
                            {(review.status === "accepted" || review.status === "submitted") && (
                              <Button size="sm" onClick={() => openReviewForm(review)} variant={review.status === "submitted" ? "ghost" : "default"}>
                                {review.status === "submitted" ? "View Submission" : "Submit Review"}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!showReviewForm} onOpenChange={() => setShowReviewForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showReviewForm?.status === "submitted" ? "Review Details" : "Submit Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Reviewing</p>
              <p className="font-semibold">{showReviewForm?.content?.title}</p>
            </div>
            <div className="space-y-2">
              <Label>Recommendation *</Label>
              <Select value={recommendation} onValueChange={setRecommendation} disabled={showReviewForm?.status === "submitted"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="minor_revisions">Accept with Minor Revisions</SelectItem>
                  <SelectItem value="major_revisions">Major Revisions Required</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Comments to Editor *</Label>
              <Textarea
                value={commentsEditor}
                onChange={(e) => setCommentsEditor(e.target.value)}
                placeholder="Confidential comments for the editor only..."
                rows={4}
                disabled={showReviewForm?.status === "submitted"}
              />
            </div>
            <div className="space-y-2">
              <Label>Comments to Author (optional)</Label>
              <Textarea
                value={commentsAuthor}
                onChange={(e) => setCommentsAuthor(e.target.value)}
                placeholder="Comments that will be shared with the author..."
                rows={4}
                disabled={showReviewForm?.status === "submitted"}
              />
            </div>
            {showReviewForm?.submittedAt && (
              <p className="text-xs text-muted-foreground">Submitted: {new Date(showReviewForm.submittedAt).toLocaleString()}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewForm(null)}>Close</Button>
            {showReviewForm?.status !== "submitted" && (
              <Button onClick={handleSubmitReview} disabled={saving}>{saving ? "Submitting..." : "Submit Review"}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewReview} onOpenChange={() => setPreviewReview(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paper Preview (First Page Only)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {previewReview?.content?.title || "Untitled"}
            </p>
            <div className="rounded-lg border overflow-hidden">
              {getPreviewUrl(previewReview?.content) ? (
                <iframe
                  title="paper-preview-first-page"
                  src={getPreviewUrl(previewReview?.content)}
                  className="w-full h-[75vh]"
                />
              ) : (
                <div className="p-6 text-sm text-muted-foreground">No manuscript file available for preview.</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Preview is restricted to the first page before selection.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewReview(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
