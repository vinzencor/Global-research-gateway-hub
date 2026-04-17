import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, ClipboardList, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/sub-admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Review Queue", to: "/reviewer/stage", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Settings", to: "/sub-admin/settings", icon: <Settings className="h-4 w-4" /> },
];

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_review: "bg-warning/10 text-warning border-warning/20",
  changes_requested: "bg-orange-500/10 text-orange-600 border-orange-200",
  approved: "bg-success/10 text-success border-success/20",
};

export default function SubAdminReview() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [accessMode, setAccessMode] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { if (user) loadAssignments(); }, [user]);

  async function loadAssignments() {
    setLoading(true);
    // Find all stages assigned to this user
    const { data: stages } = await supabase
      .from("workflow_stages")
      .select("id, stage_name, order_index, template_id")
      .eq("assigned_user_id", user!.id);

    if (!stages || stages.length === 0) { setAssignments([]); setLoading(false); return; }

    // Find all content_items at one of these stages and submitted/in_review
    const templateIds = stages.map((s: any) => s.template_id);
    const { data: items } = await supabase
      .from("content_items")
      .select("id, title, summary, type, workflow_status, workflow_template_id, current_stage_index, created_at, access_mode")
      .in("workflow_template_id", templateIds)
      .in("workflow_status", ["submitted", "in_review"])
      .order("created_at", { ascending: false });

    // Match items to stages
    const matched = (items || []).filter((item: any) => {
      const stage = stages.find((s: any) => s.template_id === item.workflow_template_id && s.order_index === item.current_stage_index);
      return !!stage;
    }).map((item: any) => {
      const stage = stages.find((s: any) => s.template_id === item.workflow_template_id && s.order_index === item.current_stage_index);
      return { ...item, stage };
    });

    setAssignments(matched);
    // Mark them as in_review
    if (matched.length > 0) {
      await supabase.from("content_items").update({ workflow_status: "in_review" }).in("id", matched.map((m: any) => m.id)).eq("workflow_status", "submitted");
    }
    setLoading(false);
  }

  async function act(item: any, action: "approved" | "changes_requested" | "rejected") {
    setActing(item.id);
    const comment = comments[item.id] || "";
    // Determine next status/stage
    let nextStatus = action === "approved" ? "approved" : action;
    let nextStageIndex = item.current_stage_index;

    if (action === "approved") {
      // Check if there's a next stage
      const { data: nextStage } = await supabase
        .from("workflow_stages")
        .select("id, order_index")
        .eq("template_id", item.workflow_template_id)
        .eq("order_index", item.current_stage_index + 1)
        .maybeSingle();

      if (nextStage) {
        nextStageIndex = nextStage.order_index;
        nextStatus = "submitted"; // goes to next stage
      } else {
        nextStatus = "published"; // all stages done → auto-publish!
      }
    }

    const contentStatus =
      action === "rejected" ? "archived"
      : nextStatus === "published" ? "published"
      : nextStatus === "submitted" ? "in_review"
      : "in_review";

    const selectedAccessMode = accessMode[item.id] || item.access_mode || "open_access";
    const payload: Record<string, any> = {
      workflow_status: nextStatus,
      current_stage_index: nextStageIndex,
      status: contentStatus,
    };
    if (nextStatus === "published") {
      payload.access_mode = selectedAccessMode;
      payload.visibility = selectedAccessMode;
    }

    const { error } = await supabase.from("content_items").update(payload).eq("id", item.id);

    if (error) { toast.error("Action failed"); setActing(null); return; }

    // Log the action
    await supabase.from("workflow_logs").insert({
      content_id: item.id,
      stage_id: item.stage?.id,
      stage_index: item.current_stage_index,
      action,
      comment,
      acted_by: user!.id,
    });

    setActing(null);
    const msg = nextStatus === "published"
      ? "🎉 Journal approved & published! It is now live on the public website."
      : `Journal ${action.replace("_", " ")} successfully`;
    toast.success(msg);
    setAssignments(prev => prev.filter(a => a.id !== item.id));
  }

  if (loading) return (
    <DashboardLayout navItems={navItems} title="Stage Review Queue">
      <div className="flex justify-center py-20"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout navItems={navItems} title="Stage Review Queue">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">These journals are assigned to your review stage. Review each and take action.</p>

        {assignments.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No journals pending your review</p>
            <p className="text-sm">You'll see submissions here when they reach your stage in the workflow</p>
          </div>
        )}

        {assignments.map(item => (
          <div key={item.id} className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{item.type} · Submitted {new Date(item.created_at).toLocaleDateString()}</p>
                <Badge variant="outline" className={`mt-2 text-xs ${STATUS_COLORS[item.workflow_status] || ""}`}>{item.workflow_status?.replace("_", " ")}</Badge>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground text-right">
                <p className="font-medium text-foreground">{item.stage?.stage_name}</p>
                <p>Stage {(item.current_stage_index || 0) + 1}</p>
              </div>
            </div>

            {item.summary && (
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs font-medium mb-1 text-muted-foreground">Abstract</p>
                <p className="text-sm line-clamp-4">{item.summary}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Reviewer Comment (optional)</label>
              <Textarea rows={2} placeholder="Add feedback for the author or next reviewer..." value={comments[item.id] || ""} onChange={e => setComments(prev => ({ ...prev, [item.id]: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Access Mode When Published</label>
              <Select value={accessMode[item.id] || item.access_mode || "open_access"} onValueChange={(v) => setAccessMode((prev) => ({ ...prev, [item.id]: v }))}>
                <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open_access">Open Access</SelectItem>
                  <SelectItem value="members_only">Members Only</SelectItem>
                  <SelectItem value="pay_per_view">Pay-per-view</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="bg-success hover:bg-success/90 text-white" onClick={() => act(item, "approved")} disabled={acting === item.id}>✓ Approve</Button>
              <Button size="sm" variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50" onClick={() => act(item, "changes_requested")} disabled={acting === item.id}>↩ Request Changes</Button>
              <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5" onClick={() => act(item, "rejected")} disabled={acting === item.id}>✗ Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

