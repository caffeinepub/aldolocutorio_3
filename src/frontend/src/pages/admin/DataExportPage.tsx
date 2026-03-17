import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../../hooks/useActor";
import { stringifyWithBigInt } from "../../utils/BigIntSerializer";

function formatDate(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

const BYTES_PER_RECORD = {
  portfolio: 2400,
  services: 1800,
  testimonials: 800,
  contactSettings: 600,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataExportPage() {
  const navigate = useNavigate();
  const { actor } = useActor();

  const [selections, setSelections] = useState({
    portfolio: true,
    services: true,
    testimonials: true,
    contactSettings: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch counts
  const { data: portfolioData } = useQuery({
    queryKey: ["portfolio-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPortfolioProjects(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["services-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServices(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor,
  });

  const { data: testimonialsData } = useQuery({
    queryKey: ["testimonials-count"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTestimonials(BigInt(1), BigInt(1), null);
    },
    enabled: !!actor,
  });

  const portfolioCount = portfolioData ? Number(portfolioData.total) : 0;
  const servicesCount = servicesData ? Number(servicesData.total) : 0;
  const testimonialsCount = testimonialsData
    ? Number(testimonialsData.total)
    : 0;

  const allChecked =
    selections.portfolio &&
    selections.services &&
    selections.testimonials &&
    selections.contactSettings;

  const noneChecked =
    !selections.portfolio &&
    !selections.services &&
    !selections.testimonials &&
    !selections.contactSettings;

  const toggleAll = () => {
    const newVal = !allChecked;
    setSelections({
      portfolio: newVal,
      services: newVal,
      testimonials: newVal,
      contactSettings: newVal,
    });
  };

  const totalRecords =
    (selections.portfolio ? portfolioCount : 0) +
    (selections.services ? servicesCount : 0) +
    (selections.testimonials ? testimonialsCount : 0);

  const estimatedBytes =
    (selections.portfolio ? portfolioCount * BYTES_PER_RECORD.portfolio : 0) +
    (selections.services ? servicesCount * BYTES_PER_RECORD.services : 0) +
    (selections.testimonials
      ? testimonialsCount * BYTES_PER_RECORD.testimonials
      : 0) +
    (selections.contactSettings ? BYTES_PER_RECORD.contactSettings : 0) +
    512; // metadata overhead

  const handleExport = async () => {
    if (!actor) {
      toast.error("Actor no disponible. Inténtalo de nuevo.");
      return;
    }
    if (noneChecked) {
      toast.error("Selecciona al menos un tipo de datos para exportar.");
      return;
    }

    setIsExporting(true);
    try {
      const exportResult = await actor.exportData();

      // Filter based on selections
      const filteredExport = {
        metadata: exportResult.metadata,
        portfolio: selections.portfolio ? exportResult.portfolio : [],
        services: selections.services ? exportResult.services : [],
        testimonials: selections.testimonials ? exportResult.testimonials : [],
        contactSettings: selections.contactSettings
          ? exportResult.contactSettings
          : null,
      };

      const jsonString = stringifyWithBigInt(filteredExport, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aldolocutorio-export-${formatDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Datos exportados correctamente");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al exportar: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="font-display text-2xl font-bold text-foreground">
        Exportar Datos
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: options + summary */}
        <div className="lg:col-span-2 space-y-4">
          {/* Export Options Card */}
          <div className="bg-card rounded-xl shadow-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Selecciona los datos a exportar
            </h3>

            {/* Select All toggle */}
            <label className="flex items-center gap-3 py-2 border-b border-border mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (el) el.indeterminate = !allChecked && !noneChecked;
                }}
                onChange={toggleAll}
                className="h-4 w-4 rounded accent-primary"
              />
              <span className="font-medium text-sm text-foreground">
                Seleccionar todo
              </span>
            </label>

            {/* Individual checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selections.portfolio}
                    onChange={(e) =>
                      setSelections((p) => ({
                        ...p,
                        portfolio: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    Portafolio
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {portfolioCount} registro{portfolioCount !== 1 ? "s" : ""}
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selections.services}
                    onChange={(e) =>
                      setSelections((p) => ({
                        ...p,
                        services: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    Servicios
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {servicesCount} registro{servicesCount !== 1 ? "s" : ""}
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selections.testimonials}
                    onChange={(e) =>
                      setSelections((p) => ({
                        ...p,
                        testimonials: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    Testimonios
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  {testimonialsCount} registro
                  {testimonialsCount !== 1 ? "s" : ""}
                </span>
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selections.contactSettings}
                    onChange={(e) =>
                      setSelections((p) => ({
                        ...p,
                        contactSettings: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    Configuración de Contacto
                  </span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                  1 registro
                </span>
              </label>
            </div>
          </div>

          {/* Export Summary Card */}
          <div className="bg-card rounded-xl shadow-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Resumen de exportación
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {totalRecords}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Registros totales
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatFileSize(estimatedBytes)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tamaño estimado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: info + actions */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl shadow-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-3">
              Información
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                El archivo se descargará automáticamente al finalizar.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                El formato es compatible con el sistema de importación.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Las imágenes se exportan como referencias URL.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Formato del archivo:{" "}
                <code className="text-xs bg-secondary px-1 py-0.5 rounded">
                  aldolocutorio-export-YYYY-MM-DD-HHmmss.json
                </code>
              </li>
            </ul>
          </div>

          {/* Action Area */}
          <div className="bg-card rounded-xl shadow-card p-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || noneChecked}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar Ahora
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/admin" })}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-foreground rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
