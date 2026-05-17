import { describe, expect, it } from "vitest";
import { AuthError, ForbiddenError, toPublicActionMessage } from "./errors";

describe("auth guards", () => {
  it("keeps auth and authorization errors public but hides unknown failures", () => {
    expect(toPublicActionMessage(new AuthError())).toBe("Debes iniciar sesión.");
    expect(toPublicActionMessage(new ForbiddenError())).toBe("No tienes permisos para realizar esta acción.");
    expect(toPublicActionMessage(new Error("database details"))).toBe("No se pudo completar la acción.");
  });
});
