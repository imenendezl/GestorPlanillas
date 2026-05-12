export type ActionVariant = "success" | "info" | "warning" | "error";

export type ActionResult<T = void> = {
  ok: boolean;
  message: string;
  variant: ActionVariant;
  data?: T;
};

export function actionSuccess<T>(message: string, data?: T): ActionResult<T> {
  return { ok: true, message, variant: "success", data };
}

export function actionError(message: string): ActionResult {
  return { ok: false, message, variant: "error" };
}
