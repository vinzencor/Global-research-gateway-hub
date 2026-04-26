import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { featuredApi, journalApi, usersApi } from "@/lib/api";
import { Search, ArrowRight, Star } from "lucide-react";

export default function    AuthorsPage() {
  const [authors, setAuthors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuthors() {
      setLoading(true);
      try {
        const [usersRes, journalsRes, featuredRes] = await Promise.all([
          usersApi.list({ role: "author", limit: "2000" }) as Promise<any>,
          journalApi.listPublished({ limit: "2000" }) as Promise<any>,
          featuredApi.list() as Promise<any>,
        ]);

        const users = Array.isArray(usersRes?.users)
          ? usersRes.users
          : Array.isArray(usersRes?.items)
          ? usersRes.items
          : Array.isArray(usersRes)
          ? usersRes
          : [];

        const journals = Array.isArray(journalsRes?.items)
          ? journalsRes.items
          : Array.isArray(journalsRes)
          ? journalsRes
          : [];

        const featuredUsers = Array.isArray(featuredRes?.items)
          ? featuredRes.items
          : Array.isArray(featuredRes)
          ? featuredRes
          : [];

        const publishedAuthorIds = new Set<string>();
        for (const j of journals) {
          const authorId = String(j?.authorUser?._id || j?.author_user_id || "");
          if (authorId) publishedAuthorIds.add(authorId);
        }

        const featuredIdSet = new Set<string>();
        for (const f of featuredUsers) {
          const id = String(f?._id || f?.id || "");
          if (id) featuredIdSet.add(id);
        }

        const userMap = new Map<string, any>();
        for (const u of users) {
          const id = String(u?._id || u?.id || "");
          if (!id) continue;
          userMap.set(id, {
            id,
            full_name: u?.fullName || "Unnamed User",
            institution: u?.institution || "",
            organization: u?.institution || "",
            bio: u?.bio || "",
            photo_url: u?.photoUrl || "",
            is_featured: featuredIdSet.has(id),
          });
        }

        for (const f of featuredUsers) {
          const id = String(f?._id || f?.id || "");
          if (!id || userMap.has(id)) continue;
          userMap.set(id, {
            id,
            full_name: f?.fullName || "Unnamed User",
            institution: f?.institution || "",
            organization: f?.institution || "",
            bio: f?.bio || "",
            photo_url: f?.photoUrl || "",
            is_featured: true,
          });
        }

        const merged = Array.from(userMap.values())
          .filter((a) => publishedAuthorIds.has(a.id) || a.is_featured)
          .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

        setAuthors(merged);
      } catch {
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    }

    loadAuthors();
  }, []);

  const filtered = authors.filter(a =>
    !search ||
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.organization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-16">
          <div className="container relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <Star className="h-4 w-4" />
              Contributors
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">Authors</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Meet the contributors behind the ideas, analysis, publications, and articles featured on our platform.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="container py-16 max-w-3xl mx-auto text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our authors bring insight, expertise, and perspective across a wide range of topics. This directory helps readers discover contributors, learn more about their backgrounds, and explore the work associated with each profile.
          </p>
        </section>

        {/* Directory Section Header */}
        <div className="container mb-4">
          <h2 className="font-heading text-2xl font-bold mb-2">Browse the Authors Directory</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Search or browse author profiles to find contributors by name, area of expertise, or featured status. Each profile is designed to connect readers not only with the individual, but also with their published work on the platform.
          </p>
        </div>

        <div className="container pb-16">

        {/* Search */}
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
          <div className="text-center py-16 text-muted-foreground">No authors found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(author => (
              <div key={author.id} className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/40 transition-colors text-center">
                {author.photo_url ? (
                  <img src={author.photo_url} alt={author.full_name} className="h-20 w-20 rounded-full object-cover mx-auto mb-3" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                    {author.full_name.charAt(0)}
                  </div>
                )}
                <h3 className="font-semibold text-sm">{author.full_name}</h3>
                {author.organization && <p className="text-xs text-muted-foreground">{author.organization}</p>}
                {author.is_featured && (
                  <Badge className="mt-2 text-xs bg-warning/10 text-warning border-warning/20">Featured</Badge>
                )}
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Featured Authors Section */}
        <section className="bg-secondary/30 py-16">
          <div className="container">
            <h2 className="font-heading text-2xl font-bold mb-2">Featured Authors</h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-xl">
              Highlighted contributors selected for visibility, engagement, or notable published work.
            </p>
            {authors.filter(a => a.is_featured).length === 0 ? (
              <p className="text-muted-foreground text-sm">No featured authors at the moment.</p>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {authors.filter(a => a.is_featured).map(author => (
                  <div key={`f-${author.id}`} className="rounded-xl border bg-card p-5 card-shadow hover:border-primary/40 transition-colors text-center">
                    {author.photo_url ? (
                      <img src={author.photo_url} alt={author.full_name} className="h-20 w-20 rounded-full object-cover mx-auto mb-3" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                        {author.full_name.charAt(0)}
                      </div>
                    )}
                    <h3 className="font-semibold text-sm">{author.full_name}</h3>
                    {author.organization && <p className="text-xs text-muted-foreground">{author.organization}</p>}
                    <Badge className="mt-2 text-xs bg-warning/10 text-warning border-warning/20">Featured</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/publications">
              <Button size="lg" className="rounded-full px-8 font-bold">
                View Publications <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/library">
              <Button size="lg" variant="outline" className="rounded-full px-8 font-bold">
                Explore the Digital Library
              </Button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}


