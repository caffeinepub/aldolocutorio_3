import { Link } from "@tanstack/react-router";

export default function ContactoPage() {
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
      <h1 className="text-3xl font-bold mb-3">Contacto</h1>
      <p className="text-muted-foreground mb-6">
        Página de contacto - Próximamente
      </p>
      <Link to="/" className="text-primary hover:underline text-sm">
        Volver al Inicio
      </Link>
    </div>
  );
}
