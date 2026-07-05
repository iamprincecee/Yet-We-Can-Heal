import { createClient } from "@/lib/supabase/server";

export type AdminRole = "editor" | "super_admin";

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
// explicitly added as Editor or Super Admin. Optionally requires super_admin.
//
// Returns either { ctx } on success or { error, status } to return directly.
export async function requireAdmin(
  options: { superAdmin?: boolean } = {}
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

  if (options.superAdmin && profile.role !== "super_admin") {
    return { error: "Only Super Admins can perform this action.", status: 403 };
  }

  return {
    ctx: {
      userId: user.id,
      email: user.email ?? "",
      role: profile.role as AdminRole,
    },
  };
}
