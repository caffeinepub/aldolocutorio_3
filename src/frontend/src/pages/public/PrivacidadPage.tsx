import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSEO } from "../../hooks/useSEO";

const TOC_ITEMS = [
  { id: "introduccion", label: "Introducción" },
  { id: "datos", label: "Datos que Recopilamos" },
  { id: "finalidad", label: "Finalidad del Tratamiento" },
  { id: "base-legal", label: "Base Legal" },
  { id: "cookies", label: "Cookies y Tecnologías Similares" },
  { id: "openstreetmap", label: "OpenStreetMap" },
  { id: "plazos", label: "Plazos de Conservación" },
  { id: "derechos", label: "Tus Derechos" },
  { id: "seguridad", label: "Seguridad de los Datos" },
  { id: "transferencias", label: "Transferencias Internacionales" },
  { id: "cambios", label: "Cambios en la Política" },
  { id: "contacto", label: "Contacto" },
];

const HEADER_OFFSET = 88;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

function SectionHeading({
  id,
  children,
}: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="text-2xl font-bold text-foreground mb-4 scroll-mt-24"
    >
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">
      {children}
    </h3>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
      {children}
    </p>
  );
}

type BulletItem = { key: string; bold: string; rest: string };

function BoldBulletList({ items }: { items: BulletItem[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 ml-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
      {items.map(({ key, bold, rest }) => (
        <li key={key}>
          <span className="font-semibold">{bold}</span> {rest}
        </li>
      ))}
    </ul>
  );
}

function PlainBulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc list-inside space-y-1 ml-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <section className="mb-12">{children}</section>;
}

