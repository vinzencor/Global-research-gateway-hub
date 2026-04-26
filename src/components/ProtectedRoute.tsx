import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/contexts/AuthContext";
import { getEffectiveModuleAccess, getPortalNavItemsForRoles, getSubAdminNavItemsForRoles, isModuleAllowed } from "@/lib/portalNav";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredModule?: string;
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRoles, requiredModule, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const normalizedRoles: UserRole[] = user.roles.length > 0 ? user.roles : ["registered_user"];

  const privilegedRoles: UserRole[] = ["super_admin", "content_admin", "editor", "sub_admin", "reviewer"];
  const isPrivileged = normalizedRoles.some((role) => privilegedRoles.includes(role));
  const isPendingMembership = user.membershipStatus === "pending_verification" || user.membershipStatus === "pending";

  // Non-privileged users in pending verification are directed to pending page.
  if (!isPrivileged && isPendingMembership && location.pathname !== "/portal/pending") {
    return <Navigate to="/portal/pending" replace />;
  }

  if (!isPrivileged && !isPendingMembership && location.pathname === "/portal/pending") {
    return <Navigate to="/portal/dashboard" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => normalizedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/portal/dashboard" replace />;
    }
  }

  if (requiredModule) {
    const roleAccess = getEffectiveModuleAccess(normalizedRoles, user.moduleAccess || {});
    if (!isModuleAllowed(requiredModule, roleAccess)) {
      const firstAllowedPortal = getPortalNavItemsForRoles(normalizedRoles, roleAccess);
      const firstAllowedSubAdmin = getSubAdminNavItemsForRoles(normalizedRoles, roleAccess);
      const allowedTargets = [...firstAllowedSubAdmin, ...firstAllowedPortal];
      const fallbackTo =
        allowedTargets.find((n) => n.to.startsWith("/sub-admin") || n.to === "/reviewer/stage")?.to ||
        allowedTargets.find((n) => n.to.startsWith("/portal/") || n.to === "/author" || n.to === "/submit-paper")?.to ||
        "/portal/pending";
      return <Navigate to={fallbackTo} replace />;
    }
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user) {
    // Redirect based on role priority
    if (user.roles.includes("super_admin") || user.roles.includes("content_admin") || user.roles.includes("editor")) {
      return <Navigate to="/admin" replace />;
    }
    if (user.roles.includes("sub_admin")) {
      return <Navigate to="/reviewer/stage" replace />;
    }
    if (user.roles.includes("reviewer")) {
      return <Navigate to="/reviewer" replace />;
    }
    if (user.roles.includes("author")) {
      return <Navigate to="/author" replace />;
    }
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <>{children}</>;
}

