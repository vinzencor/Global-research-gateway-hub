import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { happeningsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit, Plus, ExternalLink, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AdminHappenings() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    imageUrl: "",
    link: "",
    isActive: true
  });

  const { data: happenings = [], isLoading } = useQuery({
    queryKey: ["admin_happenings"],
    queryFn: happeningsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: happeningsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_happenings"] });
      queryClient.invalidateQueries({ queryKey: ["happenings"] });
      toast.success("Happening created successfully");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to create"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => happeningsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_happenings"] });
      queryClient.invalidateQueries({ queryKey: ["happenings"] });
      toast.success("Happening updated successfully");
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update"),
  });

  const deleteMutation = useMutation({
    mutationFn: happeningsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_happenings"] });
      queryClient.invalidateQueries({ queryKey: ["happenings"] });
      toast.success("Happening deleted successfully");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete"),
  });

  const resetForm = () => {
    setFormData({ title: "", category: "", imageUrl: "", link: "", isActive: true });
    setEditingId(null);
    setIsOpen(false);
  };

  const openEdit = (item: any) => {
    setFormData({
      title: item.title || "",
      category: item.category || "",
      imageUrl: item.imageUrl || "",
      link: item.link || "",
      isActive: item.isActive ?? true
    });
    setEditingId(item._id || item.id);
    setIsOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await happeningsApi.uploadImage(file);
      setFormData({ ...formData, imageUrl: res.url });
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return toast.error("Title is required");
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Happenings</h2>
          <p className="text-muted-foreground">Manage the content shown in the 'Happening Across' section on the homepage.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Happening</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Happening" : "Create Happening"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. 2026 Medal of Honor..." required />
              </div>
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. AWARDS" />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex items-center gap-3">
                  {formData.imageUrl && (
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden shrink-0">
                      <img src={formData.imageUrl} alt="preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="flex-1" />
                </div>
                {isUploading && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</p>}
                <Input value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="Or paste image URL..." className="mt-2" />
              </div>
              <div className="space-y-2">
                <Label>Link URL (Optional)</Label>
                <Input value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: c})} />
                <Label>Active (Show on website)</Label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : happenings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No happenings found. Create one to get started.</div>
        ) : (
          <div className="divide-y">
            {happenings.map((item: any) => (
              <div key={item._id || item.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{item.title}</h4>
                      {!item.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {item.category && <span>{item.category}</span>}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <ExternalLink className="h-3 w-3" /> Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                    if (confirm("Are you sure you want to delete this?")) deleteMutation.mutate(item._id || item.id);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
