import { Link } from "@tanstack/react-router";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-card mt-auto"
      data-ocid="public.footer"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <img
              src="https://i.imgur.com/xGJXblj.png"
              alt="AldoLocutorio"
              style={{ width: "200px", height: "auto" }}
              className="object-contain self-start"
            />
            <p className="text-sm text-muted-foreground max-w-xs">
              Soluciones digitales para negocios y particulares
            </p>
            <p className="text-xs text-muted-foreground">
              © {year} AldoLocutorio. Todos los derechos reservados.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">
              Navegación
            </h4>
            <nav className="flex flex-col gap-2">
              <Link
                to="/servicios"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="public.footer.link"
              >
                Servicios
              </Link>
              <Link
                to="/portafolio"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="public.footer.link"
              >
                Portafolio
              </Link>
              <Link
                to="/sobre-nosotros"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="public.footer.link"
              >
                Compañía
              </Link>
              <Link
                to="/testimonios"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="public.footer.link"
              >
                Testimonios
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
            <p className="text-sm text-muted-foreground">Málaga, España</p>
            <p className="text-sm text-muted-foreground">
              aldolocutoriomalaga@gmail.com
            </p>
          </div>
        </div>

        {/* Legal row */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <nav className="flex gap-4">
            <Link
              to="/privacidad"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="public.footer.link"
            >
              Política de Privacidad
            </Link>
            <Link
              to="/terminos"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="public.footer.link"
            >
              Términos de Servicio
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {year}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
