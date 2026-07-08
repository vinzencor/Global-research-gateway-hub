import { useEffect, useState } from "react";
import { journalApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw, Eye,
  FileText, Download, User, Building, Calendar, AlertTriangle,
} from "lucide-react";

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

const isImageUrl = (url: string) => /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(url || "");

export default function AdminJournalPayments() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [verifying, setVerifying] = useState<string | null>(null);

  const [viewItem, setViewItem] = useState<any | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  async function handleVerify(id: string, approve: boolean, reason?: string) {
    setVerifying(id);
    try {
      const updated: any = await journalApi.verifyPayment(id, approve, reason);
      toast.success(approve ? "Payment approved!" : "Payment rejected.");
      setJournals((prev) =>
        prev.map((j) => ((j._id || j.id) === id ? { ...j, ...updated } : j))
      );
      setViewItem((prev: any) => (prev && (prev._id || prev.id) === id ? { ...prev, ...updated } : prev));
      setRejectMode(false);
      setRejectReason("");
    } catch (err: any) {
      // 409 = someone else already actioned this payment (race condition) — refresh so the UI reflects reality
      if (err?.message?.includes("not awaiting verification") || err?.status === 409) {
        toast.error("This payment was already actioned (possibly by another admin). Refreshing list.");
        await load();
        setViewItem(null);
      } else {
        toast.error(err?.message || "Action failed");
      }
    } finally {
      setVerifying(null);
    }
  }

  function openView(item: any) {
    setViewItem(item);
    setRejectMode(false);
    setRejectReason("");
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
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Submitted</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted-foreground">
                  No journals found for this filter.
                </td>
              </tr>
            )}
            {filtered.map((j) => {
              const jid = j._id || j.id;
              const ps = j.paymentStatus || "unpaid";
              const isVerifying = verifying === jid;
              // "unpaid" covers two very different cases: the author never paid at
              // all, vs. they paid and an admin already rejected the proof. Without
              // this distinction the rejected case looks identical to "no action
              // taken yet" and the note an admin left disappears from view.
              const wasRejected = ps === "unpaid" && !!j.paymentRejectionReason;

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
                  <td className="p-4 max-w-[220px]">
                    {wasRejected ? (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={PAYMENT_COLORS[ps]}>
                        {PAYMENT_LABELS[ps] || ps}
                      </Badge>
                    )}
                    {wasRejected && (
                      <p className="text-[11px] text-destructive/80 mt-1 line-clamp-2" title={j.paymentRejectionReason}>
                        Note: {j.paymentRejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                    {j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap items-center">
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => openView(j)}>
                        <Eye className="h-3 w-3" /> View
                      </Button>
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
                            onClick={() => { openView(j); setRejectMode(true); }}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                      {ps === "paid" && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                      {ps === "unpaid" && wasRejected && (
                        <span className="text-xs text-muted-foreground italic">Awaiting author to re-upload</span>
                      )}
                      {ps === "unpaid" && !wasRejected && (
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

      {/* ─── View / Verify Modal ─── */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) { setViewItem(null); setRejectMode(false); setRejectReason(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl leading-tight pr-6">{viewItem?.title}</DialogTitle>
          </DialogHeader>

          {viewItem && (() => {
            const ps = viewItem.paymentStatus || "unpaid";
            const jid = viewItem._id || viewItem.id;
            const isVerifying = verifying === jid;
            const hasProof = !!viewItem.paymentProofUrl;
            const proofIsImage = hasProof && isImageUrl(viewItem.paymentProofUrl);

            return (
              <div className="space-y-5 py-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={PAYMENT_COLORS[ps]}>{PAYMENT_LABELS[ps] || ps}</Badge>
                  <Badge variant="outline" className="capitalize">{viewItem.status || "draft"}</Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <User className="h-3 w-3" />Author
                    </p>
                    <p className="text-sm">{viewItem.authorUser?.fullName || viewItem.originalAuthorName || "—"}</p>
                    {viewItem.authorUser?.email && <p className="text-xs text-muted-foreground">{viewItem.authorUser.email}</p>}
                  </div>
                  {viewItem.institution && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Building className="h-3 w-3" />Institution
                      </p>
                      <p className="text-sm">{viewItem.institution}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />Submitted
                    </p>
                    <p className="text-sm">
                      {viewItem.createdAt ? new Date(viewItem.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Amount Paid</p>
                    <p className="text-sm font-semibold">
                      {viewItem.paymentAmount ? `₹${Number(viewItem.paymentAmount).toFixed(2)}` : "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Payment proof */}
                <div className="rounded-lg border p-4 bg-muted/20">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Payment Proof</p>
                  {!hasProof ? (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" /> No payment proof uploaded yet.
                    </div>
                  ) : proofIsImage ? (
                    <div className="space-y-2">
                      <img
                        src={viewItem.paymentProofUrl}
                        alt="Payment proof"
                        className="max-h-72 w-auto rounded-lg border object-contain bg-white"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="text-xs gap-1">
                          <a href={viewItem.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3" /> Open Full Size
                          </a>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button asChild size="sm" variant="outline" className="text-xs gap-1">
                      <a href={viewItem.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3" /> View Payment Document
                      </a>
                    </Button>
                  )}
                </div>

                {/* Related documents */}
                <div className="flex flex-wrap gap-2">
                  {viewItem.manuscriptUrl && (
                    <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
                      <a href={viewItem.manuscriptUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3" /> Manuscript
                      </a>
                    </Button>
                  )}
                  {viewItem.supplementaryFileUrl && (
                    <Button asChild size="sm" variant="ghost" className="text-xs gap-1">
                      <a href={viewItem.supplementaryFileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" /> Supporting Document
                      </a>
                    </Button>
                  )}
                </div>

                {/* Verification history */}
                {ps === "paid" && viewItem.paymentVerifiedAt && (
                  <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 text-xs text-green-700 dark:text-green-400">
                    Verified by {viewItem.paymentVerifiedBy?.fullName || viewItem.paymentVerifiedBy?.email || "admin"} on{" "}
                    {new Date(viewItem.paymentVerifiedAt).toLocaleString()}.
                  </div>
                )}
                {ps === "unpaid" && viewItem.paymentRejectionReason && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    <p className="font-bold mb-1">Last rejection reason:</p>
                    {viewItem.paymentRejectionReason}
                  </div>
                )}

                {/* Reject reason input */}
                {ps === "awaiting_verification" && rejectMode && (
                  <div className="space-y-2 rounded-lg border border-destructive/30 p-3">
                    <Label htmlFor="reject-reason" className="text-xs">Reason for rejection (shown to author when they re-upload)</Label>
                    <Textarea
                      id="reject-reason"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Screenshot doesn't show amount/date clearly, please re-upload"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            {viewItem && (viewItem.paymentStatus || "unpaid") === "awaiting_verification" ? (
              rejectMode ? (
                <>
                  <Button variant="outline" onClick={() => { setRejectMode(false); setRejectReason(""); }}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={verifying === (viewItem._id || viewItem.id)}
                    onClick={() => handleVerify(viewItem._id || viewItem.id, false, rejectReason.trim())}
                  >
                    {verifying === (viewItem._id || viewItem.id) ? "Rejecting..." : "Confirm Reject"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setRejectMode(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Reject
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={!viewItem.paymentProofUrl || verifying === (viewItem._id || viewItem.id)}
                    onClick={() => handleVerify(viewItem._id || viewItem.id, true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    {verifying === (viewItem._id || viewItem.id) ? "Approving..." : "Approve"}
                  </Button>
                </>
              )
            ) : (
              <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
