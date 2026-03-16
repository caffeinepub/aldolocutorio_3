/**
 * NumericConverter.ts
 * Utilidades para conversión segura de tipos numéricos y validación.
 */

const isDev = import.meta.env.DEV;

/**
 * Convierte de forma segura strings, números, null o undefined a número.
 * Retorna null para entradas inválidas.
 *
 * Ejemplos: "10" → 10, "4.5" → 4.5, "" → null, "abc" → null
 */
export function safeConvertToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      if (isDev)
        console.warn(
          "[NumericConverter] safeConvertToNumber: número no finito recibido:",
          value,
        );
      return null;
    }
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      if (isDev)
        console.warn(
          "[NumericConverter] safeConvertToNumber: no se pudo convertir a número:",
          value,
        );
      return null;
    }
    return parsed;
  }

  if (isDev)
    console.warn(
      "[NumericConverter] safeConvertToNumber: tipo no soportado:",
      typeof value,
    );
  return null;
}

/**
 * Valida valores de año (1900–2100).
 * Convierte strings a número primero.
 * Retorna número o null si es inválido.
 */
export function validateYear(value: unknown): number | null {
  const num = safeConvertToNumber(value);
  if (num === null) return null;
  const year = Math.floor(num);
  if (year < 1900 || year > 2100) {
    if (isDev)
      console.warn(
        "[NumericConverter] validateYear: año fuera de rango (1900-2100):",
        year,
      );
    return null;
  }
  return year;
}

/**
 * Valida calificaciones de estrellas (1–5).
 * Convierte strings a número primero.
 * Retorna número o null si es inválido.
 */
export function validateRating(value: unknown): number | null {
  const num = safeConvertToNumber(value);
  if (num === null) return null;
  if (num < 1 || num > 5) {
    if (isDev)
      console.warn(
        "[NumericConverter] validateRating: calificación fuera de rango (1-5):",
        num,
      );
    return null;
  }
  return num;
}
