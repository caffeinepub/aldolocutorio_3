import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-primary">
            AldoLocutorio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Panel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-card p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-lg font-semibold text-foreground">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Accede con tu identidad digital segura
            </p>
          </div>

          <button
            type="button"
            data-ocid="login.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-3 px-6 rounded-lg transition-all duration-150 hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>Iniciar sesión con Internet Identity</>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Solo personal autorizado
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            ¿No tienes Internet Identity?{" "}
            <a
              data-ocid="login.link"
              href="https://identity.ic0.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Obtener uno nuevo
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
