export const PENDING_REGISTRATION_COOKIE = "pending-registration";

export type PendingRegistration = {
  email: string;
  firstName: string;
  lastName: string;
  serviceCode: string;
};

export function encodePendingRegistration(payload: PendingRegistration) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodePendingRegistration(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<PendingRegistration>;
  } catch {
    return null;
  }
}
