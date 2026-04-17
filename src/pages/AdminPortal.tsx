import { useEffect, useState } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, FileText, Users, BookOpen, CreditCard, Star, ClipboardList, GitBranch, UserCheck, BarChart3, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import AdminContent from "@/pages/admin/AdminContent";
import AdminPeople from "@/pages/admin/AdminPeople";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminLibrary from "@/pages/admin/AdminLibrary";
import AdminWorkflow from "@/pages/admin/AdminWorkflow";
import AdminSubAdmins from "@/pages/admin/AdminSubAdmins";
import AdminJournalPipeline from "@/pages/admin/AdminJournalPipeline";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Journal Pipeline", to: "/admin/pipeline", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Analytics", to: "/admin/analytics", icon: <TrendingUp className="h-4 w-4" /> },
  { label: "Workflow Designer", to: "/admin/workflow", icon: <GitBranch className="h-4 w-4" /> },
  { label: "Sub-Admins", to: "/admin/sub-admins", icon: <UserCheck className="h-4 w-4" /> },
  { label: "Content", to: "/admin/content", icon: <FileText className="h-4 w-4" /> },
  { label: "Review Queue", to: "/admin/reviews", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Featured Users", to: "/admin/people", icon: <Star className="h-4 w-4" /> },
  { label: "Digital Library", to: "/admin/library", icon: <BookOpen className="h-4 w-4" /> },
  { label: "Users & Roles", to: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Billing", to: "/admin/billing", icon: <CreditCard className="h-4 w-4" /> },
];

export default function AdminPortal() {
  const [stats, setStats] = useState({ content: 0, inReview: 0, published: 0, featuredUsers: 0, users: 0, members: 0 });
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      supabase.from("content_items").select("id,status", { count: "exact" }),
      supabase.from("content_items").select("id", { count: "exact" }).eq("status", "in_review"),
      supabase.from("content_items").select("id", { count: "exact" }).eq("status", "published"),
      supabase.from("featured_users").select("user_id", { count: "exact" }).eq("is_featured", true),
      supabase.from("memberships").select("id", { count: "exact" }).eq("status", "active"),
      supabase.from("content_items").select("id,title,type,status,created_at").order("created_at", { ascending: false }).limit(6),
    ]).then(([all, inRev, pub, featured, mems, recent]) => {
      setStats({ content: all.count || 0, inReview: inRev.count || 0, published: pub.count || 0, featuredUsers: featured.count || 0, users: 0, members: mems.count || 0 });
      setRecentContent(recent.data || []);
    });
  }, []);

  const statusColor: Record<string, string> = {
    draft: "bg-muted text-muted-foreground", in_review: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-info/10 text-info border-info/20", published: "bg-success/10 text-success border-success/20",
    archived: "bg-destructive/10 text-destructive border-destructive/20", changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  };

  return (
    <DashboardLayout navItems={navItems} title="Admin Console">
      <Routes>
        <Route path="/" element={
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Content", value: stats.content, action: () => navigate("/admin/content") },
                { label: "In Review", value: stats.inReview, action: () => navigate("/admin/reviews") },
                { label: "Published", value: stats.published, action: () => navigate("/admin/content") },
                { label: "Featured Users", value: stats.featuredUsers, action: () => navigate("/admin/people") },
                { label: "Active Members", value: stats.members, action: () => navigate("/admin/billing") },
              ].map((s) => (
                <button key={s.label} onClick={s.action} className="rounded-xl border bg-card p-5 card-shadow text-left hover:border-primary/40 transition-colors">
                  <p className="text-sm text-muted-foreground mb-1">{s.label}</p>
                  <p className="text-3xl font-bold">{s.value}</p>
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Create Content", desc: "Add new articles, publications, pages", action: () => navigate("/admin/content"), btn: "Create" },
                { title: "Review Queue", desc: "Review pending content submissions", action: () => navigate("/admin/reviews"), btn: "View Queue" },
                { title: "Manage Featured Users", desc: "Feature published users for the public authors page", action: () => navigate("/admin/people"), btn: "Manage" },
                { title: "Digital Library", desc: "Upload and manage library papers", action: () => navigate("/admin/library"), btn: "Manage" },
              ].map((c) => (
                <div key={c.title} className="rounded-xl border bg-card p-5 card-shadow">
                  <h3 className="font-heading font-bold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.desc}</p>
                  <Button size="sm" onClick={c.action}>{c.btn}</Button>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-card card-shadow overflow-hidden">
              <div className="p-5 border-b flex items-center justify-between">
                <h2 className="font-heading font-bold">Recent Content</h2>
                <Button size="sm" variant="ghost" onClick={() => navigate("/admin/content")}>View all</Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                  </tr></thead>
                  <tbody>
                    {recentContent.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium max-w-[200px] truncate">{item.title}</td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell capitalize">{item.type}</td>
                        <td className="p-4"><Badge variant="outline" className={statusColor[item.status]}>{item.status}</Badge></td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{new Date(item.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        <Route path="/pipeline" element={<AdminJournalPipeline />} />
        <Route path="/analytics" element={<AdminAnalytics />} />
        <Route path="/workflow" element={<AdminWorkflow />} />
        <Route path="/sub-admins" element={<AdminSubAdmins />} />
        <Route path="/content" element={<AdminContent />} />
        <Route path="/content/*" element={<AdminContent />} />
        <Route path="/reviews" element={<AdminReviews />} />
        <Route path="/people" element={<AdminPeople />} />
        <Route path="/library" element={<AdminLibrary />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/billing" element={<AdminBilling />} />
      </Routes>
    </DashboardLayout>
  );
}
