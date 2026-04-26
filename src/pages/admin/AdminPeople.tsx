import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { featuredApi, journalApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import { Star } from "lucide-react";

type AdminUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  institution?: string;
  photoUrl?: string;
  roles?: string[];
};

type FeaturedRow = {
  _id?: string;
  user?: AdminUser;
  isFeatured?: boolean;
  updatedAt?: string;
};

type FeaturedRequest = {
  _id?: string;
  user?: AdminUser;
  status?: "pending" | "approved" | "rejected";
  note?: string;
  adminNote?: string;
  createdAt?: string;
  reviewedAt?: string;
};

export default function AdminPeople() {
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<FeaturedRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const [usersRes, featuredRes, requestsRes, journalsRes] = await Promise.all([
        usersApi.list({ limit: "2000" }) as Promise<any>,
        featuredApi.adminList() as Promise<any>,
        featuredApi.adminListRequests() as Promise<any>,
        journalApi.adminList({ limit: "2000" }) as Promise<any>,
      ]);

      const allUsers: AdminUser[] = Array.isArray(usersRes?.users)
        ? usersRes.users
        : Array.isArray(usersRes?.items)
        ? usersRes.items
        : Array.isArray(usersRes)
        ? usersRes
        : [];

      const featuredRows: FeaturedRow[] = Array.isArray(featuredRes?.items)
        ? featuredRes.items
        : Array.isArray(featuredRes)
        ? featuredRes
        : [];

      const featuredMap = new Map<string, boolean>();
      for (const row of featuredRows) {
        const userId = String(row?.user?._id || row?.user?.id || "");
        if (!userId) continue;
        featuredMap.set(userId, !!row?.isFeatured);
      }

      const journalItems = Array.isArray(journalsRes?.items)
        ? journalsRes.items
        : Array.isArray(journalsRes)
        ? journalsRes
        : [];

      const publishedCount = new Map<string, number>();
      for (const j of journalItems) {
        if (j?.status !== "published") continue;
        const authorId = String(j?.authorUser?._id || j?.author_user_id || "");
        if (!authorId) continue;
        publishedCount.set(authorId, (publishedCount.get(authorId) || 0) + 1);
      }

      const mappedUsers = allUsers
        .filter((u) => !!(u?._id || u?.id))
        .map((u) => {
          const uid = String(u?._id || u?.id);
          return {
            id: uid,
            full_name: u?.fullName || "Unnamed User",
            institution: u?.institution || "",
            photo_url: u?.photoUrl || "",
            is_featured: featuredMap.get(uid) || false,
            published_count: publishedCount.get(uid) || 0,
          };
        })
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

      const mappedRequests: FeaturedRequest[] = Array.isArray(requestsRes)
        ? requestsRes
        : Array.isArray(requestsRes?.items)
        ? requestsRes.items
        : [];

      setUsers(mappedUsers);
      setRequests(mappedRequests);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load featured users data");
      setUsers([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  async function reviewRequest(requestId: string, approve: boolean) {
    try {
      await featuredApi.reviewRequest(requestId, approve);
      toast.success(approve ? "Request approved and user featured" : "Request rejected");
      loadUsers();
    } catch (err: any) {
      toast.error("Failed to review request: " + (err?.message || "Unknown error"));
    }
  }

  async function toggleFeatured(userId: string, current: boolean) {
    try {
      if (current) {
        await featuredApi.removeFeatured(userId);
        toast.success("Featured status updated");
        loadUsers();
        return;
      }
      toast.error("Feature user from the pending request list.");
    } catch (err: any) {
      toast.error("Failed to update featured status: " + (err?.message || "Unknown error"));
    }
  }

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.institution || "").toLowerCase().includes(q)
    );
  }), [users, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Featured Users</h2>
      </div>

      <Input
        placeholder="Search by name or institution..."
        className="max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="font-semibold">Featured Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">User</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Requested</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No featured requests</td></tr>
              ) : requests.map((r) => {
                const requestId = String(r?._id || "");
                const fullName = r?.user?.fullName || "Unnamed User";
                const institution = r?.user?.institution || "-";
                return (
                  <tr key={requestId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{fullName}</td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">{institution}</td>
                    <td className="p-4"><Badge variant="outline" className={r.status === "approved" ? "bg-success/10 text-success border-success/20" : r.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-warning/10 text-warning border-warning/20"}>{r.status}</Badge></td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "-"}</td>
                    <td className="p-4">
                      {r.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => reviewRequest(requestId, true)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => reviewRequest(requestId, false)}>Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">User</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Institution</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Published</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Featured</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.photo_url ? (
                        <img src={u.photo_url} alt={u.full_name || "User"} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {(u.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium">{u.full_name || "Unnamed User"}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{u.institution || "-"}</td>
                  <td className="p-4"><Badge variant="outline">{u.published_count}</Badge></td>
                  <td className="p-4">
                    <Star className={`h-4 w-4 ${u.is_featured ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </td>
                  <td className="p-4">
                    {u.is_featured ? (
                      <Button variant="outline" size="sm" onClick={() => toggleFeatured(u.id, u.is_featured)}>
                        Unfeature
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Approve pending request</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
