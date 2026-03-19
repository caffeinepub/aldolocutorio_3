import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import type { ContactSettings } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { safeConvertToNumber } from "../../utils/NumericConverter";

function toWaNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

function FooterContacto() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ContactSettings>({
    queryKey: ["contact-settings", "footer"],
    queryFn: () => actor!.getContactSettings(),
    enabled: Boolean(actor) && !actorFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["contact-settings", "footer"] });
    };
  }, [queryClient]);

  const isLoadingState = isLoading || actorFetching;

  if (isLoadingState) {
    return (
      <div className="flex flex-col gap-3" data-ocid="public.footer.contacto">
        <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
        <div className="space-y-2">
          <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          <div className="h-3 w-36 bg-muted rounded animate-pulse" />
          <div className="h-3 w-40 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3" data-ocid="public.footer.contacto">
        <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
        <Link
          to="/contacto"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="public.footer.link"
        >
          Ir a Contacto
        </Link>
      </div>
    );
  }

  const lat = safeConvertToNumber(data.map.latitude) ?? 0;
  const lon = safeConvertToNumber(data.map.longitude) ?? 0;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
  const waNumber =
    data.whatsapp.isEnabled && data.whatsapp.number
      ? toWaNumber(data.whatsapp.number)
      : null;

  return (
    <div className="flex flex-col gap-3" data-ocid="public.footer.contacto">
      <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
      <nav className="flex flex-col gap-2">
        {/* Primary email */}
        {data.email.primary && (
          <a
            href={`mailto:${data.email.primary}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="public.footer.email"
          >
            {data.email.primary}
          </a>
        )}
        {/* WhatsApp */}
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="public.footer.whatsapp"
          >
            Envíanos un WhatsApp
          </a>
        )}
        {/* Directions */}
        {(lat !== 0 || lon !== 0) && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="public.footer.directions"
          >
            Cómo llegar
          </a>
        )}
      </nav>
    </div>
  );
}

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-border bg-card mt-auto"
      data-ocid="public.footer"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="flex flex-col gap-3">
            <img
              src="https://i.imgur.com/pIzPFRP.png"
              alt="Aldotelico"
              style={{ width: "200px", height: "auto" }}
              className="object-contain self-start"
            />
            <p className="text-sm text-muted-foreground max-w-xs">
              Soluciones digitales para negocios y particulares
            </p>
            <p className="text-xs text-muted-foreground">
              © {year} Aldotelico. Todos los derechos reservados.
            </p>
          </div>

          {/* Servicios column */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold text-foreground">Servicios</h4>
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
                Proyectos
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

          {/* Contacto column — dynamic */}
          <FooterContacto />
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
