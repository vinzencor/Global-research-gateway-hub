import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
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
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    const { data, error } = await supabase.from("library_items").select("*").order("year", { ascending: false });
    if (error) {
      toast.error("Failed to load library items: " + error.message);
      return;
    }
    setItems(data || []);
  }

  function openCreate() { setForm({ ...defaultForm }); setEditItem(null); setTagInput(""); setShowForm(true); }
  function openEdit(item: any) {
    setForm({
      title: item.title, authors_json: item.authors_json?.length ? item.authors_json : [{ name: "" }],
      abstract: item.abstract || "", venue: item.venue || "", year: item.year || new Date().getFullYear(),
      doi: item.doi || "", pdf_url: item.pdf_url || "", access_type: item.access_type || "open",
      tags: item.tags || [],
    });
    setTagInput(""); setEditItem(item); setShowForm(true);
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

  async function upsertLibraryItem(payload: Record<string, any>, itemId?: string): Promise<{ error: any }> {
    if (itemId) {
      const res = await supabase.from("library_items").update(payload).eq("id", itemId);
      if (!res.error) return res;

      const missingCol = String(res.error.message || "").match(/Could not find the '([^']+)' column/i)?.[1];
      if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
        const nextPayload = { ...payload };
        delete nextPayload[missingCol];
        return upsertLibraryItem(nextPayload, itemId);
      }
      return res;
    }

    const res = await supabase.from("library_items").insert(payload);
    if (!res.error) return res;

    const missingCol = String(res.error.message || "").match(/Could not find the '([^']+)' column/i)?.[1];
    if (missingCol && Object.prototype.hasOwnProperty.call(payload, missingCol)) {
      const nextPayload = { ...payload };
      delete nextPayload[missingCol];
      return upsertLibraryItem(nextPayload);
    }
    return res;
  }

  async function handlePdfUpload(file: File) {
    if (!file) return;
    setUploadingPdf(true);
    const ext = file.name.split(".").pop() || "pdf";
    const path = `library/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("library-pdfs").upload(path, file, { upsert: false });
    if (error) {
      toast.error("Upload failed: " + error.message + ". You can still paste a PDF URL manually.");
      setUploadingPdf(false);
      return;
    }
    const { data } = supabase.storage.from("library-pdfs").getPublicUrl(path);
    setForm((f) => ({ ...f, pdf_url: data.publicUrl }));
    setUploadingPdf(false);
    toast.success("PDF uploaded and linked");
  }

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload = { ...form, authors_json: form.authors_json.filter(a => a.name.trim()) };
    const { error } = await upsertLibraryItem(payload, editItem?.id);
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(editItem ? "Item updated!" : "Item added!"); setShowForm(false); loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this library item?")) return;
    await supabase.from("library_items").delete().eq("id", id);
    toast.success("Deleted"); loadItems();
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
                    {(item.authors_json || []).map((a: any) => a.name).join(", ") || "—"}
                  </td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">{item.year}</td>
                  <td className="p-4">
                    <Badge variant="outline" className={item.access_type === "open" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                      {item.access_type === "open" ? <><Globe className="h-3 w-3 inline mr-1" />Open</> : <><Lock className="h-3 w-3 inline mr-1" />Members</>}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
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
                <Input type="file" accept="application/pdf" onChange={e => { const file = e.target.files?.[0]; if (file) handlePdfUpload(file); }} />
                  <p className="text-xs text-muted-foreground">Uploads to Supabase storage bucket: `library-pdfs`.</p>
                  {uploadingPdf && <p className="text-xs text-primary">Uploading PDF...</p>}
              </div>
            </div>
            <div className="space-y-1"><Label>Abstract</Label><Textarea value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))} rows={3} /></div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag and press Enter" />
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tags.map(t => <Badge key={t} variant="secondary" className="cursor-pointer" onClick={() => removeTag(t)}>{t} ×</Badge>)}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || uploadingPdf}>{saving ? "Saving..." : uploadingPdf ? "Uploading..." : editItem ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

