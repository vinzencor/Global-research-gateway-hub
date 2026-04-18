import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase, UserRole, UserProfile, UserWithRoles } from "@/lib/supabase";

interface AuthContextType {
  user: UserWithRoles | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, institution?: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function resolveMembershipStatus(userId: string, roles: UserRole[]): Promise<string | null> {
    const approvedStatuses = ["active", "renewal_due", "approved"];

    const { data: approvedMembership } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", userId)
      .in("status", approvedStatuses)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (approvedMembership?.status) {
      return approvedMembership.status;
    }

    const { data: memberships } = await supabase
      .from("memberships")
      .select("status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestStatus = ((memberships || []) as Array<{ status?: string | null }>)[0]?.status || null;

    // If a paid membership invoice exists, treat the account as approved to avoid stale pending loops.
    if (latestStatus === "pending_verification" || latestStatus === "pending") {
      const { data: paidMembershipInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "paid")
        .not("membership_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (paidMembershipInvoice?.id) {
        return "active";
      }
    }

    if (roles.includes("member") || roles.includes("subscriber")) {
      return "active";
    }

    return latestStatus;
  }

  async function fetchUserData(supabaseUser: User): Promise<UserWithRoles> {
    // Fetch profile and roles independently so one failure doesn't block the other
    let profile: UserProfile | null = null;
    let roles: UserRole[] = [];

    try {
      const profileResult = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .maybeSingle(); // maybeSingle() won't error if no row found (unlike single())
      profile = (profileResult.data as UserProfile) || null;
    } catch { /* profile stays null */ }

    let membershipStatus: string | null = null;

    try {
      const rolesResult = await supabase
        .from("user_roles")
        .select("role_id, roles!inner(name)")
        .eq("user_id", supabaseUser.id);
      roles = ((rolesResult.data || []) as any[])
        .map((r: any) => r.roles?.name as UserRole)
        .filter(Boolean);
    } catch { /* roles stays [] */ }

    try {
      membershipStatus = await resolveMembershipStatus(supabaseUser.id, roles);
    } catch { /* status stays null */ }

    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      profile,
      roles,
      membershipStatus,
    };
  }

  async function refreshUser() {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const userData = await fetchUserData(supabaseUser);
      setUser(userData);
    }
  }

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION on mount,
    // so we do NOT call getSession() separately — that causes the
    // "Lock broken by another request" AbortError.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        // Defer DB calls with setTimeout so the auth lock is released first.
        // Without this, concurrent Supabase requests inside the callback
        // steal each other's navigator.locks entries → AbortError.
        const authUser = session.user;
        setTimeout(async () => {
          try {
            const userData = await fetchUserData(authUser);
            setUser(userData);
          } catch {
            setUser(null);
          } finally {
            setLoading(false);
          }
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signUp(email: string, password: string, fullName: string, institution?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, institution },
      },
    });
    return { data, error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

