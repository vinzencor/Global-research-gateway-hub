import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, GitBranch, Save, RefreshCw } from "lucide-react";

export default function AdminWorkflow() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  // localStages holds the editable state; only pushed to DB on save
  const [localStages, setLocalStages] = useState<any[]>([]);
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const { data: tData, error: tErr } = await supabase
      .from("workflow_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (tErr) toast.error("Failed to load workflows: " + tErr.message);
    setTemplates(tData || []);

    // Sub-admins: get role_id first, then filter user_roles
    const { data: roleData } = await supabase.from("roles").select("id").eq("name", "sub_admin").single();
    if (roleData?.id) {
      const { data: saRows } = await supabase.from("user_roles").select("user_id").eq("role_id", roleData.id);
      const ids = (saRows || []).map((u: any) => u.user_id);
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, institution").in("id", ids);
        setSubAdmins(profiles || []);
      } else {
        setSubAdmins([]);
      }
    } else {
      setSubAdmins([]);
    }
    setLoading(false);
  }

  async function selectTemplate(t: any) {
    setSelected(t);
    const { data, error } = await supabase
      .from("workflow_stages")
      .select("*")
      .eq("template_id", t.id)
      .order("order_index");
    if (error) toast.error("Failed to load stages");
    setLocalStages(data || []);
  }

  async function createWorkflow() {
    if (!newName.trim()) { toast.error("Please enter a workflow name"); return; }
    setCreating(true);
    const { data, error } = await supabase
      .from("workflow_templates")
      .insert({ name: newName.trim(), description: newDesc.trim() || null })
      .select()
      .single();
    setCreating(false);
    if (error) { toast.error("Failed to create workflow: " + error.message); return; }
    toast.success(`Workflow "${data.name}" created!`);
    setTemplates(prev => [data, ...prev]);
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    selectTemplate(data);
  }

  function addLocalStage() {
    if (!selected) return;
    const newStage = {
      id: `new-${Date.now()}`,  // temp id until saved
      template_id: selected.id,
      stage_name: `Stage ${localStages.length + 1}`,
      order_index: localStages.length,
      assigned_user_id: null,
      assigned_user_email: null,
      _isNew: true,
    };
    setLocalStages(prev => [...prev, newStage]);
  }

  function updateLocal(id: string, changes: any) {
    setLocalStages(prev => prev.map(s => s.id === id ? { ...s, ...changes } : s));
  }

  function removeLocal(id: string) {
    setLocalStages(prev => {
      const filtered = prev.filter(s => s.id !== id);
      return filtered.map((s, i) => ({ ...s, order_index: i }));
    });
  }

  function moveLocal(index: number, dir: "up" | "down") {
    const arr = [...localStages];
    const swapIdx = dir === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    [arr[index], arr[swapIdx]] = [arr[swapIdx], arr[index]];
    setLocalStages(arr.map((s, i) => ({ ...s, order_index: i })));
  }

  const saveStages = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    // Delete all existing stages for this template, then re-insert
    const { error: delErr } = await supabase.from("workflow_stages").delete().eq("template_id", selected.id);
    if (delErr) { toast.error("Save failed: " + delErr.message); setSaving(false); return; }

    const toInsert = localStages.map((s, i) => ({
      template_id: selected.id,
      stage_name: s.stage_name || `Stage ${i + 1}`,
      order_index: i,
      assigned_user_id: s.assigned_user_id || null,
      assigned_user_email: s.assigned_user_email || null,
    }));

    if (toInsert.length > 0) {
      const { data: inserted, error: insErr } = await supabase.from("workflow_stages").insert(toInsert).select();
      if (insErr) { toast.error("Save failed: " + insErr.message); setSaving(false); return; }
      setLocalStages(inserted || []);
    } else {
      setLocalStages([]);
    }
    setSaving(false);
    toast.success("Workflow stages saved!");
  }, [selected, localStages]);

  async function toggleActive(t: any) {
    const { error } = await supabase.from("workflow_templates").update({ is_active: !t.is_active }).eq("id", t.id);
    if (error) { toast.error("Failed to update status"); return; }
    const updated = { ...t, is_active: !t.is_active };
    setTemplates(prev => prev.map(x => x.id === t.id ? updated : x));
    if (selected?.id === t.id) setSelected(updated);
    toast.success(updated.is_active ? "Workflow activated" : "Workflow deactivated");
  }

  async function deleteTemplate(t: any) {
    if (!window.confirm(`Delete workflow "${t.name}"? This will remove all its stages.`)) return;
    await supabase.from("workflow_stages").delete().eq("template_id", t.id);
    const { error } = await supabase.from("workflow_templates").delete().eq("id", t.id);
    if (error) { toast.error("Delete failed: " + error.message); return; }
    setTemplates(prev => prev.filter(x => x.id !== t.id));
    if (selected?.id === t.id) { setSelected(null); setLocalStages([]); }
    toast.success("Workflow deleted");
  }

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Workflow Designer</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Workflow
          </Button>
        </div>
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreate} onOpenChange={o => { setShowCreate(o); if (!o) { setNewName(""); setNewDesc(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> Create New Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Workflow Name *</Label>
              <Input placeholder="e.g. Standard Review Process" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createWorkflow()} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input placeholder="Brief description of this workflow" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createWorkflow} disabled={creating}>{creating ? "Creating..." : "Create Workflow"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left panel: workflow list */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Workflows</p>
          {templates.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
              No workflows yet.<br />Click <strong>+ New Workflow</strong> to get started.
            </div>
          ) : templates.map(t => (
            <div key={t.id} onClick={() => selectTemplate(t)}
              className={`w-full text-left rounded-xl border p-4 transition-colors cursor-pointer ${selected?.id === t.id ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate">{t.name}</span>
                <Badge variant="outline" className={`shrink-0 ${t.is_active ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                  {t.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {t.description && <p className="text-xs text-muted-foreground mt-1 truncate">{t.description}</p>}
            </div>
          ))}
        </div>

        {/* Right panel: stage designer */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="rounded-xl border border-dashed bg-card p-14 text-center text-muted-foreground">
              <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a workflow to design its stages</p>
              <p className="text-sm mt-1">Or create a new one using the button above</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-5 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-base">{selected.name}</h3>
                  {selected.description && <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(selected)}>
                    {selected.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => deleteTemplate(selected)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {/* Flow preview */}
              {localStages.length > 0 && (
                <div className="rounded-lg bg-muted/40 p-3 flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Flow:</span>
                  {localStages.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-1">
                      <span className="rounded-full bg-primary/10 text-primary border border-primary/30 text-xs px-2.5 py-0.5 font-medium">{s.stage_name || `Stage ${i + 1}`}</span>
                      {i < localStages.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                  ))}
                </div>
              )}

              {/* Stages */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Pipeline Stages <span className="text-muted-foreground font-normal">({localStages.length})</span></p>
                  <Button size="sm" onClick={addLocalStage} className="flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Stage
                  </Button>
                </div>

                {localStages.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
                    No stages yet. Click <strong>+ Add Stage</strong> to build your pipeline.
                  </div>
                )}

                {localStages.map((s, i) => (
                  <div key={s.id} className="rounded-lg border bg-muted/20 p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0">{i + 1}</span>
                    <Input
                      value={s.stage_name}
                      onChange={e => updateLocal(s.id, { stage_name: e.target.value })}
                      placeholder={`Stage ${i + 1} name`}
                      className="h-8 text-sm flex-1"
                    />
                    <Select
                      value={s.assigned_user_id || "none"}
                      onValueChange={v => {
                        const u = subAdmins.find(x => x.id === v);
                        updateLocal(s.id, { assigned_user_id: v === "none" ? null : v, assigned_user_email: u?.full_name || null });
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm flex-1">
                        <SelectValue placeholder="Assign sub-admin..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— No assignment —</SelectItem>
                        {subAdmins.length === 0 && <SelectItem value="__empty" disabled>No sub-admins yet</SelectItem>}
                        {subAdmins.map(u => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name}{u.institution ? ` (${u.institution})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLocal(i, "up")} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveLocal(i, "down")} disabled={i === localStages.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeLocal(s.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div className="flex justify-end pt-2 border-t">
                <Button onClick={saveStages} disabled={saving} className="flex items-center gap-2">
                  {saving ? <><RefreshCw className="h-3 w-3 animate-spin" /> Saving...</> : <><Save className="h-3 w-3" /> Save Workflow</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

