import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { libraryApi } from "@/lib/api";
import { Search, Lock, Globe, Download, BookOpen, Plus, Settings, Calendar, User, Building, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function DigitalLibraryPublic() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterAccess, setFilterAccess] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    if (!viewItem) return;
    const handleCopy = () => {
      const id = viewItem._id || viewItem.id;
      libraryApi.track(id, "copy").catch(() => {});
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [viewItem]);

  const openView = (item: any) => {
    setViewItem(item);
    setShowView(true);
    libraryApi.track(item._id || item.id, "view").catch(() => {});
  };

  const canManageLibrary = user?.roles?.some((r: string) =>
    ["super_admin", "content_admin", "editor"].includes(r)
  );
  const hasMembership = user?.roles?.some((r: string) =>
    ["member", "subscriber", "super_admin", "content_admin", "editor"].includes(r)
  );

  useEffect(() => {
    libraryApi.list({ limit: "200" })
      .then((data: any) => {
        setItems(data?.items || data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(items.map((i: any) => i.category).filter(Boolean)))];

  const filtered = items.filter((item: any) => {
    const matchSearch = !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      (item.authorsJson || []).some((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()));
    const matchAccess = filterAccess === "all" || item.accessType === filterAccess;
    const matchCat = filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchAccess && matchCat;
  });

  const openCount = items.filter((i: any) => i.accessType === "open_access" || i.accessType === "open").length;
  const memberCount = items.filter((i: any) => i.accessType === "members_only").length;

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
            Search and access peer-reviewed research papers. Open access papers are free to download.
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
              <SelectItem value="open_access">Open Access</SelectItem>
              <SelectItem value="members_only">Members Only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => <SelectItem key={c} value={c} className="capitalize">{c === "all" ? "All Categories" : c}</SelectItem>)}
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
            {filtered.map((item: any) => {
              const itemId = item._id || item.id;
              const isOpen = item.accessType === "open_access" || item.accessType === "open";
              const canAccess = isOpen || hasMembership;

              return (
                <div
                  key={itemId}
                  className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => openView(item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className={isOpen ? "bg-success/10 text-success border-success/20 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                          {isOpen
                            ? <><Globe className="h-3 w-3 inline mr-1" />Open Access</>
                            : <><Lock className="h-3 w-3 inline mr-1" />Members Only</>}
                        </Badge>
                        {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
                        {item.year && <span className="text-xs text-muted-foreground">{item.year}</span>}
                      </div>
                      <h3 className="font-semibold text-sm leading-snug hover:text-primary transition-colors">{item.title}</h3>
                      {item.authorsJson?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.authorsJson.map((a: any) => a.name).join(", ")}
                        </p>
                      )}
                      {item.venue && <p className="text-xs text-muted-foreground italic mt-0.5">{item.venue}</p>}
                      {canAccess && item.abstract && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.abstract}</p>
                      )}
                    </div>
                    <div className="shrink-0" onClick={e => e.stopPropagation()}>
                      {canAccess && item.pdfUrl ? (
                        <Button size="sm" asChild>
                          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
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

      {/* ─── View Details Modal ─── */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl leading-tight pr-6">{viewItem?.title}</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-5 py-2">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={(viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {(viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" ? <><Globe className="h-3 w-3 mr-1" />Open Access</> : <><Lock className="h-3 w-3 mr-1" />Members Only</>}
                </Badge>
                {viewItem.category && <Badge variant="secondary" className="capitalize">{viewItem.category}</Badge>}
                {viewItem.year && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{viewItem.year}</Badge>}
              </div>

              {/* Authors */}
              {(viewItem.authorsJson || viewItem.authors_json || []).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><User className="h-3.5 w-3.5" />Authors</p>
                  <div className="space-y-1">
                    {(viewItem.authorsJson || viewItem.authors_json || []).map((auth: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{auth.name}</span>
                        {auth.institution && <span className="text-muted-foreground text-xs"> — {auth.institution}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue */}
              {viewItem.venue && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Building className="h-3.5 w-3.5" />Published In</p>
                  <p className="text-sm italic">{viewItem.venue}</p>
                </div>
              )}

              {/* Abstract */}
              {viewItem.abstract && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Abstract</p>
                  {((viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" || hasMembership) ? (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewItem.abstract}</p>
                  ) : (
                    <div className="relative">
                      <p className="text-sm text-muted-foreground/30 select-none blur-[4px] leading-relaxed line-clamp-3">
                        {viewItem.abstract}
                      </p>
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg p-4 border border-dashed border-primary/20">
                        <div className="text-center">
                          <Lock className="h-5 w-5 text-primary mx-auto mb-1.5" />
                          <p className="text-xs font-bold">Members Only Abstract</p>
                          <p className="text-[10px] text-muted-foreground">Unlock access to read full paper details.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PDF Action */}
              <div className="pt-3 border-t flex justify-end gap-2">
                {((viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" || hasMembership) && viewItem.pdfUrl ? (
                  <Button asChild>
                    <a href={viewItem.pdfUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <Download className="h-4 w-4 mr-2" /> View PDF Manuscript
                    </a>
                  </Button>
                ) : !((viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" || hasMembership) ? (
                  <Button asChild>
                    <Link to={user ? "/portal/membership" : "/register"} onClick={e => e.stopPropagation()}>
                      <Lock className="h-4 w-4 mr-2" /> Get Membership to Access PDF
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    No PDF Manuscript Uploaded
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
