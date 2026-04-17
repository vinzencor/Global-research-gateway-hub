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
                Browse our growing repository of peer-reviewed and editorial content.
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
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link 
                  to={`/publications/${item.slug}`} 
                  className="flex flex-col h-full rounded-[2rem] border bg-card hover:border-primary/40 hover:shadow-2xl transition-all group overflow-hidden"
                >
                  {item.cover_image_url ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img src={item.cover_image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-primary/10 to-secondary/30 flex items-center justify-center">
                      <FileText className="h-12 w-12 text-primary/20" />
                    </div>
                  )}
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-6">
                      <Badge variant="secondary" className="capitalize text-[10px] font-bold tracking-widest rounded-full px-3 py-1">{item.type}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xl leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-4">{item.title}</h3>
                    {item.summary && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">{item.summary}</p>}
                    
                    <div className="mt-8 pt-6 border-t flex items-center justify-between">
                      <span className="text-primary font-bold text-sm tracking-wide">Read Publication →</span>
                      {item.access_mode === "pay_per_view" && (
                        <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded">
                          ${Number(item.ppv_price || 9.99).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        </div>

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

