import { useEffect, useState, useCallback } from "react";
import { usersApi, workflowApi } from "@/lib/api";
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
  const [assignees, setAssignees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const tData = await workflowApi.listTemplates() as any[];
      setTemplates((tData || []).map((t: any) => ({
        id: t._id,
        name: t.name,
        description: t.description || null,
        is_active: Boolean(t.isActive),
      })));
    } catch (err: any) {
      toast.error("Failed to load workflows: " + (err?.message || "Unknown error"));
      setTemplates([]);
    }

    try {
      const [subAdminRes, reviewerRes] = await Promise.all([
        usersApi.list({ role: "sub_admin", limit: "300" }) as Promise<any>,
        usersApi.list({ role: "reviewer", limit: "300" }) as Promise<any>,
      ]);
      const subAdminUsers = Array.isArray(subAdminRes?.users) ? subAdminRes.users : [];
      const reviewerUsers = Array.isArray(reviewerRes?.users) ? reviewerRes.users : [];

      const merged = [...subAdminUsers, ...reviewerUsers];
      const byId = new Map<string, any>();
      for (const u of merged) {
        const id = String(u?._id || u?.id || "");
        if (!id) continue;
        if (byId.has(id)) continue;
        byId.set(id, {
          id,
          full_name: u.fullName || "Unnamed user",
          institution: u.institution || null,
          roles: Array.isArray(u.roles) ? u.roles : [],
        });
      }
      setAssignees(Array.from(byId.values()));
    } catch {
      setAssignees([]);
    }

    setLoading(false);
  }

  async function selectTemplate(t: any) {
    setSelected(t);
    try {
      const data = await workflowApi.getStages(t.id) as any[];
      setLocalStages((data || []).map((s: any) => ({
        id: s._id,
        template_id: t.id,
        stage_name: s.stageName,
        order_index: s.orderIndex,
        assigned_user_id: s.assignedUser?._id || s.assignedUser || null,
        assigned_user_email: s.assignedUser?.fullName || s.assignedUser?.email || null,
      })));
    } catch {
      toast.error("Failed to load stages");
      setLocalStages([]);
    }
  }

  async function createWorkflow() {
    if (!newName.trim()) { toast.error("Please enter a workflow name"); return; }
    setCreating(true);
    let data: any = null;
    let error: any = null;
    try {
      data = await workflowApi.createTemplate(newName.trim()) as any;
      if (newDesc.trim()) {
        data = await workflowApi.updateTemplate(data._id, { name: newName.trim(), description: newDesc.trim() }) as any;
      }
    } catch (err: any) {
      error = err;
    }
    setCreating(false);
    if (error) { toast.error("Failed to create workflow: " + error.message); return; }
    const normalized = {
      id: data._id,
      name: data.name,
      description: data.description || null,
      is_active: Boolean(data.isActive),
    };
    toast.success(`Workflow "${normalized.name}" created!`);
    setTemplates(prev => [normalized, ...prev]);
    setNewName("");
    setNewDesc("");
    setShowCreate(false);
    selectTemplate(normalized);
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
    const payload = localStages.map((s, i) => ({
      stageName: s.stage_name || `Stage ${i + 1}`,
      orderIndex: i,
      assignedUser: s.assigned_user_id || null,
    }));

    try {
      const inserted = await workflowApi.upsertStages(selected.id, payload) as any[];
      setLocalStages((inserted || []).map((s: any) => ({
        id: s._id,
        template_id: selected.id,
        stage_name: s.stageName,
        order_index: s.orderIndex,
        assigned_user_id: s.assignedUser || null,
        assigned_user_email: null,
      })));
    } catch (err: any) {
      toast.error("Save failed: " + (err?.message || "Unknown error"));
      setSaving(false);
      return;
    }
    setSaving(false);
    toast.success("Workflow stages saved!");
  }, [selected, localStages]);

  async function toggleActive(t: any) {
    try {
      await workflowApi.updateTemplate(t.id, { isActive: !t.is_active, name: t.name });
    } catch {
      toast.error("Failed to update status");
      return;
    }
    const updated = { ...t, is_active: !t.is_active };
    setTemplates(prev => prev.map(x => x.id === t.id ? updated : x));
    if (selected?.id === t.id) setSelected(updated);
    toast.success(updated.is_active ? "Workflow activated" : "Workflow deactivated");
  }

  async function deleteTemplate(t: any) {
    if (!window.confirm(`Delete workflow "${t.name}"? This will remove all its stages.`)) return;
    try {
      await workflowApi.deleteTemplate(t.id);
    } catch (err: any) {
      toast.error("Delete failed: " + (err?.message || "Unknown error"));
      return;
    }
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
                        const u = assignees.find(x => x.id === v);
                        updateLocal(s.id, { assigned_user_id: v === "none" ? null : v, assigned_user_email: u?.full_name || null });
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm flex-1">
                        <SelectValue placeholder="Assign sub-admin or reviewer..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">â€” No assignment â€”</SelectItem>
                        {assignees.length === 0 && <SelectItem value="__empty" disabled>No sub-admins or reviewers yet</SelectItem>}
                        {assignees.map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name}
                            {u.institution ? ` (${u.institution})` : ""}
                            {u.roles?.includes("sub_admin") ? " [Sub-admin]" : u.roles?.includes("reviewer") ? " [Reviewer]" : ""}
                          </SelectItem>
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


