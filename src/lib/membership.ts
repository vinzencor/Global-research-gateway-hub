import { supabase } from "@/lib/supabase";

export type MembershipState = "active" | "renewal_due" | "expired" | "cancelled" | "suspended" | "pending_verification";

function deriveStatus(endsAt: string): MembershipState {
  const now = Date.now();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return "active";
  if (end <= now) return "expired";

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (end - now <= sevenDaysMs) return "renewal_due";
  return "active";
}

export async function reconcileMembershipStatuses(userId?: string): Promise<void> {
  let query = supabase
    .from("memberships")
    .select("id, status, ends_at")
    .in("status", ["active", "renewal_due"]);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return;

  await Promise.all(
    data
      .filter((m: any) => m.ends_at)
      .map(async (m: any) => {
        const next = deriveStatus(m.ends_at);
        if (next !== m.status) {
          await supabase.from("memberships").update({ status: next }).eq("id", m.id);
        }
      }),
  );
}

export async function ensureUserRole(userId: string, roleName: string): Promise<void> {
  const { data: roleData } = await supabase.from("roles").select("id").eq("name", roleName).maybeSingle();
  if (!roleData?.id) return;
  // Idempotent role assignment: avoid duplicate-key failures on repeated calls.
  await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role_id: roleData.id } as any, { onConflict: "user_id,role_id" });
}

export async function removeUserRoles(userId: string, roleNames: string[]): Promise<void> {
  if (roleNames.length === 0) return;
  const { data: roleRows } = await supabase.from("roles").select("id").in("name", roleNames);
  const roleIds = (roleRows || []).map((r: any) => r.id).filter(Boolean);
  if (roleIds.length === 0) return;
  await supabase.from("user_roles").delete().eq("user_id", userId).in("role_id", roleIds);
}
