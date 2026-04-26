import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { libraryApi } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Lock, Globe } from "lucide-react";

const defaultForm = {
  title: "", authors_json: [{ name: "" }], abstract: "", venue: "", year: new Date().getFullYear(),
  doi: "", pdf_url: "", access_type: "open", tags: [] as string[],
};

export default function AdminLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState("all");
  const [supportsTags, setSupportsTags] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const res = await libraryApi.adminList({ limit: "500" });
      const rows = Array.isArray((res as any)?.items)
        ? (res as any).items
        : Array.isArray((res as any)?.data?.items)
        ? (res as any).data.items
        : Array.isArray(res)
        ? (res as any[])
        : [];
      setItems(rows || []);
    } catch (err: any) {
      toast.error("Failed to load library items: " + (err?.message || "Unknown error"));
      setItems([]);
    }
  }

  function openCreate() { setForm({ ...defaultForm }); setEditItem(null); setTagInput(""); setPdfFile(null); setShowForm(true); }
  function openEdit(item: any) {
    setForm({
      title: item.title,
      authors_json: item.authors_json?.length
        ? item.authors_json
        : item.authorsJson?.length
        ? item.authorsJson
        : [{ name: "" }],
      abstract: item.abstract || "", venue: item.venue || "", year: item.year || new Date().getFullYear(),
      doi: item.doi || "", pdf_url: item.pdf_url || item.pdfUrl || "", access_type: item.access_type || item.accessType || "open",
      tags: item.tags || [],
    });
    setTagInput(""); setPdfFile(null); setEditItem(item); setShowForm(true);
  }

  function updateAuthor(idx: number, val: string) {
    setForm(f => { const arr = [...f.authors_json]; arr[idx] = { name: val }; return { ...f, authors_json: arr }; });
  }
  function addAuthor() { setForm(f => ({ ...f, authors_json: [...f.authors_json, { name: "" }] })); }
  function removeAuthor(idx: number) { setForm(f => ({ ...f, authors_json: f.authors_json.filter((_, i) => i !== idx) })); }

  function addTag() {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { setForm(f => ({ ...f, tags: [...f.tags, t] })); }
    setTagInput("");
  }
  function removeTag(tag: string) { setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) })); }

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", form.title);
      payload.append("abstract", form.abstract || "");
      payload.append("venue", form.venue || "");
      payload.append("year", String(form.year || ""));
      payload.append("accessType", form.access_type || "open");
      payload.append("authorsJson", JSON.stringify(form.authors_json.filter(a => a.name.trim())));
      if (form.pdf_url) payload.append("pdfUrl", form.pdf_url);
      if (pdfFile) payload.append("pdf", pdfFile);

      const id = String(editItem?._id || editItem?.id || "");
      if (id) {
        await libraryApi.update(id, payload);
      } else {
        await libraryApi.create(payload);
      }

      toast.success(editItem ? "Item updated!" : "Item added!");
      setShowForm(false);
      setPdfFile(null);
      await loadItems();
    } catch (err: any) {
      toast.error("Failed: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this library item?")) return;
    try {
      await libraryApi.delete(id);
      toast.success("Deleted");
      await loadItems();
    } catch (err: any) {
      toast.error("Delete failed: " + (err?.message || "Unknown error"));
    }
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.authors_json || []).some((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()));
    const matchAccess = filterAccess === "all" || item.access_type === filterAccess;
    return matchSearch && matchAccess;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Digital Library</h2>
        <Button onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" />Add Paper</Button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title or author..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAccess} onValueChange={setFilterAccess}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Access Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Access</SelectItem>
            <SelectItem value="open">Open Access</SelectItem>
            <SelectItem value="members_only">Members Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Authors</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Year</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Access</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No library items found</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium max-w-[220px]">
                    <div className="truncate">{item.title}</div>
                    {item.venue && <div className="text-xs text-muted-foreground truncate">{item.venue}</div>}
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell text-xs">
                    {(item.authors_json || item.authorsJson || []).map((a: any) => a.name).join(", ") || "â€”"}
                  </td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{item.year}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={(item.access_type || item.accessType) === "open" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                      {(item.access_type || item.accessType) === "open" ? <><Globe className="h-3 w-3 inline mr-1" />Open</> : <><Lock className="h-3 w-3 inline mr-1" />Members</>}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(String(item._id || item.id))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? "Edit Library Item" : "Add Library Item"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Authors</Label><Button type="button" size="sm" variant="ghost" onClick={addAuthor} className="text-xs">+ Add</Button></div>
              {form.authors_json.map((a, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={a.name} onChange={e => updateAuthor(i, e.target.value)} placeholder="Author name" />
                  {form.authors_json.length > 1 && <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeAuthor(i)}><Trash2 className="h-3 w-3" /></Button>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Venue / Journal</Label><Input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Year</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) || new Date().getFullYear() }))} /></div>
              <div className="space-y-1"><Label>DOI</Label><Input value={form.doi} onChange={e => setForm(f => ({ ...f, doi: e.target.value }))} placeholder="10.xxxx/..." /></div>
              <div className="space-y-1"><Label>Access Type</Label>
                <Select value={form.access_type} onValueChange={v => setForm(f => ({ ...f, access_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Open Access</SelectItem><SelectItem value="members_only">Members Only</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2"><Label>PDF URL</Label><Input value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} placeholder="https://..." /></div>
              <div className="space-y-1 col-span-2">
                <Label>Upload PDF</Label>
                <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground">Uploads to backend via /api/library using multipart form-data.</p>
                  {pdfFile && <p className="text-xs text-primary">Selected: {pdfFile.name}</p>}
              </div>
            </div>
            <div className="space-y-1"><Label>Abstract</Label><Textarea value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} rows={3} /></div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} disabled={!supportsTags} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder={supportsTags ? "Add tag and press Enter" : "Tags unavailable in current DB schema"} />
                <Button type="button" variant="outline" onClick={addTag} disabled={!supportsTags}>Add</Button>
              </div>
              {!supportsTags && <p className="text-xs text-muted-foreground">Your current db table does not have a tags column yet.</p>}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tags.map(t => <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTag(t)}>{t} Ã—</Badge>)}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


