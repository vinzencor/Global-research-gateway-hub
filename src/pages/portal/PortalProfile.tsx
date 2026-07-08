import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Save, PenSquare, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi, supportApi, roleRequestApi } from "@/lib/api";
import { getPortalNavItemsForRoles } from "@/lib/portalNav";
import { toast } from "sonner";

const REQUESTABLE_ROLES = [
  { value: "author", label: "Author" },
  { value: "reviewer", label: "Reviewer" },
  { value: "subscriber", label: "Subscriber" },
];

export default function PortalProfile() {
  const { user, refreshUser } = useAuth();
  const navItems = getPortalNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailChangeReason, setEmailChangeReason] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submittingEmailChange, setSubmittingEmailChange] = useState(false);
  const [myRoleRequests, setMyRoleRequests] = useState<any[]>([]);
  const [requestedRole, setRequestedRole] = useState("");
  const [roleRequestNote, setRoleRequestNote] = useState("");
  const [submittingRoleRequest, setSubmittingRoleRequest] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setInstitution(user.institution || "");
    setBio(user.bio || "");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    roleRequestApi.getMyRequests().then((data: any) => {
      setMyRoleRequests(Array.isArray(data) ? data : data?.items || []);
    }).catch(() => setMyRoleRequests([]));
  }, [user]);

  const availableRoles = REQUESTABLE_ROLES.filter(r => !user?.roles?.includes(r.value as any));
  const pendingRoleRequest = myRoleRequests.find(r => r.status === "pending");

  async function handleRoleRequestSubmit() {
    if (!requestedRole) {
      toast.error("Please choose a role to request.");
      return;
    }
    setSubmittingRoleRequest(true);
    try {
      await roleRequestApi.create(requestedRole, roleRequestNote.trim() || undefined);
      toast.success("Role request submitted for admin review.");
      setRequestedRole("");
      setRoleRequestNote("");
      const data: any = await roleRequestApi.getMyRequests();
      setMyRoleRequests(Array.isArray(data) ? data : data?.items || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit role request.");
    } finally {
      setSubmittingRoleRequest(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaving(false);
    try {
      await usersApi.updateProfile({
        fullName,
        institution,
        bio,
      });
    } catch {
      toast.error("Failed to save profile");
      return;
    }
    await refreshUser();
    toast.success("Profile updated successfully!");
  }

  async function handleEmailChangeRequest() {
    if (!newEmail.trim() || !emailChangeReason.trim() || !currentPassword) {
      toast.error("Please fill in the new email, reason, and your current password.");
      return;
    }
    setSubmittingEmailChange(true);
    try {
      await supportApi.createRequest({
        requestedEmail: newEmail.trim(),
        reason: emailChangeReason.trim(),
        currentPassword,
      });
      toast.success("Email change request submitted. An admin will review it and email your new credentials.");
      setShowEmailChange(false);
      setNewEmail("");
      setEmailChangeReason("");
      setCurrentPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit email change request.");
    } finally {
      setSubmittingEmailChange(false);
    }
  }

  return (
    <DashboardLayout navItems={navItems} title="My Profile">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">My Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar / Info card */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground text-3xl font-bold">
              {fullName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">{fullName || user?.email}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {user?.roles?.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs">{role.replace("_", " ")}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{fullName || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Institution</span><span className="font-medium">{institution || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium text-xs">{user?.email}</span></div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-4">Edit Profile</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Email cannot be edited directly.</p>
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowEmailChange(true)}>
                  Request email change
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution / Organization</Label>
              <Input id="institution" value={institution} onChange={e => setInstitution(e.target.value)} placeholder="MIT, Stanford, etc." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your research interests..." rows={4} />
            </div>
            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        </div>

        {/* Request an Additional Role */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <h3 className="font-heading font-bold mb-1">Request an Additional Role</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Request access to another part of the platform. An admin will review and approve it before it's added to your account.
          </p>
          {pendingRoleRequest ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 capitalize">
                {pendingRoleRequest.requestedRole} request pending
              </Badge>
            </div>
          ) : availableRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">You already have every requestable role.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="space-y-2 w-full sm:w-56">
                <Label htmlFor="requestedRole">Role</Label>
                <Select value={requestedRole} onValueChange={setRequestedRole}>
                  <SelectTrigger id="requestedRole"><SelectValue placeholder="Choose a role" /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1 w-full">
                <Label htmlFor="roleRequestNote">Note (optional)</Label>
                <Input id="roleRequestNote" value={roleRequestNote} onChange={e => setRoleRequestNote(e.target.value)} placeholder="Why do you need this role?" />
              </div>
              <Button onClick={handleRoleRequestSubmit} disabled={submittingRoleRequest}>
                {submittingRoleRequest ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          )}
          {myRoleRequests.filter(r => r.status !== "pending").length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {myRoleRequests.filter(r => r.status !== "pending").slice(0, 3).map((r) => (
                <div key={r._id} className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className={`capitalize ${r.status === "approved" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                    {r.requestedRole}: {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showEmailChange} onOpenChange={(open) => { setShowEmailChange(open); if (!open) { setNewEmail(""); setEmailChangeReason(""); setCurrentPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-4 w-4" /> Request Email Change</DialogTitle>
            <DialogDescription>
              An admin will review this request and email your new login details once approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new-email@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailChangeReason">Reason</Label>
              <Textarea id="emailChangeReason" value={emailChangeReason} onChange={(e) => setEmailChangeReason(e.target.value)} placeholder="Why do you need this change?" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Confirm Current Password</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailChange(false)}>Cancel</Button>
            <Button onClick={handleEmailChangeRequest} disabled={submittingEmailChange}>
              {submittingEmailChange ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}


