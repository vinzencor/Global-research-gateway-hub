import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usersApi, journalApi, workflowApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Search, User, Trash2, Plus, UserPlus, FileText } from "lucide-react";

// --- Types ---
type Reviewer = {
  id: string;
  full_name: string;
  email?: string;
  institution?: string;
  roles?: string[];
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  accepted: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function AdminReviews() {
  const { user } = useAuth();
  const [tab, setTab] = useState("queue");

  // Review queue state
  const [queue, setQueue] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);

  // Reviewer management state
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [showReviewerDialog, setShowReviewerDialog] = useState<"add" | null>(null);
  const [revForm, setRevForm] = useState({ email: "" });
  const [savingReviewer, setSavingReviewer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Reviewer | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoadingQueue(true);
    try {
      // 1. Fetch Review Queue (Active journals in workflow)
      const journalsResult: any = await journalApi.adminList({ limit: "1000" });
      const allJournals = journalsResult?.data?.items || journalsResult?.items || journalsResult || [];
      // Filter for items that are actually in some review/submission state
      const reviewQueue = allJournals.filter((j: any) => 
        ["submitted", "in_review", "changes_requested", "accepted"].includes(j.status)
      );
      setQueue(reviewQueue);

      // 2. Fetch Users to find Reviewers
      const usersResult: any = await usersApi.list({ limit: "2000" });
      const userRows = usersResult?.data?.users || usersResult?.users || [];
      
      const reviewerRows: Reviewer[] = userRows
        .filter((u: any) => Array.isArray(u?.roles) && u.roles.includes("reviewer"))
        .map((u: any) => ({
          id: String(u?._id || u?.id),
          full_name: u?.fullName || "Unnamed",
          email: u?.email || "",
          institution: u?.institution || "",
          roles: Array.isArray(u?.roles) ? u.roles : [],
        }));

      setReviewers(reviewerRows);
      setAllUsers(userRows);
    } catch (err: any) {
      toast.error("Failed to load review data");
    } finally {
      setLoadingQueue(false);
    }
  }

  // --- Reviewer management actions ---
  function openAddReviewer() {
    setRevForm({ email: "" });
    setShowReviewerDialog("add");
  }

  async function handleSaveReviewer() {
    if (!revForm.email.trim()) { toast.error("Email is required"); return; }
    setSavingReviewer(true);
    const found = allUsers.find((u: any) => String(u?.email || "").toLowerCase() === revForm.email.trim().toLowerCase());
    
    if (!found) {
      setSavingReviewer(false);
      toast.error("No user found with this email. Ask them to register first.");
      return;
    }

    const userId = String(found?._id || found?.id);
    try {
      await usersApi.addRole(userId, "reviewer");
      toast.success("Reviewer role added!");
      setShowReviewerDialog(null);
      loadData();
    } catch (err: any) {
      toast.error("Failed to add reviewer role: " + (err?.message || "Unknown error"));
    } finally {
      setSavingReviewer(false);
    }
  }

  async function handleDeleteReviewer(r: Reviewer) {
    try {
      await usersApi.removeRole(r.id, "reviewer");
      toast.success("Reviewer role removed");
      setDeleteConfirm(null);
      loadData();
    } catch (err: any) {
      toast.error("Remove failed: " + (err?.message || "Unknown error"));
    }
  }

  const filteredReviewers = reviewers.filter(r => {
    const q = reviewerSearch.toLowerCase();
    return !q || r.full_name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.institution?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-xl">Review Management</h2>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loadingQueue} className="gap-2">
           <Clock className={`h-4 w-4 ${loadingQueue ? 'animate-spin' : ''}`} /> Refresh Data
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="queue" className="gap-2">
            <FileText className="h-4 w-4" />
            Review Queue
            <Badge variant="secondary" className="ml-1 text-[10px]">{queue.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-2">
            <User className="h-4 w-4" />
            Manage Reviewers
            <Badge variant="secondary" className="ml-1 text-[10px]">{reviewers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Review Queue */}
        <TabsContent value="queue" className="space-y-4 mt-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Submitted", count: queue.filter(q => q.status === "submitted").length, icon: <FileText className="h-4 w-4 text-blue-500" /> },
              { label: "In Review", count: queue.filter(q => q.status === "in_review").length, icon: <Clock className="h-4 w-4 text-warning" /> },
              { label: "Changes Req.", count: queue.filter(q => q.status === "changes_requested").length, icon: <RotateCcw className="h-4 w-4 text-orange-500" /> },
              { label: "Accepted", count: queue.filter(q => q.status === "accepted").length, icon: <CheckCircle className="h-4 w-4 text-success" /> },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">{s.icon}</div>
                <div><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{s.label}</p><p className="text-xl font-bold">{s.count}</p></div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Journal Title</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Author</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Workflow Stage</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody>
                  {loadingQueue ? (
                    <tr><td colSpan={5} className="p-10 text-center"><Clock className="h-6 w-6 animate-spin mx-auto opacity-20" /></td></tr>
                  ) : queue.length === 0 ? (
                    <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No items in review queue</p>
                    </td></tr>
                  ) : queue.map((item) => (
                    <tr key={item._id || item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium max-w-[250px] truncate">{item.title}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{item.authorUser?.fullName || "Unknown"}</td>
                      <td className="p-4"><Badge variant="outline" className={STATUS_COLORS[item.status]}>{item.status.replace("_", " ")}</Badge></td>
                      <td className="p-4 text-xs font-medium text-primary">Stage {(item.currentStageIndex || 0) + 1}</td>
                      <td className="p-4">
                        <Button size="sm" variant="ghost" className="text-xs" asChild>
                          <a href="/admin/pipeline">View in Pipeline</a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Manage Reviewers */}
        <TabsContent value="reviewers" className="space-y-4 mt-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search reviewers..." className="pl-10" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)} />
            </div>
            <Button onClick={openAddReviewer} className="gap-2">
              <Plus className="h-4 w-4" /> Add Reviewer Role
            </Button>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {filteredReviewers.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p className="font-medium">No reviewers found</p>
                <p className="text-sm mt-1">Assign the 'reviewer' role to users to see them here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Reviewer</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Institution</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Roles</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredReviewers.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {r.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-foreground">{r.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{r.email || "-"}</td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">{r.institution || "-"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {r.roles?.map((role, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                                {role.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/5" onClick={() => setDeleteConfirm(r)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Reviewer Dialog */}
      <Dialog open={!!showReviewerDialog} onOpenChange={o => { if (!o) setShowReviewerDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Reviewer Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email Address</Label>
              <Input type="email" value={revForm.email} onChange={e => setRevForm(f => ({ ...f, email: e.target.value }))} placeholder="reviewer@example.com" />
              <p className="text-[10px] text-muted-foreground">This will grant the 'reviewer' role to an existing user account.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewerDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveReviewer} disabled={savingReviewer}>{savingReviewer ? "Adding..." : "Add Reviewer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Reviewer Role</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to remove the reviewer role from <strong>{deleteConfirm?.full_name}</strong>? 
              They will no longer be able to access the reviewer portal.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteReviewer(deleteConfirm)}>Confirm Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const RotateCcw = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);
