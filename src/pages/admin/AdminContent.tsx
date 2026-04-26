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
import { Plus, Search, Edit, Trash2 } from "lucide-react";

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
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No content found</td></tr>
              ) : filtered.map((item) => (
                <tr key={item._id || item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium max-w-[200px] truncate">{item.title}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{item.type}</td>
                  <td className="p-4"><Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge></td>
                  <td className="p-4 hidden lg:table-cell">
                    <Badge variant="outline" className="capitalize">{(item.accessMode || "open_access").replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(item.createdAt || item.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-3 w-3" /></Button>
                      <Select value={item.status} onValueChange={(v) => handleStatusChange(item, v)} disabled={updatingId === (item._id || item.id)}>
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "draft",
                            "in_review",
                            "approved",
                            "published",
                            "changes_requested",
                            "archived",
                          ].map((s) => (
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
                <div className="space-y-2 col-span-2"><Label>Pay-per-view Price (USD)</Label><Input type="number" min={0} step={0.01} value={form.ppvPrice} onChange={e => setForm(f => ({ ...f, ppvPrice: Number(e.target.value) || 0 }))} /></div>
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


