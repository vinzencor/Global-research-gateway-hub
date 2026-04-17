import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, ClipboardList, Settings, CheckCircle, Clock, XCircle, GitBranch, Trophy, Flame, Star, TrendingUp, History, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export const subAdminNavItems = [
  { label: "Dashboard", to: "/sub-admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Review Queue", to: "/reviewer/stage", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Review History", to: "/sub-admin/history", icon: <History className="h-4 w-4" /> },
  { label: "Reports", to: "/sub-admin/report", icon: <BarChart2 className="h-4 w-4" /> },
  { label: "Settings", to: "/sub-admin/settings", icon: <Settings className="h-4 w-4" /> },
];

// Scoring weights
const SCORE_APPROVED = 10;
const SCORE_CHANGES_REQUESTED = 5;
const SCORE_REJECTED = 3;

// Level thresholds
const LEVELS = [
  { name: "Bronze", minScore: 0, color: "from-amber-700 to-amber-600", textColor: "text-amber-700", bgColor: "bg-amber-100", icon: "🥉" },
  { name: "Silver", minScore: 50, color: "from-gray-400 to-gray-300", textColor: "text-gray-500", bgColor: "bg-gray-100", icon: "🥈" },
  { name: "Gold", minScore: 150, color: "from-yellow-500 to-yellow-400", textColor: "text-yellow-600", bgColor: "bg-yellow-50", icon: "🥇" },
  { name: "Platinum", minScore: 300, color: "from-indigo-500 to-purple-500", textColor: "text-indigo-600", bgColor: "bg-indigo-50", icon: "💎" },
  { name: "Diamond", minScore: 500, color: "from-cyan-400 to-blue-500", textColor: "text-cyan-600", bgColor: "bg-cyan-50", icon: "👑" },
];

function getLevel(score: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (score >= l.minScore) level = l;
  }
  return level;
}

function getNextLevel(score: number) {
  for (const l of LEVELS) {
    if (score < l.minScore) return l;
  }
  return null;
}

