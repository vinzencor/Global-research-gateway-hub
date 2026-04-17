import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRoles, redirectTo = "/login" }: ProtectedRouteProps) {
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

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      return <Navigate to="/portal/dashboard" replace />;
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

