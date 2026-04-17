import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Send, User, Upload, ArrowLeft, CreditCard, BookOpen, PenSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

export default function SubmitPaper() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [journal, setJournal] = useState("");
  const [coAuthors, setCoAuthors] = useState("");
  const [institution, setInstitution] = useState(user?.profile?.institution || "");
  const [submitting, setSub] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<any>(null);
  const [hasMembership, setHasMembership] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(true);

  useEffect(() => {
    // Load active workflow template
    supabase.from("workflow_templates").select("id, name").eq("is_active", true).limit(1).maybeSingle().then(({ data }) => setActiveTemplate(data));
    // If editing a returned submission, load its data
    if (editId) {
      supabase.from("content_items").select("*").eq("id", editId).single().then(({ data }) => {
        if (data) {
          setTitle(data.title || "");
          setAbstract(data.summary || "");
          setKeywords(data.body || "");
          setJournal(data.type || "");
        }
      });
    }
  }, [editId]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "renewal_due"])
      .maybeSingle()
      .then(({ data }) => {
        setHasMembership(!!data);
        setCheckingMembership(false);
      });
  }, [user]);

  function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now(); }

  async function handleSaveDraft() {
    if (!hasMembership) { toast.error("Active membership is required to save or submit journals"); return; }
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    setSaving(true);
    const payload = { title, summary: abstract, body: keywords, type: journal || "article", status: "draft", workflow_status: "draft", author_user_id: user!.id, slug: slugify(title) };
    const { error } = editId
      ? await supabase.from("content_items").update(payload).eq("id", editId)
      : await supabase.from("content_items").insert(payload);
    setSaving(false);
    if (error) { toast.error("Failed to save draft"); return; }
    toast.success("Draft saved!");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasMembership) { toast.error("Only active members can submit journals"); return; }
    if (!title.trim() || !abstract.trim()) { toast.error("Title and abstract are required"); return; }
    if (!user) { toast.error("You must be logged in"); return; }
    setSub(true);
    const wStatus = activeTemplate ? "submitted" : "submitted";
    const payload = {
      title, summary: abstract, body: keywords, type: journal || "article",
      status: "in_review", workflow_status: wStatus,
      workflow_template_id: activeTemplate?.id || null,
      current_stage_index: 0,
      author_user_id: user.id,
      slug: slugify(title),
    };
    let contentId = editId;
    if (editId) {
      await supabase.from("content_items").update({ ...payload, workflow_status: "submitted" }).eq("id", editId);
    } else {
      const { data, error } = await supabase.from("content_items").insert(payload).select("id").single();
      if (error) { toast.error("Submission failed: " + error.message); setSub(false); return; }
      contentId = data.id;
    }
    // Log the submission action
    await supabase.from("workflow_logs").insert({ content_id: contentId, stage_index: 0, action: editId ? "resubmitted" : "submitted", comment: "Author submitted journal", acted_by: user.id });
    setSub(false);
    toast.success("Journal submitted successfully! It will now go through the review workflow.");
    navigate("/author");
  }

  return (
    <DashboardLayout navItems={navItems} title={editId ? "Edit & Resubmit" : "Submit Journal"}>
      <div className="max-w-3xl">
        {editId && (
          <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 mb-4 flex items-center gap-3">
            <span className="text-orange-700 dark:text-orange-400 text-sm font-medium">⚠️ Changes were requested. Please revise your submission and resubmit.</span>
          </div>
        )}
        {activeTemplate && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 mb-4 text-sm text-muted-foreground">
            📋 Active workflow: <span className="font-semibold text-foreground">{activeTemplate.name}</span> — your submission will go through this review pipeline.
          </div>
        )}
        {!checkingMembership && !hasMembership && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 mb-4 text-sm">
            <p className="font-medium">Membership required</p>
            <p className="text-muted-foreground">You can submit/publish journals only with an active membership.</p>
            <Link to="/portal/membership" className="text-primary hover:underline font-medium">Activate membership</Link>
          </div>
        )}
        <div className="rounded-xl border bg-card p-8 card-shadow">
          <h2 className="font-heading text-xl font-bold mb-6">{editId ? "Revise & Resubmit" : "Paper Submission Form"}</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Paper Title *</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter the full title of your paper" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea id="abstract" rows={6} value={abstract} onChange={e => setAbstract(e.target.value)} placeholder="Provide a concise summary of your research..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input id="keywords" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="e.g. machine learning, NLP, deep learning" />
            </div>
            <div className="space-y-2">
              <Label>Target Journal / Type</Label>
              <Select value={journal} onValueChange={setJournal}>
                <SelectTrigger><SelectValue placeholder="Select a journal type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Research Article</SelectItem>
                  <SelectItem value="review">Review Paper</SelectItem>
                  <SelectItem value="letter">Research Letter</SelectItem>
                  <SelectItem value="case_study">Case Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authors">Co-Authors</Label>
                <Input id="authors" value={coAuthors} onChange={e => setCoAuthors(e.target.value)} placeholder="Author names (comma separated)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="Your institution" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Upload Paper (PDF) — optional for now</Label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">PDF up to 50MB</span>
                <input type="file" accept=".pdf" className="hidden" />
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft} disabled={saving || !hasMembership}>{saving ? "Saving..." : "Save Draft"}</Button>
              <Button type="submit" size="lg" disabled={submitting || !hasMembership}>{submitting ? "Submitting..." : editId ? "Resubmit Journal" : "Submit Journal"}</Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