export default function SubAdminPortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ stages: 0, pending: 0, inReview: 0, approved: 0, changesRequested: 0, rejected: 0, total: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [myStages, setMyStages] = useState<any[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);

    // Get stages assigned to this sub-admin
    const { data: stages } = await supabase
      .from("workflow_stages")
      .select("id, stage_name, order_index, template_id")
      .eq("assigned_user_id", user!.id);

    setMyStages(stages || []);
    const stageCount = stages?.length || 0;

    // Count pending items at my stages
    let pendingCount = 0;
    let inReviewCount = 0;
    if (stages && stages.length > 0) {
      const templateIds = stages.map((s: any) => s.template_id);
      const { data: items } = await supabase
        .from("content_items")
        .select("id, workflow_status, current_stage_index, workflow_template_id")
        .in("workflow_template_id", templateIds)
        .in("workflow_status", ["submitted", "in_review"]);

      (items || []).forEach((item: any) => {
        const atMyStage = stages.some(
          (s: any) => s.template_id === item.workflow_template_id && s.order_index === item.current_stage_index
        );
        if (atMyStage) {
          if (item.workflow_status === "submitted") pendingCount++;
          else inReviewCount++;
        }
      });
    }

    // Get ALL review history from workflow_logs for scoring
    const { data: allLogsData } = await supabase
      .from("workflow_logs")
      .select("id, action, acted_at, content_id")
      .eq("acted_by", user!.id)
      .order("acted_at", { ascending: false });

    const allLogs = allLogsData || [];
    const approved = allLogs.filter((l: any) => l.action === "approved").length;
    const changesReq = allLogs.filter((l: any) => l.action === "changes_requested").length;
    const rejected = allLogs.filter((l: any) => l.action === "rejected").length;

    // Calculate score
    const score = (approved * SCORE_APPROVED) + (changesReq * SCORE_CHANGES_REQUESTED) + (rejected * SCORE_REJECTED);
    setTotalScore(score);

    // Calculate streak (consecutive days with activity)
    let streakCount = 0;
    if (allLogs.length > 0) {
      const uniqueDays = new Set(allLogs.map((l: any) => new Date(l.acted_at).toDateString()));
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (uniqueDays.has(d.toDateString())) {
          streakCount++;
        } else if (i > 0) {
          break;
        }
      }
    }
    setStreak(streakCount);

    setStats({
      stages: stageCount,
      pending: pendingCount,
      inReview: inReviewCount,
      approved,
      changesRequested: changesReq,
      rejected,
      total: allLogs.length,
    });
    setRecentLogs(allLogs.slice(0, 5));
    setLoading(false);
  }

  const currentLevel = getLevel(totalScore);
  const nextLevel = getNextLevel(totalScore);
  const progressToNext = nextLevel
    ? ((totalScore - currentLevel.minScore) / (nextLevel.minScore - currentLevel.minScore)) * 100
    : 100;

  if (loading) return (
    <DashboardLayout navItems={subAdminNavItems} title="Sub-Admin Portal">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={subAdminNavItems} title="Sub-Admin Portal">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="rounded-xl border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <h2 className="font-heading text-2xl font-bold mb-1">
            Welcome, {user?.profile?.full_name?.split(" ")[0] || "Sub-Admin"}!
          </h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>

        {/* Gamification Scoring Card */}
        <div className="rounded-xl border bg-card card-shadow overflow-hidden">
          <div className={`bg-gradient-to-r ${currentLevel.color} p-5 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{currentLevel.icon}</div>
                <div>
                  <h3 className="font-heading font-bold text-lg">{currentLevel.name} Reviewer</h3>
                  <p className="text-sm opacity-90">{totalScore} points earned</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {streak > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5">
                    <Flame className="h-4 w-4" />
                    <span className="text-sm font-bold">{streak} day streak</span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-bold">{stats.total} reviews</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {nextLevel ? `${nextLevel.minScore - totalScore} pts to ${nextLevel.name}` : "Maximum level reached!"}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{Math.round(progressToNext)}%</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${currentLevel.color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-lg font-bold text-success">{stats.approved}</span>
                </div>
                <p className="text-xs text-muted-foreground">Approved (+{SCORE_APPROVED}pts each)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-lg font-bold text-orange-500">{stats.changesRequested}</span>
                </div>
                <p className="text-xs text-muted-foreground">Changes Req. (+{SCORE_CHANGES_REQUESTED}pts)</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-lg font-bold text-destructive">{stats.rejected}</span>
                </div>
                <p className="text-xs text-muted-foreground">Rejected (+{SCORE_REJECTED}pts each)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "My Assigned Stages", value: stats.stages, icon: <GitBranch className="h-5 w-5 text-primary" />, color: "text-primary" },
            { label: "Pending Review", value: stats.pending, icon: <Clock className="h-5 w-5 text-warning" />, color: "text-warning" },
            { label: "Currently In Review", value: stats.inReview, icon: <ClipboardList className="h-5 w-5 text-blue-500" />, color: "text-blue-500" },
            { label: "Total Reviewed", value: stats.total, icon: <CheckCircle className="h-5 w-5 text-success" />, color: "text-success" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-5 card-shadow flex items-center gap-4">
              <div className="shrink-0">{s.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-5 card-shadow text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold text-success">{stats.approved}</p>
            <p className="text-sm text-muted-foreground">Approved (total)</p>
          </div>
          <div className="rounded-xl border bg-card p-5 card-shadow text-center">
            <XCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-500">{stats.changesRequested}</p>
            <p className="text-sm text-muted-foreground">Changes Requested (total)</p>
          </div>
          <div className="rounded-xl border bg-card p-5 card-shadow flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-medium text-muted-foreground">Ready to review?</p>
            <Button onClick={() => navigate("/reviewer/stage")} className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Open Review Queue
            </Button>
          </div>
        </div>

        {/* My Stages */}
        {myStages.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-heading font-bold">My Assigned Workflow Stages</h3>
            </div>
            <div className="divide-y">
              {myStages.map((s: any) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{s.order_index + 1}</span>
                    <span className="font-medium text-sm">{s.stage_name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Assigned</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentLogs.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-heading font-bold">Recent Review Activity</h3>
            </div>
            <div className="divide-y">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {log.action === "approved" && <CheckCircle className="h-4 w-4 text-success" />}
                    {log.action === "changes_requested" && <XCircle className="h-4 w-4 text-orange-500" />}
                    {log.action === "rejected" && <XCircle className="h-4 w-4 text-destructive" />}
                    <span className="text-sm capitalize">{log.action?.replace("_", " ")}</span>
                    <Badge variant="outline" className="text-xs">
                      +{log.action === "approved" ? SCORE_APPROVED : log.action === "changes_requested" ? SCORE_CHANGES_REQUESTED : SCORE_REJECTED} pts
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.acted_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
