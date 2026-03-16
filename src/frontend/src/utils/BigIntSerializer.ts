/**
 * BigIntSerializer.ts
 * Utilidades para serialización/deserialización segura de BigInt
 */

const isDev = import.meta.env.DEV;

// Campos que deben tratarse como BigInt/número al parsear JSON
const BIGINT_FIELDS = new Set(["createdDate", "lastUpdatedDate", "timestamp"]);
const BIGINT_FIELD_SUFFIXES = ["Date", "Timestamp"];

// Nombres de campo que contienen fechas/ids al serializar
const BIGINT_FIELD_KEYWORDS = ["date", "timestamp", "id"];

/**
 * Convierte BigInt, número o string a string de forma segura para serialización JSON.
 * Retorna string vacío para entradas inválidas.
 */
export function safeBigIntToString(
  value: bigint | number | string | null | undefined,
): string {
  if (value === null || value === undefined) {
    if (isDev)
      console.warn(
        "[BigIntSerializer] safeBigIntToString: valor nulo o indefinido recibido",
      );
    return "";
  }
  try {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        if (isDev)
          console.warn(
            "[BigIntSerializer] safeBigIntToString: número no finito:",
            value,
          );
        return "";
      }
      return String(value);
    }
    if (typeof value === "string") return value;
    if (isDev)
      console.warn(
        "[BigIntSerializer] safeBigIntToString: tipo inesperado:",
        typeof value,
      );
    return "";
  } catch (e) {
    if (isDev) console.warn("[BigIntSerializer] safeBigIntToString error:", e);
    return "";
  }
}

/**
 * Convierte string a BigInt de forma segura.
 * Retorna null si el string no es válido.
 */
export function safeStringToBigInt(
  value: string | null | undefined,
): bigint | null {
  if (!value || typeof value !== "string" || value.trim() === "") {
    if (isDev)
      console.warn("[BigIntSerializer] safeStringToBigInt: valor vacío o nulo");
    return null;
  }
  try {
    return BigInt(value.trim());
  } catch (_e) {
    if (isDev)
      console.warn(
        "[BigIntSerializer] safeStringToBigInt: no se pudo convertir:",
        value,
      );
    return null;
  }
}

/**
 * Verifica si un string puede convertirse de forma segura a BigInt.
 */
export function isValidBigIntString(value: string): boolean {
  if (!value || typeof value !== "string" || value.trim() === "") return false;
  try {
    BigInt(value.trim());
    return true;
  } catch {
    return false;
  }
}

/**
 * Determina si un campo debe procesarse como BigInt al parsear.
 */
function isBigIntField(key: string): boolean {
  if (BIGINT_FIELDS.has(key)) return true;
  return BIGINT_FIELD_SUFFIXES.some((suffix) => key.endsWith(suffix));
}

/**
 * Parser JSON personalizado que maneja strings BigInt en campos específicos.
 * Usar en lugar de JSON.parse() en toda la aplicación.
 */
export function parseJSONWithBigInt(jsonString: string): any {
  try {
    return JSON.parse(jsonString, (key, value) => {
      if (
        key !== "" &&
        isBigIntField(key) &&
        typeof value === "string" &&
        isValidBigIntString(value)
      ) {
        const num = Number(value);
        if (!Number.isNaN(num) && Number.isFinite(num)) return num;
        const big = safeStringToBigInt(value);
        return big !== null ? big : value;
      }
      return value;
    });
  } catch (e) {
    if (isDev)
      console.warn(
        "[BigIntSerializer] parseJSONWithBigInt error, fallback a JSON.parse:",
        e,
      );
    return JSON.parse(jsonString);
  }
}

/**
 * Stringificador JSON personalizado que convierte BigInt a strings.
 * Usar en lugar de JSON.stringify() cuando los datos pueden contener BigInt.
 */
export function stringifyWithBigInt(data: any, space?: number): string {
  return JSON.stringify(
    data,
    (key, value) => {
      if (typeof value === "bigint") return value.toString();
      const lowerKey = key.toLowerCase();
      if (
        value !== null &&
        value !== undefined &&
        typeof value !== "object" &&
        BIGINT_FIELD_KEYWORDS.some((k) => lowerKey.includes(k))
      ) {
        return String(value);
      }
      return value;
    },
    space,
  );
}
