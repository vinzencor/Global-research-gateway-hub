import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sdnyrvlnbbybhmnysvqz.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbnlydmxuYmJ5YmhtbnlzdnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2MjA4ODcsImV4cCI6MjA5MTE5Njg4N30.OFqQyxsYhtiGXSYAXDiKO7AL44UBOx_LOqMBe57oPxI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  id: string;
  full_name: string | null;
  institution: string | null;
  bio: string | null;
  photo_url: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface UserWithRoles {
  id: string;
  email: string | undefined;
  profile: UserProfile | null;
  roles: UserRole[];
  membershipStatus: string | null;
}

export function isAdmin(roles: UserRole[]): boolean {
  return roles.includes("super_admin") || roles.includes("content_admin") || roles.includes("editor");
}

export function isReviewer(roles: UserRole[]): boolean {
  return roles.includes("reviewer") || isAdmin(roles);
}

export function isAuthor(roles: UserRole[]): boolean {
  return roles.includes("author") || isAdmin(roles);
}

export function isMember(roles: UserRole[]): boolean {
  return roles.includes("member") || isAdmin(roles);
}

export function isSubscriber(roles: UserRole[]): boolean {
  return roles.includes("subscriber") || isAdmin(roles);
}

export function isSuperAdmin(roles: UserRole[]): boolean {
  return roles.includes("super_admin");
}

export function isSubAdmin(roles: UserRole[]): boolean {
  return roles.includes("sub_admin");
}

