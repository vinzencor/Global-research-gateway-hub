import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/legacyDb";
import { Search, Crown, Star, Users, ArrowRight, CheckCircle } from "lucide-react";

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReviewers() {
      const { data: roleData } = await db.from("roles").select("id").eq("name", "reviewer").single();
      if (!roleData) { setLoading(false); return; }
      
      const { data: userRoles } = await db.from("user_roles").select("user_id").eq("role_id", roleData.id);
      const reviewerIds = Array.from(new Set((userRoles || []).map((ur: any) => ur.user_id)));
      
      if (reviewerIds.length === 0) {
        setReviewers([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name, institution, bio, photo_url, reviewer_category")
        .in("id", reviewerIds)
        .order("full_name");
        
      setReviewers(profiles || []);
      setLoading(false);
    }
    fetchReviewers();
  }, []);

  const filtered = reviewers.filter(r =>
    !search ||
    (r.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.institution || "").toLowerCase().includes(search.toLowerCase())
  );

  const chiefEditors = filtered.filter(r => r.reviewer_category === "chief_editor");
  const topReviewers = filtered.filter(r => r.reviewer_category === "top_reviewer");
  const ourReviewers = filtered.filter(r => r.reviewer_category === "our_reviewer" || !r.reviewer_category);

  function ReviewerCard({ reviewer }: { reviewer: any }) {
    return (
      <div className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/40 transition-colors text-center">
        {reviewer.photo_url ? (
          <img src={reviewer.photo_url} alt={reviewer.full_name} className="h-20 w-20 rounded-full object-cover mx-auto mb-3" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-secondary/30 text-foreground flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            {reviewer.full_name.charAt(0)}
          </div>
        )}
        <h3 className="font-semibold text-sm">{reviewer.full_name}</h3>
        {reviewer.designation && <p className="text-xs text-muted-foreground mt-0.5">{reviewer.designation}</p>}
        {reviewer.institution && <p className="text-xs text-muted-foreground">{reviewer.institution}</p>}
        {reviewer.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{reviewer.bio}</p>}
        {reviewer.is_featured && (
          <Badge className="mt-2 text-xs bg-info/10 text-info border-info/20">Featured Reviewer</Badge>
        )}
      </div>
    );
  }

  function CategorySection({ title, icon, reviewers, emptyText, badgeClass }: { title: string; icon: React.ReactNode; reviewers: any[]; emptyText: string; badgeClass: string }) {
    if (reviewers.length === 0 && search) return null;
    return (
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2.5 rounded-xl ${badgeClass}`}>{icon}</div>
          <div>
            <h2 className="font-heading text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{reviewers.length} member{reviewers.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {reviewers.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">{emptyText}</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {reviewers.map(reviewer => <ReviewerCard key={reviewer.id} reviewer={reviewer} />)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-16">
          <div className="container relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <Star className="h-4 w-4" />
              Review Panel
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">Reviewers & Review Panel</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Meet the experts who help evaluate, strengthen, and support the quality of published content.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="container py-16 max-w-3xl mx-auto text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our review panel plays an important role in supporting quality, structure, clarity, and credibility. Reviewers contribute through editorial assessment, structured recommendations, and professional evaluation that helps refine content before publication where review is required.
          </p>
        </section>

        {/* Why Review Matters */}
        <section className="bg-secondary/30 py-16">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl font-bold mb-4">Why Review Matters</h2>
            <p className="text-muted-foreground leading-relaxed">
              A strong review process helps ensure content is relevant, coherent, and professionally presented. It also reinforces trust by showing that published work can pass through a considered evaluation process before being made public.
            </p>
          </div>
        </section>

        {/* Directory Header */}
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-4">
          <h2 className="font-heading text-2xl font-bold mb-2">Browse the Review Panel</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Explore reviewer profiles, learn about their expertise, and discover the individuals helping maintain quality standards across the platform.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-16">

        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or institution..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No reviewers found.</div>
        ) : (
          <>
            <CategorySection
              title="Chief Editors"
              icon={<Crown className="h-5 w-5 text-warning" />}
              reviewers={chiefEditors}
              emptyText="No chief editors assigned yet."
              badgeClass="bg-warning/10"
            />
            <CategorySection
              title="Top Reviewers"
              icon={<Star className="h-5 w-5 text-primary" />}
              reviewers={topReviewers}
              emptyText="No top reviewers assigned yet."
              badgeClass="bg-primary/10"
            />
            <CategorySection
              title="Our Reviewers"
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              reviewers={ourReviewers}
              emptyText="No reviewers found."
              badgeClass="bg-secondary"
            />
          </>
        )}
        </div>

        {/* CTA */}
        <section className="container py-16 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/authors">
              <Button size="lg" className="rounded-full px-8 font-bold">
                Meet the Authors <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/support">
              <Button size="lg" variant="outline" className="rounded-full px-8 font-bold">
                Contact the Editorial Team
              </Button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

