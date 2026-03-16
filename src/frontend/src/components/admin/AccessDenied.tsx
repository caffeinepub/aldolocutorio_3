import { Check, Copy, LogOut } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAdminStore } from "../../store/adminStore";

export function AccessDenied() {
  const { clear } = useInternetIdentity();
  const { principal, clearAuth } = useAdminStore();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    clear();
    clearAuth();
  };

  const handleCopy = async () => {
    if (!principal) return;
    await navigator.clipboard.writeText(principal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayPrincipal = principal
    ? principal.length > 40
      ? `${principal.slice(0, 20)}...${principal.slice(-10)}`
      : principal
    : "—";

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div
        data-ocid="access_denied.panel"
        className="w-full max-w-md bg-card rounded-xl shadow-card p-8 space-y-6 text-center"
      >
        <div className="space-y-3">
          <span
            className="text-5xl block"
            role="img"
            aria-label="Acceso denegado"
          >
            🛑
          </span>
          <h1 className="font-display text-3xl font-bold text-destructive">
            Acceso Denegado
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No tienes permisos de administrador para acceder a este panel.
          </p>
        </div>

        {/* Principal display */}
        <div className="text-left space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Tu ID de Internet Identity:
          </p>
          <div className="bg-secondary rounded-lg p-4 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-foreground break-all leading-relaxed flex-1">
              {displayPrincipal}
            </span>
            <button
              type="button"
              data-ocid="access_denied.button"
              onClick={handleCopy}
              aria-label="Copiar ID al portapapeles"
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          data-ocid="access_denied.primary_button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 border border-border text-foreground font-medium py-2.5 px-6 rounded-lg transition-all duration-150 hover:border-destructive hover:text-destructive text-sm"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
