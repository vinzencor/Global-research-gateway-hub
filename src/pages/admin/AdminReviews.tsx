import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usersApi, journalApi, reviewsApi } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle, Clock, FileText, Pencil, Plus, Search, Trash2, Upload, User } from "lucide-react";

type Reviewer = {
  id: string;
  fullName: string;
  email: string;
  institution: string;
  bio?: string;
  reviewerCategory?: string;
  roles: string[];
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  accepted: "bg-success/10 text-success border-success/20",
  published: "bg-green-600/10 text-green-700 border-green-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

const redactAuthor = (name: string) => {
  if (!name) return "Redacted";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => (part.length <= 1 ? "*" : `${part[0]}${"*".repeat(Math.max(2, part.length - 1))}`))
    .join(" ");
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 3);

export default function AdminReviews() {
  const [tab, setTab] = useState("queue");
  const [queue, setQueue] = useState<any[]>([]);
  const [allPapers, setAllPapers] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewerSearch, setReviewerSearch] = useState("");
  const [showReviewerDialog, setShowReviewerDialog] = useState<"add" | null>(null);
  const [revForm, setRevForm] = useState({ email: "" });
  const [savingReviewer, setSavingReviewer] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Reviewer | null>(null);

  const [bucketOpen, setBucketOpen] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
  const [assigningBucket, setAssigningBucket] = useState(false);
  const [paperSearch, setPaperSearch] = useState("");

  const [uploadingPaper, setUploadingPaper] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    originalAuthorName: "",
    abstract: "",
    institution: "",
    publishDate: "",
    keywords: "",
    coAuthors: "",
  });
  const [uploadPdfFile, setUploadPdfFile] = useState<File | null>(null);

  const [editPaper, setEditPaper] = useState<any>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deletePaper, setDeletePaper] = useState<any>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const journalsResult: any = await journalApi.adminList({ limit: "1000" });
      const allJournals = journalsResult?.items || journalsResult || [];
      setAllPapers(allJournals);
      const reviewQueue = allJournals.filter((j: any) => ["submitted", "in_review", "changes_requested", "accepted"].includes(j.status));
      setQueue(reviewQueue);

      const usersResult: any = await usersApi.list({ limit: "2000" });
      const userRows = usersResult?.users || [];
      setAllUsers(userRows);

      const reviewerRows: Reviewer[] = userRows
        .filter((u: any) => Array.isArray(u?.roles) && u.roles.includes("reviewer"))
        .map((u: any) => ({
          id: String(u?._id || u?.id),
          fullName: u?.fullName || "Unnamed",
          email: u?.email || "",
          institution: u?.institution || "",
          bio: u?.bio || "",
          reviewerCategory: u?.reviewerCategory || "",
          roles: Array.isArray(u?.roles) ? u.roles : [],
        }));
      setReviewers(reviewerRows);
    } catch {
      toast.error("Failed to load review data");
    } finally {
      setLoading(false);
    }
  }

  function openAddReviewer() {
    setRevForm({ email: "" });
    setShowReviewerDialog("add");
  }

  async function handleSaveReviewer() {
    if (!revForm.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setSavingReviewer(true);
    const found = allUsers.find(
      (u: any) => String(u?.email || "").toLowerCase() === revForm.email.trim().toLowerCase()
    );

    if (!found) {
      setSavingReviewer(false);
      toast.error("No user found with this email. Ask them to register first.");
      return;
    }

    const userId = String(found?._id || found?.id);
    try {
      await usersApi.addRole(userId, "reviewer");
      toast.success("Reviewer role added");
      setShowReviewerDialog(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add reviewer role");
    } finally {
      setSavingReviewer(false);
    }
  }

  async function handleDeleteReviewer(r: Reviewer) {
    try {
      await usersApi.removeRole(r.id, "reviewer");
      toast.success("Reviewer role removed");
      setDeleteConfirm(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Remove failed");
    }
  }

  const selectedReviewer = useMemo(
    () => reviewers.find((r) => r.id === selectedReviewerId) || null,
    [reviewers, selectedReviewerId]
  );

  const recommendedPapers = useMemo(() => {
    if (!selectedReviewer) return [];

    const nicheTokens = tokenize(
      [selectedReviewer.reviewerCategory, selectedReviewer.bio, selectedReviewer.institution].filter(Boolean).join(" ")
    );

    const scored = queue.map((paper: any) => {
      const paperText = [paper.title, paper.abstract, Array.isArray(paper.keywords) ? paper.keywords.join(" ") : ""].join(" ").toLowerCase();
      const score = nicheTokens.reduce((sum, token) => (paperText.includes(token) ? sum + 1 : sum), 0);
      return { paper, score };
    });

    const ordered = scored
      .sort((a, b) => (b.score !== a.score ? b.score - a.score : new Date(b.paper.createdAt).getTime() - new Date(a.paper.createdAt).getTime()))
      .map((row) => row.paper);

    return ordered.slice(0, 10);
  }, [queue, selectedReviewer]);

  useEffect(() => {
    if (!selectedReviewerId) {
      setSelectedPaperIds([]);
      return;
    }
    setSelectedPaperIds(recommendedPapers.map((p: any) => String(p._id || p.id)).slice(0, 10));
  }, [selectedReviewerId, recommendedPapers]);

  const filteredBucketPapers = useMemo(() => {
    const target = recommendedPapers.length ? recommendedPapers : queue;
    const q = paperSearch.trim().toLowerCase();
    if (!q) return target.slice(0, 10);
    return target
      .filter((paper: any) => `${paper.title} ${paper.abstract}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [recommendedPapers, queue, paperSearch]);

  function togglePaper(paperId: string) {
    setSelectedPaperIds((prev) => {
      if (prev.includes(paperId)) return prev.filter((id) => id !== paperId);
      if (prev.length >= 10) {
        toast.error("You can select up to 10 papers");
        return prev;
      }
      return [...prev, paperId];
    });
  }

  async function submitBucketAssignment() {
    if (!selectedReviewerId) {
      toast.error("Please choose a reviewer");
      return;
    }
    if (!selectedPaperIds.length) {
      toast.error("Select at least one paper");
      return;
    }

    setAssigningBucket(true);
    try {
      await reviewsApi.assignBucket(selectedReviewerId, selectedPaperIds, dueDate || undefined);
      toast.success("Paper bucket assigned. Reviewer can now select one paper.");
      setBucketOpen(false);
      setSelectedReviewerId("");
      setDueDate("");
      setSelectedPaperIds([]);
      setPaperSearch("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign bucket");
    } finally {
      setAssigningBucket(false);
    }
  }

  async function handleUploadPaper() {
    if (!uploadForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!uploadForm.originalAuthorName.trim()) {
      toast.error("Author name is required");
      return;
    }
    if (!uploadPdfFile) {
      toast.error("Please upload the manuscript PDF");
      return;
    }

    const formData = new FormData();
    formData.append("title", uploadForm.title.trim());
    formData.append("originalAuthorName", uploadForm.originalAuthorName.trim());
    formData.append("abstract", uploadForm.abstract.trim());
    formData.append("institution", uploadForm.institution.trim());
    formData.append("keywords", uploadForm.keywords);
    formData.append("coAuthors", uploadForm.coAuthors);
    if (uploadForm.publishDate) formData.append("publishDate", uploadForm.publishDate);
    formData.append("manuscript", uploadPdfFile);

    setUploadingPaper(true);
    try {
      await journalApi.adminUpload(formData);
      toast.success("Paper uploaded successfully. It is now available for assignment.");
      setUploadForm({
        title: "",
        originalAuthorName: "",
        abstract: "",
        institution: "",
        publishDate: "",
        keywords: "",
        coAuthors: "",
      });
      setUploadPdfFile(null);
      await loadData();
      setTab("queue");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload paper");
    } finally {
      setUploadingPaper(false);
    }
  }

  const uploadedByAdmin = useMemo(
    () => allPapers.filter((p) => p.uploadedBySuperAdmin),
    [allPapers]
  );

  function openEditPaper(item: any) {
    setEditPaper({
      _id: item._id || item.id,
      title: item.title || "",
      originalAuthorName: item.originalAuthorName || "",
      abstract: item.abstract || "",
      publishDate: item.publishDate ? new Date(item.publishDate).toISOString().slice(0, 10) : "",
      status: item.status || "submitted",
      institution: item.institution || "",
    });
  }

  async function saveEditPaper() {
    if (!editPaper?._id) return;
    if (!editPaper.title?.trim()) {
      toast.error("Title is required");
      return;
    }

    const formData = new FormData();
    formData.append("title", editPaper.title.trim());
    formData.append("originalAuthorName", editPaper.originalAuthorName || "");
    formData.append("abstract", editPaper.abstract || "");
    formData.append("institution", editPaper.institution || "");
    formData.append("status", editPaper.status || "submitted");
    if (editPaper.publishDate) formData.append("publishDate", editPaper.publishDate);

    setEditSaving(true);
    try {
      await journalApi.update(editPaper._id, formData);
      toast.success("Paper updated successfully");
      setEditPaper(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update paper");
    } finally {
      setEditSaving(false);
    }
  }

  async function confirmDeletePaper() {
    if (!deletePaper?._id) return;
    setDeleteSaving(true);
    try {
      await journalApi.delete(deletePaper._id);
      toast.success("Paper deleted successfully");
      setDeletePaper(null);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete paper");
    } finally {
      setDeleteSaving(false);
    }
  }

  const filteredReviewers = reviewers.filter((r) => {
    const q = reviewerSearch.toLowerCase();
    return !q || `${r.fullName} ${r.email} ${r.institution}`.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Paper Review Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
            <Clock className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setBucketOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Assign Paper Bucket
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="queue" className="gap-2">
            <FileText className="h-4 w-4" />
            Paper Queue
            <Badge variant="secondary" className="ml-1 text-[10px]">{queue.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Papers
          </TabsTrigger>
          <TabsTrigger value="reviewers" className="gap-2">
            <User className="h-4 w-4" />
            Manage Reviewers
            <Badge variant="secondary" className="ml-1 text-[10px]">{reviewers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all_papers" className="gap-2">
            <FileText className="h-4 w-4" />
            All Papers
            <Badge variant="secondary" className="ml-1 text-[10px]">{allPapers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Submitted", count: queue.filter((q) => q.status === "submitted").length, icon: <FileText className="h-4 w-4 text-blue-500" /> },
              { label: "In Review", count: queue.filter((q) => q.status === "in_review").length, icon: <Clock className="h-4 w-4 text-warning" /> },
              { label: "Changes Req.", count: queue.filter((q) => q.status === "changes_requested").length, icon: <RotateCcw className="h-4 w-4 text-orange-500" /> },
              { label: "Accepted", count: queue.filter((q) => q.status === "accepted").length, icon: <CheckCircle className="h-4 w-4 text-success" /> },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card p-4 shadow-sm flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/50">{s.icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{s.label}</p>
                  <p className="text-xl font-bold">{s.count}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Paper Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Redacted Author</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Abstract</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <Clock className="h-6 w-6 animate-spin mx-auto opacity-20" />
                      </td>
                    </tr>
                  ) : queue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-muted-foreground">No papers in review queue</td>
                    </tr>
                  ) : (
                    queue.map((item) => (
                      <tr key={item._id || item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium max-w-[280px] truncate">{item.title}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          {redactAuthor(item.originalAuthorName || item.authorUser?.fullName || "Unknown")}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={STATUS_COLORS[item.status] || ""}>
                            {String(item.status || "").replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-muted-foreground hidden lg:table-cell max-w-[420px]">
                          <p className="line-clamp-2">{item.abstract || "No abstract"}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditPaper(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => setDeletePaper(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
            <h3 className="font-heading font-semibold">Upload New Paper (Super Admin)</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Paper Title *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Enter full paper title"
                />
              </div>
              <div className="space-y-2">
                <Label>Author Name *</Label>
                <Input
                  value={uploadForm.originalAuthorName}
                  onChange={(e) => setUploadForm((p) => ({ ...p, originalAuthorName: e.target.value }))}
                  placeholder="Enter author name"
                />
              </div>
              <div className="space-y-2">
                <Label>Published Date</Label>
                <Input
                  type="date"
                  value={uploadForm.publishDate}
                  onChange={(e) => setUploadForm((p) => ({ ...p, publishDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={uploadForm.institution}
                  onChange={(e) => setUploadForm((p) => ({ ...p, institution: e.target.value }))}
                  placeholder="Institution or affiliation"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  value={uploadForm.keywords}
                  onChange={(e) => setUploadForm((p) => ({ ...p, keywords: e.target.value }))}
                  placeholder="AI ethics, healthcare analytics, NLP"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Co-Authors (comma separated)</Label>
                <Input
                  value={uploadForm.coAuthors}
                  onChange={(e) => setUploadForm((p) => ({ ...p, coAuthors: e.target.value }))}
                  placeholder="Co Author 1, Co Author 2"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Full Abstract</Label>
                <Textarea
                  value={uploadForm.abstract}
                  onChange={(e) => setUploadForm((p) => ({ ...p, abstract: e.target.value }))}
                  placeholder="Paste full abstract"
                  rows={5}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Upload Manuscript PDF *</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setUploadPdfFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUploadPaper} disabled={uploadingPaper} className="gap-2">
                <Upload className="h-4 w-4" /> {uploadingPaper ? "Uploading..." : "Upload Paper"}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-heading font-semibold">Recently Uploaded Papers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Author</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Published Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedByAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">No uploaded papers yet.</td>
                    </tr>
                  ) : (
                    uploadedByAdmin.slice(0, 15).map((paper) => (
                      <tr key={paper._id || paper.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium max-w-[320px] truncate">{paper.title}</td>
                        <td className="p-4 text-muted-foreground">{paper.originalAuthorName || "Unknown"}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          {paper.publishDate ? new Date(paper.publishDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={STATUS_COLORS[paper.status] || ""}>
                            {String(paper.status || "").replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviewers" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviewers..."
                className="pl-10"
                value={reviewerSearch}
                onChange={(e) => setReviewerSearch(e.target.value)}
              />
            </div>
            <Button onClick={openAddReviewer} className="gap-2">
              <Plus className="h-4 w-4" /> Add Reviewer Role
            </Button>
          </div>

          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {filteredReviewers.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">No reviewers found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Reviewer</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Institution</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Roles</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviewers.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-semibold">{r.fullName}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{r.email || "-"}</td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">{r.institution || "-"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {r.roles.map((role, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[10px] uppercase font-bold tracking-tighter">
                                {role.replace("_", " ")}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/5"
                            onClick={() => setDeleteConfirm(r)}
                          >
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

        <TabsContent value="all_papers" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-lg">All Papers</h3>
            <p className="text-sm text-muted-foreground">Directly publish or feature any paper across the entire system.</p>
          </div>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Paper Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Author</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-center">Featured</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPapers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No papers found</td>
                    </tr>
                  ) : (
                    allPapers.map((paper) => (
                      <tr key={paper._id || paper.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium max-w-[320px] truncate">{paper.title}</td>
                        <td className="p-4 text-muted-foreground">{paper.originalAuthorName || paper.authorUser?.fullName || "Unknown"}</td>
                        <td className="p-4">
                          <Badge variant="outline" className={STATUS_COLORS[paper.status] || ""}>
                            {String(paper.status || "").replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {paper.featured ? (
                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Featured</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant={paper.featured ? "outline" : "secondary"}
                              onClick={async () => {
                                try {
                                  const formData = new FormData();
                                  formData.append("featured", String(!paper.featured));
                                  await journalApi.update(paper._id || paper.id, formData);
                                  toast.success(`Paper ${!paper.featured ? 'featured' : 'unfeatured'} successfully`);
                                  loadData();
                                } catch (err: any) {
                                  toast.error(err.message || "Failed to toggle feature");
                                }
                              }}
                            >
                              {paper.featured ? "Unfeature" : "Feature"}
                            </Button>
                            {paper.status !== "published" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={async () => {
                                  if (!confirm("Are you sure you want to directly publish this paper?")) return;
                                  try {
                                    const formData = new FormData();
                                    formData.append("status", "published");
                                    if (!paper.publishDate) formData.append("publishDate", new Date().toISOString());
                                    await journalApi.update(paper._id || paper.id, formData);
                                    toast.success("Paper published successfully");
                                    loadData();
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to publish paper");
                                  }
                                }}
                              >
                                Publish Now
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={bucketOpen} onOpenChange={setBucketOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Paper Bucket For Single Reviewer Selection</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="space-y-2 md:col-span-2">
                <Label>Reviewer</Label>
                <select
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={selectedReviewerId}
                  onChange={(e) => setSelectedReviewerId(e.target.value)}
                >
                  <option value="">Select reviewer</option>
                  {reviewers.map((r) => (
                    <option key={r.id} value={r.id}>{r.fullName} ({r.email})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Optional Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            {selectedReviewer && (
              <div className="rounded-lg border p-3 bg-muted/30 text-sm">
                <p className="font-medium">Niche-based recommendation ready</p>
                <p className="text-muted-foreground text-xs mt-1">
                  The list below shows up to 10 papers based on reviewer niche keywords. Reviewer will only be able to select one paper.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Search paper title or abstract"
                value={paperSearch}
                onChange={(e) => setPaperSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filteredBucketPapers.map((paper: any) => {
                const paperId = String(paper._id || paper.id);
                const selected = selectedPaperIds.includes(paperId);
                return (
                  <label key={paperId} className="flex gap-3 rounded-lg border p-3 hover:bg-muted/20 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePaper(paperId)}
                      className="mt-1"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{paper.title}</p>
                        <Badge variant="outline" className={STATUS_COLORS[paper.status] || ""}>
                          {String(paper.status || "").replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Author: {redactAuthor(paper.originalAuthorName || paper.authorUser?.fullName || "Unknown")}</p>
                      <p className="text-sm text-muted-foreground">{paper.abstract || "No abstract available"}</p>
                    </div>
                  </label>
                );
              })}
              {filteredBucketPapers.length === 0 && (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">No papers available for this selection.</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="w-full flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Selected papers: {selectedPaperIds.length}/10</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBucketOpen(false)}>Cancel</Button>
                <Button onClick={submitBucketAssignment} disabled={assigningBucket}>
                  {assigningBucket ? "Assigning..." : "Assign Bucket"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showReviewerDialog} onOpenChange={(o) => { if (!o) setShowReviewerDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Reviewer Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email Address</Label>
              <Input
                type="email"
                value={revForm.email}
                onChange={(e) => setRevForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="reviewer@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewerDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveReviewer} disabled={savingReviewer}>{savingReviewer ? "Adding..." : "Add Reviewer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remove Reviewer Role</DialogTitle></DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Remove reviewer role from <strong>{deleteConfirm?.fullName}</strong>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDeleteReviewer(deleteConfirm)}>Confirm Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPaper} onOpenChange={(o) => { if (!o) setEditPaper(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Paper</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-3 py-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input value={editPaper?.title || ""} onChange={(e) => setEditPaper((p: any) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Author Name</Label>
              <Input value={editPaper?.originalAuthorName || ""} onChange={(e) => setEditPaper((p: any) => ({ ...p, originalAuthorName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Published Date</Label>
              <Input type="date" value={editPaper?.publishDate || ""} onChange={(e) => setEditPaper((p: any) => ({ ...p, publishDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input value={editPaper?.institution || ""} onChange={(e) => setEditPaper((p: any) => ({ ...p, institution: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={editPaper?.status || "submitted"}
                onChange={(e) => setEditPaper((p: any) => ({ ...p, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="changes_requested">Changes Requested</option>
                <option value="accepted">Accepted</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Abstract</Label>
              <Textarea rows={5} value={editPaper?.abstract || ""} onChange={(e) => setEditPaper((p: any) => ({ ...p, abstract: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPaper(null)}>Cancel</Button>
            <Button onClick={saveEditPaper} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePaper} onOpenChange={(o) => { if (!o) setDeletePaper(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Paper</DialogTitle></DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deletePaper?.title}</strong>? This cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePaper(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePaper} disabled={deleteSaving}>{deleteSaving ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const RotateCcw = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);
