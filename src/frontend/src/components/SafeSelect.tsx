/**
 * SafeSelect.tsx
 * Componente Select seguro que previene valores de string vacío.
 * Usa valores centinela en lugar de string vacío.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type React from "react";

// ─── Valores Centinela ────────────────────────────────────────────────────────
/** Usado para opciones "Todos" / filtro general */
export const SENTINEL_ALL = "all";
/** Usado para estado no seleccionado / placeholder (DEFAULT) */
export const SENTINEL_NONE = "none";
/** Usado para opción "Sin cambios" en operaciones masivas */
export const SENTINEL_NO_CHANGE = "no-change";

const SENTINEL_VALUES = new Set([
  SENTINEL_ALL,
  SENTINEL_NONE,
  SENTINEL_NO_CHANGE,
]);

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Inicializa el estado de un Select.
 * Convierte string vacío a valor centinela. Garantiza que el estado nunca empiece como string vacío.
 */
export function initializeSelectState(
  defaultValue?: string,
  sentinel: string = SENTINEL_NONE,
): string {
  if (
    defaultValue === undefined ||
    defaultValue === null ||
    defaultValue === ""
  ) {
    return sentinel;
  }
  return defaultValue;
}

/**
 * Convierte valores centinela a null para llamadas a la API.
 * Valores regulares pasan sin cambios.
 */
export function convertSentinelToNull(value: string): string | null {
  if (SENTINEL_VALUES.has(value)) return null;
  return value;
}

/**
 * Comprueba si el valor es un centinela.
 */
export function isSentinelValue(value: string): boolean {
  return SENTINEL_VALUES.has(value);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SafeSelectOption {
  value: string;
  label: string;
}

export interface SafeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  /** Callback alternativo que convierte centinelas a null antes de llamar */
  onSentinelChange?: (value: string | null) => void;
  options: SafeSelectOption[];
  placeholder?: string;
  /** Valor centinela por defecto cuando no hay selección. Default: "none" */
  sentinelValue?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  "data-ocid"?: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

/**
 * SafeSelect
 * Envuelve el componente Select para prevenir valores de string vacío.
 * Usa el sistema de centinelas para manejar estados no seleccionados.
 */
export const SafeSelect: React.FC<SafeSelectProps> = ({
  value,
  onValueChange,
  onSentinelChange,
  options,
  placeholder = "Seleccionar...",
  sentinelValue = SENTINEL_NONE,
  disabled = false,
  className,
  triggerClassName,
  "data-ocid": dataOcid,
}) => {
  // Garantizar que el valor nunca sea string vacío
  const safeValue = !value || value === "" ? sentinelValue : value;

  const handleChange = (newValue: string) => {
    // Garantizar que nunca se propague un string vacío
    const safe = !newValue || newValue === "" ? sentinelValue : newValue;
    onValueChange(safe);
    if (onSentinelChange) {
      onSentinelChange(convertSentinelToNull(safe));
    }
  };

  return (
    <div className={className}>
      <Select
        value={safeValue}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className={triggerClassName} data-ocid={dataOcid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            // Garantizar que ninguna opción tenga string vacío como valor
            const safeOptionValue =
              !option.value || option.value === ""
                ? sentinelValue
                : option.value;
            return (
              <SelectItem key={safeOptionValue} value={safeOptionValue}>
                {option.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SafeSelect;
