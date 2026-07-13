import { createClient } from "@/lib/supabase/server";

export type AdminRole = "editor" | "chief_editor" | "super_admin";

export type AdminContext = {
  userId: string;
  email: string;
  role: AdminRole;
};

// Authenticates the current request as an admin.
//
// Uses supabase.auth.getUser() -- NOT getSession() -- because getUser()
// re-validates the token against Supabase's auth server, while getSession()
// only reads it from the cookie without verifying it. On the server, always
// verify. See: https://supabase.com/docs/guides/auth/server-side
//
// Then confirms the authenticated user actually has an admin_profiles row,
// so a valid Supabase login alone is never enough -- they must have been
// explicitly added. Options can require a minimum role:
//   - superAdmin: true  -> only super_admin
//   - publisher: true   -> chief_editor or super_admin (final approval, sending
//                          message replies, acting on reports)
//
// Returns either { ctx } on success or { error, status } to return directly.
export async function requireAdmin(
  options: { superAdmin?: boolean; publisher?: boolean } = {}
): Promise<
  | { ctx: AdminContext; error?: undefined; status?: undefined }
  | { ctx?: undefined; error: string; status: number }
> {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not signed in.", status: 401 };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Not authorized.", status: 403 };
  }

  const role = profile.role as AdminRole;

  if (options.superAdmin && role !== "super_admin") {
    return { error: "Only Super Admins can perform this action.", status: 403 };
  }

  if (options.publisher && role !== "super_admin" && role !== "chief_editor") {
    return {
      error: "Only Chief Editors or Super Admins can perform this action.",
      status: 403,
    };
  }

  return {
    ctx: {
      userId: user.id,
      email: user.email ?? "",
      role,
    },
  };
}
