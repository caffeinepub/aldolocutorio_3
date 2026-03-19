import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Service } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { useSEO } from "../../hooks/useSEO";

// ─── Helpers ────────────────────────────────────────────────────────────────

const HEADER_OFFSET = 88;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="space-y-3">
        <div className="h-10 w-64 bg-muted rounded-xl mx-auto" />
        <div className="h-5 w-96 bg-muted rounded-lg mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-muted h-52" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
          <div className="h-4 w-5/6 bg-muted rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Process Timeline ────────────────────────────────────────────────────────

interface ProcessTimelineProps {
  steps: Array<{ step: string; description: string }>;
}

function ProcessTimeline({ steps }: ProcessTimelineProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (!steps.length) return null;

  return (
    <div ref={ref}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Nuestro proceso
      </p>

      {/* Desktop: horizontal */}
      <div className="hidden lg:flex items-start gap-0">
        {steps.map((s, i) => (
          <div
            key={s.step}
            className="flex-1 flex flex-col items-center text-center"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}
          >
            <div className="relative flex items-center w-full">
              {i > 0 && <div className="flex-1 h-px bg-border" />}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10 bg-primary text-primary-foreground shadow-md">
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-border" />
              )}
            </div>
            <div className="mt-3 px-2">
              <p className="font-semibold text-sm text-foreground">{s.step}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="flex lg:hidden flex-col gap-0">
        {steps.map((s, i) => (
          <div
            key={s.step}
            className="flex gap-4"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-12px)",
              transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className="w-px flex-1 bg-border my-1" />
              )}
            </div>
            <div className="pb-6">
              <p className="font-semibold text-sm text-foreground">{s.step}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {s.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

interface FaqAccordionProps {
  faqs: Array<{ question: string; answer: string }>;
}

function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Preguntas frecuentes
      </p>
      <div className="space-y-2" data-ocid="services.panel">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={faq.question}
              className="border border-border rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
                aria-expanded={isOpen}
                data-ocid="services.toggle"
              >
                <span className="font-medium text-sm text-foreground">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                ) : (
                  <ChevronDown
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                )}
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                  transition: "grid-template-rows 0.25s ease",
                }}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Service Detail Section ───────────────────────────────────────────────────

interface ServiceDetailSectionProps {
  service: Service;
  isLast: boolean;
}

