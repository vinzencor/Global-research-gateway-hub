import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message || "Invalid credentials"); return; }
    toast.success("Welcome back!");

    if (from) { navigate(from, { replace: true }); return; }

    // Fetch roles right after sign-in so we can redirect to the right dashboard
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("roles!inner(name)")
          .eq("user_id", userId);
        const roles = (roleRows || []).map((r: any) => r.roles?.name as string);
        if (roles.includes("super_admin") || roles.includes("content_admin") || roles.includes("editor")) {
          navigate("/admin", { replace: true }); return;
        }
        if (roles.includes("sub_admin")) {
          navigate("/sub-admin", { replace: true }); return;
        }
      }
    } catch { /* fall through to default */ }
    navigate("/portal/dashboard", { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">KH</span>
            </div>
            <span className="font-heading text-xl font-bold">KnowledgeHub</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in to access your account, membership, saved items, invoices, and digital library experience.</p>
        </div>

        <div className="rounded-xl border bg-card p-8 card-shadow">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to the platform?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">Create an Account</Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground/60">
            Secure login gives you access to your personalized dashboard and account-based features.
          </p>
        </div>
      </div>
    </div>
  );
}
