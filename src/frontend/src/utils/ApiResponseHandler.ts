/**
 * ApiResponseHandler.ts
 * Manejo estandarizado de respuestas y errores de API.
 */

import { parseJSONWithBigInt } from "./BigIntSerializer";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string; // En español para mostrar al usuario
  details?: unknown;
  status?: number;
  retryable?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string; // En español
    details?: unknown;
  };
  timestamp: string; // BigInt como string
}

// ─── Códigos de error retryable ───────────────────────────────────────────────
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "SERVICE_UNAVAILABLE",
]);

// ─── Funciones ────────────────────────────────────────────────────────────────

/**
 * Crea un objeto de error estandarizado con mensaje en español.
 */
export function createApiError(
  message: string,
  code = "UNKNOWN_ERROR",
  details?: unknown,
  status?: number,
): ApiError {
  const retryable =
    status !== undefined
      ? RETRYABLE_STATUS_CODES.has(status)
      : RETRYABLE_ERROR_CODES.has(code);

  if (import.meta.env.DEV) {
    console.warn(
      `[ApiResponseHandler] Error API [${code}]:`,
      message,
      details ?? "",
    );
  }

  return { code, message, details, status, retryable };
}

/**
 * Determina si una petición fallida debe reintentarse.
 */
export function shouldRetryRequest(error: ApiError): boolean {
  if (error.retryable !== undefined) return error.retryable;
  if (error.status !== undefined)
    return RETRYABLE_STATUS_CODES.has(error.status);
  return RETRYABLE_ERROR_CODES.has(error.code);
}

/**
 * Manejador estándar de respuestas fetch.
 * Parsea JSON con soporte BigInt y formatea errores de forma consistente.
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  let rawText: string;

  try {
    rawText = await response.text();
  } catch (e) {
    throw createApiError(
      "Error al leer la respuesta del servidor.",
      "READ_ERROR",
      e,
      response.status,
    );
  }

  if (!response.ok) {
    let errorBody: ApiResponse<unknown> | null = null;
    try {
      errorBody = parseJSONWithBigInt(rawText) as ApiResponse<unknown>;
    } catch {
      // ignorar error de parseo
    }

    const spanishMessages: Record<number, string> = {
      400: "Solicitud inválida. Verifique los datos enviados.",
      401: "No autorizado. Por favor inicie sesión.",
      403: "Acceso denegado. No tiene permisos para esta acción.",
      404: "Recurso no encontrado.",
      408: "La solicitud tardó demasiado. Intente de nuevo.",
      429: "Demasiadas solicitudes. Espere un momento e intente de nuevo.",
      500: "Error interno del servidor. Intente más tarde.",
      502: "Servicio temporalmente no disponible.",
      503: "Servicio no disponible. Intente más tarde.",
      504: "El servidor tardó demasiado en responder.",
    };

    const message =
      errorBody?.error?.message ??
      spanishMessages[response.status] ??
      `Error del servidor (${response.status}).`;

    throw createApiError(
      message,
      errorBody?.error?.code ?? `HTTP_${response.status}`,
      errorBody?.error?.details,
      response.status,
    );
  }

  try {
    const parsed = parseJSONWithBigInt(rawText) as ApiResponse<T>;

    // Si la respuesta sigue el formato ApiResponse estándar
    if (typeof parsed === "object" && parsed !== null && "success" in parsed) {
      if (!parsed.success) {
        throw createApiError(
          parsed.error?.message ?? "La operación no fue exitosa.",
          parsed.error?.code ?? "OPERATION_FAILED",
          parsed.error?.details,
          response.status,
        );
      }
      return parsed.data as T;
    }

    // Respuesta directa sin envoltorio ApiResponse
    return parsed as T;
  } catch (e) {
    if ((e as ApiError).code) throw e; // re-throw ApiError
    throw createApiError(
      "Error al procesar la respuesta del servidor.",
      "PARSE_ERROR",
      e,
      response.status,
    );
  }
}
