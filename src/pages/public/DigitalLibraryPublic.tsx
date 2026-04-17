import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Search, Lock, Globe, Download, BookOpen, Plus, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin, isMember } from "@/lib/supabase";

export default function DigitalLibraryPublic() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);
  const canManageLibrary = isAdmin(user?.roles || []);

  useEffect(() => {
    async function load() {
      const queries: any[] = [
        supabase
          .from("library_items")
          .select("*")
          .order("year", { ascending: false }),
      ];

      if (user) {
        queries.push(
          supabase
            .from("memberships")
            .select("id")
            .eq("user_id", user.id)
            .in("status", ["active", "renewal_due"])
            .maybeSingle(),
        );
      }

      const [libraryRes, membershipRes] = await Promise.all(queries);
      setItems(libraryRes.data || []);
      // Fall back to role check if membership query is unavailable.
      setHasMembership(Boolean(membershipRes?.data) || isMember(user?.roles || []));
      setLoading(false);
    }
    load();
  }, [user]);

  function resolvePdfUrl(item: any): string | null {
    const raw = item?.pdf_url;
    if (!raw) return null;
    if (String(raw).startsWith("http://") || String(raw).startsWith("https://")) return raw;
    const { data } = supabase.storage.from("library-pdfs").getPublicUrl(raw);
    return data?.publicUrl || null;
  }

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];

  const filtered = items.filter(item => {
    const matchSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.authors_json || []).some((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()));
    const matchAccess = filterAccess === "all" || item.access_type === filterAccess;
    const matchCat = filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchAccess && matchCat;
  });

  const openCount = items.filter(i => i.access_type === "open").length;
  const memberCount = items.filter(i => i.access_type === "members_only").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <BookOpen className="h-4 w-4" /> Digital Library
          </div>
          <h1 className="font-heading text-4xl font-bold mb-3">Research Paper Library</h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-4">
            Search and access thousands of peer-reviewed research papers. Open access papers are free to download.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <span className="text-muted-foreground"><span className="font-bold text-foreground">{items.length}</span> total papers</span>
            <span className="text-muted-foreground"><span className="font-bold text-success">{openCount}</span> open access</span>
            <span className="text-muted-foreground"><span className="font-bold text-primary">{memberCount}</span> members only</span>
          </div>
          {canManageLibrary && (
            <div className="mt-5 flex justify-center gap-2 flex-wrap">
              <Button asChild size="sm">
                <Link to="/admin/library">
                  <Plus className="h-3 w-3 mr-1" /> Add Paper
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/library">
                  <Settings className="h-3 w-3 mr-1" /> Edit / Delete Papers
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by title, author..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterAccess} onValueChange={setFilterAccess}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Access" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Access</SelectItem>
              <SelectItem value="open">Open Access</SelectItem>
              <SelectItem value="members_only">Members Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Membership Banner */}
        {!hasMembership && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Unlock the full library</p>
              <p className="text-sm text-muted-foreground">Get a membership to access all members-only papers with full PDF downloads.</p>
            </div>
            <Button asChild size="sm">
              <Link to={user ? "/portal/membership" : "/register"}>
                {user ? "Upgrade Membership" : "Get Started"}
              </Link>
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No papers found matching your search.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const canAccess = item.access_type === "open" || hasMembership;
              const pdfUrl = resolvePdfUrl(item);
              return (
                <div key={item.id} className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className={item.access_type === "open" ? "bg-success/10 text-success border-success/20 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                          {item.access_type === "open" ? <><Globe className="h-3 w-3 inline mr-1" />Open Access</> : <><Lock className="h-3 w-3 inline mr-1" />Members Only</>}
                        </Badge>
                        {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{item.year}</span>
                      </div>
                      <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>
                      {item.authors_json?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.authors_json.map((a: any) => a.name).join(", ")}
                        </p>
                      )}
                      {item.venue && <p className="text-xs text-muted-foreground italic mt-0.5">{item.venue}</p>}
                      {canAccess && item.abstract && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.abstract}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {canAccess && pdfUrl ? (
                        <Button size="sm" asChild>
                          <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" /> PDF
                          </a>
                        </Button>
                      ) : !canAccess ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={user ? "/portal/membership" : "/register"}>
                            <Lock className="h-3 w-3 mr-1" /> Unlock
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <Download className="h-3 w-3 mr-1" /> No PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

