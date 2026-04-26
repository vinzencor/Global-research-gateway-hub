import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PREDEFINED_ROLES } from "@/lib/roles";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";
import { RefreshCw, Users } from "lucide-react";

function normalizeRoleName(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export default function AdminRoles() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const usersRes = await usersApi.list({ limit: "2000" });
      const apiUsers = Array.isArray((usersRes as any)?.users)
        ? (usersRes as any).users
        : Array.isArray((usersRes as any)?.items)
        ? (usersRes as any).items
        : Array.isArray(usersRes)
        ? (usersRes as any[])
        : [];
      setUsers(apiUsers);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err?.message || "Unknown error"));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (PREDEFINED_ROLES as readonly string[]).forEach((role) => {
      counts[role] = 0;
    });

    users.forEach((u: any) => {
      const userRoles: string[] = Array.isArray(u?.roles) && u.roles.length > 0
        ? u.roles
        : ["registered_user"];
      userRoles.forEach((r) => {
        const role = normalizeRoleName(r);
        if (counts[role] !== undefined) {
          counts[role] += 1;
        }
      });
    });

    return counts;
  }, [users]);

  const totalUsers = useMemo(() => {
    const ids = new Set<string>();
    users.forEach((u: any) => {
      const id = String(u?._id || u?.id || "");
      if (id) ids.add(id);
    });
    return ids.size;
  }, [users]);

  const roleCards = (PREDEFINED_ROLES as readonly string[]).map((role) => ({
    role,
    count: roleCounts[role] || 0,
  }));

  const topRole = roleCards.reduce(
    (max, current) => (current.count > max.count ? current : max),
    { role: "registered_user", count: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Roles</h2>
        <Button variant="outline" size="sm" onClick={loadUsers} className="flex items-center gap-2">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-4 card-shadow">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Users</p>
          <p className="text-2xl font-bold mt-1">{totalUsers}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 card-shadow">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Predefined Roles</p>
          <p className="text-2xl font-bold mt-1">{PREDEFINED_ROLES.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4 card-shadow">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Largest Role Group</p>
          <p className="text-lg font-bold mt-1 capitalize">{topRole.role.replace(/_/g, " ")}</p>
          <p className="text-xs text-muted-foreground mt-1">{topRole.count} users</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 card-shadow">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading role counts...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roleCards.map(({ role, count }) => (
              <div key={role} className="rounded-xl border p-4 bg-background/70">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="capitalize">{role.replace(/_/g, " ")}</Badge>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold mt-3">{count}</p>
                <p className="text-xs text-muted-foreground">users in this role</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

