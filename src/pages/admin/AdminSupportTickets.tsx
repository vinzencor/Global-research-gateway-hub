import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supportTicketApi } from "@/lib/api";
import { toast } from "sonner";
import { HelpCircle, Mail } from "lucide-react";

const categoryLabels: Record<string, string> = {
  general: "General Enquiry",
  membership: "Membership Support",
  digital_library: "Digital Library Support",
  technical: "Technical Issue",
  other: "Other",
};

const statusStyles: Record<string, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  in_progress: "bg-info/10 text-info border-info/20",
  resolved: "bg-success/10 text-success border-success/20",
};

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res: any = await supportTicketApi.adminList(
        statusFilter !== "all" ? { status: statusFilter } : undefined
      );
      const items = res?.items || res || [];
      setTickets(items);
    } catch {
      toast.error("Failed to load support tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    try {
      await supportTicketApi.adminUpdate(id, { status, adminNote: noteDrafts[id] });
      toast.success("Ticket updated.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update ticket.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-2xl font-bold">Support Tickets</h2>
          <p className="text-sm text-muted-foreground mt-1">Issues and questions submitted via the public Support page.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground">
          <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          No support tickets found.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t._id || t.id} className="rounded-xl border bg-card p-6 card-shadow space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-bold">{t.subject}</h3>
                    <Badge variant="outline" className={statusStyles[t.status] || ""}>{t.status}</Badge>
                    <Badge variant="secondary">{categoryLabels[t.category] || t.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {t.name} · {t.email}
                    {" · "}{new Date(t.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{t.description}</p>
              <div className="space-y-2 pt-2 border-t">
                <Textarea
                  placeholder="Add an internal note (optional)..."
                  rows={2}
                  defaultValue={t.adminNote || ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [t._id || t.id]: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  {t.status !== "in_progress" && (
                    <Button size="sm" variant="outline" disabled={savingId === (t._id || t.id)} onClick={() => updateStatus(t._id || t.id, "in_progress")}>
                      Mark In Progress
                    </Button>
                  )}
                  {t.status !== "resolved" && (
                    <Button size="sm" disabled={savingId === (t._id || t.id)} onClick={() => updateStatus(t._id || t.id, "resolved")}>
                      Mark Resolved
                    </Button>
                  )}
                  {t.status !== "open" && (
                    <Button size="sm" variant="ghost" disabled={savingId === (t._id || t.id)} onClick={() => updateStatus(t._id || t.id, "open")}>
                      Reopen
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
