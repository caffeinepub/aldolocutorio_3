import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Download,
  FileJson,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ExportData, ImportOptions, ImportResult } from "../../backend";
import {
  type ImportMode as BackendImportMode,
  PortfolioCategory,
  PublishStatus,
} from "../../backend";
import { useActor } from "../../hooks/useActor";
import { parseJSONWithBigInt } from "../../utils/BigIntSerializer";

type ImportMode = "createAndUpdate" | "createOnly" | "replaceAll" | "skip";

interface ContentTypeOptions {
  portfolioMode: ImportMode;
  servicesMode: ImportMode;
  testimonialsMode: ImportMode;
  importContactSettings: boolean;
}

const MODE_LABELS: Record<ImportMode, string> = {
  createAndUpdate: "Crear nuevos y actualizar coincidentes (recomendado)",
  createOnly: "Solo crear nuevos (ignorar coincidentes)",
  replaceAll: "Reemplazar todos los existentes",
  skip: "No importar este tipo",
};

const MODES: ImportMode[] = [
  "createAndUpdate",
  "createOnly",
  "replaceAll",
  "skip",
];

function formatBigIntDate(
  ns: bigint | number | string | null | undefined,
): string {
  try {
    const val = typeof ns === "bigint" ? ns : BigInt(String(ns ?? 0));
    const ms = Number(val / BigInt(1_000_000));
    return new Date(ms).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(ns ?? "");
  }
}

/** Safely convert any value to bigint. Returns 0n on failure. */
function toBigInt(v: unknown): bigint {
  if (v === undefined || v === null) return BigInt(0);
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.trunc(v));
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (trimmed === "") return BigInt(0);
    try {
      return BigInt(trimmed);
    } catch {
      return BigInt(0);
    }
  }
  return BigInt(0);
}

/** Safely convert any value to optional bigint. Returns undefined when absent. */
function toOptBigInt(v: unknown): bigint | undefined {
  if (v === undefined || v === null) return undefined;
  // Empty array means null/None in Candid optional
  if (Array.isArray(v)) {
    if (v.length === 0) return undefined;
    return toBigInt(v[0]);
  }
  return toBigInt(v);
}

/** Convert a string category to the PortfolioCategory enum value. */
function toCategory(v: unknown): PortfolioCategory {
  const s = typeof v === "string" ? v.toLowerCase() : "web";
  const valid = Object.values(PortfolioCategory) as string[];
  return valid.includes(s) ? (s as PortfolioCategory) : PortfolioCategory.web;
}

/** Convert a string publishStatus to the PublishStatus enum value. */
function toPublishStatus(v: unknown): PublishStatus {
  const s = typeof v === "string" ? v.toLowerCase() : "draft";
  const valid = Object.values(PublishStatus) as string[];
  return valid.includes(s) ? (s as PublishStatus) : PublishStatus.draft;
}

/**
 * Normalizes raw JSON-parsed import data into a properly-typed ExportData
 * object that the backend wrapper can accept.
 *
 * Transformations applied:
 * - All bigint fields (id, displayOrder, rating, dates, totalRecords) are
 *   converted from strings/numbers to bigint.
 * - category and publishStatus strings are mapped to their enum values.
 * - All image fields (thumbnail, galleryImages, icon, photo) are set to
 *   undefined / empty array so that no upload is attempted and no type
 *   mismatch occurs.
 * - contactSettings float coordinates are preserved as-is.
 */
