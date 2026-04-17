import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, User, CreditCard, BookOpen, Save, PenSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/portal/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", icon: <BookOpen className="h-4 w-4" /> },
];

export default function PortalProfile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || "");
      setInstitution(user.profile.institution || "");
      setBio(user.profile.bio || "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      institution,
      bio,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to save profile"); return; }
    await refreshUser();
    toast.success("Profile updated successfully!");
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
              <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
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
      </div>
    </DashboardLayout>
  );
}

