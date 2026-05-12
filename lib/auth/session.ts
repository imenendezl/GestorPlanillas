import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEV_ADMIN_COOKIE = "dev-admin-user-id";

export async function getRequestUserContext() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    return {
      userId: data.user.id,
      db: supabase,
      isDevBypass: false
    };
  }

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const cookieStore = await cookies();
  const devAdminUserId = cookieStore.get(DEV_ADMIN_COOKIE)?.value;
  const adminClient = createAdminClient();

  if (!devAdminUserId || !adminClient) {
    return null;
  }

  const { data: profile } = await adminClient
    .from("users")
    .select("id, role, email")
    .eq("id", devAdminUserId)
    .eq("role", "Admin")
    .maybeSingle();

  if (!profile?.id) {
    return null;
  }

  return {
    userId: profile.id,
    db: adminClient,
    isDevBypass: true
  };
}

export { DEV_ADMIN_COOKIE };
