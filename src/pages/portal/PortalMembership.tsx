import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Check, Receipt, PenSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ensureUserRole, reconcileMembershipStatuses, removeUserRoles } from "@/lib/membership";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

export default function PortalMembership() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ppvMode = searchParams.get("mode") === "ppv";
  const ppvContentId = searchParams.get("contentId") || "";
  const returnTo = searchParams.get("returnTo") || "/publications";
  const [plans, setPlans] = useState<any[]>([]);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [ppvPurchasing, setPpvPurchasing] = useState(false);
  const [ppvContent, setPpvContent] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    reconcileMembershipStatuses(user.id).then(() => Promise.all([
      supabase.from("membership_plans").select("*").eq("is_active", true).order("price"),
      supabase.from("memberships").select("*, membership_plans(name, price, billing_period)").eq("user_id", user.id).in("status", ["active", "renewal_due"]).maybeSingle(),
      supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ])).then(([p, m, i]) => {
      setPlans(p.data || []);
      setCurrentMembership(m.data);
      setInvoices(i.data || []);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !ppvMode || !ppvContentId) return;
    supabase
      .from("content_items")
      .select("id, title, slug, access_mode, ppv_price")
      .eq("id", ppvContentId)
      .maybeSingle()
      .then(({ data }) => setPpvContent(data || null));
  }, [user, ppvMode, ppvContentId]);

  async function handlePurchase(plan: any) {
    if (!user) return;
    setPurchasing(plan.id);
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setFullYear(endsAt.getFullYear() + (plan.billing_period === "yearly" ? 1 : 0));
    endsAt.setMonth(endsAt.getMonth() + (plan.billing_period === "monthly" ? 1 : 0));

    const { data: mem, error: memError } = await supabase.from("memberships").insert({
      user_id: user.id, plan_id: plan.id, status: "active",
      starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
    }).select().single();

    if (memError) { toast.error("Purchase failed"); setPurchasing(null); return; }

    await ensureUserRole(user.id, "member");

    await supabase.from("invoices").insert({
      user_id: user.id, membership_id: mem.id, amount: plan.price, currency: "USD", status: "paid", paid_at: new Date().toISOString(),
    });

    toast.success(`${plan.name} membership activated!`);
    setPurchasing(null);
    // Refresh
    const [m2, i2] = await Promise.all([
      supabase.from("memberships").select("*, membership_plans(name, price, billing_period)").eq("user_id", user.id).in("status", ["active", "renewal_due"]).maybeSingle(),
      supabase.from("invoices").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setCurrentMembership(m2.data); setInvoices(i2.data || []);
  }

  async function handleCancelMembership() {
    if (!user || !currentMembership?.id) return;
    if (!confirm("Cancel your current membership now?")) return;

    setCancelling(true);
    const nowIso = new Date().toISOString();
    const attempt = await supabase
      .from("memberships")
      .update({ status: "cancelled", ends_at: nowIso, cancelled_at: nowIso } as any)
      .eq("id", currentMembership.id);

    if (attempt.error) {
      const fallback = await supabase
        .from("memberships")
        .update({ status: "cancelled", ends_at: nowIso } as any)
        .eq("id", currentMembership.id);
      if (fallback.error) {
        toast.error("Failed to cancel membership: " + fallback.error.message);
        setCancelling(false);
        return;
      }
    }

    await removeUserRoles(user.id, ["member"]);

    setCancelling(false);
    setCurrentMembership(null);
    toast.success("Membership cancelled");
  }

  async function handlePurchasePpv() {
    if (!user || !ppvContent?.id) return;
    setPpvPurchasing(true);

    const { data: existing } = await supabase
      .from("pay_per_view_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", ppvContent.id)
      .maybeSingle();

    if (existing) {
      setPpvPurchasing(false);
      toast.success("Access already purchased");
      navigate(returnTo, { replace: true });
      return;
    }

    const amount = Number(ppvContent.ppv_price || 9.99);
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        user_id: user.id,
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

    const { error: ppvError } = await supabase
      .from("pay_per_view_purchases")
      .insert({
        user_id: user.id,
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
      await supabase.from("invoices").update({ status: "cancelled" }).eq("id", invoice.id);
    }

    await ensureUserRole(user.id, "subscriber");
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
        </div>

        {/* Plans */}
        <div>
          <h3 className="font-heading font-bold mb-4">Available Plans</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = currentMembership?.plan_id === plan.id;
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
                  <Button className="w-full" disabled={isCurrent || purchasing === plan.id} onClick={() => handlePurchase(plan)}>
                    {isCurrent ? "Active" : purchasing === plan.id ? "Processing..." : "Subscribe"}
                  </Button>
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

