import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Search, Heart, Download, Lock, PenSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

export default function PortalLibrary() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "saved">("all");
  const [loading, setLoading] = useState(true);
  // Check membership from the memberships table, NOT from roles.
  // Purchasing a plan creates a row in memberships but doesn't assign a "member" role.
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const queries: Promise<any>[] = [
      supabase.from("library_items").select("*").order("year", { ascending: false }),
    ];
    if (user) {
      queries.push(
        supabase.from("saved_library_items").select("library_item_id").eq("user_id", user.id),
        supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .in("status", ["active", "renewal_due"])
          .maybeSingle(),
      );
    }
    const [libResult, savedResult, memResult] = await Promise.all(queries);
    setItems(libResult.data || []);
    setSavedIds(new Set((savedResult?.data || []).map((s: any) => s.library_item_id)));
    setHasMembership(!!memResult?.data);
    setLoading(false);
  }

  async function toggleSave(itemId: string) {
    if (!user) { toast.error("Please login to save items"); return; }
    if (savedIds.has(itemId)) {
      await supabase.from("saved_library_items").delete().eq("user_id", user.id).eq("library_item_id", itemId);
      setSavedIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
      toast.success("Removed from saved items");
    } else {
      await supabase.from("saved_library_items").insert({ user_id: user.id, library_item_id: itemId });
      setSavedIds(prev => new Set([...prev, itemId]));
      toast.success("Saved to your library!");
    }
  }

  function canAccess(item: any): boolean {
    return item.access_type === "open" || hasMembership;
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.abstract?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "open" && item.access_type === "open") || (filter === "saved" && savedIds.has(item.id));
    return matchSearch && matchFilter;
  });

  return (
    <DashboardLayout navItems={navItems} title="Digital Library">
      <div className="space-y-4">
        {!hasMembership && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground"><Lock className="h-4 w-4 inline mr-1" />Some items require a membership to access.</p>
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/portal/membership"}>Upgrade</Button>
          </div>
        )}

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search papers, authors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["all", "open", "saved"].map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f as any)} className="capitalize">{f}</Button>
            ))}
          </div>
        </div>

        {/* Items */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No items found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={item.access_type === "open" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                        {item.access_type === "open" ? "Open Access" : "Members Only"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.venue} • {item.year}</span>
                    </div>
                    <h4 className="font-semibold text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(item.authors_json || []).map((a: any) => a.name).join(", ")}
                    </p>
                    {canAccess(item) && item.abstract && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.abstract}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="ghost" size="icon" className={savedIds.has(item.id) ? "text-destructive" : "text-muted-foreground"} onClick={() => toggleSave(item.id)}>
                      <Heart className="h-4 w-4" fill={savedIds.has(item.id) ? "currentColor" : "none"} />
                    </Button>
                    {canAccess(item) ? (
                      item.pdf_url ? (
                        <Button size="sm" variant="outline" className="flex items-center gap-1" asChild>
                          <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3" /> PDF
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex items-center gap-1" disabled>
                          <Download className="h-3 w-3" /> No PDF
                        </Button>
                      )
                    ) : (
                      <Button size="sm" variant="outline" className="flex items-center gap-1 text-muted-foreground" onClick={() => window.location.href = "/portal/membership"}>
                        <Lock className="h-3 w-3" /> Unlock
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

