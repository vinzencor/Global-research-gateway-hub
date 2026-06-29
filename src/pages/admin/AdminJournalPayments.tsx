import { useEffect, useState } from "react";
import { journalApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";

const PAYMENT_COLORS: Record<string, string> = {
  unpaid: "bg-muted text-muted-foreground",
  awaiting_verification: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  paid: "bg-green-500/10 text-green-700 border-green-200",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  awaiting_verification: "Awaiting Verification",
  paid: "Paid & Verified",
};

export default function AdminJournalPayments() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data: any = await journalApi.adminList({ limit: "500" });
      setJournals(data?.items || data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load journals");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(id: string, approve: boolean) {
    setVerifying(id);
    try {
      await journalApi.verifyPayment(id, approve);
      toast.success(approve ? "Payment approved!" : "Payment rejected.");
      setJournals((prev) =>
        prev.map((j) =>
          (j._id || j.id) === id
            ? { ...j, paymentStatus: approve ? "paid" : "unpaid" }
            : j
        )
      );
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setVerifying(null);
    }
  }

  const filtered =
    filter === "all"
      ? journals
      : journals.filter((j) => (j.paymentStatus || "unpaid") === filter);

  const stats = {
    unpaid: journals.filter((j) => !j.paymentStatus || j.paymentStatus === "unpaid").length,
    awaiting_verification: journals.filter((j) => j.paymentStatus === "awaiting_verification").length,
    paid: journals.filter((j) => j.paymentStatus === "paid").length,
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Journal Submission Payments</h2>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Unpaid", value: stats.unpaid, icon: <XCircle className="h-5 w-5 text-muted-foreground" />, bg: "bg-muted/50" },
          { label: "Awaiting Verification", value: stats.awaiting_verification, icon: <Clock className="h-5 w-5 text-yellow-600" />, bg: "bg-yellow-50 dark:bg-yellow-950/20" },
          { label: "Paid & Verified", value: stats.paid, icon: <CheckCircle2 className="h-5 w-5 text-green-600" />, bg: "bg-green-50 dark:bg-green-950/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-5 flex items-center gap-3 ${s.bg}`}>
            {s.icon}
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "All" },
          { key: "awaiting_verification", label: "Awaiting Verification" },
          { key: "unpaid", label: "Unpaid" },
          { key: "paid", label: "Paid" },
        ].map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
            className="text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Paper Title</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Author</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Institution</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Payment Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">Proof</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Submitted</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  No journals found for this filter.
                </td>
              </tr>
            )}
            {filtered.map((j) => {
              const jid = j._id || j.id;
              const ps = j.paymentStatus || "unpaid";
              const hasProof = !!j.paymentProofUrl;
              const isVerifying = verifying === jid;

              return (
                <tr key={jid} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-medium max-w-[200px]">
                    <p className="truncate">{j.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                      Status: {j.status || "draft"}
                    </p>
                  </td>
                  <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                    {j.authorUser?.fullName || j.authorUser?.email || j.originalAuthorName || "—"}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                    {j.institution || "—"}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className={PAYMENT_COLORS[ps]}>
                      {PAYMENT_LABELS[ps] || ps}
                    </Badge>
                  </td>
                  <td className="p-4 hidden xl:table-cell">
                    {hasProof ? (
                      <a
                        href={j.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> View Proof
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No proof uploaded</span>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {ps === "awaiting_verification" && (
                        <>
                          <Button
                            size="sm"
                            className="text-xs gap-1 bg-green-600 hover:bg-green-700"
                            disabled={isVerifying}
                            onClick={() => handleVerify(jid, true)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {isVerifying ? "..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            disabled={isVerifying}
                            onClick={() => handleVerify(jid, false)}
                          >
                            <XCircle className="h-3 w-3" />
                            {isVerifying ? "..." : "Reject"}
                          </Button>
                        </>
                      )}
                      {ps === "paid" && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {ps === "unpaid" && (
                        <span className="text-xs text-muted-foreground italic">Awaiting user payment</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