function ServiceDetailSection({ service, isLast }: ServiceDetailSectionProps) {
  const iconUrl = service.icon?.getDirectURL?.();
  const sectionId = String(service.id);

  return (
    <>
      <section
        id={sectionId}
        className="scroll-mt-24 py-12"
        data-ocid="services.section"
      >
        {/* Section header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="shrink-0">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={service.title}
                className="w-16 h-16 object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {service.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {service.fullDescription}
            </p>
          </div>
        </div>

        {/* Use cases + Process */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
          {service.useCases.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Casos de uso típicos
              </p>
              <ul className="space-y-2">
                {service.useCases.map((uc) => (
                  <li
                    key={uc}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2
                      size={16}
                      className="text-primary mt-0.5 shrink-0"
                    />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {service.processSteps.length > 0 && (
            <ProcessTimeline steps={service.processSteps} />
          )}
        </div>

        {/* Target audience */}
        {service.targetAudience && (
          <div className="bg-muted rounded-xl p-5 border border-border mb-8 flex items-start gap-3">
            <Users size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                ¿Para quién es este servicio?
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {service.targetAudience}
              </p>
            </div>
          </div>
        )}

        {/* FAQ */}
        {service.faqs.length > 0 && (
          <div className="mb-8">
            <FaqAccordion faqs={service.faqs} />
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center md:justify-start">
          <Link
            to="/contacto"
            search={{ servicio: service.title }}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20 w-full md:w-auto justify-center"
            data-ocid="services.primary_button"
          >
            <MessageCircle size={16} />
            Solicitar presupuesto para este servicio
          </Link>
        </div>
      </section>

      {!isLast && <hr className="border-border" />}
    </>
  );
}

// ─── Sticky Sidebar ───────────────────────────────────────────────────────────

interface StickyServiceSidebarProps {
  services: Service[];
  activeId: string | null;
  onSelect: (service: Service) => void;
}

function StickyServiceSidebar({
  services,
  activeId,
  onSelect,
}: StickyServiceSidebarProps) {
  return (
    <aside
      className="hidden lg:flex flex-col sticky top-24 h-fit w-56 shrink-0"
      data-ocid="services.panel"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 px-2">
        Servicios
      </p>
      <nav className="flex flex-col gap-1">
        {services.map((s) => {
          const iconUrl = s.icon?.getDirectURL?.();
          const isActive = activeId === String(s.id);
          return (
            <button
              key={String(s.id)}
              type="button"
              onClick={() => onSelect(s)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-ocid="services.link"
            >
              <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt=""
                    className="w-5 h-5 object-contain"
                  />
                ) : (
                  <span className="text-xs">⚡</span>
                )}
              </span>
              <span className="line-clamp-1">{s.title}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-6 pt-4 border-t border-border">
        <Link
          to="/contacto"
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          data-ocid="services.secondary_button"
        >
          <MessageCircle size={14} />
          Contactar
        </Link>
      </div>
    </aside>
  );
}

// ─── Overview Card ───────────────────────────────────────────────────────────

interface OverviewCardProps {
  service: Service;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

function OverviewCard({
  service,
  isActive,
  onClick,
  index,
}: OverviewCardProps) {
  const iconUrl = service.icon?.getDirectURL?.();
  const ocids = ["services.item.1", "services.item.2", "services.item.3"];
  const ocid = ocids[index] ?? "services.item.1";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 ${
        isActive ? "ring-2 ring-primary bg-primary/5 border-primary" : ""
      }`}
      data-ocid={ocid}
    >
      <div className="mb-4">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={service.title}
            className="w-12 h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
        )}
      </div>
      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {service.title}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-1">
        {service.shortDescription}
      </p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Ver más <ArrowRight size={12} />
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ServiciosPage() {
  useSEO({
    title: "Servicios de Desarrollo Software | Aldotelico Málaga",
    description:
      "Descubre nuestros servicios de desarrollo software en Málaga: tiendas online, paneles de administración, soluciones para restaurantes, aplicaciones descentralizadas y sistemas de facturación. Soluciones a medida para tu negocio.",
    keywords:
      "servicios desarrollo software Málaga, desarrollo web Málaga, creación tiendas online, paneles administración, software restaurantes, aplicaciones descentralizadas, sistemas facturación, TPV digital Málaga",
    canonical: "https://aldotelico.es/servicios",
  });
  const params = useParams({ strict: false }) as { serviceid?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { actor, isFetching: actorFetching } = useActor();
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const scrolledRef = useRef(false);
  const observersRef = useRef<IntersectionObserver[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["services", "all-visible"],
    queryFn: () =>
      actor!.getServices(1n, 1000n, { isVisible: true, search: undefined }),
    enabled: Boolean(actor) && !actorFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!params.serviceid) {
      window.scrollTo(0, 0);
    }
  }, [params.serviceid]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["services", "all-visible"] });
    };
  }, [queryClient]);

  const services = (data?.items ?? []).filter((s) => s.isVisible);

  // Deep-link scroll after data loads
  useEffect(() => {
    if (!services.length || scrolledRef.current) return;
    const sid = params.serviceid;
    if (!sid) return;

    const exists = services.some((s) => String(s.id) === sid);
    if (!exists) {
      toast.error("Servicio no encontrado", {
        description: "El servicio solicitado no existe.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    scrolledRef.current = true;
    setTimeout(() => {
      scrollToSection(sid);
      setActiveServiceId(sid);
    }, 100);
  }, [services, params.serviceid]);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    if (!services.length) return;

    for (const obs of observersRef.current) {
      obs.disconnect();
    }
    observersRef.current = [];

    for (const s of services) {
      const el = document.getElementById(String(s.id));
      if (!el) continue;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const sid = String(s.id);
            setActiveServiceId(sid);
            navigate({
              to: "/servicios/$serviceid",
              params: { serviceid: sid },
              replace: true,
            });
          }
        },
        { threshold: 0.3, rootMargin: "-80px 0px 0px 0px" },
      );
      obs.observe(el);
      observersRef.current.push(obs);
    }

    return () => {
      for (const obs of observersRef.current) {
        obs.disconnect();
      }
    };
  }, [services, navigate]);

  function handleCardClick(service: Service) {
    const sid = String(service.id);
    setActiveServiceId(sid);
    scrollToSection(sid);
    navigate({
      to: "/servicios/$serviceid",
      params: { serviceid: sid },
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
        <PageSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="services.error_state"
      >
        <div className="max-w-sm mx-auto bg-card border border-border rounded-2xl p-8 space-y-4">
          <p className="text-lg font-semibold text-foreground">
            Error al cargar los servicios
          </p>
          <p className="text-sm text-muted-foreground">
            No se pudo obtener la información. Por favor, inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            data-ocid="services.primary_button"
          >
            Reintentar
          </button>
          <div>
            <Link
              to="/"
              className="text-sm text-primary hover:underline"
              data-ocid="services.link"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="services.empty_state"
      >
        <p className="text-lg text-muted-foreground mb-4">
          Actualmente no hay servicios disponibles. Por favor, vuelve más tarde.
        </p>
        <Link
          to="/"
          className="text-primary hover:underline text-sm"
          data-ocid="services.link"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
      {/* Page header */}
      <header className="text-center mb-14" data-ocid="services.section">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Nuestros Servicios
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Soluciones adaptadas a las necesidades de tu negocio
        </p>
      </header>

      {/* Overview grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        data-ocid="services.list"
      >
        {services.map((s, i) => (
          <OverviewCard
            key={String(s.id)}
            service={s}
            isActive={activeServiceId === String(s.id)}
            onClick={() => handleCardClick(s)}
            index={i}
          />
        ))}
      </div>

      {/* Main content + sidebar */}
      <div className="flex gap-12 items-start">
        <div className="flex-1 min-w-0">
          {services.map((s, i) => (
            <ServiceDetailSection
              key={String(s.id)}
              service={s}
              isLast={i === services.length - 1}
            />
          ))}

          <div className="mt-16 text-center" data-ocid="services.card">
            <p className="text-muted-foreground mb-4">
              ¿No encuentras lo que buscas?
            </p>
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
              data-ocid="services.primary_button"
            >
              <MessageCircle size={16} />
              Contáctanos para más información
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <StickyServiceSidebar
          services={services}
          activeId={activeServiceId}
          onSelect={handleCardClick}
        />
      </div>
    </div>
  );
}