function normalizeImportData(raw: any): ExportData {
  const meta = raw.metadata ?? {};
  const totalRec = meta.totalRecords ?? {};

  return {
    metadata: {
      exportDate: toBigInt(meta.exportDate),
      exportVersion: String(meta.exportVersion ?? "1.0"),
      totalRecords: {
        portfolio: toBigInt(totalRec.portfolio),
        services: toBigInt(totalRec.services),
        testimonials: toBigInt(totalRec.testimonials),
      },
    },
    portfolio: (raw.portfolio ?? []).map((p: any) => ({
      id: toBigInt(p.id),
      title: String(p.title ?? ""),
      clientName: String(p.clientName ?? ""),
      industry: String(p.industry ?? ""),
      category: toCategory(p.category),
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      // Ignore all image data — set to undefined/empty
      thumbnail: undefined,
      galleryImages: [],
      description: String(p.description ?? ""),
      technologiesUsed: Array.isArray(p.technologiesUsed)
        ? p.technologiesUsed.map(String)
        : [],
      results: Array.isArray(p.results) ? p.results.map(String) : [],
      linkedTestimonialId: toOptBigInt(p.linkedTestimonialId),
      publishStatus: toPublishStatus(p.publishStatus),
      displayOrder: toBigInt(p.displayOrder),
      createdDate: toOptBigInt(p.createdDate),
      lastUpdatedDate: toOptBigInt(p.lastUpdatedDate),
    })),
    services: (raw.services ?? []).map((s: any) => ({
      id: toBigInt(s.id),
      title: String(s.title ?? ""),
      // Ignore icon image data
      icon: undefined,
      shortDescription: String(s.shortDescription ?? ""),
      fullDescription: String(s.fullDescription ?? ""),
      useCases: Array.isArray(s.useCases) ? s.useCases.map(String) : [],
      processSteps: Array.isArray(s.processSteps)
        ? s.processSteps.map((ps: any) => ({
            step: String(ps.step ?? ""),
            description: String(ps.description ?? ""),
          }))
        : [],
      targetAudience: String(s.targetAudience ?? ""),
      faqs: Array.isArray(s.faqs)
        ? s.faqs.map((f: any) => ({
            question: String(f.question ?? ""),
            answer: String(f.answer ?? ""),
          }))
        : [],
      displayOrder: toBigInt(s.displayOrder),
      isVisible: Boolean(s.isVisible),
      createdDate: toOptBigInt(s.createdDate),
      lastUpdatedDate: toOptBigInt(s.lastUpdatedDate),
    })),
    testimonials: (raw.testimonials ?? []).map((t: any) => ({
      id: toBigInt(t.id),
      quote: String(t.quote ?? ""),
      authorName: String(t.authorName ?? ""),
      jobTitle: String(t.jobTitle ?? ""),
      companyName: String(t.companyName ?? ""),
      // Ignore photo image data
      photo: undefined,
      linkedPortfolioId: toOptBigInt(t.linkedPortfolioId),
      rating: toBigInt(t.rating),
      displayOrder: toBigInt(t.displayOrder),
      isVisible: Boolean(t.isVisible),
      createdDate: toOptBigInt(t.createdDate),
      lastUpdatedDate: toOptBigInt(t.lastUpdatedDate),
    })),
    contactSettings: raw.contactSettings
      ? {
          ...raw.contactSettings,
          lastUpdated: toBigInt(raw.contactSettings.lastUpdated),
        }
      : null,
  };
}

function validateImportData(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  const meta = data.metadata;
  if (!meta || typeof meta !== "object") return false;
  if (!meta.exportVersion || meta.exportDate === undefined) return false;
  if (!meta.totalRecords || typeof meta.totalRecords !== "object") return false;
  if (!Array.isArray(data.portfolio)) return false;
  if (!Array.isArray(data.services)) return false;
  if (!Array.isArray(data.testimonials)) return false;
  return true;
}

