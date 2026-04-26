import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText, MessageSquare, AlertTriangle, ExternalLink, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { journalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  accepted: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted - Awaiting Review",
  in_review: "Under Review",
  changes_requested: "Changes Requested",
  accepted: "Accepted",
  published: "Published",
  rejected: "Rejected",
};

export default function AuthorDashboard() {
  const { user } = useAuth();
  const navItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadSubmissions(); }, [user]);

  async function loadSubmissions() {
    setLoading(true);
    try {
      const data: any = await journalApi.getMySubmissions();
      setSubmissions(data.items || data || []);
    } catch { toast.error("Failed to load submissions"); }
    setLoading(false);
  }

  const stats = [
    { label: "Total Submissions", value: submissions.length },
    { label: "Under Review", value: submissions.filter(s => ["submitted", "in_review"].includes(s.status)).length },
    { label: "Published", value: submissions.filter(s => s.status === "published").length },
    { label: "Needs Revision", value: submissions.filter(s => s.status === "changes_requested").length },
  ];

  const displayStatus = (s: any) => s.status || "draft";

  return (
    <DashboardLayout navItems={navItems} title="My Submissions">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold font-heading">My Submissions</h2>
              <p className="text-muted-foreground text-sm mt-1">Manage and track your journal submissions throughout the peer-review process.</p>
            </div>
            <Link to="/submit-paper"><Button>+ Submit Journal</Button></Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow">
                <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                <p className="text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Changes Requested alert */}
          {submissions.some(s => s.status === "changes_requested") && (
            <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                  Action Required: Some submissions need revisions
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-0.5">
                  A reviewer has requested changes. Please review the feedback below, edit your submission, and resubmit.
                </p>
              </div>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
          ) : submissions.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground card-shadow">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm">Submit your first journal to get started</p>
              <Link to="/submit-paper"><Button size="sm" className="mt-3">Submit Journal</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((s) => {
                const ds = displayStatus(s);
                const needsEdit = ds === "changes_requested";
                const isPublished = ds === "published";
                const sid = s._id || s.id;
                const manuscriptFullUrl = s.manuscriptUrl
                  ? (s.manuscriptUrl.startsWith("http") ? s.manuscriptUrl : `${API_BASE}${s.manuscriptUrl}`)
                  : null;

                return (
                  <div key={sid} className={`rounded-xl border bg-card overflow-hidden card-shadow transition-all ${needsEdit ? "border-orange-300 ring-1 ring-orange-200" : ""}`}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base truncate">{s.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(s.createdAt || s.created_at).toLocaleDateString()}
                            {s.institution && ` - ${s.institution}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 ${STATUS_COLORS[ds]}`}>
                          {STATUS_LABELS[ds] || ds.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {/* Show reviewer feedback if changes were requested */}
                      {needsEdit && s.reviewerComment && (
                        <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-orange-600" />
                            <p className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Reviewer Feedback</p>
                          </div>
                          <p className="text-sm text-orange-800 dark:text-orange-300 leading-relaxed whitespace-pre-wrap">
                            {s.reviewerComment}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap mt-4 pt-3 border-t border-border/50">
                        {needsEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-400 text-orange-600 hover:bg-orange-50 gap-2"
                            onClick={() => navigate(`/submit-paper?edit=${sid}`)}
                          >
                            <Edit3 className="h-3 w-3" /> Edit and Resubmit
                          </Button>
                        )}
                        {manuscriptFullUrl && (
                          <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
                            <a href={manuscriptFullUrl} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-3 w-3" /> View Manuscript
                            </a>
                          </Button>
                        )}
                        {isPublished && s.slug && (
                          <Button variant="ghost" size="sm" className="text-xs gap-1 ml-auto" asChild>
                            <Link to={`/journals/${s.slug}`}>
                              <ExternalLink className="h-3 w-3" /> View Published
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5 card-shadow">
            <h3 className="font-heading font-bold text-sm mb-4 border-b pb-2">Submission Guidelines</h3>
            <ul className="text-xs space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Ensure your abstract is under 300 words.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Maintain anonymity for double-blind peer review.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Use clear, high-resolution figures.</span>
              </li>
            </ul>
            <Button variant="link" className="px-0 text-xs mt-4 h-auto" asChild>
              <Link to="/standards">View full guidelines -&gt;</Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-primary/5 p-5">
            <h3 className="font-heading font-bold text-sm mb-2">Need Help?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              If you have questions about your submission or the review status, please contact our editorial support.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs" asChild>
              <Link to="/support">Contact Editorial</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
