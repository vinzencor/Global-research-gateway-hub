import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) { toast.error("Please fill in all required fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, institution);
    setLoading(false);
    if (error) { toast.error(error.message || "Registration failed"); return; }
    toast.success("Account created! Please check your email to verify your account, then sign in.");
    navigate("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">KH</span>
            </div>
            <span className="font-heading text-xl font-bold">KnowledgeHub</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold">Create Your Account</h1>
          <p className="text-muted-foreground text-sm mt-1">Register to save items, manage your profile, purchase membership, access entitled content, and engage more fully with the platform.</p>
        </div>

        <div className="rounded-xl border bg-card p-8 card-shadow">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
              <Input id="name" placeholder="Dr. Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
              <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" placeholder="MIT, Stanford, etc." value={institution} onChange={e => setInstitution(e.target.value)} />
            </div>
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            Creating an account gives you access to your personal dashboard, billing records, saved content, and more.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
