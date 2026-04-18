import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { ensureUserRole, removeUserRoles } from "@/lib/membership";
import { toast } from "sonner";
import { CheckCircle2, Eye, Search, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type PendingMembership = {
  id: string;
  user_id: string;
  status: string;
  plan_id: string | null;
  created_at: string;
  screenshot_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  email?: string | null;
  profiles?: { full_name?: string | null; institution?: string | null };
  membership_plans?: { name?: string | null; price?: number | null; billing_period?: string | null };
};

export default function AdminValidateUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState<PendingMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PendingMembership | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  function latestPendingPerUser(items: PendingMembership[]) {
    const map = new Map<string, PendingMembership>();
    for (const item of items) {
      const existing = map.get(item.user_id);
      if (!existing || new Date(item.created_at).getTime() > new Date(existing.created_at).getTime()) {
        map.set(item.user_id, item);
      }
    }
    return Array.from(map.values());
  }

  async function getIneligibleUserIds(userIds: string[]) {
    if (userIds.length === 0) return new Set<string>();

    const [approvedMembershipRes, paidMembershipInvoiceRes] = await Promise.all([
      supabase
        .from("memberships")
        .select("user_id")
        .in("user_id", userIds)
        .in("status", ["active", "renewal_due", "approved"]),
      supabase
        .from("invoices")
        .select("user_id")
        .in("user_id", userIds)
        .eq("status", "paid")
        .not("membership_id", "is", null),
    ]);

    const ineligible = new Set<string>();
    (approvedMembershipRes.data || []).forEach((r: any) => ineligible.add(r.user_id));
    (paidMembershipInvoiceRes.data || []).forEach((r: any) => ineligible.add(r.user_id));
    hiddenUserIds.forEach((id) => ineligible.add(id));
    return ineligible;
  }

  async function loadPendingUsers() {
    setLoading(true);
    const rpcRes = await supabase.rpc("get_pending_validations_admin");
    if (!rpcRes.error && Array.isArray(rpcRes.data)) {
      const mappedFromRpc: PendingMembership[] = (rpcRes.data as any[]).map((r: any) => ({
        id: r.membership_id,
        user_id: r.user_id,
        status: r.status,
        plan_id: r.plan_id,
        created_at: r.created_at,
        screenshot_url: r.screenshot_url,
        starts_at: r.starts_at,
        ends_at: r.ends_at,
        email: r.email || null,
        profiles: {
          full_name: r.full_name || null,
          institution: r.institution || null,
        },
        membership_plans: {
          name: r.plan_name || null,
          price: r.plan_price ?? null,
          billing_period: r.plan_billing_period || null,
        },
      }));

      const userIds = Array.from(new Set(mappedFromRpc.map((r) => r.user_id)));
      const ineligibleUserIds = await getIneligibleUserIds(userIds);

      const filteredMapped = latestPendingPerUser(
        mappedFromRpc.filter((r) => !ineligibleUserIds.has(r.user_id))
      );

      setRows(filteredMapped);
      setLoading(false);
      return;
    }

    // Fallback to client-side queries if RPC is not deployed yet.
    const { data: membershipRows, error } = await supabase
      .from("memberships")
      .select("id,user_id,status,plan_id,created_at,screenshot_url,starts_at,ends_at")
      .in("status", ["pending_verification", "pending"])
      .not("screenshot_url", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load pending users: " + error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const rows = (membershipRows || []) as PendingMembership[];
    if (rows.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
    const planIds = Array.from(new Set(rows.map((r) => r.plan_id).filter(Boolean))) as string[];

    const [profilesRes, plansRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("id,full_name,institution").in("id", userIds)
        : Promise.resolve({ data: [], error: null } as any),
      planIds.length > 0
        ? supabase.from("membership_plans").select("id,name,price,billing_period").in("id", planIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesRes.error) {
      toast.error("Failed to load profile details: " + profilesRes.error.message);
    }
    if (plansRes.error) {
      toast.error("Failed to load plan details: " + plansRes.error.message);
    }

    const profileMap: Record<string, { full_name?: string | null; institution?: string | null }> = {};
    (profilesRes.data || []).forEach((p: any) => {
      profileMap[p.id] = { full_name: p.full_name, institution: p.institution };
    });

    const planMap: Record<string, { name?: string | null; price?: number | null; billing_period?: string | null }> = {};
    (plansRes.data || []).forEach((p: any) => {
      planMap[p.id] = { name: p.name, price: p.price, billing_period: p.billing_period };
    });

    const mergedRows = rows.map((r) => ({
      ...r,
      email: r.email || null,
      profiles: profileMap[r.user_id] || undefined,
      membership_plans: r.plan_id ? (planMap[r.plan_id] || undefined) : undefined,
    }));

    const ineligibleUserIds = await getIneligibleUserIds(userIds);

    const filteredMerged = latestPendingPerUser(
      mergedRows.filter((r) => !ineligibleUserIds.has(r.user_id))
    );

    setRows(filteredMerged);
    setLoading(false);
  }

  useEffect(() => {
    if (!selected?.screenshot_url) {
      setSelectedScreenshotUrl(null);
      return;
    }

    const publicUrl = supabase.storage.from("payment-proofs").getPublicUrl(selected.screenshot_url).data.publicUrl;
    setSelectedScreenshotUrl(publicUrl || null);

    supabase.storage
      .from("payment-proofs")
      .createSignedUrl(selected.screenshot_url, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setSelectedScreenshotUrl(data.signedUrl);
      });
  }, [selected]);

  async function logAdminAction(params: {
    targetUserId: string;
    membershipId?: string | null;
    actionType: string;
    actionNote?: string | null;
  }) {
    if (!user?.id) return;
    await supabase.from("payment_admin_actions").insert({
      admin_user_id: user.id,
      target_user_id: params.targetUserId,
      membership_id: params.membershipId || null,
      invoice_id: null,
      action_type: params.actionType,
      action_note: params.actionNote || null,
    } as any);
  }

  async function approve(row: PendingMembership) {
    if (!row.plan_id || !row.screenshot_url) {
      toast.error("Cannot approve this account yet. User must submit payment screenshot and plan.");
      return;
    }
    setActioningId(row.id);
    const now = new Date();
    const endsAt = new Date(now);
    if ((row.membership_plans?.billing_period || "yearly") === "monthly") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    const cancelActiveRes = await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: now.toISOString() } as any)
      .eq("user_id", row.user_id)
      .in("status", ["active", "renewal_due"])
      .neq("id", row.id);
    if (cancelActiveRes.error) {
      setActioningId(null);
      toast.error("Failed to close previous active membership: " + cancelActiveRes.error.message);
      return;
    }

    const cancelPendingRes = await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: now.toISOString() } as any)
      .eq("user_id", row.user_id)
      .in("status", ["pending_verification", "pending"])
      .neq("id", row.id);
    if (cancelPendingRes.error) {
      setActioningId(null);
      toast.error("Failed to close previous pending requests: " + cancelPendingRes.error.message);
      return;
    }

    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        status: "active",
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      setActioningId(null);
      toast.error("Failed to approve: " + updateError.message);
      return;
    }

    try {
      await ensureUserRole(row.user_id, "member");
    } catch (e: any) {
      setActioningId(null);
      toast.error("Membership activated but role assignment failed: " + (e?.message || "Unknown error"));
      await loadPendingUsers();
      return;
    }

    const { error: invError } = await supabase.from("invoices").insert({
      user_id: row.user_id,
      membership_id: row.id,
      amount: Number(row.membership_plans?.price || 0),
      currency: "USD",
      status: "paid",
      paid_at: new Date().toISOString(),
    } as any);

    if (invError) {
      setActioningId(null);
      toast.error("Membership approved but invoice failed: " + invError.message);
      await logAdminAction({
        targetUserId: row.user_id,
        membershipId: row.id,
        actionType: "membership_approved_invoice_failed",
        actionNote: invError.message,
      });
      await loadPendingUsers();
      return;
    }

    await logAdminAction({
      targetUserId: row.user_id,
      membershipId: row.id,
      actionType: "membership_approved",
      actionNote: `Approved in Validate New Users (${row.membership_plans?.name || "plan"})`,
    });

    // Final cleanup pass to avoid stale pending rows lingering for the same user.
    await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: now.toISOString() } as any)
      .eq("user_id", row.user_id)
      .in("status", ["pending_verification", "pending"]);

    setHiddenUserIds((prev) => (prev.includes(row.user_id) ? prev : [...prev, row.user_id]));
    setRows((prev) => prev.filter((r) => r.user_id !== row.user_id));

    setActioningId(null);
    setSelected(null);
    toast.success("User verified and membership activated");
    await loadPendingUsers();
  }

  async function reject(row: PendingMembership) {
    setActioningId(row.id);
    const { error } = await supabase
      .from("memberships")
      .update({ status: "cancelled" })
      .eq("id", row.id);

    if (error) {
      setActioningId(null);
      toast.error("Failed to reject: " + error.message);
      return;
    }

    await removeUserRoles(row.user_id, ["member", "subscriber"]);
    await logAdminAction({
      targetUserId: row.user_id,
      membershipId: row.id,
      actionType: "membership_rejected",
      actionNote: "Rejected in Validate New Users",
    });

    setHiddenUserIds((prev) => (prev.includes(row.user_id) ? prev : [...prev, row.user_id]));
    setRows((prev) => prev.filter((r) => r.id !== row.id));

    setActioningId(null);
    setSelected(null);
    toast.success("Verification rejected");
    await loadPendingUsers();
  }

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const name = (r.profiles?.full_name || "").toLowerCase();
      const email = (r.email || "").toLowerCase();
      const institution = (r.profiles?.institution || "").toLowerCase();
      const plan = (r.membership_plans?.name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || institution.includes(q) || plan.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-heading font-bold text-xl">Validate New Users</h2>
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          {rows.length} pending
        </Badge>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 text-muted-foreground absolute left-2.5 top-2.5" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          placeholder="Search by name, email, institution, plan..."
        />
      </div>

      <div className="rounded-xl border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Plan</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                <th className="p-4 font-medium text-muted-foreground text-center">Proof</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading pending users...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No pending validations found</td>
                </tr>
              ) : (
                filteredRows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-semibold">{r.profiles?.full_name || "Unnamed user"}</div>
                      <div className="text-xs text-muted-foreground">{r.profiles?.institution || "No institution"}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">{r.email || "Not available"}</td>
                    <td className="p-4">{r.membership_plans?.name || "Not submitted"}</td>
                    <td className="p-4 font-medium">${Number(r.membership_plans?.price || 0).toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setSelected(r)}>
                        <Eye className="h-4 w-4" /> View
                      </Button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="bg-success hover:bg-success/90 gap-1"
                          disabled={actioningId === r.id || !r.plan_id || !r.screenshot_url}
                          onClick={() => approve(r)}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          disabled={actioningId === r.id}
                          onClick={() => reject(r)}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof Review</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selected.profiles?.full_name || "Unnamed user"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selected.email || "Not available"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">{selected.membership_plans?.name || "Not submitted"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">${Number(selected.membership_plans?.price || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                {selected.screenshot_url ? (
                  <img
                    src={selectedScreenshotUrl || ""}
                    alt="Payment proof"
                    className="w-full max-h-[60vh] object-contain rounded-md"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No screenshot submitted yet. Ask the user to submit payment proof from membership page.</p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                <Button
                  variant="destructive"
                  onClick={() => reject(selected)}
                  disabled={actioningId === selected.id}
                  className="gap-1"
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button
                  onClick={() => approve(selected)}
                  disabled={actioningId === selected.id || !selected.plan_id || !selected.screenshot_url}
                  className="bg-success hover:bg-success/90 gap-1"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Activate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
