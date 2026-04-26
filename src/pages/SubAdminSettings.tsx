import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/legacyDb";
import { toast } from "sonner";
import { getSubAdminNavItemsForRoles } from "@/lib/portalNav";
import { KeyRound, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SubAdminSettings() {
  const { user } = useAuth();
  const subAdminNavItems = getSubAdminNavItemsForRoles(user?.roles || [], user?.moduleAccess || {});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSaving(true);
    // Re-authenticate with current password first
    const { error: signInError } = await db.auth.signInWithPassword({
      email: user?.email || "",
      password: currentPassword,
    });
    if (signInError) {
      toast.error("Current password is incorrect.");
      setSaving(false);
      return;
    }

    // Update to new password
    const { error } = await db.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error("Failed to update password: " + error.message);
      return;
    }
    toast.success("Password changed successfully!");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <DashboardLayout navItems={subAdminNavItems} title="Settings">
      <div className="space-y-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">

        {/* Account Info */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <div className="flex items-center gap-2 mb-5">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-lg">Account Information</h3>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
              {user?.profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div>
              <p className="font-heading font-bold text-lg">{user?.profile?.full_name || "Sub Admin"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {user?.roles?.map(role => (
                  <Badge key={role} variant="secondary" className="text-xs capitalize">{role.replace(/_/g, " ")}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Full Name</span>
              <span className="font-medium">{user?.profile?.full_name || "â€”"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            {user?.profile?.institution && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Institution</span>
                <span className="font-medium">{user.profile.institution}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-xl border bg-card p-6 card-shadow">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-lg">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </div>

        </div>{/* end grid */}
      </div>
    </DashboardLayout>
  );
}


