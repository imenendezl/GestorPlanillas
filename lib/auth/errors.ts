export class AuthError extends Error {
  constructor(message = "Debes iniciar sesión.") {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function toPublicActionMessage(error: unknown) {
  if (error instanceof AuthError || error instanceof ForbiddenError) {
    return error.message;
  }

  return "No se pudo completar la acción.";
}
