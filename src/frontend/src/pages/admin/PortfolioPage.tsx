export default function PortfolioPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Portafolio
      </h1>
      <div className="bg-card rounded-xl shadow-card p-8 text-center">
        <p className="text-4xl mb-4">📁</p>
        <p className="font-display text-lg font-semibold text-foreground">
          Próximamente disponible
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          La gestión del portafolio estará disponible próximamente.
        </p>
      </div>
    </div>
  );
}
