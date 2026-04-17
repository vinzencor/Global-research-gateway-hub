import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, UserPlus, Plus, Pencil, Trash2, Search, User, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Reviewer = {
  id: string;
  full_name: string;
  email?: string;
  expertise?: string;
  institution?: string;
  type: string;
};

const STATUS_COLORS: Record<string, string> = {
  in_review: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-success/10 text-success border-success/20",
  changes_requested: "bg-orange-500/10 text-orange-600",
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminReviews() {
  const { user } = useAuth();
  const [tab, setTab] = useState("queue");

  // Review queue state
  const [queue, setQueue] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [showAssign, setShowAssign] = useState<any>(null);
  const [selectedReviewerPerson, setSelectedReviewerPerson] = useState("");
  const [selectedReviewerUser, setSelectedReviewerUser] = useState("");
  const [showDecision, setShowDecision] = useState<any>(null);
  const [decision, setDecision] = useState("approved");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reviewer management state
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [showReviewerDialog, setShowReviewerDialog] = useState<"add" | "edit" | null>(null);
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null);
  const [revForm, setRevForm] = useState({ full_name: "", email: "", expertise: "", institution: "", type: "reviewer" });
  const [savingReviewer, setSavingReviewer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Reviewer | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [contentResult, reviewersResult, profilesResult] = await Promise.all([
      supabase
        .from("content_items")
        .select("id,title,type,status,created_at,reviews(id,status,reviewer_person_id,reviewer_user_id)")
        .in("status", ["in_review", "approved", "changes_requested"])
        .order("created_at", { ascending: false }),
      supabase
        .from("persons")
        .select("id,full_name,email,expertise,institution,type")
        .in("type", ["reviewer", "both"])
        .order("full_name"),
      supabase.from("profiles").select("id,full_name,institution"),
    ]);
    setQueue(contentResult.data || []);
    setReviewers(reviewersResult.data || []);
    setProfiles(profilesResult.data || []);
  }

  // ── Queue actions ─────────────────────────────────────────────────────────
  async function handleAssign() {
    if (!selectedReviewerPerson || !showAssign) return;
    setSaving(true);
    await supabase.from("content_items").update({ status: "in_review" }).eq("id", showAssign.id).in("status", ["draft"]);
    const { error } = await supabase.from("reviews").insert({
      content_id: showAssign.id,
      reviewer_person_id: selectedReviewerPerson,
      reviewer_user_id: selectedReviewerUser || null,
      assigned_by_user_id: user?.id,
      status: "assigned",
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    });
    setSaving(false);
    if (error) { toast.error("Assignment failed"); return; }
    toast.success("Reviewer assigned!");
    setShowAssign(null); setSelectedReviewerPerson(""); setSelectedReviewerUser("");
    loadData();
  }

  async function handleDecision() {
    if (!showDecision) return;
    setSaving(true);
    await supabase.from("review_decisions").insert({
      content_id: showDecision.id,
      decided_by_user_id: user?.id,
      decision,
      decision_notes: decisionNotes,
    });
    const newStatus = decision === "approved" ? "approved" : decision === "rejected" ? "archived" : "changes_requested";
    await supabase.from("content_items").update({ status: newStatus }).eq("id", showDecision.id);
    setSaving(false);
    toast.success(`Decision recorded: ${decision}`);
    setShowDecision(null); setDecisionNotes("");
    loadData();
  }

  // ── Reviewer management ───────────────────────────────────────────────────
  function openAddReviewer() {
    setRevForm({ full_name: "", email: "", expertise: "", institution: "", type: "reviewer" });
    setEditingReviewer(null);
    setShowReviewerDialog("add");
  }

  function openEditReviewer(r: Reviewer) {
    setRevForm({ full_name: r.full_name, email: r.email || "", expertise: r.expertise || "", institution: r.institution || "", type: r.type });
    setEditingReviewer(r);
    setShowReviewerDialog("edit");
  }

  async function handleSaveReviewer() {
    if (!revForm.full_name.trim()) { toast.error("Name is required"); return; }
    setSavingReviewer(true);
    const payload = {
      full_name: revForm.full_name,
      email: revForm.email || null,
      expertise: revForm.expertise || null,
      institution: revForm.institution || null,
      type: revForm.type,
    };
    let error;
    if (showReviewerDialog === "edit" && editingReviewer) {
      ({ error } = await supabase.from("persons").update(payload).eq("id", editingReviewer.id));
    } else {
      ({ error } = await supabase.from("persons").insert(payload));
    }
    setSavingReviewer(false);
    if (error) { toast.error("Failed to save reviewer: " + error.message); return; }
    toast.success(showReviewerDialog === "edit" ? "Reviewer updated!" : "Reviewer added!");
    setShowReviewerDialog(null);
    loadData();
  }

  async function handleDeleteReviewer(r: Reviewer) {
    const { error } = await supabase.from("persons").delete().eq("id", r.id);
    if (error) { toast.error("Delete failed: " + error.message); return; }
    toast.success("Reviewer removed");
    setDeleteConfirm(null);
    loadData();
  }

  const filteredReviewers = reviewers.filter(r => {
    const q = reviewerSearch.toLowerCase();
    return !q || r.full_name.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q) || r.expertise?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <h2 className="font-heading font-bold text-xl">Review Management</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="reviewers">
            Manage Reviewers
            <Badge variant="secondary" className="ml-2 text-xs">{reviewers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Review Queue ─────────────────────────────────────── */}
        <TabsContent value="queue" className="space-y-4 mt-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "In Review", count: queue.filter(q => q.status === "in_review").length, icon: <Clock className="h-4 w-4 text-warning" /> },
              { label: "Approved", count: queue.filter(q => q.status === "approved").length, icon: <CheckCircle className="h-4 w-4 text-success" /> },
              { label: "Changes Req.", count: queue.filter(q => q.status === "changes_requested").length, icon: <XCircle className="h-4 w-4 text-orange-500" /> },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card p-4 card-shadow flex items-center gap-3">
                {s.icon}<div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.count}</p></div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Content</th>
                  <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr></thead>
                <tbody>
                  {queue.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No items in review queue</td></tr>
                  ) : queue.map((item) => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium max-w-[200px] truncate">{item.title}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{item.type}</td>
                      <td className="p-4"><Badge variant="outline" className={STATUS_COLORS[item.status]}>{item.status.replace("_", " ")}</Badge></td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => { setShowAssign(item); setSelectedReviewerPerson(""); }}>
                            <UserPlus className="h-3 w-3" /> Assign
                          </Button>
                          <Button size="sm" variant="outline" className="text-success" onClick={() => { setShowDecision(item); setDecision("approved"); }}>Decide</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 2: Manage Reviewers ─────────────────────────────────── */}
        <TabsContent value="reviewers" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, email or expertise..." className="pl-9" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)} />
            </div>
            <Button onClick={openAddReviewer} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Reviewer
            </Button>
          </div>

          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            {filteredReviewers.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground">
                <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No reviewers found</p>
                <p className="text-sm mt-1">Add reviewers using the button above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Expertise</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">Institution</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredReviewers.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {r.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{r.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{r.email || "—"}</td>
                        <td className="p-4 hidden lg:table-cell">
                          {r.expertise
                            ? <div className="flex flex-wrap gap-1">{r.expertise.split(",").slice(0, 2).map((e, i) => <Badge key={i} variant="secondary" className="text-xs">{e.trim()}</Badge>)}</div>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4 text-muted-foreground hidden xl:table-cell">{r.institution || "—"}</td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs capitalize">
                            {r.type === "both" ? <><Star className="h-3 w-3 mr-1 inline" />Both</> : r.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditReviewer(r)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(r)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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

      {/* ── Assign Reviewer Dialog ──────────────────────────────────────── */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Reviewer</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium">{showAssign?.title}</p>
            <div className="space-y-2">
              <Label>Reviewer (from Reviewer Directory)</Label>
              <Select value={selectedReviewerPerson} onValueChange={setSelectedReviewerPerson}>
                <SelectTrigger><SelectValue placeholder="Choose a reviewer..." /></SelectTrigger>
                <SelectContent>
                  {reviewers.map(r => <SelectItem key={r.id} value={r.id}>{r.full_name}{r.expertise ? ` — ${r.expertise.split(",")[0].trim()}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Portal User (optional)</Label>
              <Select value={selectedReviewerUser} onValueChange={setSelectedReviewerUser}>
                <SelectTrigger><SelectValue placeholder="Select user account..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Linking a user account lets them see this review in their reviewer portal.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || !selectedReviewerPerson}>{saving ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Decision Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!showDecision} onOpenChange={() => setShowDecision(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editorial Decision</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{showDecision?.title}</p>
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={decision} onValueChange={setDecision}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approve</SelectItem>
                  <SelectItem value="changes_requested">Request Changes</SelectItem>
                  <SelectItem value="rejected">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)} placeholder="Decision notes..." rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecision(null)}>Cancel</Button>
            <Button onClick={handleDecision} disabled={saving}>{saving ? "Saving..." : "Submit Decision"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit Reviewer Dialog ────────────────────────────────────── */}
      <Dialog open={!!showReviewerDialog} onOpenChange={o => { if (!o) setShowReviewerDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showReviewerDialog === "edit" ? "Edit Reviewer" : "Add Reviewer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input value={revForm.full_name} onChange={e => setRevForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Dr. Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={revForm.email} onChange={e => setRevForm(f => ({ ...f, email: e.target.value }))} placeholder="reviewer@university.edu" />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input value={revForm.institution} onChange={e => setRevForm(f => ({ ...f, institution: e.target.value }))} placeholder="MIT, Stanford, etc." />
            </div>
            <div className="space-y-2">
              <Label>Expertise / Categories</Label>
              <Input value={revForm.expertise} onChange={e => setRevForm(f => ({ ...f, expertise: e.target.value }))} placeholder="e.g. Machine Learning, NLP, Bioinformatics" />
              <p className="text-xs text-muted-foreground">Separate multiple areas with commas</p>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={revForm.type} onValueChange={v => setRevForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewer">Reviewer only</SelectItem>
                  <SelectItem value="both">Reviewer & Author</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewerDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveReviewer} disabled={savingReviewer}>{savingReviewer ? "Saving..." : showReviewerDialog === "edit" ? "Update" : "Add Reviewer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={o => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Reviewer</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to remove <strong>{deleteConfirm?.full_name}</strong> from the reviewer directory? This will not affect existing review assignments.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteReviewer(deleteConfirm)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
