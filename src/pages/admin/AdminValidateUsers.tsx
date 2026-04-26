import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { membershipApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import { CheckCircle2, Eye, Search, XCircle } from "lucide-react";

type PendingMembership = {
  id: string;
  user_id: string;
  status: string;
  request_featured?: boolean | null;
  plan_id: string | null;
  created_at: string;
  screenshot_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  email?: string | null;
  profiles?: { full_name?: string | null; institution?: string | null };
  membership_plans?: { name?: string | null; price?: number | null; billing_period?: string | null };
  roles?: string[];
  isSynthetic?: boolean;
};

export default function AdminValidateUsers() {
  const [rows, setRows] = useState<PendingMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PendingMembership | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const pendingStatuses = ["pending_verification", "pending"];
  const approvedStatuses = ["active", "renewal_due", "approved"];

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

  function normalizeMembershipRows(payload: any): any[] {
    if (Array.isArray(payload?.memberships)) return payload.memberships;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  function normalizeUserRows(payload: any): any[] {
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  async function loadPendingUsers() {
    setLoading(true);
    try {
      const [membershipsRes, usersRes] = await Promise.all([
        membershipApi.adminList({ limit: "3000" }),
        usersApi.list({ limit: "1000" }),
      ]);

      const memberships = normalizeMembershipRows(membershipsRes);
      const users = normalizeUserRows(usersRes);

      const userMap = new Map<string, any>();
      users.forEach((u: any) => {
        const uid = String(u?._id || u?.id || "");
        if (uid) userMap.set(uid, u);
      });

      const mappedPending: PendingMembership[] = memberships
        .map((m: any) => {
          const uid = String(m?.user?._id || m?.user || m?.userId || "");
          if (!uid) return null;
          const userRow = userMap.get(uid);
          return {
            id: String(m?._id || m?.id || ""),
            user_id: uid,
            status: String(m?.status || "pending_verification"),
            request_featured: !!m?.requestFeatured,
            plan_id: m?.plan?._id || m?.plan || m?.planId || null,
            created_at: m?.createdAt || new Date().toISOString(),
            screenshot_url: m?.paymentScreenshotUrl || m?.screenshotUrl || null,
            starts_at: m?.startsAt || null,
            ends_at: m?.endsAt || null,
            email: m?.user?.email || userRow?.email || null,
            profiles: {
              full_name: m?.user?.fullName || userRow?.fullName || null,
              institution: m?.user?.institution || userRow?.institution || null,
            },
            membership_plans: {
              name: m?.plan?.name || null,
              price: Number(m?.plan?.price || 0),
              billing_period: m?.plan?.billingPeriod || null,
            },
            roles: Array.isArray(userRow?.roles) ? userRow.roles : [],
            isSynthetic: false,
          } as PendingMembership;
        })
        .filter((r): r is PendingMembership => !!r && pendingStatuses.includes(String(r.status || "")));

      const approvedUserIds = new Set(
        memberships
          .filter((m: any) => approvedStatuses.includes(String(m?.status || "")))
          .map((m: any) => String(m?.user?._id || m?.user || m?.userId || ""))
          .filter(Boolean)
      );

      const pendingUserIds = new Set(mappedPending.map((r) => r.user_id));

      const registeredOnlyRows: PendingMembership[] = users
        .filter((u: any) => {
          const uid = String(u?._id || u?.id || "");
          if (!uid) return false;
          if (approvedUserIds.has(uid) || pendingUserIds.has(uid)) return false;
          const roles: string[] = Array.isArray(u?.roles) ? u.roles : ["registered_user"];
          return !roles.some((r) => ["super_admin", "content_admin", "editor", "sub_admin", "reviewer", "author", "member", "subscriber"].includes(r));
        })
        .map((u: any) => ({
          id: `user-${String(u?._id || u?.id)}`,
          user_id: String(u?._id || u?.id),
          status: "registered",
          request_featured: false,
          plan_id: null,
          created_at: u?.createdAt || new Date().toISOString(),
          screenshot_url: null,
          starts_at: null,
          ends_at: null,
          email: u?.email || null,
          profiles: {
            full_name: u?.fullName || null,
            institution: u?.institution || null,
          },
          membership_plans: {
            name: null,
            price: null,
            billing_period: null,
          },
          roles: Array.isArray(u?.roles) ? u.roles : ["registered_user"],
          isSynthetic: true,
        }));

      const merged = latestPendingPerUser([...mappedPending, ...registeredOnlyRows]).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRows(merged);
    } catch (err: any) {
      setRows([]);
      toast.error(err?.message || "Failed to load validation requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedScreenshotUrl(selected?.screenshot_url || null);
  }, [selected]);

  async function approve(row: PendingMembership) {
    if (row.isSynthetic || String(row.id).startsWith("user-")) {
      toast.error("This user has not submitted a plan request yet.");
      return;
    }
    if (!row.plan_id || !row.screenshot_url) {
      toast.error("Cannot approve this account yet. User must submit payment screenshot and plan.");
      return;
    }
    setActioningId(row.id);
    try {
      const months = (row.membership_plans?.billing_period || "yearly") === "monthly" ? 1 : 12;
      await membershipApi.approve(row.id, true, months);
      await usersApi.addRole(row.user_id, "member").catch(() => null);
      await usersApi.addRole(row.user_id, "author").catch(() => null);

      setRows((prev) => prev.filter((r) => r.user_id !== row.user_id));
      setSelected(null);
      toast.success("User approved. Membership activated and paper submission access enabled.");
      await loadPendingUsers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve user");
    } finally {
      setActioningId(null);
    }
  }

  async function reject(row: PendingMembership) {
    if (row.isSynthetic || String(row.id).startsWith("user-")) {
      toast.error("No membership request to reject for this user.");
      return;
    }
    setActioningId(row.id);
    try {
      await membershipApi.approve(row.id, false);
      await usersApi.removeRole(row.user_id, "member").catch(() => null);
      await usersApi.removeRole(row.user_id, "subscriber").catch(() => null);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSelected(null);
      toast.success("Verification rejected");
      await loadPendingUsers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reject user");
    } finally {
      setActioningId(null);
    }
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
                <th className="text-left p-4 font-medium text-muted-foreground">Feature Request</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Submitted</th>
                <th className="p-4 font-medium text-muted-foreground text-center">Proof</th>
                <th className="p-4 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading pending users...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">No new registrations found</td>
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
                    <td className="p-4">
                      <Badge variant="outline" className={r.request_featured ? "bg-info/10 text-info border-info/20" : ""}>
                        {r.request_featured ? "Requested" : "No"}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium">{r.membership_plans?.price != null ? `$${Number(r.membership_plans.price).toFixed(2)}` : "-"}</td>
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
                          disabled={actioningId === r.id || !r.plan_id || !r.screenshot_url || r.isSynthetic}
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
                  <p className="font-medium">{selected.membership_plans?.price != null ? `$${Number(selected.membership_plans.price).toFixed(2)}` : "-"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Featured Request</p>
                  <p className="font-medium">{selected.request_featured ? "Yes" : "No"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{String(selected.status || "registered").replace(/_/g, " ")}</p>
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
                  disabled={actioningId === selected.id || !selected.plan_id || !selected.screenshot_url || selected.isSynthetic}
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

