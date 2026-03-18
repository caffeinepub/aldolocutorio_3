export default function HomePage() {
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
      <h1 className="text-3xl font-bold mb-3">Página de inicio</h1>
      <p className="text-muted-foreground mb-6">Contenido próximamente</p>
    </div>
  );
}

export { HomePage };
