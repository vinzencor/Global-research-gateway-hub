import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Check, Receipt, PenSquare, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/legacyDb";
import { featuredApi, membershipApi } from "@/lib/api";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";
import { ensureUserRole, reconcileMembershipStatuses, removeUserRoles } from "@/lib/membership";
import { toast } from "sonner";

export default function PortalMembership() {
  const { user } = useAuth();
  const navItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ppvMode = searchParams.get("mode") === "ppv";
  const ppvContentId = searchParams.get("contentId") || "";
  const returnTo = searchParams.get("returnTo") || "/publications";
  const [plans, setPlans] = useState<any[]>([]);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [pendingMembership, setPendingMembership] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [ppvPurchasing, setPpvPurchasing] = useState(false);
  const [ppvContent, setPpvContent] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [requestFeatured, setRequestFeatured] = useState(false);
  const [featuredRequestStatus, setFeaturedRequestStatus] = useState<string | null>(null);
  const [featuredRequesting, setFeaturedRequesting] = useState(false);
  const approvedStatuses = ["active", "renewal_due", "approved"];
  const pendingStatuses = ["pending_verification", "pending"];
  const maxPlanPrice = plans.length > 0 ? Math.max(...plans.map((p) => Number(p.price || 0))) : 0;
  const currentPlanPrice = Number(currentMembership?.membership_plans?.price || 0);
  const isOnHighestTier = !!currentMembership && currentPlanPrice >= maxPlanPrice && maxPlanPrice > 0;

  function normalizePlanRows(payload: any) {
    if (Array.isArray(payload?.plans)) return payload.plans;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  function normalizeInvoiceRows(payload: any) {
    if (Array.isArray(payload?.invoices)) return payload.invoices;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
  }

  function normalizeMembershipRows(payload: any) {
    if (!payload) return [] as any[];
    if (Array.isArray(payload?.memberships)) return payload.memberships;
    if (Array.isArray(payload?.items)) return payload.items;
    if (payload?.membership) return [payload.membership];
    if (payload?.currentMembership) return [payload.currentMembership];
    if (Array.isArray(payload)) return payload;
    if (payload?.id || payload?._id) return [payload];
    return [];
  }

  function normalizeMembershipShape(m: any) {
    const planObj = m?.plan || m?.membership_plans || {};
    return {
      ...m,
      id: String(m?._id || m?.id || ""),
      plan_id: planObj?._id || m?.plan_id || m?.planId || null,
      status: String(m?.status || ""),
      created_at: m?.createdAt || m?.created_at || new Date().toISOString(),
      starts_at: m?.startsAt || m?.starts_at || null,
      ends_at: m?.endsAt || m?.ends_at || null,
      screenshot_url: m?.paymentScreenshotUrl || m?.screenshotUrl || m?.screenshot_url || null,
      request_featured: !!(m?.requestFeatured || m?.request_featured),
      membership_plans: {
        name: planObj?.name || null,
        price: Number(planObj?.price || 0),
        billing_period: planObj?.billingPeriod || planObj?.billing_period || null,
      },
    };
  }

  async function loadMembershipData() {
    if (!user) return;
    try {
      const [plansRes, myRes, invoicesRes] = await Promise.all([
        membershipApi.listPlans().catch(() => ({ plans: [] })),
        membershipApi.getMy().catch(() => null),
        membershipApi.getMyInvoices().catch(() => ({ invoices: [] })),
      ]);

      const normalizedPlans = normalizePlanRows(plansRes).map((p: any) => ({
        id: String(p?._id || p?.id || p?.planId || ""),
        name: String(p?.name || p?.plan_name || ""),
        price: Number(p?.price ?? p?.amount ?? 0),
        description: p?.description || null,
        billing_period: p?.billingPeriod || p?.billing_period || null,
        features: Array.isArray(p?.features) ? p.features : [],
      }));
      setPlans(normalizedPlans.filter((p: any) => p.id && p.name));

      const invoiceRows = normalizeInvoiceRows(invoicesRes).map((inv: any) => ({
        ...inv,
        id: String(inv?._id || inv?.id || ""),
        created_at: inv?.createdAt || inv?.created_at,
        status: inv?.status,
        amount: Number(inv?.amount || 0),
        currency: inv?.currency || "USD",
        membership_id: inv?.membership?._id || inv?.membershipId || inv?.membership_id || null,
      }));
      setInvoices(invoiceRows);

      const myMembershipRows = normalizeMembershipRows(myRes).map(normalizeMembershipShape);
      const approved = myMembershipRows.find((m: any) => approvedStatuses.includes(String(m?.status || ""))) || null;
      const pending = myMembershipRows.find((m: any) => pendingStatuses.includes(String(m?.status || ""))) || null;
      const resolved = resolveDisplayMembership(approved, pending, invoiceRows);
      setCurrentMembership(resolved.current);
      setPendingMembership(resolved.pending);
    } catch {
      setCurrentMembership(null);
      setPendingMembership(null);
      setInvoices([]);
      setPlans([]);
    }
  }

  function resolveDisplayMembership(approved: any, pending: any, invoiceRows: any[]) {
    if (approved) {
      return { current: approved, pending: null };
    }

    const paidMembershipInvoiceIds = new Set(
      (invoiceRows || [])
        .filter((inv: any) => inv?.status === "paid" && !!inv?.membership_id)
        .map((inv: any) => inv.membership_id)
    );

    if (pending?.id && paidMembershipInvoiceIds.has(pending.id)) {
      return { current: { ...pending, status: "approved" }, pending: null };
    }

    return { current: null, pending: pending || null };
  }

  useEffect(() => {
    if (!user) return;
    loadMembershipData();
  }, [user]);

  useEffect(() => {
    if (!user || !ppvMode || !ppvContentId) return;
    db
      .from("content_items")
      .select("id, title, slug, access_mode, ppv_price")
      .eq("id", ppvContentId)
      .maybeSingle()
      .then(({ data }) => setPpvContent(data || null));
  }, [user, ppvMode, ppvContentId]);

  useEffect(() => {
    if (!user) return;
    featuredApi.getMyRequests().then((res: any) => {
      const rows = Array.isArray(res?.requests)
        ? res.requests
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res)
        ? res
        : [];
      const latest = rows.length > 0 ? rows[0] : null;
      setFeaturedRequestStatus(latest?.status || null);
    }).catch(() => setFeaturedRequestStatus(null));
  }, [user]);

  async function handleRequestFeaturedUser() {
    if (!user) return;
    setFeaturedRequesting(true);
    let error: any = null;
    try {
      await featuredApi.submitRequest();
    } catch (err: any) {
      error = err;
    }
    setFeaturedRequesting(false);
    if (error) {
      toast.error("Failed to submit featured request: " + error.message);
      return;
    }
    setFeaturedRequestStatus("pending");
    toast.success("Featured user request submitted for admin approval");
  }

  async function handlePurchase(plan: any) {
    if (!user) return;
    if (pendingMembership) {
      toast.info("You already have a plan request under verification. Please wait for admin approval.");
      return;
    }
    if (!paymentFile) {
      toast.error("Please upload your payment screenshot first.");
      return;
    }

    const currentPrice = Number(currentMembership?.membership_plans?.price || 0);
    const targetPrice = Number(plan.price || 0);

    if (isOnHighestTier && currentMembership?.plan_id !== plan.id) {
      toast.error("You are already on the highest premium plan. Upgrade is not available.");
      return;
    }

    if (currentMembership && currentMembership.plan_id !== plan.id && targetPrice < currentPrice) {
      toast.error("Downgrade is not possible right now. Please request downgrade for next month.");
      return;
    }

    if (currentMembership && currentMembership.plan_id !== plan.id && targetPrice === currentPrice) {
      toast.error("Please choose a higher-value plan for upgrade.");
      return;
    }

    setPurchasing(plan.id);
    try {
      await membershipApi.apply(plan.id, paymentFile);
    } catch (err: any) {
      toast.error("Submission failed: " + (err?.message || "Unknown error"));
      setPurchasing(null);
      return;
    }

    toast.success(`${plan.name} request submitted. Admin approval is required.`);
    setPurchasing(null);
    setPaymentFile(null);
    setRequestFeatured(false);
    await loadMembershipData();
    navigate("/portal/pending", { replace: true });
  }

  async function handleCancelMembership() {
    if (!user || !currentMembership?.id) return;
    if (!confirm("Cancel your current membership now?")) return;

    setCancelling(true);
    try {
      await membershipApi.cancel();
      await removeUserRoles(user._id, ["member"]);
      setCurrentMembership(null);
      setPendingMembership(null);
      await loadMembershipData();
      toast.success("Membership cancelled");
    } catch (err: any) {
      toast.error("Failed to cancel membership: " + (err?.message || "Unknown error"));
    } finally {
      setCancelling(false);
    }
  }

  async function handlePurchasePpv() {
    if (!user || !ppvContent?.id) return;
    setPpvPurchasing(true);

    const { data: existing } = await db
      .from("pay_per_view_purchases")
      .select("id")
      .eq("user_id", user._id)
      .eq("content_id", ppvContent.id)
      .maybeSingle();

    if (existing) {
      setPpvPurchasing(false);
      toast.success("Access already purchased");
      navigate(returnTo, { replace: true });
      return;
    }

    const amount = Number(ppvContent.ppv_price || 9.99);
    const { data: invoice, error: invoiceError } = await db
      .from("invoices")
      .insert({
        user_id: user._id,
        amount,
        currency: "USD",
        status: "paid",
        paid_at: new Date().toISOString(),
      } as any)
      .select("id")
      .single();

    if (invoiceError) {
      setPpvPurchasing(false);
      toast.error("Payment failed: " + invoiceError.message);
      return;
    }

    const { error: ppvError } = await db
      .from("pay_per_view_purchases")
      .insert({
        user_id: user._id,
        content_id: ppvContent.id,
        invoice_id: invoice?.id || null,
        amount,
        currency: "USD",
      } as any);

    if (ppvError && !String(ppvError.message || "").toLowerCase().includes("duplicate")) {
      setPpvPurchasing(false);
      toast.error("Could not complete purchase: " + ppvError.message);
      return;
    }

    if (ppvError && invoice?.id) {
      await db.from("invoices").update({ status: "cancelled" }).eq("id", invoice.id);
    }

    await ensureUserRole(user._id, "subscriber");
    setPpvPurchasing(false);
    toast.success("Payment successful. Access unlocked.");
    navigate(returnTo, { replace: true });
  }

  return (
    <DashboardLayout navItems={navItems} title="Membership & Billing">
      <div className="space-y-6">
        {ppvMode && (
          <div className="rounded-xl border bg-card p-6 card-shadow">
            <h3 className="font-heading font-bold mb-2">Pay-per-view Checkout</h3>
            {ppvContent ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">One-time access purchase for this publication:</p>
                <p className="font-medium">{ppvContent.title}</p>
                <p className="text-sm">Amount: <span className="font-semibold">${Number(ppvContent.ppv_price || 9.99).toFixed(2)}</span></p>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handlePurchasePpv} disabled={ppvPurchasing}>{ppvPurchasing ? "Processing..." : "Pay Now"}</Button>
                  <Button variant="outline" asChild><Link to={returnTo}>Cancel</Link></Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Preparing payment details...</p>
            )}
          </div>
        )}

        {/* Current membership */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-3">Current Membership</h3>
          {currentMembership ? (
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-success/10 text-success border-success/20 text-sm px-3 py-1">{currentMembership.membership_plans?.name} Plan</Badge>
              <span className="text-sm text-muted-foreground">Expires: {currentMembership.ends_at ? new Date(currentMembership.ends_at).toLocaleDateString() : "N/A"}</span>
              <span className="text-sm font-medium">${currentMembership.membership_plans?.price}/{currentMembership.membership_plans?.billing_period || "yr"}</span>
              <Button variant="outline" size="sm" onClick={handleCancelMembership} disabled={cancelling}>
                {cancelling ? "Cancelling..." : "Cancel Membership"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active membership. Choose a plan below to get started.</p>
          )}

          <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  featuredRequestStatus === "approved"
                    ? "bg-success/10 text-success border-success/20"
                    : featuredRequestStatus === "rejected"
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : featuredRequestStatus === "pending"
                        ? "bg-warning/10 text-warning border-warning/20"
                        : ""
                }
              >
                Featured request: {featuredRequestStatus || "not requested"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestFeaturedUser}
              disabled={featuredRequesting || featuredRequestStatus === "pending"}
              className="flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              {featuredRequesting ? "Submitting..." : featuredRequestStatus === "pending" ? "Request Pending" : "Request Featured User"}
            </Button>
          </div>
        </div>

        {pendingMembership && !currentMembership && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-6 card-shadow">
            <h3 className="font-heading font-bold mb-2">Approval Pending</h3>
            <p className="text-sm text-muted-foreground">
              Your request for <span className="font-semibold text-foreground">{pendingMembership.membership_plans?.name}</span>
              {" "}(${Number(pendingMembership.membership_plans?.price || 0).toFixed(2)}) is awaiting admin approval.
            </p>
          </div>
        )}

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Bank Transfer Instructions</p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Transfer the amount for your selected plan, then upload the payment screenshot and submit for admin approval.
          </p>
          <div className="text-xs space-y-1 font-medium bg-white/50 p-2 rounded-lg border">
            <p>Bank: National Research Bank</p>
            <p>Account: 9784 2210 5543 1109</p>
            <p>IFSC: NRBK0002714</p>
            <p>UPI: researchhub@upi</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="membership-proof">Payment Screenshot *</Label>
            <input
              id="membership-proof"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-medium file:text-primary"
            />
            {paymentFile && <p className="text-xs text-muted-foreground">Selected: {paymentFile.name}</p>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requestFeatured}
              onChange={(e) => setRequestFeatured(e.target.checked)}
            />
            Request to be shown in Featured Users after admin approval
          </label>
        </div>

        {/* Plans */}
        <div>
          <h3 className="font-heading font-bold mb-4">Available Plans</h3>
          {isOnHighestTier && (
            <p className="text-sm text-muted-foreground mb-4">You are currently on the highest premium plan. Upgrade is not available.</p>
          )}
          {pendingMembership && !currentMembership && (
            <p className="text-sm text-muted-foreground mb-4">Your latest membership request is under verification. You can submit a new request after admin review.</p>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = currentMembership?.plan_id === plan.id;
              const currentPrice = Number(currentMembership?.membership_plans?.price || 0);
              const planPrice = Number(plan.price || 0);
              const upgradeBlocked = isOnHighestTier && !isCurrent;
              const notHigherTier = !!currentMembership && !isCurrent && planPrice <= currentPrice;
              const isDowngrade = !!currentMembership && !isCurrent && planPrice < currentPrice;
              return (
                <div key={plan.id} className={`rounded-xl border p-6 card-shadow ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}>
                  {isCurrent && <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Current Plan</Badge>}
                  <h4 className="font-heading font-bold text-lg">{plan.name}</h4>
                  <div className="my-3"><span className="text-3xl font-bold">${plan.price}</span><span className="text-muted-foreground text-sm">/{plan.billing_period}</span></div>
                  <ul className="space-y-2 mb-4">
                    {(plan.features || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success shrink-0" />{f}</li>
                    ))}
                  </ul>
                  <Button className="w-full" disabled={isCurrent || upgradeBlocked || notHigherTier || purchasing === plan.id || !!pendingMembership} onClick={() => handlePurchase(plan)}>
                    {isCurrent
                      ? "Active"
                      : purchasing === plan.id
                        ? "Submitting..."
                        : currentMembership
                          ? "Request Upgrade"
                          : "Submit For Approval"}
                  </Button>
                  {isDowngrade && <p className="text-xs text-muted-foreground mt-2">Downgrade is possible only from next month.</p>}
                  {notHigherTier && !isDowngrade && <p className="text-xs text-muted-foreground mt-2">Choose a higher-value plan to upgrade.</p>}
                  {upgradeBlocked && <p className="text-xs text-muted-foreground mt-2">You are already on the highest plan.</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="rounded-xl border bg-card card-shadow overflow-hidden">
            <div className="p-5 border-b flex items-center gap-2">
              <Receipt className="h-4 w-4" /><h3 className="font-heading font-bold">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="p-4 font-medium">${inv.amount} {inv.currency}</td>
                      <td className="p-4"><Badge variant="outline" className={inv.status === "paid" ? "bg-success/10 text-success border-success/20" : ""}>{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


