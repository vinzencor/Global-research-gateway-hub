import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ensureUserRole, reconcileMembershipStatuses, removeUserRoles } from "@/lib/membership";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign, Users, CreditCard, Search, XCircle, RotateCw, CheckCircle2, AlertCircle, Eye } from "lucide-react";

const defaultPlan = { name: "", description: "", price: 0, billing_period: "yearly", features: [""], is_active: true };

export default function AdminBilling() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [profileOptions, setProfileOptions] = useState<any[]>([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultPlan });
  const [invoiceForm, setInvoiceForm] = useState({ user_id: "", amount: 0, currency: "USD", status: "unpaid" });
  const [saving, setSaving] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"plans" | "members" | "invoices" | "verifications">("plans");

  useEffect(() => { loadData(); }, []);

  async function logAdminAction(params: {
    targetUserId: string;
    membershipId?: string | null;
    invoiceId?: string | null;
    actionType: string;
    actionNote?: string | null;
  }) {
    if (!user?.id) return;
    await supabase.from("payment_admin_actions").insert({
      admin_user_id: user.id,
      target_user_id: params.targetUserId,
      membership_id: params.membershipId || null,
      invoice_id: params.invoiceId || null,
      action_type: params.actionType,
      action_note: params.actionNote || null,
    } as any);
  }

  async function loadData() {
    await reconcileMembershipStatuses();
    const [p, m, i, profiles, pending] = await Promise.all([
      supabase.from("membership_plans").select("*").order("price"),
      supabase.from("memberships").select("*, membership_plans(name), user_id").eq("status", "active").order("created_at", { ascending: false }).limit(50),
      supabase.from("invoices").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, full_name, institution").order("full_name"),
      supabase.from("memberships").select("*, membership_plans(name, price, billing_period), user_id").eq("status", "pending_verification").order("created_at", { ascending: false }),
    ]);

    const profileMap: Record<string, { full_name?: string; institution?: string }> = {};
    (profiles.data || []).forEach((pr: any) => {
      profileMap[pr.id] = { full_name: pr.full_name, institution: pr.institution };
    });

    const activeRows = (m.data || []).map((row: any) => ({
      ...row,
      profiles: row.profiles || profileMap[row.user_id] || null,
    }));

    const pendingRows = (pending.data || []).map((row: any) => ({
      ...row,
      profiles: row.profiles || profileMap[row.user_id] || null,
    }));

    setPlans(p.data || []);
    setMemberships(activeRows);
    setInvoices(i.data || []);
    setProfileOptions(profiles.data || []);
    setPendingVerifications(pendingRows);
  }

  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [showScreenshot, setShowScreenshot] = useState<any>(null);

  function openCreate() { setForm({ ...defaultPlan }); setEditPlan(null); setShowPlanForm(true); }
  function openEdit(plan: any) {
    setForm({ name: plan.name, description: plan.description || "", price: plan.price, billing_period: plan.billing_period, features: plan.features || [""], is_active: plan.is_active });
    setEditPlan(plan); setShowPlanForm(true);
  }

  function updateFeature(idx: number, val: string) {
    setForm(f => { const arr = [...f.features]; arr[idx] = val; return { ...f, features: arr }; });
  }
  function addFeature() { setForm(f => ({ ...f, features: [...f.features, ""] })); }
  function removeFeature(idx: number) { setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) })); }

  async function handleSave() {
    if (!form.name) { toast.error("Plan name is required"); return; }
    setSaving(true);
    const payload = { ...form, features: form.features.filter(f => f.trim()) };
    const { error } = editPlan
      ? await supabase.from("membership_plans").update(payload).eq("id", editPlan.id)
      : await supabase.from("membership_plans").insert(payload);
    setSaving(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success(editPlan ? "Plan updated!" : "Plan created!"); setShowPlanForm(false); loadData();
  }

  async function handleDeletePlan(id: string) {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("membership_plans").delete().eq("id", id);
    toast.success("Plan deleted"); loadData();
  }

  async function togglePlanStatus(plan: any) {
    await supabase.from("membership_plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
    toast.success(`Plan ${plan.is_active ? "deactivated" : "activated"}`); loadData();
  }

  async function handleMembershipStatus(member: any, status: string) {
    const { error } = await supabase.from("memberships").update({ status }).eq("id", member.id);
    if (error) {
      toast.error("Failed: " + error.message);
      return;
    }
    if (status === "cancelled" || status === "suspended" || status === "expired") {
      await removeUserRoles(member.user_id, ["member", "subscriber"]);
    }
    if (status === "active" || status === "renewal_due") {
      await ensureUserRole(member.user_id, "member");
    }
    await logAdminAction({
      targetUserId: member.user_id,
      membershipId: member.id,
      actionType: `membership_${status}`,
      actionNote: "Status changed from AdminBilling",
    });
    toast.success(`Membership set to ${status}`);
    loadData();
  }

  async function handleMembershipRenew(member: any) {
    const next = member.ends_at ? new Date(member.ends_at) : new Date();
    if (next.getTime() < Date.now()) next.setTime(Date.now());
    if (member.membership_plans?.billing_period === "monthly") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);

    const { error } = await supabase
      .from("memberships")
      .update({ status: "active", ends_at: next.toISOString() })
      .eq("id", member.id);
    if (error) {
      toast.error("Failed to renew: " + error.message);
      return;
    }
    await ensureUserRole(member.user_id, "member");
    await logAdminAction({
      targetUserId: member.user_id,
      membershipId: member.id,
      actionType: "membership_renewed",
      actionNote: "Renewed from AdminBilling",
    });
    toast.success("Membership renewed");
    loadData();
  }

  async function handleApprovePayment(member: any) {
    const next = new Date();
    if (member.membership_plans?.billing_period === "monthly") next.setMonth(next.getMonth() + 1);
    else next.setFullYear(next.getFullYear() + 1);

    await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: new Date().toISOString() } as any)
      .eq("user_id", member.user_id)
      .in("status", ["active", "renewal_due"])
      .neq("id", member.id);

    const { error } = await supabase
      .from("memberships")
      .update({ 
        status: "active", 
        starts_at: new Date().toISOString(),
        ends_at: next.toISOString() 
      })
      .eq("id", member.id);

    if (error) {
      toast.error("Approval failed: " + error.message);
      return;
    }

    await ensureUserRole(member.user_id, "member");
    
    // Create a matching paid invoice
    await supabase.from("invoices").insert({
      user_id: member.user_id,
      amount: member.membership_plans?.price || 0,
      currency: "USD",
      status: "paid",
      paid_at: new Date().toISOString(),
    } as any);

    await logAdminAction({
      targetUserId: member.user_id,
      membershipId: member.id,
      actionType: "membership_approved",
      actionNote: `Manually approved ${member.membership_plans?.name} via screenshot verification`,
    });

    toast.success("Payment verified and membership activated!");
    loadData();
  }

  async function handleInvoiceStatus(inv: any, status: string) {
    const { error } = await supabase.from("invoices").update({ status }).eq("id", inv.id);
    if (error) {
      toast.error("Failed to update invoice: " + error.message);
      return;
    }
    await logAdminAction({
      targetUserId: inv.user_id,
      invoiceId: inv.id,
      actionType: `invoice_${status}`,
      actionNote: "Invoice status changed from AdminBilling",
    });
    toast.success(`Invoice marked as ${status}`);
    loadData();
  }

  async function handleCreateManualInvoice() {
    if (!invoiceForm.user_id || invoiceForm.amount <= 0) {
      toast.error("User and amount are required");
      return;
    }
    setSaving(true);
    const payload = {
      user_id: invoiceForm.user_id,
      amount: invoiceForm.amount,
      currency: invoiceForm.currency || "USD",
      status: invoiceForm.status,
      paid_at: invoiceForm.status === "paid" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("invoices").insert(payload as any);
    setSaving(false);
    if (error) {
      toast.error("Failed to create invoice: " + error.message);
      return;
    }
    await logAdminAction({
      targetUserId: invoiceForm.user_id,
      actionType: "invoice_manual_created",
      actionNote: `Manual invoice created for ${invoiceForm.currency} ${invoiceForm.amount}`,
    });
    toast.success("Manual invoice created");
    setShowInvoiceForm(false);
    setInvoiceForm({ user_id: "", amount: 0, currency: "USD", status: "unpaid" });
    loadData();
  }

  const filteredInvoices = invoices.filter((inv) => {
    const statusMatch = invoiceStatusFilter === "all" || inv.status === invoiceStatusFilter;
    const searchValue = invoiceSearch.toLowerCase();
    const searchMatch = !searchValue ||
      inv.profiles?.full_name?.toLowerCase().includes(searchValue) ||
      String(inv.amount || "").includes(searchValue) ||
      String(inv.currency || "").toLowerCase().includes(searchValue);
    return statusMatch && searchMatch;
  });

  const tabs = [
    { key: "plans", label: "Plans", icon: <CreditCard className="h-4 w-4" /> },
    { key: "members", label: "Active Members", icon: <Users className="h-4 w-4" /> },
    { key: "verifications", label: "Pending Verifications", icon: <CheckCircle2 className="h-4 w-4" /> },
    { key: "invoices", label: "Invoices", icon: <DollarSign className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Billing & Memberships</h2>
        <div className="flex gap-2">
          {activeTab === "plans" && <Button onClick={openCreate} className="flex items-center gap-2"><Plus className="h-4 w-4" />New Plan</Button>}
          {activeTab === "invoices" && <Button onClick={() => setShowInvoiceForm(true)} className="flex items-center gap-2"><Plus className="h-4 w-4" />Manual Invoice</Button>}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Plans", value: plans.filter(p => p.is_active).length },
          { label: "Active Members", value: memberships.filter(m => m.status === "active").length },
          { label: "Total Revenue", value: `$${invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.amount || 0), 0).toFixed(0)}` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-4 card-shadow">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {activeTab === "plans" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={`rounded-xl border bg-card p-5 card-shadow ${!plan.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-heading font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant="outline" className={plan.is_active ? "bg-success/10 text-success border-success/20" : ""}>{plan.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mb-3"><span className="text-2xl font-bold">${plan.price}</span><span className="text-sm text-muted-foreground">/{plan.billing_period}</span></div>
              <ul className="text-sm space-y-1 mb-4">
                {(plan.features || []).map((f: string, i: number) => <li key={i} className="text-muted-foreground">• {f}</li>)}
              </ul>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openEdit(plan)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                <Button size="sm" variant="outline" onClick={() => togglePlanStatus(plan)}>{plan.is_active ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeletePlan(plan.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "verifications" && (
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                <th className="p-4 font-medium text-muted-foreground text-center">Screenshot</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr></thead>
              <tbody>
                {pendingVerifications.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No pending verifications</td></tr>
                  : pendingVerifications.map(v => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="font-bold text-foreground">{v.profiles?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{v.profiles?.institution}</div>
                      </td>
                      <td className="p-4 font-medium">{v.membership_plans?.name}</td>
                      <td className="p-4 font-medium">${Number(v.membership_plans?.price || 0).toFixed(2)}</td>
                      <td className="p-4 text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => setShowScreenshot(v)} className="gap-2">
                          <Eye className="h-4 w-4" /> View proof
                        </Button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleApprovePayment(v)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleMembershipStatus(v, "cancelled")}>Reject</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Member</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Plan</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Expires</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {memberships.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No memberships</td></tr>
                  : memberships.map(m => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{m.profiles?.full_name || "—"}{m.profiles?.institution && <div className="text-xs text-muted-foreground">{m.profiles.institution}</div>}</td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{m.membership_plans?.name || "—"}</td>
                      <td className="p-4"><Badge variant="outline" className={m.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>{m.status}</Badge></td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{m.ends_at ? new Date(m.ends_at).toLocaleDateString() : "—"}</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleMembershipRenew(m)}><RotateCw className="h-3 w-3 mr-1" />Renew</Button>
                          <Button size="sm" variant="outline" onClick={() => handleMembershipStatus(m, "suspended")}>Suspend</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleMembershipStatus(m, "cancelled")}><XCircle className="h-3 w-3 mr-1" />Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2.5" />
              <Input value={invoiceSearch} onChange={(e) => setInvoiceSearch(e.target.value)} className="pl-8" placeholder="Search by user, amount, currency..." />
            </div>
            <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody>
                {filteredInvoices.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No invoices</td></tr>
                  : filteredInvoices.map(inv => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4 font-medium">{inv.profiles?.full_name || "—"}</td>
                      <td className="p-4 font-medium">${inv.amount} <span className="text-muted-foreground text-xs">{inv.currency}</span></td>
                      <td className="p-4"><Badge variant="outline" className={inv.status === "paid" ? "bg-success/10 text-success border-success/20" : ""}>{inv.status}</Badge></td>
                      <td className="p-4 text-muted-foreground hidden sm:table-cell">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => handleInvoiceStatus(inv, inv.status === "paid" ? "unpaid" : "paid")}>{inv.status === "paid" ? "Mark Unpaid" : "Mark Paid"}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleInvoiceStatus(inv, "refunded")}>Refund</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleInvoiceStatus(inv, "cancelled")}>Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* Plan Form Dialog */}
      <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPlan ? "Edit Plan" : "Create Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Plan Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Basic, Pro, Enterprise..." /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Price ($)</Label><Input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1"><Label>Billing Period</Label>
                <Select value={form.billing_period} onValueChange={v => setForm(f => ({ ...f, billing_period: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>Features</Label><Button type="button" size="sm" variant="ghost" onClick={addFeature} className="text-xs">+ Add</Button></div>
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={f} onChange={e => updateFeature(i, e.target.value)} placeholder="Feature description..." />
                  <Button type="button" variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeFeature(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active (visible to users)</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editPlan ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Manual Invoice</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>User</Label>
              <Select value={invoiceForm.user_id} onValueChange={(v) => setInvoiceForm((prev) => ({ ...prev, user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {profileOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input type="number" min={0} value={invoiceForm.amount} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input value={invoiceForm.currency} onChange={(e) => setInvoiceForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={invoiceForm.status} onValueChange={(v) => setInvoiceForm((prev) => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceForm(false)}>Cancel</Button>
            <Button onClick={handleCreateManualInvoice} disabled={saving}>{saving ? "Saving..." : "Create Invoice"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!showScreenshot} onOpenChange={(open) => !open && setShowScreenshot(null)}>
        <DialogContent className="max-w-3xl border-0 p-0 overflow-hidden bg-black/90">
          <div className="relative aspect-video w-full flex items-center justify-center p-4">
            {showScreenshot && (
              <img 
                src={supabase.storage.from("payment-proofs").getPublicUrl(showScreenshot.screenshot_url).data.publicUrl} 
                alt="Payment Proof" 
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
            )}
            <Button 
              variant="outline" 
              className="absolute top-4 right-4 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
              onClick={() => setShowScreenshot(null)}
            >
              <XCircle className="h-6 w-6" />
            </Button>
          </div>
          <div className="bg-background p-6 border-t">
            <h3 className="font-heading font-bold text-lg mb-1">{showScreenshot?.profiles?.full_name}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Plan: {showScreenshot?.membership_plans?.name} • Submitted: {showScreenshot && new Date(showScreenshot.created_at).toLocaleString()}
            </p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-success hover:bg-success/90 h-11" onClick={() => { handleApprovePayment(showScreenshot); setShowScreenshot(null); }}>
                Approve Payment
              </Button>
              <Button variant="destructive" className="flex-1 h-11" onClick={() => { handleMembershipStatus(showScreenshot, "cancelled"); setShowScreenshot(null); }}>
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

