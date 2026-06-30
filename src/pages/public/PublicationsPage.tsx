import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { motion, AnimatePresence } from "framer-motion";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar, Lock, BookOpen, Download, ArrowRight, Building, User, Globe, Star } from "lucide-react";
import { contentApi, libraryApi, journalApi, membershipApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function PublicationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [showView, setShowView] = useState(false);

  useEffect(() => {
    if (!viewItem) return;
    const handleCopy = () => {
      const id = viewItem._id || viewItem.id;
      // Depending on source (library vs content), call libraryApi.track or contentApi.track
      if (viewItem._source === "library") {
        libraryApi.track(id, "copy").catch(() => {});
      } else {
        contentApi.track(id, "copy").catch(() => {});
      }
    };
    document.addEventListener("copy", handleCopy);
    return () => document.removeEventListener("copy", handleCopy);
  }, [viewItem]);

  const [hasAccess, setHasAccess] = useState(false);

  const isMember = user?.roles?.some((r: string) =>
    ["member", "subscriber", "super_admin", "content_admin", "editor"].includes(r)
  );

  useEffect(() => {
    if (!viewItem) {
      setHasAccess(false);
      return;
    }
    const checkAccess = async () => {
      if (viewItem._source === "library") {
        const isOpen = viewItem.accessType === "open_access" || viewItem.accessType === "open";
        setHasAccess(isOpen || isMember);
      } else {
        const accessMode = viewItem.accessMode || viewItem.access_mode || viewItem.visibility || "open_access";
        if (accessMode === "open_access") {
          setHasAccess(true);
          return;
        }
        if (!user) {
          setHasAccess(false);
          return;
        }
        const adminRoles = ["super_admin", "content_admin", "editor"];
        if (user.roles?.some((r: string) => adminRoles.includes(r))) {
          setHasAccess(true);
          return;
        }
        if (accessMode === "members_only") {
          const isMemberUser = user.roles?.some((r: string) =>
            ["member", "subscriber"].includes(r)
          );
          setHasAccess(!!isMemberUser);
        } else if (accessMode === "pay_per_view") {
          try {
            const itemId = viewItem._id || viewItem.id;
            const ppvRes: any = await membershipApi.checkPPVAccess(itemId);
            setHasAccess(!!(ppvRes?.hasAccess || ppvRes?.access));
          } catch {
            setHasAccess(false);
          }
        } else {
          setHasAccess(true);
        }
      }
    };
    checkAccess();
  }, [viewItem, user, isMember]);

  const openView = (item: any) => {
    setViewItem(item);
    setShowView(true);
    if (item._source === "library") {
      libraryApi.track(item._id || item.id, "view").catch(() => {});
    } else {
      contentApi.track(item._id || item.id, "view").catch(() => {});
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const [contentData, libraryData, journalData, featuredJournalData] = await Promise.all([
          contentApi.listPublished({ limit: "200" }),
          libraryApi.list({ limit: "200" }),
          journalApi.listPublished({ limit: "200" }),
          journalApi.getFeatured(),
        ]);

        const featuredJournalIds = new Set(
          ((featuredJournalData as any)?.items || []).map((j: any) => String(j._id || j.id))
        );

        const contentItems = ((contentData as any)?.items || contentData || []).map((i: any) => ({
          ...i,
          _source: "content",
          _displayType: i.type || "article",
          _featured: !!(i.featured || i.showOnHomepage),
        }));
        const libraryItems = ((libraryData as any)?.items || libraryData || []).map((i: any) => ({
          ...i,
          _source: "library",
          _displayType: i.category || "library",
          type: i.category || "library",
          _featured: false,
        }));
        const journalItems = ((journalData as any)?.items || journalData || []).map((j: any) => ({
          ...j,
          _source: "journal",
          _displayType: "journal",
          type: "journal",
          _featured: featuredJournalIds.has(String(j._id || j.id)) || !!j.featured,
        }));

        const merged = [...contentItems, ...libraryItems, ...journalItems].sort((a, b) => {
          // Featured first
          if (a._featured && !b._featured) return -1;
          if (!a._featured && b._featured) return 1;
          // Then by date descending
          return new Date(b.createdAt || b.created_at || 0).getTime() -
                 new Date(a.createdAt || a.created_at || 0).getTime();
        });
        setItems(merged);
      } catch (err) {
        console.error("Failed to load content", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const types = ["all", "featured", ...Array.from(new Set(items.map(i => i._displayType).filter(Boolean)))];

  const filtered = items.filter(i => {
    const matchSearch = !search ||
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.summary?.toLowerCase().includes(search.toLowerCase()) ||
      i.abstract?.toLowerCase().includes(search.toLowerCase());
    const matchType =
      filterType === "all" ||
      (filterType === "featured" ? i._featured : i._displayType === filterType);
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        :root { --primary: 349 56% 46%; }
        .bg-primary { background-color: #ba3850; }
        .text-primary { color: #ba3850; }
        .border-primary { border-color: #ba3850; }
        .hover\\:border-primary\\/40:hover { border-color: rgba(186, 56, 80, 0.4); }
        .hover\\:text-primary:hover { color: #ba3850; }
        .shadow-primary\\/20 { box-shadow: 0 4px 20px rgba(186, 56, 80, 0.2); }
      `}</style>
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/50 pt-24 pb-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          </div>
          <div className="container relative z-10 text-center max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
                <FileText className="h-4 w-4" />
                Knowledge Publications
              </div>
              <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">Advance Your Discovery</h1>
              <p className="text-xl text-muted-foreground leading-relaxed font-light">
                Explore a curated collection of research papers, technical frameworks, and expert analyses—built on a foundation of quality and expert-led review.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Intro */}
        <section className="container py-16 max-w-4xl mx-auto text-center">
          <p className="text-2xl text-foreground/80 font-light leading-relaxed">
            Our publications span across critical domains including primary research, comprehensive literature reviews, and industry-standard frameworks. Each piece is structured to ensure maximum readability and impact.
          </p>
        </section>

        {/* Listing Header */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3 tracking-tight">Recent Published Work</h2>
              <p className="text-muted-foreground text-lg max-w-xl font-light">
                Browse our growing repository of peer-reviewed articles, journals, and library papers.
                {items.length > 0 && (
                  <span className="ml-2 text-sm font-semibold text-primary">
                    {items.filter(i => i._featured).length > 0 && `${items.filter(i => i._featured).length} featured · `}
                    {items.length} total
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-24">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-3xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by title, author, or keyword..." 
              className="pl-12 h-14 rounded-2xl bg-secondary/50 border-0 focus:bg-background transition-all" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 h-14 rounded-2xl border-0 bg-secondary/50 font-medium">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl p-2">
              {types.map(t => <SelectItem key={t} value={t} className="capitalize rounded-lg h-10">{t === "all" ? "All Categories" : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin shadow-lg shadow-primary/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground bg-secondary/20 rounded-[3rem] border border-dashed">
            <FileText className="h-16 w-16 mx-auto mb-6 opacity-20" />
            <p className="text-xl font-light">No publications matched your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item, i) => {
              const itemId = item._id || item.id;
              const isLibrary = item._source === "library";
              const isJournal = item._source === "journal";
              const isFeatured = item._featured;
              const canLibraryAccess = item.accessType === "open_access" || item.accessType === "open" || isMember;

              const featuredBadge = isFeatured ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-bold border border-amber-300/40">
                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" /> Featured
                </span>
              ) : null;

              if (isLibrary) {
                return (
                  <motion.div
                    key={itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                    className={`flex flex-col h-full rounded-[2rem] border bg-card hover:border-primary/40 hover:shadow-2xl transition-all cursor-pointer overflow-hidden ${isFeatured ? "ring-1 ring-amber-300/40" : ""}`}
                    onClick={() => openView(item)}
                  >
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-secondary/30 flex items-center justify-center relative">
                      <BookOpen className="h-12 w-12 text-primary/20" />
                      {isFeatured && <div className="absolute top-3 right-3">{featuredBadge}</div>}
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-widest rounded-full px-3 py-1">
                          {canLibraryAccess ? "Open Access" : "Members Only"}
                        </Badge>
                        {item.category && <Badge variant="outline" className="capitalize text-[10px] rounded-full px-3 py-1">{item.category}</Badge>}
                      </div>
                      <h3 className="font-heading font-bold text-xl leading-snug line-clamp-2 mb-4 hover:text-primary transition-colors">{item.title}</h3>
                      {item.authorsJson?.length > 0 && (
                        <p className="text-sm text-muted-foreground mb-2">{item.authorsJson.map((a: any) => a.name).join(", ")}</p>
                      )}
                      {item.abstract && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.abstract}</p>}
                      <div className="mt-8 pt-6 border-t flex items-center justify-between" onClick={e => e.stopPropagation()}>
                        {canLibraryAccess && item.pdfUrl ? (
                          <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                            <Download className="h-4 w-4" /> Download PDF
                          </a>
                        ) : !canLibraryAccess ? (
                          <Link to={user ? "/portal/membership" : "/register"} className="inline-flex items-center gap-2 text-primary font-bold text-sm">
                            <Lock className="h-4 w-4" /> Members Only
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">Library Paper</span>
                        )}
                        {item.year && <span className="text-xs text-muted-foreground">{item.year}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              if (isJournal) {
                const authorName = item.authorUser?.fullName || item.originalAuthorName || null;
                const coverImg = item.coverImageUrl || null;
                return (
                  <motion.div
                    key={itemId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.5) }}
                  >
                    <Link
                      to={`/journals/${item.slug}`}
                      className={`group flex flex-col h-full rounded-[2rem] border bg-card hover:border-primary/40 hover:shadow-2xl transition-all overflow-hidden ${isFeatured ? "ring-1 ring-amber-300/40" : ""}`}
                    >
                      {coverImg ? (
                        <div className="relative aspect-video overflow-hidden">
                          <img src={coverImg} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          {isFeatured && <div className="absolute top-3 right-3">{featuredBadge}</div>}
                        </div>
                      ) : (
                        <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-secondary/30 flex items-center justify-center relative">
                          <FileText className="h-12 w-12 text-primary/20" />
                          {isFeatured && <div className="absolute top-3 right-3">{featuredBadge}</div>}
                        </div>
                      )}
                      <div className="p-8 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] font-bold tracking-widest rounded-full px-3 py-1">Journal</Badge>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.createdAt || new Date()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-4">{item.title}</h3>
                        {item.abstract && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.abstract}</p>}
                        <div className="mt-8 pt-6 border-t flex items-center justify-between">
                          {authorName && <span className="text-xs text-muted-foreground">{authorName}</span>}
                          <span className="text-primary font-bold text-sm ml-auto">Read Journal</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              }

              // Content item
              return (
                <motion.div
                  key={itemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.5) }}
                >
                  <Link
                    to={`/publications/${item.slug}`}
                    className={`group flex flex-col h-full rounded-[2rem] border bg-card hover:border-primary/40 hover:shadow-2xl transition-all overflow-hidden ${isFeatured ? "ring-1 ring-amber-300/40" : ""}`}
                  >
                    {item.coverImageUrl ? (
                      <div className="relative aspect-video overflow-hidden">
                        <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        {isFeatured && <div className="absolute top-3 right-3">{featuredBadge}</div>}
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-secondary/30 flex items-center justify-center relative">
                        <FileText className="h-12 w-12 text-primary/20" />
                        {isFeatured && <div className="absolute top-3 right-3">{featuredBadge}</div>}
                      </div>
                    )}
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-widest rounded-full px-3 py-1">{item.type}</Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.createdAt || item.created_at || new Date()).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-4">{item.title}</h3>
                      {item.summary && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.summary}</p>}
                      <div className="mt-8 pt-6 border-t flex items-center justify-between">
                        <span className="text-primary font-bold text-sm tracking-wide">Read Publication</span>
                        {item.accessMode === "pay_per_view" && (
                          <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded">
                            ${Number(item.ppvPrice || 9.99).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
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
              {viewItem._source === "library" ? (
                // Library item details inside Modal
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={(viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                      {(viewItem.accessType || viewItem.access_type) === "open" || (viewItem.accessType || viewItem.access_type) === "open_access" ? <><Globe className="h-3 w-3 mr-1" />Open Access</> : <><Lock className="h-3 w-3 mr-1" />Members Only</>}
                    </Badge>
                    {viewItem.category && <Badge variant="secondary" className="capitalize">{viewItem.category}</Badge>}
                    {viewItem.year && <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{viewItem.year}</Badge>}
                  </div>

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

                  {viewItem.venue && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Building className="h-3.5 w-3.5" />Published In</p>
                      <p className="text-sm italic">{viewItem.venue}</p>
                    </div>
                  )}

                  {viewItem.abstract && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Abstract</p>
                      {hasAccess ? (
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

                  <div className="pt-3 border-t flex justify-end gap-2">
                    {hasAccess && viewItem.pdfUrl ? (
                      <Button asChild>
                        <a href={viewItem.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> View PDF Manuscript
                        </a>
                      </Button>
                    ) : !hasAccess ? (
                      <Button asChild>
                        <Link to={user ? "/portal/membership" : "/register"}>
                          <Lock className="h-4 w-4 mr-2" /> Get Membership to Access PDF
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        No PDF Manuscript Uploaded
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                // Standard publication item details inside Modal
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">{viewItem.type}</Badge>
                    <Badge variant="outline"><Calendar className="h-3 w-3 mr-1" />{new Date(viewItem.createdAt || viewItem.created_at).toLocaleDateString()}</Badge>
                    {viewItem.accessMode === "pay_per_view" && <Badge variant="destructive">Pay-Per-View</Badge>}
                  </div>

                  {viewItem.authorUser && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><User className="h-3.5 w-3.5" />Author</p>
                      <p className="text-sm font-medium">{viewItem.authorUser.fullName || viewItem.authorUser.email}</p>
                      {viewItem.authorUser.institution && <p className="text-xs text-muted-foreground">{viewItem.authorUser.institution}</p>}
                    </div>
                  )}

                  {viewItem.coAuthors?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Co-Authors</p>
                      <p className="text-sm text-muted-foreground">{viewItem.coAuthors.join(", ")}</p>
                    </div>
                  )}

                  {viewItem.summary && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Summary / Abstract</p>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{viewItem.summary}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t flex justify-end gap-2">
                    <Button asChild>
                      <Link to={`/publications/${viewItem.slug}`}>
                        Read Full Publication <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

        {/* Supporting Text */}
        <section className="bg-primary py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[80px]" />
          </div>
          <div className="container max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white tracking-tight">Built for Clarity and Credibility</h2>
            <p className="text-xl text-primary-foreground/80 leading-relaxed font-light">
              Each publication page is structured to improve readability, showcase contributor details, and support trust through author and reviewer visibility. Explore the people and process behind every published work.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-24 text-center">
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/library">
              <Button size="lg" className="h-16 px-10 rounded-full font-bold text-lg group shadow-xl shadow-primary/20">
                Explore Digital Library
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/authors">
              <Button size="lg" variant="outline" className="h-16 px-10 rounded-full font-bold text-lg border-primary/20 hover:bg-primary/5 text-primary">
                Meet the Contributors
              </Button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}


