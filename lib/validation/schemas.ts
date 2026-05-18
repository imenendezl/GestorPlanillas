import { z } from "zod";
import type { Position, ShiftCode, SwapMode } from "@/types/domain";

const shiftCodes = ["M", "T", "N", "-", "L"] as const satisfies readonly ShiftCode[];
const positions = ["Nurse", "TMSCAE"] as const satisfies readonly Position[];
const swapModes = ["Exchange", "Coverage"] as const satisfies readonly SwapMode[];

export const requiredTextSchema = z
  .string()
  .trim()
  .min(1, "Campo obligatorio.")
  .max(160, "El texto es demasiado largo.");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Indica un correo válido.")
  .max(254, "El correo es demasiado largo.");

export const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres.").max(128);

export const uuidSchema = z.string().trim().uuid("Identificador no válido.");

export const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }, "Fecha no válida.");

export const shiftCodeSchema = z.enum(shiftCodes);
export const shiftCodesSchema = z.array(shiftCodeSchema).min(1).max(3);
export const positionSchema = z.enum(positions);
export const swapModeSchema = z.enum(swapModes);

export const authEmailSchema = z.object({
  email: emailSchema
});

export const otpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Introduce el código de 8 dígitos.")
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Indica tu contraseña.").max(128)
});

export const registrationSchema = z.object({
  email: emailSchema,
  firstName: requiredTextSchema,
  lastName: requiredTextSchema,
  serviceCode: z
    .string()
    .trim()
    .min(1, "Indica el código de servicio.")
    .max(40, "El código de servicio es demasiado largo.")
    .transform((value) => value.replace(/\s+/g, "").toUpperCase())
});

export const legacySignUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: requiredTextSchema,
  lastName: requiredTextSchema,
  unit: requiredTextSchema,
  position: positionSchema
});

export const profileSchema = z.object({
  firstName: requiredTextSchema,
  lastName: requiredTextSchema,
  unit: requiredTextSchema,
  position: positionSchema
});

export const updateEmailSchema = z.object({
  email: emailSchema
});

export const updatePasswordSchema = z.object({
  password: passwordSchema
});

export const saveShiftSchema = z.object({
  shiftDate: dateKeySchema,
  shiftCodes: shiftCodesSchema
});

export const deleteShiftSchema = z.object({
  shiftId: uuidSchema
});

export const bulkCreateShiftsSchema = z.object({
  startDate: dateKeySchema,
  sequence: z.string().trim().min(1, "Indica la secuencia de turnos.").max(500)
});

export const createWorkRequestSchema = z.object({
  requestDate: dateKeySchema
});

export const cancelWorkRequestSchema = z.object({
  requestId: uuidSchema
});

export const createSwapRequestSchema = z.object({
  shiftId: uuidSchema,
  mode: swapModeSchema,
  offeredShiftCodes: shiftCodesSchema,
  proposedDates: z.array(dateKeySchema).max(31)
});

export const acceptSwapRequestSchema = z.object({
  requestId: uuidSchema,
  acceptedDate: z.union([dateKeySchema, z.literal("")])
});

export const updateSwapSignatureSchema = z.object({
  requestId: uuidSchema,
  signed: z.boolean()
});

export function getValidationMessage(error: unknown, fallback = "Datos no válidos.") {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  return fallback;
}

export function parseFormData<T extends z.ZodRawShape>(schema: z.ZodObject<T>, formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  return schema.parse(values);
}
