import { Bell, BookOpen, CreditCard, FileText, LayoutDashboard, PenSquare, ShieldCheck, User } from "lucide-react";
import { isAdmin, isReviewer, UserRole } from "@/contexts/AuthContext";

export type PortalNavItem = {
  label: string;
  to: string;
  icon: JSX.Element;
  moduleKey?: string;
};

export type SubAdminNavItem = {
  label: string;
  to: string;
  icon: JSX.Element;
  moduleKey: string;
};

const MODULE_ALIASES: Record<string, string[]> = {};

const REGISTERED_USER_ALLOWED_DEFAULT = new Set([
  "portal_dashboard",
  "portal_profile",
  "portal_submit",
  "portal_submissions",
  "portal_membership",
  "portal_library",
]);

function withRegisteredFallback(roles: UserRole[] = [], moduleAccess: Record<string, boolean> = {}) {
  const hasAnyAccessRows = Object.keys(moduleAccess || {}).length > 0;
  if (hasAnyAccessRows) return moduleAccess;

  const defaultAccess: Record<string, boolean> = {
    portal_dashboard: true,
    portal_profile: true,
    portal_submit: true,
    portal_submissions: true,
    portal_membership: true,
    portal_library: true,
  };

  if (roles.includes("sub_admin")) {
    return {
      ...defaultAccess,
      subadmin_dashboard: true,
      subadmin_review_queue: true,
      subadmin_history: true,
      subadmin_reports: true,
      subadmin_settings: true,
    } as Record<string, boolean>;
  }

  if (roles.includes("reviewer")) {
    return {
      ...defaultAccess,
      subadmin_dashboard: true,
      subadmin_review_queue: true,
      subadmin_history: true,
      subadmin_reports: true,
      subadmin_settings: true,
    } as Record<string, boolean>;
  }

  if (!roles.includes("registered_user")) return moduleAccess;

  return {
    ...defaultAccess,
    dashboard: false,
    pipeline: false,
    analytics: false,
    workflow: false,
    sub_admins: false,
    content: false,
    reviews: false,
    people: false,
    library: false,
    users: false,
    roles: false,
    validate_users: false,
    billing: false,
  } as Record<string, boolean>;
}

export function isModuleAllowed(moduleKey: string | undefined, moduleAccess: Record<string, boolean> = {}) {
  if (!moduleKey) return true;
  const keys = [moduleKey, ...(MODULE_ALIASES[moduleKey] || [])];
  return !keys.some((k) => moduleAccess[k] === false);
}

export const BASE_PORTAL_NAV_ITEMS: PortalNavItem[] = [
  { label: "Dashboard", to: "/portal/dashboard", moduleKey: "portal_dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Profile", to: "/portal/profile", moduleKey: "portal_profile", icon: <User className="h-4 w-4" /> },
  { label: "Submit Journal", to: "/submit-paper", moduleKey: "portal_submit", icon: <PenSquare className="h-4 w-4" /> },
  { label: "My Submissions", to: "/author", moduleKey: "portal_submissions", icon: <FileText className="h-4 w-4" /> },
  { label: "Membership & Billing", to: "/portal/membership", moduleKey: "portal_membership", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Digital Library", to: "/portal/library", moduleKey: "portal_library", icon: <BookOpen className="h-4 w-4" /> },
];

export const BASE_SUBADMIN_NAV_ITEMS: SubAdminNavItem[] = [
  { label: "Dashboard", to: "/sub-admin", moduleKey: "subadmin_dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "My Review Queue", to: "/reviewer/stage", moduleKey: "subadmin_review_queue", icon: <FileText className="h-4 w-4" /> },
  { label: "Review History", to: "/sub-admin/history", moduleKey: "subadmin_history", icon: <Bell className="h-4 w-4" /> },
  { label: "Reports", to: "/sub-admin/report", moduleKey: "subadmin_reports", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Settings", to: "/sub-admin/settings", moduleKey: "subadmin_settings", icon: <User className="h-4 w-4" /> },
];

export function getPortalNavItemsForRoles(roles: UserRole[] = [], moduleAccess: Record<string, boolean> = {}): PortalNavItem[] {
  const effectiveAccess = withRegisteredFallback(roles, moduleAccess);
  const baseItems = BASE_PORTAL_NAV_ITEMS.filter((n) => {
    return isModuleAllowed(n.moduleKey, effectiveAccess);
  });

  const adminItems = isAdmin(roles) ? [{ label: "Admin Console", to: "/admin", icon: <ShieldCheck className="h-4 w-4" /> }] : [];
  
  // Both sub_admin and reviewer should have the Reviewer Portal link in their main portal nav
  const reviewerItems = (roles.includes("sub_admin") || roles.includes("reviewer") || isAdmin(roles)) 
    ? [{ label: "Reviewer Portal", to: "/sub-admin", icon: <Bell className="h-4 w-4" /> }] 
    : [];

  // Filter out the specialized portals from the main sidebar to keep it clean as requested
  return [...baseItems];
}

export function getSubAdminNavItemsForRoles(roles: UserRole[] = [], moduleAccess: Record<string, boolean> = {}): SubAdminNavItem[] {
  if (roles.includes("super_admin")) return BASE_SUBADMIN_NAV_ITEMS;
  const effectiveAccess = withRegisteredFallback(roles, moduleAccess);
  return BASE_SUBADMIN_NAV_ITEMS.filter((n) => isModuleAllowed(n.moduleKey, effectiveAccess));
}

export function getEffectiveModuleAccess(roles: UserRole[] = [], moduleAccess: Record<string, boolean> = {}) {
  return withRegisteredFallback(roles, moduleAccess);
}
