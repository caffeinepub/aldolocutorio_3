import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type { ContactSettings } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { useSEO } from "../../hooks/useSEO";
import { safeConvertToNumber } from "../../utils/NumericConverter";

function formatSpanishPhoneDisplay(raw: string): string {
  if (!raw) return raw;
  let cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) cleaned = `+${cleaned}`;
  const match = cleaned.match(/^\+(34)(\d{3})(\d{3})(\d{3})$/);
  if (match) return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  const generic = cleaned.match(/^\+(\d{1,3})(\d{3})(\d{3})(\d{3,})$/);
  if (generic)
    return `+${generic[1]} ${generic[2]} ${generic[3]} ${generic[4]}`;
  return raw;
}

function toTelLink(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

function toWaNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-xl font-semibold text-foreground">{label}</h3>
    </div>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return <div className="h-4 bg-muted rounded" style={{ width }} />;
}

function SkeletonCardSmall() {
  return (
    <div className="bg-white dark:bg-card rounded-[20px] shadow-md p-10 animate-pulse space-y-5">
      <div className="h-6 w-48 bg-muted rounded" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="80%" />
    </div>
  );
}

function SkeletonCardLarge() {
  return (
    <div className="bg-white dark:bg-card rounded-[20px] shadow-md p-10 animate-pulse space-y-5">
      <div className="h-[280px] bg-muted rounded-xl" />
      <div className="h-6 w-48 bg-muted rounded" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="90%" />
      <SkeletonLine width="70%" />
      <SkeletonLine width="80%" />
    </div>
  );
}

const SECTION_KEYS = ["phone", "email", "whatsapp"] as const;

function ContactMethodsCard({ settings }: { settings: ContactSettings }) {
  const { phone, email, whatsapp } = settings;

  type SectionEntry = {
    id: (typeof SECTION_KEYS)[number];
    node: React.ReactNode;
  };
  const sections: SectionEntry[] = [];

  if (phone.isEnabled && phone.primary) {
    sections.push({
      id: "phone",
      node: (
        <div>
          <SectionHeader icon="📞" label="Teléfono" />
          <div className="space-y-1 ml-9">
            <a
              href={`tel:${toTelLink(phone.primary)}`}
              className="block text-lg text-foreground hover:text-primary transition-colors"
              data-ocid="contact.phone_primary"
            >
              {formatSpanishPhoneDisplay(phone.primary)}
            </a>
            {phone.secondary && (
              <a
                href={`tel:${toTelLink(phone.secondary)}`}
                className="block text-base text-gray-600 hover:text-primary transition-colors"
                data-ocid="contact.phone_secondary"
              >
                {formatSpanishPhoneDisplay(phone.secondary)}
              </a>
            )}
          </div>
        </div>
      ),
    });
  }

  sections.push({
    id: "email",
    node: (
      <div>
        <SectionHeader icon="✉️" label="Email" />
        <div className="space-y-1 ml-9">
          <a
            href={`mailto:${email.primary}`}
            className="block text-lg text-foreground hover:text-primary transition-colors"
            data-ocid="contact.email_primary"
          >
            {email.primary}
          </a>
          {email.secondary && (
            <a
              href={`mailto:${email.secondary}`}
              className="block text-base text-gray-600 hover:text-primary transition-colors"
              data-ocid="contact.email_secondary"
            >
              {email.secondary}
            </a>
          )}
          <p className="text-sm text-gray-500 italic pt-1">
            ⏱️ {email.responseTime}
          </p>
        </div>
      </div>
    ),
  });

  if (whatsapp.isEnabled) {
    const waNumber = whatsapp.number ? toWaNumber(whatsapp.number) : "";
    sections.push({
      id: "whatsapp",
      node: (
        <div>
          <SectionHeader icon="💬" label="WhatsApp" />
          <div className="ml-9">
            {whatsapp.number && (
              <p className="text-lg text-foreground mb-2">
                {formatSpanishPhoneDisplay(whatsapp.number)}
              </p>
            )}
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-green-500 text-green-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors mt-3"
                data-ocid="contact.whatsapp_button"
              >
                Abrir WhatsApp →
              </a>
            )}
          </div>
        </div>
      ),
    });
  }

  return (
    <div
      className="bg-white dark:bg-card rounded-[20px] shadow-md p-10"
      data-ocid="contact.card_methods"
    >
      <div className="space-y-0">
        {sections.map(({ id, node }, i) => (
          <div key={id}>
            {i > 0 && <hr className="border-border my-6" />}
            {node}
          </div>
        ))}
      </div>
    </div>
  );
}

