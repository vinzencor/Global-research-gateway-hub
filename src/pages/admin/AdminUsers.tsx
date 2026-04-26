import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserRole } from "@/contexts/AuthContext";
import { authApi, membershipApi, usersApi } from "@/lib/api";
import { PREDEFINED_ROLES } from "@/lib/roles";
import { toast } from "sonner";
import { Search, Shield, RefreshCw, UserPlus, ReceiptText, XCircle, RotateCw, Trash2 } from "lucide-react";

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

const EMPTY_FORM = { full_name: "", email: "", password: "", institution: "", role: "registered_user" };

function normalizeRoleName(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function parseRoleNames(payload: unknown): string[] {
  const found = new Set<string>();

  function addRole(value: unknown) {
    const role = normalizeRoleName(value);
    if (role) found.add(role);
  }

  function walk(value: unknown) {
    if (!value) return;

    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }

    if (typeof value !== "object") return;
    const row = value as Record<string, unknown>;

    if (row.roleName !== undefined || row.role_name !== undefined || row.role !== undefined) {
      addRole(row.roleName ?? row.role_name ?? row.role);
    }

    for (const nestedKey of ["rows", "items", "data", "roleModuleAccess", "roles", "access"]) {
      if (nestedKey in row) walk(row[nestedKey]);
    }

    const maybeRoleMap = Object.entries(row);
    if (maybeRoleMap.length > 0 && maybeRoleMap.every(([, v]) => typeof v === "object" && v !== null)) {
      for (const [roleName] of maybeRoleMap) {
        addRole(roleName);
      }
    }
  }

  walk(payload);
  return Array.from(found);
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>(["registered_user"]);
  const [search, setSearch] = useState("");
  const [showRoleEdit, setShowRoleEdit] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("registered_user");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState<any>(null);
  const [membershipActionLoading, setMembershipActionLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const baseRoles = [...PREDEFINED_ROLES];
    setRoleOptions(baseRoles);

    try {
      const [usersRes, membershipsRes, invoicesRes, roleAccessRes] = await Promise.all([
        usersApi.list({ limit: "500" }),
        membershipApi.adminList({ limit: "1000" }),
        membershipApi.getAllInvoices({ limit: "2000" }),
        usersApi.getRoleModuleAccess().catch(() => null),
      ]);

      const dynamicRoles = parseRoleNames(roleAccessRes);
      const mergedRoleOptions = Array.from(new Set([...baseRoles, ...dynamicRoles])).sort((a, b) => a.localeCompare(b));
      setRoleOptions(mergedRoleOptions);

      const apiUsers = Array.isArray((usersRes as any)?.users) ? (usersRes as any).users : [];
      const memberships = Array.isArray((membershipsRes as any)?.memberships)
        ? (membershipsRes as any).memberships
        : Array.isArray(membershipsRes)
        ? (membershipsRes as any[])
        : [];
      const invoices = Array.isArray((invoicesRes as any)?.invoices)
        ? (invoicesRes as any).invoices
        : Array.isArray(invoicesRes)
        ? (invoicesRes as any[])
        : [];

      const membershipMap: Record<string, any> = {};
      for (const m of memberships) {
        const uid = String(m?.user?._id || m?.user || m?.userId || "");
        if (!uid) continue;
        const prev = membershipMap[uid];
        if (!prev || new Date(m?.createdAt || 0).getTime() > new Date(prev?.createdAt || 0).getTime()) {
          membershipMap[uid] = m;
        }
      }

      const invoiceSummaryMap: Record<string, { total: number; paidCount: number; lastInvoiceAt: string | null }> = {};
      for (const inv of invoices) {
        const uid = String(inv?.user?._id || inv?.user || inv?.userId || "");
        if (!uid) continue;
        if (!invoiceSummaryMap[uid]) {
          invoiceSummaryMap[uid] = { total: 0, paidCount: 0, lastInvoiceAt: null };
        }
        invoiceSummaryMap[uid].total += Number(inv?.amount || 0);
        if (String(inv?.status || "") === "paid") {
          invoiceSummaryMap[uid].paidCount += 1;
        }
        if (!invoiceSummaryMap[uid].lastInvoiceAt) {
          invoiceSummaryMap[uid].lastInvoiceAt = inv?.createdAt || null;
        }
      }

      const mapped = apiUsers.map((u: any) => ({
        id: u._id,
        full_name: u.fullName || "Unnamed user",
        institution: u.institution || null,
        created_at: u.createdAt || new Date().toISOString(),
        roleNames: Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : ["registered_user"],
        membership: membershipMap[u._id] || null,
        invoiceSummary: invoiceSummaryMap[u._id] || { total: 0, paidCount: 0, lastInvoiceAt: null },
        email: u.email || null,
      }));

      setUsers(mapped);
    } catch {
      toast.error("Failed to load users.");
      setUsers([]);
      setRoleOptions(baseRoles);
    } finally {
      setLoading(false);
    }
  }

  async function openMembershipManage(u: any) {
    setShowMembershipDialog(u);
  }

  async function handleCancelMembership() {
    toast.error("Admin cancel action is not exposed by the API yet.");
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

    try {
      await membershipApi.renew(membership.id);
    } catch (err: any) {
      toast.error("Failed to renew membership: " + (err?.message || "Unknown error"));
      setMembershipActionLoading(false);
      return;
    }

    setMembershipActionLoading(false);
    toast.success("Membership renewed successfully");
    setShowMembershipDialog(null);
    loadUsers();
  }

  async function openRoleEdit(u: any) {
    const roles: string[] = u.roleNames || ["registered_user"];
    const primary = roles.find(r => r !== "registered_user") || "registered_user";
    setSelectedRole(primary);
    setShowRoleEdit(u);
  }


  async function handleRoleUpdate() {
    if (!showRoleEdit) return;
    setSaving(true);

    try {
      await usersApi.assignRoles(showRoleEdit.id, [selectedRole]);
    } catch (err: any) {
      toast.error("Failed to update role: " + (err?.message || "Unknown error"));
      setSaving(false);
      return;
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
    try {
      const reg = await authApi.register({
        email: newUser.email.trim(),
        password: newUser.password,
        fullName: newUser.full_name.trim(),
        institution: newUser.institution.trim() || undefined,
      }) as any;

      const userId = reg?.user?._id;
      if (userId && newUser.role !== "registered_user") {
        await usersApi.assignRoles(userId, [newUser.role]);
      }
    } catch (err: any) {
      setCreating(false);
      toast.error("Failed to create user: " + (err?.message || "Unknown error"));
      return;
    }
    setCreating(false);
    toast.success(`User "${newUser.full_name}" created successfully!`);
    setShowAddUser(false);
    setNewUser(EMPTY_FORM);
    loadUsers();
  }

  async function handleDeleteUser(userId: string, name: string) {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${name}"? This action cannot be undone.`)) return;
    
    try {
      await usersApi.delete(userId);
      toast.success(`User "${name}" deleted successfully.`);
      loadUsers();
    } catch (err: any) {
      toast.error("Failed to delete user: " + (err?.message || "Unknown error"));
    }
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
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Email</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Membership</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Invoices</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No users found</td></tr>
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
                        <div>
                          <span className="font-medium block">{u.full_name || "â€”"}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{u.email || "No email"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{u.email || "â€”"}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{u.institution || "â€”"}</td>
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
                            {typeof membership.membership_plans?.price === "number" ? ` Â· $${Number(membership.membership_plans.price).toFixed(2)}` : ""}
                            {membership.ends_at ? ` Â· ${new Date(membership.ends_at).toLocaleDateString()}` : ""}
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
                        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUser(u.id, u.full_name)}>
                          <Trash2 className="h-3 w-3" /> Delete
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
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Create New User</DialogTitle>
            <DialogDescription>Create a user account and assign an initial role.</DialogDescription>
          </DialogHeader>
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
              <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>)}
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
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>Choose the primary role for this user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground font-medium">{showRoleEdit?.full_name || "Unknown user"}</p>
            <div className="space-y-2">
              <Label>Assign Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map(r => (
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
          <DialogHeader>
            <DialogTitle>Membership & Invoices</DialogTitle>
            <DialogDescription>Review membership status and invoice summary for this user.</DialogDescription>
          </DialogHeader>
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
                    {" Â· "}
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