export default function DataImportPage() {
  const { actor } = useActor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ExportData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [options, setOptions] = useState<ContentTypeOptions>({
    portfolioMode: "createAndUpdate",
    servicesMode: "createAndUpdate",
    testimonialsMode: "createAndUpdate",
    importContactSettings: true,
  });

  const { data: portfolioData } = useQuery({
    queryKey: ["import-portfolio-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPortfolioProjects(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor && !!parsedData,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["import-services-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServices(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor && !!parsedData,
  });

  const { data: testimonialsData } = useQuery({
    queryKey: ["import-testimonials-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTestimonials(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor && !!parsedData,
  });

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json")) {
      setParseError("El archivo debe ser un archivo JSON (.json)");
      return;
    }
    setFileName(file.name);
    setParseError(null);
    setParsedData(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const raw = parseJSONWithBigInt(text);
        if (!validateImportData(raw)) {
          setParseError(
            "El archivo no tiene la estructura correcta de exportación.",
          );
          setFileName(null);
          return;
        }
        // Normalize all field types: convert string IDs/dates/ratings to bigint,
        // map category/publishStatus strings to enum values, and discard image data.
        const normalized = normalizeImportData(raw);
        setParsedData(normalized);
      } catch (err) {
        console.error("Error parsing import file:", err);
        setParseError("El archivo no es un JSON válido.");
        setFileName(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleCancel = () => {
    setFileName(null);
    setParsedData(null);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setOptions({
      portfolioMode: "createAndUpdate",
      servicesMode: "createAndUpdate",
      testimonialsMode: "createAndUpdate",
      importContactSettings: true,
    });
  };

  const handleImport = async () => {
    if (!actor || !parsedData) {
      toast.error("No hay datos para importar o el actor no está disponible.");
      return;
    }
    setIsImporting(true);
    try {
      const importOptions: ImportOptions = {
        portfolioMode: options.portfolioMode as unknown as BackendImportMode,
        servicesMode: options.servicesMode as unknown as BackendImportMode,
        testimonialsMode:
          options.testimonialsMode as unknown as BackendImportMode,
        importContactSettings: options.importContactSettings,
      };
      const result = await actor.importData(parsedData, importOptions);
      setImportResult(result);
      const summary = [
        `${result.portfolio.created} portafolio nuevos`,
        `${result.portfolio.updated} actualizados`,
        `${result.services.created} servicios nuevos`,
        `${result.testimonials.created} testimonios nuevos`,
      ].join(", ");
      toast.success(`Importación completada: ${summary}`);
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(
        `Error en la importación: ${err?.message ?? "Error desconocido"}`,
      );
    } finally {
      setIsImporting(false);
    }
  };

  const systemPortfolio = portfolioData?.total
    ? Number(portfolioData.total)
    : 0;
  const systemServices = servicesData?.total ? Number(servicesData.total) : 0;
  const systemTestimonials = testimonialsData?.total
    ? Number(testimonialsData.total)
    : 0;

  const filePortfolio = parsedData ? parsedData.portfolio.length : 0;
  const fileServices = parsedData ? parsedData.services.length : 0;
  const fileTestimonials = parsedData ? parsedData.testimonials.length : 0;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Importar Datos</h2>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-50 dark:bg-amber-900/20 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Esta acción importará datos desde un archivo de exportación. Los datos
          existentes serán actualizados según tus selecciones. Recomendamos
          exportar los datos actuales antes de importar.
        </p>
      </div>

      {/* File Selection */}
      {!parsedData && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Seleccionar archivo</h3>
          <div
            data-ocid="import.dropzone"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors p-12
              ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UploadCloud className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                Arrastra y suelta tu archivo JSON aquí
              </p>
              <p className="text-sm text-muted-foreground">
                o haz clic para seleccionar
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="import.upload_button"
            />
          </div>

          {fileName && !parsedData && (
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1 truncate">
                {fileName}
              </span>
              <button type="button" onClick={handleCancel}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          )}

          {parseError && (
            <div
              data-ocid="import.error_state"
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{parseError}</p>
            </div>
          )}
        </div>
      )}

      {/* Preview State */}
      {parsedData && (
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-semibold text-foreground">
              Información del archivo
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" />
              <span className="font-medium text-foreground">{fileName}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Fecha de exportación
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatBigIntDate(parsedData.metadata.exportDate)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Versión del esquema
                </p>
                <p className="text-sm font-medium text-foreground">
                  {parsedData.metadata.exportVersion}
                </p>
              </div>
            </div>

            {/* Content Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="import.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">
                      Tipo de Contenido
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">
                      En Archivo
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">
                      En Sistema
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">
                      Nuevos
                    </th>
                    <th className="text-center py-2 px-3 font-semibold text-foreground">
                      Coinciden
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      label: "Portafolio",
                      file: filePortfolio,
                      system: systemPortfolio,
                    },
                    {
                      label: "Servicios",
                      file: fileServices,
                      system: systemServices,
                    },
                    {
                      label: "Testimonios",
                      file: fileTestimonials,
                      system: systemTestimonials,
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-2 pr-4 text-foreground">{row.label}</td>
                      <td className="text-center py-2 px-3 text-foreground">
                        {row.file}
                      </td>
                      <td className="text-center py-2 px-3 text-muted-foreground">
                        {row.system}
                      </td>
                      <td className="text-center py-2 px-3 text-green-600 dark:text-green-400 font-medium">
                        {Math.max(0, row.file - row.system)}
                      </td>
                      <td className="text-center py-2 px-3 text-blue-600 dark:text-blue-400 font-medium">
                        {Math.min(row.file, row.system)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Options */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <h3 className="font-semibold text-foreground">
              Opciones de importación
            </h3>

            {/* Portfolio */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Portafolio ({filePortfolio} registros)
              </p>
              <div className="space-y-2 pl-2">
                {MODES.map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="portfolioMode"
                      value={mode}
                      checked={options.portfolioMode === mode}
                      onChange={() =>
                        setOptions((prev) => ({ ...prev, portfolioMode: mode }))
                      }
                      data-ocid="import.radio"
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {MODE_LABELS[mode]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Services */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Servicios ({fileServices} registros)
              </p>
              <div className="space-y-2 pl-2">
                {MODES.map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="servicesMode"
                      value={mode}
                      checked={options.servicesMode === mode}
                      onChange={() =>
                        setOptions((prev) => ({ ...prev, servicesMode: mode }))
                      }
                      data-ocid="import.radio"
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {MODE_LABELS[mode]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Testimonials */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Testimonios ({fileTestimonials} registros)
              </p>
              <div className="space-y-2 pl-2">
                {MODES.map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="testimonialsMode"
                      value={mode}
                      checked={options.testimonialsMode === mode}
                      onChange={() =>
                        setOptions((prev) => ({
                          ...prev,
                          testimonialsMode: mode,
                        }))
                      }
                      data-ocid="import.radio"
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground">
                      {MODE_LABELS[mode]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Contact Settings */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                Configuración de Contacto
              </p>
              <label className="flex items-center gap-2 cursor-pointer pl-2">
                <input
                  type="checkbox"
                  checked={options.importContactSettings}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      importContactSettings: e.target.checked,
                    }))
                  }
                  data-ocid="import.checkbox"
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">
                  Importar configuración de contacto
                </span>
              </label>
            </div>
          </div>

          {/* Action Area */}
          {!importResult && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                data-ocid="import.cancel_button"
                onClick={handleCancel}
                disabled={isImporting}
                className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-ocid="import.primary_button"
                onClick={handleImport}
                disabled={isImporting || !actor}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Iniciar Importación
                  </>
                )}
              </button>
            </div>
          )}

          {/* Results Summary */}
          {importResult && (
            <div
              data-ocid="import.success_state"
              className="rounded-xl border border-green-400/40 bg-green-50 dark:bg-green-900/20 p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Importación completada
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Portafolio",
                    created: importResult.portfolio.created,
                    updated: importResult.portfolio.updated,
                  },
                  {
                    label: "Servicios",
                    created: importResult.services.created,
                    updated: importResult.services.updated,
                  },
                  {
                    label: "Testimonios",
                    created: importResult.testimonials.created,
                    updated: importResult.testimonials.updated,
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="rounded-lg bg-white/60 dark:bg-white/5 p-3"
                  >
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {r.label}
                    </p>
                    <p className="text-sm text-foreground">
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {String(r.created)} nuevos
                      </span>
                      {" · "}
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {String(r.updated)} actualizados
                      </span>
                    </p>
                  </div>
                ))}
              </div>
              {importResult.contactSettingsUpdated && (
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Configuración de contacto actualizada
                </p>
              )}
              <button
                type="button"
                data-ocid="import.secondary_button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Importar otro archivo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
