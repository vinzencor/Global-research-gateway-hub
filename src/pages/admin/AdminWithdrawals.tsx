import { useEffect, useState } from "react";
import { journalApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut, RefreshCw, User, Calendar, MessageSquare } from "lucide-react";

export default function AdminWithdrawals() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data: any = await journalApi.adminList({ status: "withdrawn", limit: "500" });
      const items = data?.items || data || [];
      setJournals(items.filter((j: any) => j.status === "withdrawn"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }

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
          <LogOut className="h-5 w-5 text-primary" />
          <h2 className="font-heading text-xl font-bold">Journal Withdrawals</h2>
          <Badge variant="outline" className="text-xs ml-1">{journals.length} total</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={load} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        These journals were withdrawn by their authors. Their active workflow was stopped immediately and reviewers no longer have access.
      </p>

      {journals.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <LogOut className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No withdrawals yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Journals withdrawn by authors will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {journals.map((j) => {
            const jid = j._id || j.id;
            const author = j.authorUser?.fullName || j.authorUser?.email || j.originalAuthorName || "Unknown Author";
            const withdrawnDate = j.withdrawnAt
              ? new Date(j.withdrawnAt).toLocaleString()
              : j.updatedAt
              ? new Date(j.updatedAt).toLocaleString()
              : "—";
            const submittedDate = j.createdAt ? new Date(j.createdAt).toLocaleDateString() : "—";

            return (
              <div key={jid} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{j.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" /> {author}
                        </span>
                        {j.institution && (
                          <span className="text-xs text-muted-foreground">{j.institution}</span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" /> Originally submitted: {submittedDate}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" /> Withdrawn: {withdrawnDate}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200 shrink-0">
                      Withdrawn
                    </Badge>
                  </div>

                  {j.withdrawalReason && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Withdrawal Reason
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed">{j.withdrawalReason}</p>
                    </div>
                  )}

                  {!j.withdrawalReason && (
                    <p className="mt-3 text-xs text-muted-foreground italic">No reason provided.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
