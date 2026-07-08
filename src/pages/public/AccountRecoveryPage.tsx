import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supportApi } from "@/lib/api";

export default function AccountRecoveryPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setSending(true);
    try {
      await supportApi.createPasswordResetRequest({ currentEmail: email.trim(), reason: reason.trim() || undefined });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err?.message || "Could not submit your request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-indigo-500/5 pt-24 pb-20 flex-1">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10 max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-sm mb-6">
              <KeyRound className="h-4 w-4" />
              Forgot Password
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight mb-4">
              Request a Password Reset
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Submit your registered email below. An administrator will review your request, reset your
              password, and email your new credentials to that address.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-3xl border bg-card p-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Request Submitted</h2>
              <p className="text-muted-foreground">
                An admin will review your request and email your new password to{" "}
                <strong className="text-foreground">{email}</strong> once it's processed.
              </p>
              <Button variant="outline" onClick={() => { setSubmitted(false); setEmail(""); setReason(""); }}>
                Submit another request
              </Button>
            </div>
          ) : (
            <div className="rounded-3xl border bg-card p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Registered Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Textarea
                    id="reason"
                    placeholder="Anything that helps us verify it's you..."
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full rounded-full font-bold" disabled={sending}>
                  {sending ? "Submitting..." : "Submit Request"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Need to change your registered email?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link> and request it from
            your profile.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
