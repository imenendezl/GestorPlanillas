import type { Database } from "@/types/database";
import type { UserProfile } from "@/types/domain";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export function toUserProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    unit: row.unit,
    hospitalId: row.hospital_id,
    unitId: row.unit_id,
    position: row.position,
    role: row.role,
    status: row.status
  };
}