export default function PrivacidadPage() {
  useSEO({
    title: "Política de Privacidad | AldoLocutorio Málaga",
    description:
      "Política de privacidad de AldoLocutorio. Información sobre cómo recopilamos, utilizamos y protegemos tus datos personales como empresa de desarrollo software en Málaga.",
    canonical: "https://aldolocutorio.es/privacidad",
    robots: "noindex, follow",
  });
  const [activeId, setActiveId] = useState("introduccion");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    function onScroll() {
      let current = TOC_ITEMS[0].id;
      for (const item of TOC_ITEMS) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= HEADER_OFFSET + 32) {
          current = item.id;
        }
      }
      setActiveId(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground text-sm">
          Última actualización: 15 de marzo de 2024
        </p>
      </header>

      <div className="flex gap-12 items-start">
        {/* TOC — desktop sticky */}
        <aside
          className="hidden lg:block w-64 flex-shrink-0 sticky top-24"
          data-ocid="privacidad.panel"
        >
          <nav
            className="bg-muted/50 dark:bg-card rounded-xl p-6 border border-border"
            aria-label="Tabla de contenidos"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              Contenido
            </p>
            <ol className="space-y-1">
              {TOC_ITEMS.map(({ id, label }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(id);
                    }}
                    className={`w-full text-left text-sm py-1 px-2 rounded-md transition-colors ${
                      activeId === id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    data-ocid="privacidad.tab"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="flex-1 min-w-0">
          {/* TOC — mobile */}
          <nav
            className="lg:hidden bg-muted/50 dark:bg-card rounded-xl p-5 border border-border mb-10"
            aria-label="Tabla de contenidos"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Contenido
            </p>
            <ol className="space-y-1">
              {TOC_ITEMS.map(({ id, label }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(id);
                    }}
                    className="w-full text-left text-sm py-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          {/* 1 — Introducción */}
          <Section>
            <SectionHeading id="introduccion">Introducción</SectionHeading>
            <Body>
              En AldoLocutorio, nos tomamos muy en serio tu privacidad. Esta
              política describe cómo recopilamos, utilizamos y protegemos tu
              información personal cuando visitas nuestro sitio web o utilizamos
              nuestros servicios de desarrollo de software, consultoría
              tecnológica y soluciones digitales en Málaga, España.
            </Body>
          </Section>

          {/* 2 — Datos */}
          <Section>
            <SectionHeading id="datos">Datos que Recopilamos</SectionHeading>
            <SubHeading>
              Información que nos proporcionas directamente:
            </SubHeading>
            <PlainBulletList
              items={[
                "Nombre y apellidos",
                "Dirección de correo electrónico",
                "Número de teléfono",
                "Mensajes y consultas enviadas a través del formulario de contacto",
                "Información de facturación y datos fiscales (cuando contratas nuestros servicios)",
              ]}
            />
            <SubHeading>Información recopilada automáticamente:</SubHeading>
            <PlainBulletList
              items={[
                "Dirección IP",
                "Tipo de navegador y dispositivo",
                "Páginas visitadas y tiempo de navegación",
                "Preferencias de idioma",
                "Cookies funcionales y de análisis",
              ]}
            />
          </Section>

          {/* 3 — Finalidad */}
          <Section>
            <SectionHeading id="finalidad">
              Finalidad del Tratamiento
            </SectionHeading>
            <Body>
              Tratamos tus datos personales con las siguientes finalidades:
            </Body>
            <SubHeading>Gestión de consultas y comunicaciones:</SubHeading>
            <Body>
              Para responder a tus mensajes enviados a través del formulario de
              contacto o por email, y proporcionarte la información solicitada
              sobre nuestros servicios de desarrollo web, aplicaciones móviles,
              consultoría tecnológica y otros servicios.
            </Body>
            <SubHeading>Prestación de servicios:</SubHeading>
            <Body>
              Para gestionar la relación contractual si contratas nuestros
              servicios, incluyendo la facturación, comunicación durante el
              desarrollo del proyecto y soporte post-lanzamiento.
            </Body>
            <SubHeading>Mejora de la experiencia de usuario:</SubHeading>
            <Body>
              Para analizar cómo los visitantes utilizan nuestro sitio web,
              optimizar el contenido y la navegación, y asegurar que nuestro
              sitio se presenta de la manera más efectiva.
            </Body>
            <SubHeading>Envío de comunicaciones comerciales:</SubHeading>
            <Body>
              Con tu consentimiento explícito, podremos enviarte información
              sobre novedades, casos de éxito, ofertas especiales y contenido
              relevante sobre tecnología y desarrollo de software. Podrás darte
              de baja en cualquier momento.
            </Body>
            <SubHeading>Funcionalidad del sitio web:</SubHeading>
            <Body>
              Para asegurar el correcto funcionamiento técnico del sitio,
              incluyendo la visualización de mapas a través de OpenStreetMap y
              la autenticación segura mediante Internet Identity.
            </Body>
          </Section>

          {/* 4 — Base legal */}
          <Section>
            <SectionHeading id="base-legal">
              Base Legal para el Tratamiento
            </SectionHeading>
            <BoldBulletList
              items={[
                {
                  key: "contrato",
                  bold: "Ejecución de un contrato:",
                  rest: "Cuando nos solicitas información sobre nuestros servicios o contratas nuestros servicios de desarrollo.",
                },
                {
                  key: "consent",
                  bold: "Consentimiento:",
                  rest: "Para el envío de comunicaciones comerciales y para el uso de cookies no esenciales.",
                },
                {
                  key: "interes",
                  bold: "Interés legítimo:",
                  rest: "Para mejorar nuestro sitio web, prevenir fraudes y garantizar la seguridad de nuestras comunicaciones.",
                },
                {
                  key: "legal",
                  bold: "Cumplimiento de obligaciones legales:",
                  rest: "Para cumplir con la normativa fiscal y mercantil aplicable en España.",
                },
              ]}
            />
          </Section>

          {/* 5 — Cookies */}
          <Section>
            <SectionHeading id="cookies">
              Cookies y Tecnologías Similares
            </SectionHeading>
            <Body>Utilizamos las siguientes cookies en nuestro sitio web:</Body>
            <SubHeading>Cookies esenciales:</SubHeading>
            <Body>
              Necesarias para el funcionamiento básico del sitio. Incluyen
              cookies de autenticación de Internet Identity y cookies técnicas
              que permiten la navegación segura. No requieren consentimiento.
            </Body>
            <SubHeading>Cookies funcionales:</SubHeading>
            <Body>
              Permiten recordar tus preferencias (como el idioma) y mejorar tu
              experiencia de navegación.
            </Body>
            <SubHeading>Cookies de análisis:</SubHeading>
            <Body>
              Utilizamos herramientas de análisis anónimo para entender cómo los
              visitantes interactúan con nuestro sitio, qué secciones son más
              populares y cómo podemos mejorar. Esta información es agregada y
              no permite identificarte directamente.
            </Body>
            <SubHeading>Cookies de terceros:</SubHeading>
            <Body>
              A través de OpenStreetMap para mostrar nuestra ubicación, pueden
              establecerse cookies de este servicio cuando interactúas con el
              mapa.
            </Body>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mt-4">
              Puedes gestionar tus preferencias de cookies a través de nuestro
              banner de consentimiento o configurando tu navegador para
              rechazarlas.
            </p>
          </Section>

          {/* 6 — OpenStreetMap */}
          <Section>
            <SectionHeading id="openstreetmap">OpenStreetMap</SectionHeading>
            <Body>
              Nuestro sitio web utiliza OpenStreetMap para mostrar nuestra
              ubicación en Málaga. Al interactuar con el mapa, OpenStreetMap
              puede recopilar información sobre tu interacción, incluyendo tu
              dirección IP. Esta funcionalidad está sujeta a la política de
              privacidad de OpenStreetMap disponible en{" "}
              <a
                href="https://osm.org/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                https://osm.org/privacy
              </a>
              .
            </Body>
          </Section>

          {/* 7 — Plazos */}
          <Section>
            <SectionHeading id="plazos">Plazos de Conservación</SectionHeading>
            <Body>
              Conservamos tus datos personales durante el tiempo necesario para
              cumplir con la finalidad para la que fueron recogidos:
            </Body>
            <div className="mt-3">
              <BoldBulletList
                items={[
                  {
                    key: "consultas",
                    bold: "Consultas no contractuales:",
                    rest: "1 año desde la última comunicación.",
                  },
                  {
                    key: "clientes",
                    bold: "Datos de clientes:",
                    rest: "Durante la vigencia de la relación contractual y los plazos legales establecidos (5 años por requisitos fiscales en España).",
                  },
                  {
                    key: "marketing",
                    bold: "Datos de marketing:",
                    rest: "Hasta que solicites la baja.",
                  },
                  {
                    key: "analisis",
                    bold: "Datos de análisis:",
                    rest: "Periodos agregados sin identificación personal.",
                  },
                ]}
              />
            </div>
          </Section>

          {/* 8 — Derechos */}
          <Section>
            <SectionHeading id="derechos">Tus Derechos</SectionHeading>
            <Body>
              Como usuario residente en España y la Unión Europea, tienes
              derecho a:
            </Body>
            <div className="mt-3">
              <BoldBulletList
                items={[
                  {
                    key: "acceso",
                    bold: "Acceso:",
                    rest: "Solicitar confirmación de si estamos tratando tus datos y acceder a ellos.",
                  },
                  {
                    key: "rectif",
                    bold: "Rectificación:",
                    rest: "Solicitar la corrección de datos inexactos o incompletos.",
                  },
                  {
                    key: "supres",
                    bold: "Supresión:",
                    rest: "Solicitar la eliminación de tus datos cuando ya no sean necesarios.",
                  },
                  {
                    key: "oposi",
                    bold: "Oposición:",
                    rest: "Oponerte al tratamiento de tus datos para determinadas finalidades.",
                  },
                  {
                    key: "limit",
                    bold: "Limitación:",
                    rest: "Solicitar la limitación del tratamiento en determinadas circunstancias.",
                  },
                  {
                    key: "porta",
                    bold: "Portabilidad:",
                    rest: "Recibir tus datos en un formato estructurado y transmitirlos a otro responsable.",
                  },
                ]}
              />
            </div>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mt-4">
              Para ejercer estos derechos, visita nuestra página de contacto y
              envía tu solicitud. Responderemos en el plazo máximo de un mes.
            </p>
            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mt-2">
              También tienes derecho a presentar una reclamación ante la Agencia
              Española de Protección de Datos (AEPD) en{" "}
              <a
                href="https://www.aepd.es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:opacity-80 transition-opacity"
              >
                www.aepd.es
              </a>
              .
            </p>
          </Section>

          {/* 9 — Seguridad */}
          <Section>
            <SectionHeading id="seguridad">
              Seguridad de los Datos
            </SectionHeading>
            <Body>
              Implementamos medidas técnicas y organizativas apropiadas para
              proteger tus datos contra el acceso no autorizado, pérdida o
              destrucción, incluyendo:
            </Body>
            <div className="mt-3">
              <PlainBulletList
                items={[
                  "Cifrado de comunicaciones mediante HTTPS",
                  "Autenticación segura mediante Internet Identity",
                  "Acceso restringido a datos personales",
                  "Copias de seguridad periódicas",
                  "Monitorización continua de seguridad",
                ]}
              />
            </div>
          </Section>

          {/* 10 — Transferencias */}
          <Section>
            <SectionHeading id="transferencias">
              Transferencias Internacionales
            </SectionHeading>
            <Body>
              Tus datos no serán transferidos fuera del Espacio Económico
              Europeo. Los servicios de terceros que utilizamos (OpenStreetMap)
              cumplen con la normativa europea de protección de datos.
            </Body>
          </Section>

          {/* 11 — Cambios */}
          <Section>
            <SectionHeading id="cambios">
              Cambios en la Política de Privacidad
            </SectionHeading>
            <Body>
              Podemos actualizar esta política periódicamente para reflejar
              cambios en nuestras prácticas o por requisitos legales. La versión
              actualizada se publicará en esta página con la fecha de
              &ldquo;Última actualización&rdquo;. Te recomendamos revisar esta
              página ocasionalmente.
            </Body>
          </Section>

          {/* 12 — Contacto */}
          <Section>
            <SectionHeading id="contacto">Contacto</SectionHeading>
            <Body>
              Para cualquier cuestión relacionada con esta política de
              privacidad o el tratamiento de tus datos, puedes contactarnos a
              través de nuestra página de contacto.
            </Body>
            <div className="mt-16 mb-8 flex justify-center">
              <Link
                to="/contacto"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity text-base"
                data-ocid="privacidad.primary_button"
              >
                Ir a la página de Contacto →
              </Link>
            </div>
          </Section>
        </article>
      </div>
    </div>
  );
}
