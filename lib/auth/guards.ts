import "server-only";

import { getRequestUserContext } from "@/lib/auth/session";
import { AuthError, ForbiddenError, toPublicActionMessage } from "@/lib/auth/errors";
import type { UserRole } from "@/types/domain";

export { AuthError, ForbiddenError, toPublicActionMessage };

export async function requireUser() {
  const context = await getRequestUserContext();

  if (!context) {
    throw new AuthError();
  }

  return context;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const context = await requireUser();
  const { data: profile } = await context.db.from("users").select("role, status").eq("id", context.userId).single();

  if (!profile || profile.status !== "Active" || !allowedRoles.includes(profile.role)) {
    throw new ForbiddenError();
  }

  return context;
}

export async function requireSameStaffGroup(targetUserId: string) {
  const context = await requireUser();

  if (targetUserId === context.userId) {
    return context;
  }

  const { data: viewer } = await context.db.from("users").select("unit, position, status").eq("id", context.userId).single();
  const { data: target } = await context.db.from("users").select("unit, position, status").eq("id", targetUserId).single();

  if (!viewer || !target || viewer.status !== "Active" || target.status !== "Active" || viewer.unit !== target.unit || viewer.position !== target.position) {
    throw new ForbiddenError("Solo puedes actuar sobre personas de tu misma unidad y categoría.");
  }

  return context;
}
