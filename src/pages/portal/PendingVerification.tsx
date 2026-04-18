import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, ShieldCheck, Mail, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function PendingVerification() {
  const { signOut, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const statusText = user?.membershipStatus ? String(user.membershipStatus).replace(/_/g, " ") : "not approved";

  useEffect(() => {
    if (user?.membershipStatus === "active" || user?.membershipStatus === "renewal_due" || user?.membershipStatus === "approved") {
      navigate("/portal/dashboard", { replace: true });
    }
  }, [user?.membershipStatus, navigate]);

  useEffect(() => {
    const timer = setInterval(async () => {
      await refreshUser();
    }, 20000);
    return () => clearInterval(timer);
  }, [refreshUser]);

  async function checkNow() {
    if (!user?.id) {
      toast.error("User session not found. Please sign in again.");
      return;
    }
    setChecking(true);
    await refreshUser();
    const { data: approvedMembership } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", user.id)
      .in("status", ["active", "renewal_due", "approved"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const [{ data: roleRows }, { data: paidMembershipInvoice }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("roles!inner(name)")
        .eq("user_id", user.id),
      supabase
        .from("invoices")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .not("membership_id", "is", null)
        .limit(1)
        .maybeSingle(),
    ]);

    const hasApprovedRole = ((roleRows || []) as any[]).some((r: any) => {
      const name = r?.roles?.name;
      return name === "member" || name === "subscriber";
    });

    setChecking(false);
    if (approvedMembership?.status === "active" || approvedMembership?.status === "renewal_due" || approvedMembership?.status === "approved" || hasApprovedRole || !!paidMembershipInvoice?.id) {
      navigate("/portal/dashboard", { replace: true });
      return;
    }
    toast.info("Still pending approval. Please try again in a moment.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link to="/" className="inline-block mb-8">
            <img src="/Logo.png" alt="KnowledgeHub" className="h-20 w-auto mx-auto object-contain" />
          </Link>
          
          <div className="relative inline-block mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto ring-8 ring-primary/5">
              <Clock className="h-10 w-10 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-md border border-border">
              <ShieldCheck className="h-5 w-5 text-success" />
            </div>
          </div>
          
          <h1 className="font-heading text-3xl font-bold tracking-tight mb-3">Account Not Approved Yet</h1>
          <p className="text-muted-foreground leading-relaxed">
            Hello <span className="text-foreground font-bold">{user?.profile?.full_name || "Member"}</span>, your account is currently in
            <span className="text-foreground font-bold"> {statusText}</span> status.
            Admin approval is required before you can access dashboard features.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 card-shadow space-y-6 text-left">
          <div className="flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">Review Timeline</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Approvals usually take 2-12 hours during business days.</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 border">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm">Email Notification</p>
              <p className="text-xs text-muted-foreground leading-relaxed">You can log in fully after admin approval confirms your submitted payment and selected plan.</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button className="w-full h-12 rounded-xl font-bold" onClick={checkNow} disabled={checking}>
              {checking ? "Checking..." : "Check Approval Now"}
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold" asChild>
              <Link to="/support">Contact Support</Link>
            </Button>
            <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-destructive group" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" /> Sign Out & Refresh Later
            </Button>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground italic">
          Tip: You can refresh this page once you've received the activation email to access your dashboard.
        </p>
      </div>
    </div>
  );
}
