import { Link } from "@tanstack/react-router";

export default function SobreNosotrosPage() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 className="text-3xl font-bold mb-3">Sobre Nosotros</h1>
      <p className="text-muted-foreground mb-6">
        Página sobre nosotros - Próximamente
      </p>
      <Link to="/" className="text-primary hover:underline text-sm">
        Volver al Inicio
      </Link>
    </div>
  );
}
