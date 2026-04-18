import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ChevronRight, Check } from "lucide-react";

type Plan = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  billing_period?: string | null;
};

export default function Register() {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [institution, setInstitution] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setPlansLoading(true);

    // Primary path: security-definer RPC, so signup can read active plans even with strict RLS.
    const rpcRes = await supabase.rpc("get_public_membership_plans");
    if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
      setPlans(rpcRes.data as Plan[]);
      setPlansLoading(false);
      return;
    }

    // Fallback path #1: direct select of active plans (works if table policy permits anon select).
    const activeRes = await supabase
      .from("membership_plans")
      .select("id,name,price")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (!activeRes.error && Array.isArray(activeRes.data) && activeRes.data.length > 0) {
      setPlans((activeRes.data as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        description: null,
        billing_period: null,
      })));
      setPlansLoading(false);
      return;
    }

    // Fallback path #2: if is_active column or filter path is unavailable, try reading all plans.
    const anyRes = await supabase
      .from("membership_plans")
      .select("id,name,price")
      .order("price", { ascending: true });

    if (!anyRes.error && Array.isArray(anyRes.data) && anyRes.data.length > 0) {
      setPlans((anyRes.data as any[]).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        description: null,
        billing_period: null,
      })));
      setPlansLoading(false);
      return;
    }

    setPlans([]);
    toast.error("Could not load membership plans. Please contact support.");
    setPlansLoading(false);
  }

  async function handleRegisterStep1(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) { toast.error("Please fill in all required fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (plansLoading) { toast.error("Plans are still loading. Please wait a moment."); return; }
    if (plans.length === 0) { toast.error("No active plans available. Contact support."); return; }
    if (!selectedPlanId) { toast.error("Please select a membership plan"); return; }
    if (!file) { toast.error("Please upload the payment screenshot"); return; }

    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    if (!selectedPlan) { toast.error("Selected plan is invalid. Please re-select your plan."); return; }

    setLoading(true);
    try {
      // 1. SignUp
      const { data, error: signUpError } = await signUp(email, password, fullName, institution);
      if (signUpError) throw signUpError;
      
      const userId = data.user?.id;
      if (!userId) throw new Error("Could not retrieve user ID");

      // 2. Upload Screenshot
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `verifications/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, file);

      if (uploadError) {
          throw new Error("Screenshot upload failed: " + uploadError.message);
      }

      // 3. Create Membership Record (Pending Verification)
      const membershipPayloadBase = {
        user_id: userId,
        plan_id: selectedPlanId,
        screenshot_url: filePath,
        starts_at: new Date().toISOString(),
      };

      const firstTry = await supabase.from("memberships").insert({
        ...membershipPayloadBase,
        status: "pending_verification",
      } as any);

      let memError = firstTry.error;
      if (memError && String(memError.code || "") === "23514") {
        // Backward-compatibility for projects where memberships_status_check still allows `pending` only.
        const secondTry = await supabase.from("memberships").insert({
          ...membershipPayloadBase,
          status: "pending",
        } as any);
        memError = secondTry.error;
      }

      if (memError) throw memError;

      toast.success(`Account created and payment submitted for ${selectedPlan.name} ($${selectedPlan.price}).`);
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-8">
            <img src="/Logo.png" alt="KnowledgeHub" className="h-20 w-auto mx-auto object-contain" />
          </Link>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Join the Hub</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
            Step {step} of 2: {step === 1 ? "Personal Details" : "Membership & Payment"}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-8 card-shadow">
          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleRegisterStep1}>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" placeholder="Dr. Jane Smith" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input id="institution" placeholder="MIT, Stanford, etc." value={institution} onChange={e => setInstitution(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl">
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Select Membership Plan *</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose your plan" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p.name} — ${p.price}</span>
                          <span className="text-xs text-muted-foreground">{p.description || `${p.billing_period} billing`}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {plansLoading && <p className="text-xs text-muted-foreground">Loading plans...</p>}
                {!plansLoading && plans.length === 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-destructive">No active plans found. Please contact support.</p>
                    <Button type="button" variant="outline" size="sm" onClick={loadPlans}>Retry</Button>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <p className="text-xs font-bold text-primary uppercase tracking-widest">Payment Instructions</p>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Please transfer the amount for your selected plan to our official bank account and upload the screenshot below.
                </p>
                <div className="text-xs space-y-1 font-medium bg-white/50 p-2 rounded-lg border">
                  <p>Bank: [Global Trust Bank]</p>
                  <p>Account: [0000 1111 2222 3333]</p>
                  <p>IFSC: [GTB0001234]</p>
                  <p>UPI: [hub@upi]</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Screenshot *</Label>
                <div className="relative border-2 border-dashed rounded-xl p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-primary font-bold">
                      <Check className="h-5 w-5" /> {file.name}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
                      <p className="text-sm font-medium">Click or drag to upload screenshot</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG or PDF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" className="flex-[2] h-12 text-base font-bold rounded-xl" disabled={loading}>
                  {loading ? "Processing..." : "Finish Registration"}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

