import { useEffect, useState } from "react";
import { db } from "@/lib/legacyDb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Plus, Trash2, Mail } from "lucide-react";

export default function AdminSubAdmins() {
  const [subAdmins, setSubAdmins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [subAdminRoleId, setSubAdminRoleId] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);

    // Get the sub_admin role ID first
    let { data: roleData } = await db.from("roles").select("id").eq("name", "sub_admin").maybeSingle();
    if (!roleData) {
      await db.rpc("admin_upsert_role", { p_name: "sub_admin", p_description: null });
      const refetch = await db.from("roles").select("id").eq("name", "sub_admin").maybeSingle();
      roleData = refetch.data;
    }
    const rid = roleData?.id || "";
    setSubAdminRoleId(rid);

    // Fetch current sub-admins using admin-safe RPC to avoid RLS visibility gaps.
    let saIds: string[] = [];
    const adminRolesRes = await db.rpc("get_all_user_roles_admin");
    if (!adminRolesRes.error && Array.isArray(adminRolesRes.data)) {
      saIds = Array.from(new Set(
        (adminRolesRes.data as any[])
          .filter((r: any) => String(r?.role_name || "") === "sub_admin")
          .map((r: any) => String(r.user_id || ""))
          .filter(Boolean)
      ));
    } else if (rid) {
      const { data: saRows } = await db.from("user_roles").select("user_id").eq("role_id", rid);
      saIds = (saRows || []).map((u: any) => u.user_id);
    }

    if (saIds.length > 0) {
      const { data: profiles } = await db.from("profiles").select("id, full_name, institution").in("id", saIds);
      const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
      setSubAdmins(saIds.map((id) => profileMap.get(id) || ({ id, full_name: "Unnamed user", institution: null })));
    } else {
      setSubAdmins([]);
    }

    // Load all non-sub-admin users for the assign panel
    const excludeIds = saIds.length > 0 ? saIds : ["00000000-0000-0000-0000-000000000000"];
    const { data: allProf } = await db
      .from("profiles")
      .select("id, full_name, institution")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("full_name")
      .limit(100);
    setAllUsers(allProf || []);
    setLoading(false);
  }

  async function assignSubAdmin(userId: string) {
    if (!subAdminRoleId) { toast.error("sub_admin role not found"); return; }
    const { error } = await db.from("user_roles").insert({ user_id: userId, role_id: subAdminRoleId });
    if (error) { toast.error("Failed to assign role"); return; }
    const user = allUsers.find(u => u.id === userId);
    setSubAdmins(prev => [...prev, user]);
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    toast.success(`${user?.full_name} is now a Sub-Admin`);
  }

  async function removeSubAdmin(userId: string) {
    if (!subAdminRoleId) return;
    const { error } = await db.from("user_roles").delete().eq("user_id", userId).eq("role_id", subAdminRoleId);
    if (error) { toast.error("Failed to remove role"); return; }
    const user = subAdmins.find(u => u.id === userId);
    setSubAdmins(prev => prev.filter(u => u.id !== userId));
    setAllUsers(prev => [...prev, user]);
    toast.success("Sub-admin role removed");
  }

  const filtered = allUsers.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.institution?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="h-5 w-5 text-primary" />
        <h2 className="font-heading text-xl font-bold">Sub-Admin Management</h2>
      </div>
      <p className="text-sm text-muted-foreground">Sub-admins are assigned to specific stages in a workflow. They can approve, reject, or request changes on journal submissions at their stage.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current sub-admins */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary" /> Current Sub-Admins ({subAdmins.length})</h3>
          {subAdmins.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No sub-admins assigned yet</p>}
          {subAdmins.map(u => (
            <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">{u.institution || "No institution"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">Sub-Admin</Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeSubAdmin(u.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Assign from existing users */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h3 className="font-bold text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Assign Sub-Admin from Users</h3>
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-sm" />
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">No matching users</p>}
            {filtered.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{u.full_name || "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{u.institution || "No institution"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => assignSubAdmin(u.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Assign
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Note: Users must register first. Then assign them the sub-admin role here to appear in workflow stage assignments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


