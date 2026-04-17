import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Star } from "lucide-react";

export default function AdminPeople() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data: published } = await supabase
      .from("content_items")
      .select("author_user_id")
      .eq("status", "published")
      .not("author_user_id", "is", null);

    const ids = Array.from(new Set((published || []).map((r: any) => r.author_user_id).filter(Boolean)));
    if (ids.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const [{ data: profiles }, { data: featuredRows }, { data: publishedContent }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, institution, photo_url").in("id", ids),
      supabase.from("featured_users").select("user_id, is_featured").in("user_id", ids),
      supabase.from("content_items").select("id, author_user_id").eq("status", "published").in("author_user_id", ids),
    ]);

    const featuredMap = new Map<string, boolean>((featuredRows || []).map((r: any) => [r.user_id, !!r.is_featured]));
    const publishedCountMap = new Map<string, number>();
    (publishedContent || []).forEach((c: any) => {
      publishedCountMap.set(c.author_user_id, (publishedCountMap.get(c.author_user_id) || 0) + 1);
    });

    const rows = (profiles || []).map((p: any) => ({
      ...p,
      is_featured: featuredMap.get(p.id) || false,
      published_count: publishedCountMap.get(p.id) || 0,
    }));

    rows.sort((a: any, b: any) => (a.full_name || "").localeCompare(b.full_name || ""));
    setUsers(rows);
    setLoading(false);
  }

  async function toggleFeatured(userId: string, current: boolean) {
    const { error } = await supabase
      .from("featured_users")
      .upsert({ user_id: userId, is_featured: !current, updated_at: new Date().toISOString() } as any, { onConflict: "user_id" });

    if (error) {
      toast.error("Failed to update featured status: " + error.message);
      return;
    }
    toast.success(!current ? "Marked as featured" : "Removed from featured");
    loadUsers();
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.institution || "").toLowerCase().includes(q)
    );
  });

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
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No published users found</td></tr>
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
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{u.institution || "—"}</td>
                  <td className="p-4"><Badge variant="outline">{u.published_count}</Badge></td>
                  <td className="p-4">
                    <Star className={`h-4 w-4 ${u.is_featured ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </td>
                  <td className="p-4">
                    <Button variant="outline" size="sm" onClick={() => toggleFeatured(u.id, u.is_featured)}>
                      {u.is_featured ? "Unfeature" : "Feature"}
                    </Button>
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
