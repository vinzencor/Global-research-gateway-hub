import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Calendar, FileText, BookOpen, Download, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicationDetail() {
  const { user } = useAuth();
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (!slug) return;
      const { data } = await supabase
        .from("content_items")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setItem(data);
      const accessMode = data.access_mode || data.visibility || "open_access";

      if (accessMode === "open_access") {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const [{ data: membership }, { data: ppv }] = await Promise.all([
        supabase
          .from("memberships")
          .select("id")
          .eq("user_id", user.id)
          .in("status", ["active", "renewal_due"])
          .maybeSingle(),
        supabase
          .from("pay_per_view_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("content_id", data.id)
          .maybeSingle(),
      ]);

      if (accessMode === "members_only") {
        setHasAccess(!!membership);
      } else if (accessMode === "pay_per_view") {
        setHasAccess(!!ppv || !!membership);
      } else {
        setHasAccess(true);
      }
      setLoading(false);
    }

    load();
  }, [slug, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center py-24">
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <Link to="/publications" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Publications
        </Link>

        {/* Above Title Label */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-xs mb-4">
          <FileText className="h-3 w-3" />
          Publication
        </div>

        {item.cover_image_url && (
          <img src={item.cover_image_url} alt={item.title} className="w-full h-64 object-cover rounded-xl mb-8" />
        )}

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge variant="outline" className="capitalize">{item.type}</Badge>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </span>
        </div>

        <h1 className="font-heading text-3xl font-bold mb-4 leading-tight">{item.title}</h1>

        {item.summary && hasAccess && (
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-4">{item.summary}</p>
        )}

        {hasAccess && item.body ? (
          <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">{item.body}</div>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-8 text-center text-muted-foreground space-y-4">
            <div className="relative overflow-hidden rounded-lg border bg-background/70 p-5">
              <div className="blur-sm select-none pointer-events-none text-left text-sm leading-relaxed">
                {(item.body || item.summary || "Preview locked").slice(0, 900)}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
            </div>
            <p>Full content is locked for this publication access mode.</p>
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              {!user ? (
                <Button asChild><Link to="/login">Login to Continue</Link></Button>
              ) : (item.access_mode || item.visibility) === "members_only" ? (
                <Button asChild><Link to="/portal/membership">Get Membership Access</Link></Button>
              ) : (
                <Button asChild>
                  <Link to={`/portal/membership?mode=ppv&contentId=${item.id}&returnTo=/publications/${item.slug}`}>
                    {`Buy Access $${Number(item.ppv_price || 9.99).toFixed(2)}`}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {hasAccess && item.pdf_url && (
          <div className="mt-8 p-5 rounded-xl border bg-card card-shadow">
            <h3 className="font-heading font-bold mb-4">Access & Download</h3>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" /> Read Full Publication
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={item.pdf_url} target="_blank" rel="noopener noreferrer" download>
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link to="/library">
                  <Library className="h-4 w-4 mr-2" /> Access in Digital Library
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Body Intro Text */}
        <div className="mt-10 p-6 rounded-2xl border bg-secondary/30 text-sm text-muted-foreground leading-relaxed italic">
          This publication presents insights, analysis, or findings intended to support deeper understanding in its subject area. Readers are encouraged to explore related materials, contributor profiles, and associated resources where available.
        </div>

        {/* Related Publications */}
        <div className="mt-12">
          <h2 className="font-heading text-2xl font-bold mb-2">Related Publications</h2>
          <p className="text-muted-foreground text-sm mb-6">Explore additional publications related by subject, tag, or author association.</p>
          <Link to="/publications">
            <Button variant="outline" className="rounded-full font-bold">
              Browse All Publications <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </Link>
        </div>

      </main>
      <Footer />
    </div>
  );
}

