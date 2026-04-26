import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { authApi, tokenStorage } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserRole =
  | "visitor"
  | "registered_user"
  | "member"
  | "subscriber"
  | "author"
  | "reviewer"
  | "sub_admin"
  | "editor"
  | "content_admin"
  | "super_admin";

export interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  institution: string;
  bio: string;
  photoUrl: string;
  socialLinks: Record<string, string>;
  roles: UserRole[];
  moduleAccess: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
}

export interface UserWithRoles extends UserProfile {
  membershipStatus: string | null;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────
export const isAdmin = (roles: UserRole[]) =>
  roles.some((r) => ["super_admin", "content_admin", "editor"].includes(r));
export const isSuperAdmin = (roles: UserRole[]) => roles.includes("super_admin");
export const isSubAdmin = (roles: UserRole[]) => roles.includes("sub_admin") || isAdmin(roles);
export const isReviewer = (roles: UserRole[]) => roles.includes("reviewer") || isAdmin(roles);
export const isAuthor = (roles: UserRole[]) => roles.includes("author") || isAdmin(roles);
export const isMember = (roles: UserRole[]) =>
  roles.some((r) => ["member", "subscriber"].includes(r)) || isAdmin(roles);
export const isSubscriber = (roles: UserRole[]) => roles.includes("subscriber");


// ─── Context type ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: UserWithRoles | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, institution?: string) => Promise<{ data: unknown; error: Error | null }>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = (await authApi.getMe()) as {
        user: UserProfile;
        membership: { status: string } | null;
      };
      setUser({ ...data.user, membershipStatus: data.membership?.status ?? null });
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handleLogout = () => setUser(null);
    window.addEventListener("grgh:logout", handleLogout);
    return () => window.removeEventListener("grgh:logout", handleLogout);
  }, [loadUser]);

  async function signIn(email: string, password: string) {
    try {
      const data = (await authApi.login(email, password)) as {
        accessToken: string;
        refreshToken: string;
        user: UserProfile;
        membership: { status: string } | null;
      };
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      setUser({ ...data.user, membershipStatus: data.membership?.status ?? null });
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }

  async function signUp(email: string, password: string, fullName: string, institution?: string) {
    try {
      const data = await authApi.register({ email, password, fullName, institution });
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  function signOut() {
    tokenStorage.clear();
    setUser(null);
  }

  async function refreshUser() {
    await loadUser();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