const DAYS: {
  label: string;
  key: keyof ContactSettings["address"]["businessHours"];
}[] = [
  { label: "Lunes", key: "monday" },
  { label: "Martes", key: "tuesday" },
  { label: "Miércoles", key: "wednesday" },
  { label: "Jueves", key: "thursday" },
  { label: "Viernes", key: "friday" },
  { label: "Sábado", key: "saturday" },
  { label: "Domingo", key: "sunday" },
];

function LocationHoursCard({ settings }: { settings: ContactSettings }) {
  const { address, map } = settings;
  const lat = safeConvertToNumber(map.latitude) ?? 0;
  const lon = safeConvertToNumber(map.longitude) ?? 0;
  const bbox = `${lon - 0.008},${lat - 0.008},${lon + 0.008},${lat + 0.008}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}`;
  const googleUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return (
    <div
      className="bg-white dark:bg-card rounded-[20px] shadow-md p-10"
      data-ocid="contact.card_location"
    >
      <a
        href={mapUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-ocid="contact.map_marker"
      >
        <iframe
          src={mapSrc}
          width="100%"
          height="280"
          className="rounded-xl border border-border"
          title="Mapa"
          loading="lazy"
        />
      </a>

      <div className="mt-6">
        <SectionHeader icon="📍" label="Dirección" />
        <div className="ml-9">
          <p className="text-lg text-foreground mb-3">{address.fullAddress}</p>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-blue-500 text-blue-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors mt-3"
            data-ocid="contact.directions_button"
          >
            Cómo llegar →
          </a>
        </div>
      </div>

      <hr className="border-border my-6" />

      <div>
        <SectionHeader icon="🕒" label="Horario de atención" />
        <dl className="ml-9 space-y-2">
          {DAYS.map(({ label, key }) => (
            <div key={key} className="flex gap-2">
              <dt className="w-28 font-medium text-foreground text-[17px]">
                {label}:
              </dt>
              <dd className="text-gray-600 text-[15px]">
                {address.businessHours[key]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function ContactoPage() {
  useSEO({
    title: "Contacto | AldoLocutorio Desarrollo Software Málaga",
    description:
      "Contacta con AldoLocutorio para tu proyecto de desarrollo software en Málaga. Estamos en C. Albertillas, 5, LOCAL, 29003 Málaga. Email: aldolocutoriomalaga@gmail.com",
    keywords:
      "contacto desarrollo software Málaga, email AldoLocutorio, dirección Málaga, teléfono, WhatsApp, pedir presupuesto software Málaga",
    canonical: "https://aldolocutorio.es/contacto",
  });
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<ContactSettings>({
    queryKey: ["contact-settings", "public"],
    queryFn: () => actor!.getContactSettings(),
    enabled: Boolean(actor) && !actorFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["contact-settings", "public"] });
    };
  }, [queryClient]);

  useEffect(() => {
    if (isError) {
      toast.error("Error al cargar la información de contacto");
    }
  }, [isError]);

  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6 lg:px-8 py-16">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Contacto
        </h1>
        <p className="text-muted-foreground text-lg">
          Estamos aquí para ayudarte
        </p>
      </header>

      {(isLoading || actorFetching) && (
        <div className="space-y-10">
          <SkeletonCardSmall />
          <SkeletonCardLarge />
        </div>
      )}

      {isError && !isLoading && (
        <div
          className="text-center py-24 space-y-4"
          data-ocid="contact.error_state"
        >
          <p className="text-lg font-semibold text-foreground">
            Error al cargar la información de contacto
          </p>
          <p className="text-sm text-muted-foreground">
            No se pudo obtener la información. Por favor, inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            data-ocid="contact.retry_button"
          >
            Reintentar
          </button>
        </div>
      )}

      {data && !isError && (
        <div className="space-y-10">
          <ContactMethodsCard settings={data} />
          <LocationHoursCard settings={data} />
        </div>
      )}
    </div>
  );
}
