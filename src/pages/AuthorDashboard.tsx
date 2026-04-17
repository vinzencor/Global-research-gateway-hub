import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, Send, User, CreditCard, BookOpen, PenSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  approved: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AuthorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadSubmissions(); }, [user]);

  async function loadSubmissions() {
    setLoading(true);
    const { data, error } = await supabase
      .from("content_items")
      .select("id, title, type, status, workflow_status, current_stage_index, created_at, summary")
      .eq("author_user_id", user!.id)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load submissions"); }
    setSubmissions(data || []);
    setLoading(false);
  }

  const stats = [
    { label: "Total Submissions", value: submissions.length },
    { label: "Under Review", value: submissions.filter(s => s.workflow_status === "in_review").length },
    { label: "Published", value: submissions.filter(s => s.workflow_status === "published" || s.status === "published").length },
    { label: "Needs Revision", value: submissions.filter(s => s.workflow_status === "changes_requested").length },
  ];

  const displayStatus = (s: any) => s.workflow_status || s.status || "draft";

  return (
    <DashboardLayout navItems={navItems} title="Author Dashboard">
      {/* Welcome */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-5 mb-6">
        <h2 className="font-heading text-xl font-bold">Welcome, {user?.profile?.full_name?.split(" ")[0] || "Author"}!</h2>
        <p className="text-sm text-muted-foreground mt-1">{user?.email} {user?.profile?.institution ? `· ${user.profile.institution}` : ""}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow">
            <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
            <p className="text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Changes Requested alert */}
      {submissions.some(s => s.workflow_status === "changes_requested") && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 mb-4">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
            ⚠️ Some of your submissions need revisions. Please review the feedback and resubmit.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="font-heading font-bold">My Submissions</h2>
          <Link to="/submit-paper"><Button size="sm">+ Submit Journal</Button></Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
        ) : submissions.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No submissions yet</p>
            <p className="text-sm">Submit your first journal to get started</p>
            <Link to="/submit-paper"><Button size="sm" className="mt-3">Submit Journal</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Paper Title</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Submitted</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => {
                  const ds = displayStatus(s);
                  const needsEdit = ds === "changes_requested";
                  return (
                    <tr key={s.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${needsEdit ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                      <td className="p-4 font-medium max-w-[200px]"><p className="truncate">{s.title}</p></td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={STATUS_COLORS[ds]}>{ds.replace("_", " ")}</Badge>
                      </td>
                      <td className="p-4">
                        {needsEdit ? (
                          <Button size="sm" variant="outline" className="border-orange-400 text-orange-600" onClick={() => navigate(`/submit-paper?edit=${s.id}`)}>
                            ✏️ Edit & Resubmit
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">View</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
