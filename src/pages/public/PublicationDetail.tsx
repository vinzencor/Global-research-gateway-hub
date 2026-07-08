import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentApi, membershipApi } from "@/lib/api";
import { ArrowLeft, Calendar, FileText, BookOpen, Download, Library, Lock, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { buildFullDocumentText, copyToClipboard } from "@/lib/citation";
import { toast } from "sonner";

export default function PublicationDetail() {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [liveStats, setLiveStats] = useState<{ viewCount: number; copyCount: number } | null>(null);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const data: any = await contentApi.getBySlug(slug);
        if (!data) { setNotFound(true); setLoading(false); return; }
        setItem(data);
        // Separately fire view tracking (fire-and-forget; getBySlug already bumps it server-side
        // but we also call track for explicit count differentiation if needed)
        try { await (contentApi as any).track(data._id || data.id, "view"); } catch {}

        const accessMode = data.accessMode || data.access_mode || data.visibility || "open_access";

        if (accessMode === "open_access") {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        if (!user) { setHasAccess(false); setLoading(false); return; }

        // Check role-based access (admins / editors always get in)
        const adminRoles = ["super_admin", "content_admin", "editor"];
        if (user.roles?.some((r: string) => adminRoles.includes(r))) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        if (accessMode === "members_only") {
          // members have access
          const isMember = user.roles?.some((r: string) =>
            ["member", "subscriber"].includes(r)
          );
          setHasAccess(!!isMember);
        } else if (accessMode === "pay_per_view") {
          try {
            const itemId = data._id || data.id;
            const ppvRes: any = await membershipApi.checkPPVAccess(itemId);
            setHasAccess(!!(ppvRes?.hasAccess || ppvRes?.access));
          } catch {
            setHasAccess(false);
          }
        } else {
          setHasAccess(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, user]);

  const handleCopyCitation = async () => {
    if (!item) return;
    try {
      await copyToClipboard(buildFullDocumentText(item));
      contentApi.track(item._id || item.id, "copy").catch(() => {});
      toast.success("Full document copied.");
    } catch {
      toast.error("Could not copy document.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-32">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="font-heading text-2xl font-bold mb-2">Publication Not Found</h1>
          <p className="text-muted-foreground mb-6">This publication may not exist or is not yet published.</p>
          <Button asChild variant="outline"><Link to="/publications"><ArrowLeft className="h-4 w-4 mr-2" />Back to Publications</Link></Button>
        </div>
      </div>
    );
  }

  const accessMode = item.accessMode || item.access_mode || item.visibility || "open_access";
  const coverImg = item.coverImageUrl || item.cover_image_url;
  const pdfUrl = item.pdfUrl || item.pdf_url;
  const publishDate = item.publishedAt || item.createdAt || item.created_at;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <style>{`
        :root { --primary: 349 56% 46%; }
        .bg-primary { background-color: #ba3850; }
        .text-primary { color: #ba3850; }
        .border-primary { border-color: #ba3850; }
      `}</style>
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-background to-secondary/40 pt-20 pb-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          </div>
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <Link to="/publications" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors group">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Publications
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Label */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs mb-5">
                <FileText className="h-3 w-3" />
                {item.type ? item.type.replace(/_/g, " ") : "Publication"}
              </div>

              {/* Cover Image */}
              {coverImg && (
                <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-2xl mb-8">
                  <img src={coverImg} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Badge variant="outline" className="capitalize">{item.type?.replace(/_/g, " ")}</Badge>
                <Badge variant="outline" className="capitalize">
                  {accessMode === "open_access" ? "Open Access" : accessMode === "members_only" ? "Members Only" : "Pay per View"}
                </Badge>
                {publishDate && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(publishDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                )}
              </div>

              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-6 leading-tight">{item.title}</h1>
              <div className="flex flex-wrap gap-3 mb-2">
                <Button variant="outline" onClick={handleCopyCitation}>
                  <Copy className="h-4 w-4 mr-2" /> Copy Full Document
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Summary / Abstract */}
          {item.summary && hasAccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed border-l-4 border-primary pl-5 py-1">
                {item.summary}
              </p>
            </motion.div>
          )}

          {/* Body Content */}
          {hasAccess && item.body ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                {item.body}
              </div>
            </motion.div>
          ) : !hasAccess ? (
            <div className="rounded-2xl border bg-muted/30 p-8 text-center text-muted-foreground space-y-5">
              <Lock className="h-12 w-12 mx-auto text-primary/30" />
              <p className="text-xl font-semibold text-foreground">
                {accessMode === "pay_per_view" ? "Purchase Access to Continue" : "Members-Only Content"}
              </p>
              {/* Blurred preview */}
              <div className="relative overflow-hidden rounded-xl border bg-background/70 p-5 text-left">
                <div className="blur-sm select-none pointer-events-none text-sm leading-relaxed">
                  {(item.body || item.summary || "Preview locked — subscribe or purchase to read the full publication.").slice(0, 600)}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background" />
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {!user ? (
                  <Button asChild><Link to="/login">Login to Continue</Link></Button>
                ) : accessMode === "members_only" ? (
                  <Button asChild><Link to="/portal/membership">Get Membership Access</Link></Button>
                ) : (
                  <Button asChild>
                    <Link to={`/portal/membership?mode=ppv&contentId=${item._id || item.id}&returnTo=/publications/${item.slug}`}>
                      {`Buy Access — ₹${Number(item.ppvPrice || item.ppv_price || 9.99).toFixed(2)}`}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground italic text-center py-10">
              No content body available for this publication.
            </div>
          )}

          {/* Download / Access */}
          {hasAccess && pdfUrl && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-10 p-6 rounded-2xl border bg-card shadow-sm">
              <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Access & Download
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />Read Full Publication
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-2" />Download PDF
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/library">
                    <Library className="h-4 w-4 mr-2" />Explore Digital Library
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Editorial note */}
          <div className="mt-10 p-6 rounded-2xl border bg-secondary/30 text-sm text-muted-foreground leading-relaxed italic">
            This publication presents insights, analysis, or findings intended to support deeper understanding in its subject area. Readers are encouraged to explore related materials, contributor profiles, and associated resources where available.
          </div>

          {/* Back CTA */}
          <div className="mt-12 text-center">
            <Link to="/publications">
              <Button variant="outline" className="rounded-full font-bold">
                <ArrowLeft className="mr-2 h-4 w-4" />Browse All Publications
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
