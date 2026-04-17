import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, ClipboardCheck, Clock, CheckCircle, XCircle, BarChart2, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/reviewer", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Reviews", to: "/reviewer", icon: <FileText className="h-4 w-4" /> },
  { label: "Reports", to: "/reviewer/report", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Settings", to: "/reviewer/settings", icon: <Settings className="h-4 w-4" /> },
];

const statusColor: Record<string, string> = {
  assigned: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-info/10 text-info border-info/20",
  submitted: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function ReviewerPortal() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState<any>(null);
  const [recommendation, setRecommendation] = useState("accept");
  const [commentsEditor, setCommentsEditor] = useState("");
  const [commentsAuthor, setCommentsAuthor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) loadReviews(); }, [user]);

  async function loadReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*, content_items(id, title, type, summary, status)")
      .eq("reviewer_user_id", user!.id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }

  async function handleAccept(reviewId: string) {
    await supabase.from("reviews").update({ status: "accepted" }).eq("id", reviewId);
    toast.success("Review accepted!"); loadReviews();
  }

  async function handleDecline(reviewId: string) {
    await supabase.from("reviews").update({ status: "declined" }).eq("id", reviewId);
    toast.success("Review declined."); loadReviews();
  }

  function openReviewForm(review: any) {
    setShowReviewForm(review);
    setRecommendation(review.recommendation || "accept");
    setCommentsEditor(review.comments_to_editor || "");
    setCommentsAuthor(review.comments_to_author || "");
  }

  async function handleSubmitReview() {
    if (!showReviewForm) return;
    if (!commentsEditor.trim()) { toast.error("Comments to editor are required"); return; }
    setSaving(true);
    const { error } = await supabase.from("reviews").update({
      status: "submitted",
      recommendation,
      comments_to_editor: commentsEditor,
      comments_to_author: commentsAuthor,
      submitted_at: new Date().toISOString(),
    }).eq("id", showReviewForm.id);
    setSaving(false);
    if (error) { toast.error("Submission failed"); return; }
    toast.success("Review submitted successfully!");
    setShowReviewForm(null); loadReviews();
  }

  const pending = reviews.filter(r => r.status === "assigned" || r.status === "accepted");
  const submitted = reviews.filter(r => r.status === "submitted");
  const declined = reviews.filter(r => r.status === "declined");

  return (
    <DashboardLayout navItems={navItems} title="Reviewer Portal">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Assigned", value: reviews.length, icon: <FileText className="h-5 w-5 text-primary" /> },
          { label: "Pending", value: pending.length, icon: <Clock className="h-5 w-5 text-warning" /> },
          { label: "Submitted", value: submitted.length, icon: <CheckCircle className="h-5 w-5 text-success" /> },
          { label: "Declined", value: declined.length, icon: <XCircle className="h-5 w-5 text-destructive" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow flex items-center gap-3">
            {s.icon}
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="p-5 border-b flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          <h2 className="font-heading font-bold">My Assigned Reviews</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No reviews assigned yet</p>
            <p className="text-sm mt-1">When an editor assigns you content to review, it will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Content</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Due Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium max-w-[200px] truncate">{review.content_items?.title || "—"}</div>
                      {review.content_items?.summary && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{review.content_items.summary}</div>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{review.content_items?.type || "—"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {review.due_date ? new Date(review.due_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={statusColor[review.status] || ""}>{review.status}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {review.status === "assigned" && (
                          <>
                            <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => handleAccept(review.id)}>Accept</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDecline(review.id)}>Decline</Button>
                          </>
                        )}
                        {review.status === "accepted" && (
                          <Button size="sm" onClick={() => openReviewForm(review)}>Submit Review</Button>
                        )}
                        {review.status === "submitted" && (
                          <Button size="sm" variant="ghost" onClick={() => openReviewForm(review)}>View Submission</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Submission Dialog */}
      <Dialog open={!!showReviewForm} onOpenChange={() => setShowReviewForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{showReviewForm?.status === "submitted" ? "Review Details" : "Submit Review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Reviewing</p>
              <p className="font-semibold">{showReviewForm?.content_items?.title}</p>
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
                onChange={e => setCommentsEditor(e.target.value)}
                placeholder="Confidential comments for the editor only..."
                rows={4}
                disabled={showReviewForm?.status === "submitted"}
              />
            </div>
            <div className="space-y-2">
              <Label>Comments to Author (optional)</Label>
              <Textarea
                value={commentsAuthor}
                onChange={e => setCommentsAuthor(e.target.value)}
                placeholder="Comments that will be shared with the author..."
                rows={4}
                disabled={showReviewForm?.status === "submitted"}
              />
            </div>
            {showReviewForm?.submitted_at && (
              <p className="text-xs text-muted-foreground">Submitted: {new Date(showReviewForm.submitted_at).toLocaleString()}</p>
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
    </DashboardLayout>
  );
}

