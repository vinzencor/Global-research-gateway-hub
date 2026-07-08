import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contentApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye, Calendar, FileText, Globe, Lock } from "lucide-react";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-warning/10 text-warning border-warning/20",
  approved: "bg-info/10 text-info border-info/20",
  published: "bg-success/10 text-success border-success/20",
  archived: "bg-destructive/10 text-destructive border-destructive/20",
  changes_requested: "bg-orange-500/10 text-orange-600",
};

export default function AdminContent() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ title: "", type: "article", summary: "", body: "", status: "draft", featured: false, showOnHomepage: false, accessMode: "open_access", ppvPrice: 9.99 });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const data: any = await contentApi.adminList({ limit: "200" });
      setItems(data?.items || data || []);
    } catch {
      toast.error("Failed to load content");
      setItems([]);
    }
  }

  function openView(item: any) { setViewItem(item); setShowView(true); }
  function openCreate() {
    setForm({ title: "", type: "article", summary: "", body: "", status: "draft", featured: false, showOnHomepage: false, accessMode: "open_access", ppvPrice: 9.99 });
    setEditItem(null);
    setShowCreate(true);
  }
  function openEdit(item: any) {
    setForm({
      title: item.title,
      type: item.type,
      summary: item.summary || "",
      body: item.body || "",
      status: item.status,
      featured: Boolean(item.featured),
      showOnHomepage: Boolean(item.showOnHomepage),
      accessMode: item.accessMode || "open_access",
      ppvPrice: Number(item.ppvPrice || 9.99),
    });
    setEditItem(item);
    setShowCreate(true);
  }

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = {
      title: form.title,
      type: form.type,
      summary: form.summary,
      body: form.body,
      status: form.status,
      featured: form.featured,
      showOnHomepage: form.showOnHomepage,
      accessMode: form.accessMode,
      ppvPrice: form.ppvPrice,
    };
    try {
      if (editItem) {
        await contentApi.update(editItem._id || editItem.id, payload);
        toast.success("Content updated!");
      } else {
        await contentApi.create(payload);
        toast.success("Content created!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save content");
    }
    setSaving(false); setShowCreate(false); loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await contentApi.delete(id);
      toast.success("Deleted");
      loadItems();
    } catch {
      toast.error("Delete failed");
    }
  }

  async function handleStatusChange(item: any, newStatus: string) {
    setUpdatingId(item._id || item.id);
    const payload: Record<string, any> = { status: newStatus };
    if (newStatus === "published") {
      payload.accessMode = item.accessMode || "open_access";
    }
    try {
      await contentApi.update(item._id || item.id, payload);
      toast.success(`Status updated to ${newStatus}`);
      loadItems();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Content Management</h2>
        <Button onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" />Create Content</Button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["draft","in_review","approved","published","archived"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Access</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Views</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Copies</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No content found</td></tr>
              ) : filtered.map((item) => (
                <tr
                  key={item._id || item.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => openView(item)}
                >
                  <td className="p-4 font-medium max-w-[200px] truncate hover:text-primary transition-colors">{item.title}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{item.type}</td>
                  <td className="p-4"><Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge></td>
                  <td className="p-4 hidden lg:table-cell">
                    <Badge variant="outline" className="capitalize">{(item.accessMode || "open_access").replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="p-4 hidden lg:table-cell">{item.viewCount || 0}</td>
                  <td className="p-4 hidden lg:table-cell">{item.copyCount || 0}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(item.createdAt || item.created_at).toLocaleDateString()}</td>
                  <td className="p-4" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => openView(item)} title="View Details"><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-3 w-3" /></Button>
                      <Select value={item.status} onValueChange={(v) => handleStatusChange(item, v)} disabled={updatingId === (item._id || item.id)}>
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          {["draft","in_review","approved","published","changes_requested","archived"].map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item._id || item.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── View Details Modal ─── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl leading-tight pr-6">{viewItem?.title}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-5 py-2">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground font-semibold mr-1">Views:</span>
                  <span className="font-bold">{viewItem.viewCount || 0}</span>
                </div>
                <div>
                  <span className="text-muted-foreground font-semibold mr-1">Copies:</span>
                  <span className="font-bold">{viewItem.copyCount || 0}</span>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`capitalize ${statusColor[viewItem.status]}`}>{viewItem.status}</Badge>
                <Badge variant="outline" className="capitalize">{viewItem.type?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">
                  {viewItem.accessMode === "open_access"
                    ? <><Globe className="h-3 w-3 mr-1" />Open Access</>
                    : viewItem.accessMode === "members_only"
                    ? <><Lock className="h-3 w-3 mr-1" />Members Only</>
                    : `Pay-per-view ₹${Number(viewItem.ppvPrice || 9.99).toFixed(2)}`
                  }
                </Badge>
                {viewItem.featured && <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Featured</Badge>}
                {viewItem.showOnHomepage && <Badge variant="secondary">On Homepage</Badge>}
              </div>

              {/* Date */}
              {(viewItem.createdAt || viewItem.created_at) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created: {new Date(viewItem.createdAt || viewItem.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}

              {/* Summary */}
              {viewItem.summary && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Summary</p>
                  <p className="text-sm leading-relaxed text-muted-foreground border-l-2 border-primary pl-3">{viewItem.summary}</p>
                </div>
              )}

              {/* Body */}
              {viewItem.body && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Content Body</p>
                  <div className="text-sm leading-relaxed bg-muted/30 rounded-lg p-3 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {viewItem.body}
                  </div>
                </div>
              )}

              {/* PDF */}
              {(viewItem.pdfUrl || viewItem.pdf_url) && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">PDF</p>
                  <a href={viewItem.pdfUrl || viewItem.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4" />{viewItem.pdfUrl || viewItem.pdf_url}
                  </a>
                </div>
              )}

              {/* Slug */}
              {viewItem.slug && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Slug</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{viewItem.slug}</code>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>Close</Button>
            <Button onClick={() => { setShowView(false); openEdit(viewItem); }}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create / Edit Form Modal ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Content" : "Create Content"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Content title" /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["article","review","letter","case_study"].map(t => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["draft","in_review","approved","published"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 col-span-2"><Label>Access Mode</Label><Select value={form.accessMode} onValueChange={v => setForm(f => ({ ...f, accessMode: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[{ value: "open_access", label: "Open Access" }, { value: "members_only", label: "Members Only" }, { value: "pay_per_view", label: "Pay-per-view" }].map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
              {form.accessMode === "pay_per_view" && (
                <div className="space-y-2 col-span-2"><Label>Pay-per-view Price (₹)</Label><Input type="number" min={0} step={0.01} value={form.ppvPrice} onChange={e => setForm(f => ({ ...f, ppvPrice: Number(e.target.value) || 0 }))} /></div>
              )}
            </div>
            <div className="space-y-2"><Label>Summary</Label><Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Brief description..." rows={2} /></div>
            <div className="space-y-2"><Label>Body</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Full content..." rows={6} /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} /> Featured</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.showOnHomepage} onChange={e => setForm(f => ({ ...f, showOnHomepage: e.target.checked }))} /> Show on Homepage</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editItem ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
