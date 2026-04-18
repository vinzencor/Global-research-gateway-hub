import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { reconcileMembershipStatuses } from "@/lib/membership";
import { toast } from "sonner";
import { Search, Shield, RefreshCw, UserPlus, ReceiptText, XCircle, RotateCw } from "lucide-react";

const ALL_ROLES: UserRole[] = ["registered_user", "member", "subscriber", "author", "reviewer", "editor", "content_admin", "sub_admin", "super_admin"];

const roleColor: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  content_admin: "bg-purple-500/10 text-purple-600 border-purple-200",
  editor: "bg-info/10 text-info border-info/20",
  reviewer: "bg-warning/10 text-warning border-warning/20",
  author: "bg-success/10 text-success border-success/20",
  subscriber: "bg-amber-500/10 text-amber-700 border-amber-300",
  member: "bg-blue-500/10 text-blue-600 border-blue-200",
  registered_user: "bg-muted text-muted-foreground",
};

const EMPTY_FORM = { full_name: "", email: "", password: "", institution: "", role: "registered_user" as UserRole };

export default function AdminUsers() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showRoleEdit, setShowRoleEdit] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("registered_user");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState<any>(null);
  const [membershipActionLoading, setMembershipActionLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    await reconcileMembershipStatuses();
    const [profilesRes, userRolesRes, membershipsRes, invoicesRes, pendingRpcRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, institution, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("user_roles")
        .select("user_id, roles(name)"),
      supabase
        .from("memberships")
        .select("id, user_id, plan_id, status, starts_at, ends_at, created_at, membership_plans(name, billing_period, price)")
        .in("status", ["active", "renewal_due", "pending_verification", "pending", "expired", "cancelled", "suspended"])
        .order("created_at", { ascending: false }),
      supabase
        .from("invoices")
        .select("id, user_id, membership_id, amount, currency, status, created_at")
        .order("created_at", { ascending: false }),
      supabase.rpc("get_pending_validations_admin"),
    ]);

    const profiles = profilesRes.data;
    const userRolesData = userRolesRes.data;
    const membershipsData = membershipsRes.data;
    const invoicesData = invoicesRes.data;

    // Build a map of user_id → role names
    const roleMap: Record<string, string[]> = {};
    (userRolesData || []).forEach((ur: any) => {
      if (!roleMap[ur.user_id]) roleMap[ur.user_id] = [];
      if (ur.roles?.name) roleMap[ur.user_id].push(ur.roles.name);
    });

    const membershipMap: Record<string, any> = {};
    const membershipsByUser: Record<string, any[]> = {};
    (membershipsData || []).forEach((m: any) => {
      if (!membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = [];
      membershipsByUser[m.user_id].push(m);
    });

    const pendingFromRpcByUser: Record<string, any> = {};
    if (!pendingRpcRes.error && Array.isArray(pendingRpcRes.data)) {
      (pendingRpcRes.data as any[]).forEach((r: any) => {
        if (!r?.user_id) return;
        pendingFromRpcByUser[r.user_id] = {
          id: r.membership_id,
          user_id: r.user_id,
          status: r.status,
          plan_id: r.plan_id,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
          created_at: r.created_at,
          membership_plans: {
            name: r.plan_name || null,
            billing_period: r.plan_billing_period || null,
            price: r.plan_price ?? null,
          },
        };
      });
    }

    Object.entries(membershipsByUser).forEach(([uid, list]) => {
      const approved = list.find((m: any) => m.status === "active" || m.status === "renewal_due" || m.status === "approved");
      const pending = list.find((m: any) => m.status === "pending_verification" || m.status === "pending");
      const withPlan = list.find((m: any) => !!m.plan_id || !!m.membership_plans?.name);
      membershipMap[uid] = approved || pending || withPlan || list[0] || null;
    });

    Object.entries(pendingFromRpcByUser).forEach(([uid, row]) => {
      if (!membershipMap[uid]) {
        membershipMap[uid] = row;
      }
    });

    const invoiceSummaryMap: Record<string, { total: number; paidCount: number; lastInvoiceAt: string | null }> = {};
    const paidMembershipInvoiceUserIds = new Set<string>();
    (invoicesData || []).forEach((inv: any) => {
      if (!inv.membership_id) return;
      if (!invoiceSummaryMap[inv.user_id]) {
        invoiceSummaryMap[inv.user_id] = { total: 0, paidCount: 0, lastInvoiceAt: null };
      }
      invoiceSummaryMap[inv.user_id].total += Number(inv.amount || 0);
      if (inv.status === "paid") {
        invoiceSummaryMap[inv.user_id].paidCount += 1;
        paidMembershipInvoiceUserIds.add(inv.user_id);
      }
      if (!invoiceSummaryMap[inv.user_id].lastInvoiceAt) invoiceSummaryMap[inv.user_id].lastInvoiceAt = inv.created_at;
    });

    Object.entries(membershipMap).forEach(([uid, m]) => {
      const status = String(m?.status || "");
      const isPending = status === "pending_verification" || status === "pending";
      if (isPending && paidMembershipInvoiceUserIds.has(uid)) {
        membershipMap[uid] = { ...m, status: "approved" };
      }
    });

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.id] = p;
    });

    const privilegedRoles = new Set(["super_admin", "content_admin", "editor", "sub_admin", "reviewer", "author"]);
    const approvedStatuses = new Set(["active", "renewal_due"]);
    approvedStatuses.add("approved");

    const roleUserIds = Object.keys(roleMap);
    const approvedMembershipUserIds = Object.entries(membershipMap)
      .filter(([, m]: any) => approvedStatuses.has(String(m?.status || "")))
      .map(([uid]) => uid);

    const baseUserIds = Array.from(
      new Set([
        ...Object.keys(profileMap),
        ...roleUserIds,
        ...approvedMembershipUserIds,
      ])
    );

    const merged = baseUserIds.map((uid) => {
      const p = profileMap[uid] || {};
      return {
        id: uid,
        full_name: p.full_name || "Unnamed user",
        institution: p.institution || null,
        created_at: p.created_at || membershipMap[uid]?.created_at || new Date().toISOString(),
        roleNames: roleMap[uid] || ["registered_user"],
        membership: membershipMap[uid] || null,
        invoiceSummary: invoiceSummaryMap[uid] || { total: 0, paidCount: 0, lastInvoiceAt: null },
        email: null,
      };
    });

    const allUsers = [...merged].sort((a: any, b: any) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });

    setUsers(allUsers);
    setLoading(false);
  }

  async function openMembershipManage(u: any) {
    setShowMembershipDialog(u);
  }

  async function logAdminAction(params: {
    targetUserId: string;
    membershipId?: string | null;
    invoiceId?: string | null;
    actionType: string;
    actionNote?: string | null;
  }) {
    if (!authUser?.id) return;
    await supabase.from("payment_admin_actions").insert({
      admin_user_id: authUser.id,
      target_user_id: params.targetUserId,
      membership_id: params.membershipId || null,
      invoice_id: params.invoiceId || null,
      action_type: params.actionType,
      action_note: params.actionNote || null,
    } as any);
  }

  async function handleCancelMembership() {
    if (!showMembershipDialog?.membership?.id) {
      toast.error("No active membership found for this user");
      return;
    }

    setMembershipActionLoading(true);
    const membershipId = showMembershipDialog.membership.id;
    const nowIso = new Date().toISOString();

    const cancelAttempt = await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: nowIso, updated_at: nowIso, cancelled_at: nowIso } as any)
      .eq("id", membershipId);

    if (cancelAttempt.error) {
      const fallback = await supabase
        .from("memberships")
        .update({ status: "cancelled", ends_at: nowIso } as any)
        .eq("id", membershipId);

      if (fallback.error) {
        toast.error("Failed to cancel membership: " + fallback.error.message);
        setMembershipActionLoading(false);
        return;
      }
    }

    // Revoke member role on cancellation so route checks remain consistent.
    const [{ data: memberRole }, { data: subscriberRole }] = await Promise.all([
      supabase.from("roles").select("id").eq("name", "member").maybeSingle(),
      supabase.from("roles").select("id").eq("name", "subscriber").maybeSingle(),
    ]);

    const removableRoleIds = [memberRole?.id, subscriberRole?.id].filter(Boolean);
    if (removableRoleIds.length > 0) {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", showMembershipDialog.id)
        .in("role_id", removableRoleIds as string[]);
    }

    await logAdminAction({
      targetUserId: showMembershipDialog.id,
      membershipId,
      actionType: "membership_cancelled",
      actionNote: "Cancelled from AdminUsers dialog",
    });

    setMembershipActionLoading(false);
    toast.success("Membership cancelled successfully");
    setShowMembershipDialog(null);
    loadUsers();
  }

  async function handleRenewMembership() {
    const membership = showMembershipDialog?.membership;
    if (!membership?.id) {
      toast.error("No membership found for this user");
      return;
    }

    setMembershipActionLoading(true);
    const baseDate = membership.ends_at ? new Date(membership.ends_at) : new Date();
    if (baseDate.getTime() < Date.now()) {
      baseDate.setTime(Date.now());
    }

    const period = membership.membership_plans?.billing_period;
    if (period === "monthly") {
      baseDate.setMonth(baseDate.getMonth() + 1);
    } else {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    }

    const renewAttempt = await supabase
      .from("memberships")
      .update({ status: "active", ends_at: baseDate.toISOString(), renewed_at: new Date().toISOString() } as any)
      .eq("id", membership.id);

    if (renewAttempt.error) {
      const fallback = await supabase
        .from("memberships")
        .update({ status: "active", ends_at: baseDate.toISOString() } as any)
        .eq("id", membership.id);

      if (fallback.error) {
        toast.error("Failed to renew membership: " + fallback.error.message);
        setMembershipActionLoading(false);
        return;
      }
    }

    // Ensure member role exists after renewal.
    const { data: memberRole } = await supabase.from("roles").select("id").eq("name", "member").maybeSingle();
    if (memberRole?.id) {
      await supabase
        .from("user_roles")
        .insert({ user_id: showMembershipDialog.id, role_id: memberRole.id } as any);
    }

    await logAdminAction({
      targetUserId: showMembershipDialog.id,
      membershipId: membership.id,
      actionType: "membership_renewed",
      actionNote: "Renewed from AdminUsers dialog",
    });

    setMembershipActionLoading(false);
    toast.success("Membership renewed successfully");
    setShowMembershipDialog(null);
    loadUsers();
  }

  async function openRoleEdit(u: any) {
    const roles: string[] = u.roleNames || ["registered_user"];
    const primary = roles.find(r => r !== "registered_user") || "registered_user";
    setSelectedRole(primary as UserRole);
    setShowRoleEdit(u);
  }

  async function handleRoleUpdate() {
    if (!showRoleEdit) return;
    setSaving(true);

    // Look up the role_id for the selected role
    const { data: roleData } = await supabase.from("roles").select("id").eq("name", selectedRole).single();
    if (!roleData) { toast.error("Role not found"); setSaving(false); return; }

    // Get registered_user role_id so we never delete it
    const { data: baseRole } = await supabase.from("roles").select("id").eq("name", "registered_user").single();

    // Remove all non-registered_user roles for this user
    if (baseRole) {
      await supabase.from("user_roles").delete()
        .eq("user_id", showRoleEdit.id)
        .neq("role_id", baseRole.id);
    }

    // Insert new role if it's not the base role
    if (selectedRole !== "registered_user") {
      const { error } = await supabase.from("user_roles").insert({ user_id: showRoleEdit.id, role_id: roleData.id });
      if (error && !error.message.includes("duplicate")) {
        toast.error("Failed to update role: " + error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success(`Role updated to ${selectedRole}`);
    setShowRoleEdit(null);
    loadUsers();
  }

  async function handleCreateUser() {
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.rpc("admin_create_user", {
      p_email: newUser.email.trim(),
      p_password: newUser.password,
      p_full_name: newUser.full_name.trim(),
      p_institution: newUser.institution.trim() || null,
      p_role_name: newUser.role,
    });
    setCreating(false);
    if (error) {
      toast.error("Failed to create user: " + error.message);
      return;
    }
    toast.success(`User "${newUser.full_name}" created successfully!`);
    setShowAddUser(false);
    setNewUser(EMPTY_FORM);
    loadUsers();
  }

  const filtered = users.filter(u => {
    if (!search) return true;
    const name = u.full_name?.toLowerCase() || "";
    const email = u.email?.toLowerCase() || "";
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Users & Roles</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} className="flex items-center gap-2">
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAddUser(true)} className="flex items-center gap-2">
            <UserPlus className="h-3 w-3" /> Add User
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users by name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">User</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Membership</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Invoices</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : filtered.map((u) => {
                const roles: string[] = u.roleNames || ["registered_user"];
                const role: UserRole = (roles.find((r: string) => r !== "registered_user") || "registered_user") as UserRole;
                const membership = u.membership;
                const invoiceSummary = u.invoiceSummary;
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="font-medium">{u.full_name || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{u.institution || "—"}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={roleColor[role] || ""}>{role.replace("_", " ")}</Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {membership ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className={membership.status === "active" || membership.status === "renewal_due" || membership.status === "approved" ? "bg-success/10 text-success border-success/20" : ""}>
                            {String(membership.status || "unknown").replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {membership.membership_plans?.name || "Plan"}
                            {typeof membership.membership_plans?.price === "number" ? ` · $${Number(membership.membership_plans.price).toFixed(2)}` : ""}
                            {membership.ends_at ? ` · ${new Date(membership.ends_at).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">No membership</span>}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-xs">
                        <p className="font-medium">{invoiceSummary.paidCount} membership paid</p>
                        <p className="text-muted-foreground">${invoiceSummary.total.toFixed(0)} membership total</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => openRoleEdit(u)}>
                          <Shield className="h-3 w-3" /> Edit Role
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1" onClick={() => openMembershipManage(u)}>
                          <ReceiptText className="h-3 w-3" /> Membership
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={(o) => { setShowAddUser(o); if (!o) setNewUser(EMPTY_FORM); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create New User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="e.g. John Smith" value={newUser.full_name} onChange={e => setNewUser(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input type="email" placeholder="user@example.com" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" placeholder="Minimum 6 characters" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input placeholder="University / Organisation" value={newUser.institution} onChange={e => setNewUser(p => ({ ...p, institution: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>{creating ? "Creating..." : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showRoleEdit} onOpenChange={() => setShowRoleEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User Role</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-medium">{showRoleEdit?.full_name || "Unknown user"}</p>
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map(r => (
                    <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleEdit(null)}>Cancel</Button>
            <Button onClick={handleRoleUpdate} disabled={saving}>{saving ? "Saving..." : "Update Role"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showMembershipDialog} onOpenChange={() => setShowMembershipDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Membership & Invoices</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-medium">{showMembershipDialog?.full_name || "Unknown user"}</p>
            </div>

            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Membership Status</p>
              {showMembershipDialog?.membership ? (
                <div className="space-y-1">
                  <Badge variant="outline" className={showMembershipDialog.membership.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                    {String(showMembershipDialog.membership.status || "unknown").replace("_", " ")}
                  </Badge>
                  <p className="text-sm">{showMembershipDialog.membership.membership_plans?.name || "Plan"}</p>
                  <p className="text-xs text-muted-foreground">
                    Starts: {showMembershipDialog.membership.starts_at ? new Date(showMembershipDialog.membership.starts_at).toLocaleDateString() : "N/A"}
                    {" · "}
                    Ends: {showMembershipDialog.membership.ends_at ? new Date(showMembershipDialog.membership.ends_at).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No membership found.</p>
              )}
            </div>

            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-1">Membership Invoice Summary</p>
              <p className="text-sm">
                Paid invoices: <span className="font-medium">{showMembershipDialog?.invoiceSummary?.paidCount || 0}</span>
              </p>
              <p className="text-sm">
                Total billed: <span className="font-medium">${Number(showMembershipDialog?.invoiceSummary?.total || 0).toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Last invoice: {showMembershipDialog?.invoiceSummary?.lastInvoiceAt ? new Date(showMembershipDialog.invoiceSummary.lastInvoiceAt).toLocaleDateString() : "No invoices"}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowMembershipDialog(null)}>Close</Button>
            <Button variant="outline" disabled={membershipActionLoading || !showMembershipDialog?.membership} onClick={handleRenewMembership} className="flex items-center gap-1">
              <RotateCw className="h-3 w-3" /> Renew Membership
            </Button>
            <Button variant="destructive" disabled={membershipActionLoading || !showMembershipDialog?.membership} onClick={handleCancelMembership} className="flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Cancel Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

