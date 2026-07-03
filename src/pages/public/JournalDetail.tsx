import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { journalApi } from "@/lib/api";
import { ArrowLeft, Calendar, FileText, BookOpen, Download, User, Tag, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { buildFullDocumentText, copyToClipboard } from "@/lib/citation";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

export default function JournalDetail() {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    journalApi.getBySlug(slug)
      .then((data: any) => {
        if (!data) { setNotFound(true); } else {
          setItem(data);
          // Separately fire view tracking (fire-and-forget; getBySlug already bumps it server-side)
          journalApi.track(data._id || data.id, "view").catch(() => {});
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyCitation = async () => {
    if (!item) return;
    try {
      await copyToClipboard(buildFullDocumentText(item));
      journalApi.track(item._id || item.id, "copy").catch(() => {});
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
          <h1 className="font-heading text-2xl font-bold mb-2">Journal Not Found</h1>
          <p className="text-muted-foreground mb-6">This journal may not exist or has not been published yet.</p>
          <Button asChild variant="outline">
            <Link to="/publications"><ArrowLeft className="h-4 w-4 mr-2" />Back to Publications</Link>
          </Button>
        </div>
      </div>
    );
  }

  const coverImg = item.coverImageUrl || item.cover_image_url || null;
  const publishDate = item.publishedAt || item.createdAt || item.created_at;
  const authorName = item.authorUser?.fullName || item.originalAuthorName || null;
  const authorInstitution = item.authorUser?.institution || item.institution || null;
  const keywords: string[] = Array.isArray(item.keywords)
    ? item.keywords
    : typeof item.keywords === "string"
    ? item.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : [];

  const manuscriptUrl = item.manuscriptUrl
    ? item.manuscriptUrl.startsWith("http")
      ? item.manuscriptUrl
      : `${API_BASE}${item.manuscriptUrl}`
    : null;

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
        {/* Hero */}
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs mb-5">
                <BookOpen className="h-3 w-3" />
                Journal Submission
              </div>

              {coverImg && (
                <div className="relative w-full h-64 md:h-80 overflow-hidden rounded-2xl mb-8">
                  <img src={coverImg} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <Badge variant="outline">Journal</Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">Published</Badge>
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

              {authorName && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{authorName}</p>
                    {authorInstitution && <p className="text-xs text-muted-foreground">{authorInstitution}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Abstract */}
          {item.abstract && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <h2 className="font-heading font-bold text-lg mb-3">Abstract</h2>
              <p className="text-muted-foreground leading-relaxed border-l-4 border-primary pl-5 py-1 mb-10">
                {item.abstract}
              </p>
            </motion.div>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              {keywords.map((kw: string) => (
                <Badge key={kw} variant="secondary" className="rounded-full text-xs">{kw}</Badge>
              ))}
            </div>
          )}

          {/* Manuscript Download */}
          {manuscriptUrl && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 p-6 rounded-2xl border bg-card shadow-sm mb-10">
              <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Full Manuscript
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={manuscriptUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" /> Read Manuscript
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={manuscriptUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4 mr-2" /> Download PDF
                  </a>
                </Button>
              </div>
            </motion.div>
          )}

          {/* Editorial note */}
          <div className="mt-6 p-6 rounded-2xl border bg-secondary/30 text-sm text-muted-foreground leading-relaxed italic">
            This journal submission has been reviewed and published on the GRGH platform. The content represents the findings and views of the contributing author(s).
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
