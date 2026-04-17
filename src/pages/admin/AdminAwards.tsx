import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Award, Search, Trophy } from "lucide-react";

export default function AdminAwards() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase
      .from("content_items")
      .select("id, title, type, status, is_award_winning, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  async function toggleAward(id: string, current: boolean) {
    const { error } = await supabase
      .from("content_items")
      .update({ is_award_winning: !current } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to update: " + error.message);
      return;
    }
    toast.success(!current ? "Marked as Award Winning 🏆" : "Removed award status");
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_award_winning: !current } : i));
  }

  const filtered = items.filter(i => {
    if (!search) return true;
    return i.title.toLowerCase().includes(search.toLowerCase());
  });

  const awardCount = items.filter(i => i.is_award_winning).length;

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-bold text-xl">Award-Winning Publications</h2>
        </div>
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          <Trophy className="h-3 w-3 mr-1" /> {awardCount} Award Winners
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Mark published journals as "Award Winning" to highlight them on the publications page.
      </p>

      <Input
        placeholder="Search publications..."
        className="max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Publication</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Award Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No published content found</td></tr>
              ) : filtered.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {item.is_award_winning && <Trophy className="h-4 w-4 text-warning shrink-0" />}
                      <span className="font-medium max-w-[250px] truncate">{item.title}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell capitalize">{item.type}</td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {item.is_award_winning ? (
                      <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">🏆 Award Winner</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Not awarded</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <Button
                      variant={item.is_award_winning ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleAward(item.id, !!item.is_award_winning)}
                    >
                      {item.is_award_winning ? "Remove Award" : "🏆 Award"}
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
