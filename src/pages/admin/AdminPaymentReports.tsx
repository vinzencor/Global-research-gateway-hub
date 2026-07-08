import { useEffect, useMemo, useState } from "react";
import { membershipApi, journalApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileBarChart, RefreshCw, Download, Search, CreditCard, FileText,
  CheckCircle2, Clock, XCircle, User, TrendingUp,
} from "lucide-react";

type PaymentRecord = {
  id: string;
  type: "membership" | "journal";
  userId: string;
  userName: string;
  userEmail: string;
  itemTitle: string;
  amount: number;
  currency: string;
  status: "paid" | "awaiting_verification" | "unpaid";
  recordedAt: string | null; // when admin approved — the only date that counts toward "recorded revenue"
  submittedAt: string | null;
  verifiedByName: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-500/10 text-green-700 border-green-200",
  awaiting_verification: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  unpaid: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Approved & Recorded",
  awaiting_verification: "Pending Verification",
  unpaid: "Not Recorded",
};

function toCsv(rows: PaymentRecord[]): string {
  const headers = ["Date", "Type", "User", "Email", "Item", "Amount", "Currency", "Status", "Verified By"];
  const lines = rows.map((r) =>
    [
      r.recordedAt || r.submittedAt || "",
      r.type,
      r.userName,
      r.userEmail,
      r.itemTitle,
      r.amount,
      r.currency,
      STATUS_LABELS[r.status] || r.status,
      r.verifiedByName || "",
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

function downloadCsv(filename: string, rows: PaymentRecord[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminPaymentReports() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [userReportTarget, setUserReportTarget] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [invoiceData, journalData]: [any, any] = await Promise.all([
        membershipApi.getAllInvoices({ limit: "2000" }),
        journalApi.adminList({ limit: "2000" }),
      ]);

      const invoices = invoiceData?.invoices || invoiceData?.items || invoiceData || [];
      const membershipRecords: PaymentRecord[] = invoices
        // Only show invoices that represent a real membership payment attempt
        .filter((inv: any) => inv.user)
        .map((inv: any) => {
          const userId = String(inv.user?._id || inv.user?.id || inv.user || "");
          const status: PaymentRecord["status"] =
            inv.status === "paid" ? "paid" : inv.status === "refunded" ? "unpaid" : "awaiting_verification";
          return {
            id: `membership_${inv._id || inv.id}`,
            type: "membership",
            userId,
            userName: inv.user?.fullName || "Unknown",
            userEmail: inv.user?.email || "",
            itemTitle: inv.membership?.plan?.name
              ? `${inv.membership.plan.name} Membership`
              : "Membership",
            amount: Number(inv.amount) || 0,
            currency: inv.currency || "INR",
            status,
            recordedAt: inv.status === "paid" ? (inv.paidAt || inv.updatedAt || null) : null,
            submittedAt: inv.createdAt || null,
            verifiedByName: null,
          };
        });

      const journals = journalData?.items || journalData || [];
      const journalRecords: PaymentRecord[] = journals
        // Only journals where the author actually attempted to pay (has proof or a non-default status)
        .filter((j: any) => j.paymentProofUrl || (j.paymentStatus && j.paymentStatus !== "unpaid"))
        .map((j: any) => ({
          id: `journal_${j._id || j.id}`,
          type: "journal",
          userId: String(j.authorUser?._id || j.authorUser?.id || j.authorUser || ""),
          userName: j.authorUser?.fullName || j.originalAuthorName || "Unknown",
          userEmail: j.authorUser?.email || "",
          itemTitle: j.title || "Journal Submission",
          amount: Number(j.paymentAmount) || 0,
          currency: "INR",
          status: (j.paymentStatus === "paid" ? "paid" : j.paymentStatus === "awaiting_verification" ? "awaiting_verification" : "unpaid") as PaymentRecord["status"],
          recordedAt: j.paymentStatus === "paid" ? (j.paymentVerifiedAt || null) : null,
          submittedAt: j.createdAt || null,
          verifiedByName: j.paymentVerifiedBy?.fullName || j.paymentVerifiedBy?.email || null,
        }));

      const merged = [...membershipRecords, ...journalRecords].sort((a, b) => {
        const da = new Date(a.submittedAt || 0).getTime();
        const db_ = new Date(b.submittedAt || 0).getTime();
        return db_ - da;
      });
      setRecords(merged);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load payment report");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchType = typeFilter === "all" || r.type === typeFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.itemTitle.toLowerCase().includes(q);
      return matchType && matchStatus && matchSearch;
    });
  }, [records, typeFilter, statusFilter, search]);

  // "Recorded" = only payments an admin has actually approved. Pending/unpaid
  // never contribute here, no matter how many records exist.
  const totals = useMemo(() => {
    const recorded = records.filter((r) => r.status === "paid");
    const pending = records.filter((r) => r.status === "awaiting_verification");
    return {
      recordedTotal: recorded.reduce((sum, r) => sum + r.amount, 0),
      recordedCount: recorded.length,
      pendingTotal: pending.reduce((sum, r) => sum + r.amount, 0),
      pendingCount: pending.length,
      membershipRecordedTotal: recorded.filter((r) => r.type === "membership").reduce((sum, r) => sum + r.amount, 0),
      journalRecordedTotal: recorded.filter((r) => r.type === "journal").reduce((sum, r) => sum + r.amount, 0),
    };
  }, [records]);

  // Unique users who have at least one payment record, for the individual user report search
  const usersWithPayments = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    records.forEach((r) => {
      if (r.userId && !map.has(r.userId)) {
        map.set(r.userId, { id: r.userId, name: r.userName, email: r.userEmail });
      }
    });
    return Array.from(map.values());
  }, [records]);

  const userReportRecords = useMemo(() => {
    if (!userReportTarget) return [];
    return records
      .filter((r) => r.userId === userReportTarget.id)
      .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  }, [records, userReportTarget]);

  const userReportTotal = useMemo(
    () => userReportRecords.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amount, 0),
    [userReportRecords]
  );

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
          <FileBarChart className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Payment Reports</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => downloadCsv(`payment-report-${new Date().toISOString().slice(0, 10)}.csv`, filtered)}
            disabled={filtered.length === 0}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Download Report (CSV)
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Only payments an admin has explicitly approved count toward "Recorded Revenue" below — pending or unapproved
        submissions are listed for visibility but excluded from the totals until verified.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border p-5 bg-green-50 dark:bg-green-950/20 flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-2xl font-bold">₹{totals.recordedTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Recorded Revenue ({totals.recordedCount})</p>
          </div>
        </div>
        <div className="rounded-xl border p-5 bg-yellow-50 dark:bg-yellow-950/20 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-2xl font-bold">₹{totals.pendingTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Pending, Not Recorded ({totals.pendingCount})</p>
          </div>
        </div>
        <div className="rounded-xl border p-5 bg-blue-50 dark:bg-blue-950/20 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-2xl font-bold">₹{totals.membershipRecordedTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Membership Revenue</p>
          </div>
        </div>
        <div className="rounded-xl border p-5 bg-violet-50 dark:bg-violet-950/20 flex items-center gap-3">
          <FileText className="h-5 w-5 text-violet-600" />
          <div>
            <p className="text-2xl font-bold">₹{totals.journalRecordedTotal.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Journal Submission Revenue</p>
          </div>
        </div>
      </div>

      {/* Individual user report search */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Individual User Report</p>
        </div>
        <p className="text-xs text-muted-foreground">Search a user who has made a payment to see their full payment history and total amount paid.</p>
        <Select onValueChange={(id) => {
          const u = usersWithPayments.find((x) => x.id === id);
          if (u) setUserReportTarget(u);
        }}>
          <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Select a user..." /></SelectTrigger>
          <SelectContent>
            {usersWithPayments.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search user or item..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="membership">Membership</SelectItem>
            <SelectItem value="journal">Journal Submission</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="paid">Approved & Recorded</SelectItem>
            <SelectItem value="awaiting_verification">Pending Verification</SelectItem>
            <SelectItem value="unpaid">Not Recorded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 font-medium text-muted-foreground">User</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Item</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
              <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground hidden xl:table-cell">Verified By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">No payment records found.</td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-4 text-xs text-muted-foreground">
                  {(r.recordedAt || r.submittedAt) ? new Date(r.recordedAt || r.submittedAt!).toLocaleDateString() : "—"}
                </td>
                <td className="p-4">
                  <button
                    className="text-left hover:text-primary transition-colors"
                    onClick={() => setUserReportTarget({ id: r.userId, name: r.userName, email: r.userEmail })}
                  >
                    <p className="font-medium text-xs">{r.userName}</p>
                    <p className="text-[11px] text-muted-foreground">{r.userEmail}</p>
                  </button>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.type === "membership" ? <CreditCard className="h-3 w-3 mr-1 inline" /> : <FileText className="h-3 w-3 mr-1 inline" />}
                    {r.type}
                  </Badge>
                </td>
                <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground max-w-[220px] truncate">{r.itemTitle}</td>
                <td className="p-4 text-xs font-semibold">₹{r.amount.toFixed(2)}</td>
                <td className="p-4">
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[r.status]}`}>
                    {r.status === "paid" && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                    {r.status === "awaiting_verification" && <Clock className="h-3 w-3 mr-1 inline" />}
                    {r.status === "unpaid" && <XCircle className="h-3 w-3 mr-1 inline" />}
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </td>
                <td className="p-4 hidden xl:table-cell text-xs text-muted-foreground">{r.verifiedByName || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── Individual User Report Modal ─── */}
      <Dialog open={!!userReportTarget} onOpenChange={(o) => { if (!o) setUserReportTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{userReportTarget?.name}'s Payment History</DialogTitle>
          </DialogHeader>
          {userReportTarget && (
            <div className="space-y-5 py-2">
              <p className="text-xs text-muted-foreground">{userReportTarget.email}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4 bg-green-50 dark:bg-green-950/20">
                  <p className="text-2xl font-bold">₹{userReportTotal.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Approved & Recorded</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-2xl font-bold">{userReportRecords.length}</p>
                  <p className="text-xs text-muted-foreground">Total Payment Records</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full History</p>
                {userReportRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No payment records for this user.</p>
                ) : (
                  <div className="space-y-2">
                    {userReportRecords.map((r) => (
                      <div key={r.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{r.itemTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.type === "membership" ? "Membership" : "Journal Submission"} ·{" "}
                            {(r.recordedAt || r.submittedAt) ? new Date(r.recordedAt || r.submittedAt!).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">₹{r.amount.toFixed(2)}</p>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[r.status]}`}>
                            {STATUS_LABELS[r.status]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => downloadCsv(`${userReportTarget.name.replace(/\s+/g, "-")}-payment-history.csv`, userReportRecords)}
              >
                <Download className="h-3.5 w-3.5" /> Download This User's History (CSV)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
