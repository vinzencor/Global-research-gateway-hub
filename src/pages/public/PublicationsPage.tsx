import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Search, FileText, Calendar, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PublicationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("content_items")
      .select("id, title, slug, type, summary, cover_image_url, created_at, access_mode, ppv_price")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setItems(data || []); setLoading(false); });
  }, []);

  const types = ["all", ...Array.from(new Set(items.map(i => i.type)))];

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.summary?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || i.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-16">
          <div className="container relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <FileText className="h-4 w-4" />
              Publications
            </div>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6">Publications</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Browse featured and recent publications with clear attribution, structured review indicators, and easy access to full details.
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="container py-12 max-w-3xl mx-auto text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our Publications section highlights valuable work published through the platform. Each publication page is structured to improve readability, showcase contributor details, and support trust through author and reviewer visibility where enabled.
          </p>
        </section>

        {/* Listing Header */}
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <h2 className="font-heading text-2xl font-bold mb-2">Discover Published Work</h2>
          <p className="text-muted-foreground text-sm max-w-xl">
            Browse publications by category, tag, year, or featured status. Each listing is designed to help readers quickly identify what is relevant and worth exploring further.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-16">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search publications..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              {types.map(t => <SelectItem key={t} value={t} className="capitalize">{t === "all" ? "All Types" : t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No publications found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <Link key={item.id} to={`/publications/${item.slug}`} className="rounded-xl border bg-card card-shadow hover:border-primary/40 hover:shadow-md transition-all group overflow-hidden">
                {item.cover_image_url ? (
                  <img src={item.cover_image_url} alt={item.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize text-xs">{item.type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {(item.access_mode || "open_access").replace(/_/g, " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">{item.title}</h3>
                  {item.summary && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>}
                  {!user && item.access_mode && item.access_mode !== "open_access" && (
                    <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Login required for full access
                    </p>
                  )}
                  {item.access_mode === "pay_per_view" && (
                    <p className="text-xs text-primary mt-1 font-medium">
                      Pay-per-view: ${Number(item.ppv_price || 9.99).toFixed(2)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>

        {/* Supporting Text */}
        <section className="bg-secondary/30 py-16">
          <div className="container max-w-3xl mx-auto text-center space-y-4">
            <h2 className="font-heading text-3xl font-bold">Built for Clarity and Credibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              Publication pages are structured to present content clearly while also highlighting the people behind the work. Where enabled, readers can see the author and reviewer information directly on the page, helping reinforce quality and transparency.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="container py-16 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/library">
              <Button size="lg" className="rounded-full px-8 font-bold">
                Explore Digital Library <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/authors">
              <Button size="lg" variant="outline" className="rounded-full px-8 font-bold">
                Meet the Authors
              </Button>
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}

