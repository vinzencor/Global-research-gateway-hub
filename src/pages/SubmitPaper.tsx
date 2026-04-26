import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Upload, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { journalApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function SubmitPaper() {
  const { user } = useAuth();
  const navItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");
  const [journal, setJournal] = useState("");
  const [coAuthors, setCoAuthors] = useState("");
  const [institution, setInstitution] = useState(user?.institution || "");
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [existingManuscriptUrl, setExistingManuscriptUrl] = useState("");
  const [submitting, setSub] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInstitution(user?.institution || "");
  }, [user?.institution]);

  useEffect(() => {
    if (editId) {
      journalApi
        .getMySubmissions()
        .then((data: any) => {
          const items = data?.items || data || [];
          const item = items.find((row: any) => (row._id || row.id) === editId);
          if (!item) return;
          setTitle(item.title || "");
          setAbstract(item.abstract || "");
          setKeywords(Array.isArray(item.keywords) ? item.keywords.join(", ") : "");
          setJournal(item.type || "article");
          setCoAuthors(Array.isArray(item.coAuthors) ? item.coAuthors.join(", ") : "");
          setInstitution(item.institution || user?.institution || "");
          setExistingManuscriptUrl(item.manuscriptUrl || "");
        })
        .catch(() => {
          toast.error("Failed to load submission for editing");
        });
    }
  }, [editId, user?.institution]);

  function buildFormData() {
    const form = new FormData();
    form.append("title", title.trim());
    form.append("abstract", abstract.trim());
    form.append("body", abstract.trim());
    form.append("institution", institution.trim());
    form.append("keywords", keywords);
    form.append("coAuthors", coAuthors);
    if (journal) form.append("type", journal);
    if (manuscriptFile) form.append("manuscript", manuscriptFile);
    return form;
  }

  async function handleSaveDraft() {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    setSaving(true);
    try {
      const payload = buildFormData();
      if (editId) {
        await journalApi.update(editId, payload);
      } else {
        await journalApi.createDraft(payload);
      }
      toast.success("Draft saved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !abstract.trim()) { toast.error("Title and abstract are required"); return; }
    if (!manuscriptFile && !existingManuscriptUrl) {
      toast.error("Please upload manuscript PDF before submitting");
      return;
    }
    setSub(true);
    try {
      const payload = buildFormData();
      if (editId) {
        await journalApi.submitDraft(editId, payload);
      } else {
        await journalApi.submit(payload);
      }
      toast.success("Journal submitted successfully! It is now in review workflow.");
      navigate("/author");
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    } finally {
      setSub(false);
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="Submit Journal">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/author">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Submissions
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold font-heading">{editId ? "Revise Submission" : "Submit New Journal"}</h2>
          <p className="text-sm text-muted-foreground italic">Prepare and submit your manuscript for peer review.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
        {editId && (
          <div className="rounded-xl border border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <span className="text-orange-700 dark:text-orange-400 text-sm font-medium">Changes were requested. Please revise your submission and resubmit.</span>
          </div>
        )}
        <div className="rounded-xl border bg-card p-8 card-shadow">
          <h2 className="font-heading text-xl font-bold mb-6">{editId ? "Revise and Resubmit" : "Paper Submission Form"}</h2>
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
              <Label>Upload Paper (PDF) *</Label>
              <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">PDF up to 50MB</span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setManuscriptFile(e.target.files?.[0] || null)}
                />
              </label>
              {(manuscriptFile || existingManuscriptUrl) && (
                <p className="text-xs text-muted-foreground">
                  {manuscriptFile ? `Selected: ${manuscriptFile.name}` : "Existing manuscript is attached"}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</Button>
              <Button type="submit" size="lg" disabled={submitting}>{submitting ? "Submitting..." : editId ? "Resubmit Journal" : "Submit Journal"}</Button>
            </div>
          </form>
        </div>

        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 card-shadow">
            <h3 className="font-heading font-bold text-sm mb-4 border-b pb-2">Technical requirements</h3>
            <div className="space-y-4 text-xs text-muted-foreground">
              <div>
                <p className="font-bold text-foreground mb-1">File Format</p>
                <p>Only PDF files are accepted. Max size 50MB.</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Citations</p>
                <p>Use APA or IEEE formatting style throughout your paper.</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Processing Time</p>
                <p>Initial screening usually takes 3-5 business days.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="font-heading font-bold text-sm mb-2 text-primary">Need Clarification?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Check our Author Guidelines for detailed information on the formatting, ethical standards, and review process.
            </p>
            <Button variant="link" className="p-0 h-auto text-xs" asChild>
              <Link to="/standards">Author Guidelines -&gt;</Link>
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
