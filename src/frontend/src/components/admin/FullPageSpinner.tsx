export function FullPageSpinner() {
  return (
    <div
      data-ocid="admin.loading_state"
      className="min-h-screen bg-secondary flex flex-col items-center justify-center gap-6"
    >
      <p className="font-display text-lg font-semibold text-muted-foreground tracking-wide">
        Aldotelico
      </p>

      <div
        role="status"
        aria-label="Cargando"
        className="w-16 h-16 rounded-full border-4 border-accent border-t-primary animate-spin"
      />

      <div className="text-center space-y-1">
        <p className="text-lg font-medium text-foreground">
          Verificando credenciales...
        </p>
        <p className="text-sm text-muted-foreground">
          Por favor espera un momento
        </p>
      </div>
    </div>
  );
}
