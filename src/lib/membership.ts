// Membership helpers for the frontend.
// Server-side reconciliation is handled by the Node.js backend.

export type MembershipState =
  | "active"
  | "renewal_due"
  | "expired"
  | "cancelled"
  | "suspended"
  | "pending_verification";

export function deriveStatus(endsAt: string): MembershipState {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return "active";
  if (end <= now) return "expired";
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (end - now <= sevenDaysMs) return "renewal_due";
  return "active";
}

// These functions now delegate to the backend API.
// Import membershipApi from "@/lib/api" directly in your components.
export async function reconcileMembershipStatuses(_userId?: string): Promise<void> {
  // No-op on frontend – handled server-side on GET /api/memberships/my
}

export async function ensureUserRole(_userId: string, _roleName: string): Promise<void> {
  // Use usersApi.addRole() from "@/lib/api" instead
}

export async function removeUserRoles(_userId: string, _roleNames: string[]): Promise<void> {
  // Use usersApi.removeRole() from "@/lib/api" instead
}

