export const PREDEFINED_ROLES = [
  "registered_user",
  "member",
  "subscriber",
  "author",
  "reviewer",
  "sub_admin",
  "editor",
  "content_admin",
  "super_admin",
] as const;

export type PredefinedRole = (typeof PREDEFINED_ROLES)[number];
