import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Heart, Download, Lock, Globe, Calendar, User, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { libraryApi, membershipApi } from "@/lib/api";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PortalLibrary() {
  const { user } = useAuth();
  const navItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [items, setItems] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "saved">("all");
  const [loading, setLoading] = useState(true);
  // Check membership from the memberships table, NOT from roles.
  // Purchasing a plan creates a row in memberships but doesn't assign a "member" role.
  const [hasMembership, setHasMembership] = useState(false);

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    if (!viewItem) return;
    const handleCopy = () => {
      const id = viewItem.id || viewItem._id;
      libraryApi.track(id, "copy").catch(() => {});
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [viewItem]);

  const openView = (item: any) => {
    setViewItem(item);
    setShowView(true);
    libraryApi.track(item.id || item._id, "view").catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [libraryRes, savedRes, membershipRes] = await Promise.all([
        libraryApi.list({ limit: "500" }) as Promise<any>,
        user ? (libraryApi.getMySaved() as Promise<any>) : Promise.resolve([]),
        user ? (membershipApi.getMy() as Promise<any>).catch(() => null) : Promise.resolve(null),
      ]);

      const libraryItems = Array.isArray(libraryRes?.items)
        ? libraryRes.items
        : Array.isArray(libraryRes)
        ? libraryRes
        : [];

      const normalizedItems = libraryItems.map((item: any) => ({
        id: String(item?._id || item?.id),
        title: item?.title || "Untitled",
        abstract: item?.abstract || "",
        authors_json: Array.isArray(item?.authorsJson) ? item.authorsJson : [],
        venue: item?.venue || "",
        year: item?.year,
        access_type: item?.accessType || "open",
        pdf_url: item?.pdfUrl || "",
      }));

      const savedItems = Array.isArray(savedRes) ? savedRes : Array.isArray(savedRes?.items) ? savedRes.items : [];
      const nextSavedIds = new Set<string>(
        savedItems.map((item: any) => String(item?._id || item?.id)).filter(Boolean)
      );

      const membershipStatus = membershipRes?.status || null;
      const roleBasedMember = (user?.roles || []).some((r: string) => ["member", "subscriber", "super_admin", "content_admin", "editor"].includes(r));
      const statusBasedMember = ["active", "renewal_due"].includes(String(membershipStatus || ""));

      setItems(normalizedItems);
      setSavedIds(nextSavedIds);
      setHasMembership(roleBasedMember || statusBasedMember);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load library items");
      setItems([]);
      setSavedIds(new Set());
      setHasMembership(false);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave(itemId: string) {
    if (!user) { toast.error("Please login to save items"); return; }
    try {
      if (savedIds.has(itemId)) {
        await libraryApi.unsave(itemId);
        setSavedIds(prev => { const n = new Set(prev); n.delete(itemId); return n; });
        toast.success("Removed from saved items");
      } else {
        await libraryApi.save(itemId);
        setSavedIds(prev => new Set([...prev, itemId]));
        toast.success("Saved to your library!");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update saved item");
    }
  }

  function canAccess(item: any): boolean {
    return item.access_type === "open" || item.access_type === "open_access" || hasMembership;
  }

  const filtered = items.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.abstract?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "open" && (item.access_type === "open" || item.access_type === "open_access")) || (filter === "saved" && savedIds.has(item.id));
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
              <div
                key={item.id}
                className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => openView(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className={item.access_type === "open" || item.access_type === "open_access" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                        {item.access_type === "open" || item.access_type === "open_access" ? "Open Access" : "Members Only"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{item.venue} &bull; {item.year}</span>
                    </div>
                    <h4 className="font-semibold text-sm leading-snug">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(item.authors_json || []).map((a: any) => a.name).join(", ")}
                    </p>
                    {canAccess(item) && item.abstract && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.abstract}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0" onClick={e => e.stopPropagation()}>
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
                <Badge variant="outline" className={canAccess(viewItem) ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {canAccess(viewItem) ? <><Globe className="h-3 w-3 mr-1" />Open Access</> : <><Lock className="h-3 w-3 mr-1" />Members Only</>}
                </Badge>
                {viewItem.category && <Badge variant="secondary" className="capitalize">{viewItem.category}</Badge>}
                {viewItem.year && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{viewItem.year}</Badge>}
              </div>

              {/* Authors */}
              {(viewItem.authors_json || []).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"><User className="h-3.5 w-3.5" />Authors</p>
                  <div className="space-y-1">
                    {(viewItem.authors_json || []).map((auth: any, idx: number) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{auth.name}</span>
                        {auth.institution && <span className="text-muted-foreground text-xs"> &mdash; {auth.institution}</span>}
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
                  {canAccess(viewItem) ? (
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
                {canAccess(viewItem) && viewItem.pdf_url ? (
                  <Button asChild>
                    <a href={viewItem.pdf_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <Download className="h-4 w-4 mr-2" /> View PDF Manuscript
                    </a>
                  </Button>
                ) : !canAccess(viewItem) ? (
                  <Button asChild>
                    <a href="/portal/membership" onClick={e => e.stopPropagation()}>
                      <Lock className="h-4 w-4 mr-2" /> Get Membership to Access PDF
                    </a>
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
    </DashboardLayout>
  );
}


