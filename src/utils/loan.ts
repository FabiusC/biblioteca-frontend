// Tipos y utilidades compartidas para la gestion de prestamos

export type BookSortMode = "isbn" | "available" | "alpha";

// Devuelve la fecha actual en formato YYYY-MM-DD
export const today = (): string => new Date().toISOString().slice(0, 10);

// Extrae un mensaje claro y localizado del error devuelto por el backend
export const parseLoanError = (err: unknown): string => {
  const data = (err as { response?: { data?: unknown } })?.response?.data;

  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string") {
      if (/already has active loans/i.test(message)) {
        return "El usuario ya tiene un préstamo activo.";
      }
      if (/overdue loans/i.test(message)) {
        return "El usuario tiene un préstamo vencido.";
      }
      return message;
    }
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return "Error al registrar el préstamo";
};
