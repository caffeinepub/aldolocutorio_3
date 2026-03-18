import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  PortfolioCategory,
  PortfolioProject,
  Service,
  Testimonial,
} from "../../backend";
import { useActor } from "../../hooks/useActor";
import { safeBigIntToString } from "../../utils/BigIntSerializer";

// ─── Helpers ────────────────────────────────────────────────────────────────

const categoryLabel: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  saas: "SaaS",
  ai: "IA / AI",
  blockchain: "Blockchain",
  branding: "Branding",
};

function getCategoryLabel(cat: PortfolioCategory | string): string {
  return categoryLabel[cat as string] ?? String(cat);
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl bg-muted h-52" />
      ))}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  linkLabel: string;
  linkTo: string;
  ocid: string;
}

function SectionHeader({
  title,
  subtitle,
  linkLabel,
  linkTo,
  ocid,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>
      <Link
        to={linkTo}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline whitespace-nowrap shrink-0"
        data-ocid={ocid}
      >
        {linkLabel} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── Service Card ────────────────────────────────────────────────────────────

function ServiceCard({ service }: { service: Service }) {
  const iconUrl = service.icon?.getDirectURL?.();
  const serviceIdStr = safeBigIntToString(service.id);
  return (
    <Link
      to="/servicios/$serviceid"
      params={{ serviceid: serviceIdStr }}
      className="group block rounded-2xl border border-border bg-card p-6 hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
      data-ocid="services.item.1"
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
    </Link>
  );
}

// ─── Project Card ────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: PortfolioProject }) {
  const thumbUrl = project.thumbnail?.getDirectURL?.();
  const firstResult = project.results[0];
  const projectIdStr = safeBigIntToString(project.id);
  return (
    <Link
      to="/portafolio/$projectid"
      params={{ projectid: projectIdStr }}
      className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300"
      data-ocid="projects.item.1"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl opacity-30">🖼️</span>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-background/90 backdrop-blur text-foreground text-xs font-semibold px-2 py-1 rounded-full">
          {getCategoryLabel(project.category)}
        </span>
      </div>
      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {project.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{project.industry}</p>
        {firstResult && (
          <p className="mt-3 text-sm font-medium text-primary">{firstResult}</p>
        )}
      </div>
    </Link>
  );
}

// ─── Testimonial Card ────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: bigint }) {
  const n = Number(rating);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={
            i <= n
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const photoUrl = testimonial.photo?.getDirectURL?.();
  return (
    <div className="flex flex-col gap-4 bg-card rounded-2xl border border-border p-8 max-w-2xl mx-auto w-full">
      <StarRating rating={testimonial.rating} />
      <blockquote className="text-lg italic text-foreground/90 leading-relaxed">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-3 mt-auto">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={testimonial.authorName}
            className="w-10 h-10 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {testimonial.authorName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-sm text-foreground">
            {testimonial.authorName}
          </p>
          <p className="text-xs text-muted-foreground">
            {testimonial.jobTitle} · {testimonial.companyName}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Testimonials Carousel ───────────────────────────────────────────────────

function TestimonialsCarousel({
  testimonials,
}: { testimonials: Testimonial[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = testimonials.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + total) % total),
    [total],
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 50) prev();
    else if (delta < -50) next();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-ocid="testimonials.panel"
    >
      {/* Slide */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {testimonials.map((t) => (
            <div key={String(t.id)} className="min-w-full px-4">
              <TestimonialCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-background border border-border rounded-full p-2 shadow hover:shadow-md hover:border-primary transition-all"
            aria-label="Anterior testimonio"
            data-ocid="testimonials.pagination_prev"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-background border border-border rounded-full p-2 shadow hover:shadow-md hover:border-primary transition-all"
            aria-label="Siguiente testimonio"
            data-ocid="testimonials.pagination_next"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((t, i) => (
            <button
              key={String(t.id)}
              type="button"
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "w-6 bg-primary" : "bg-muted-foreground/30"}`}
              aria-label={`Ir al testimonio ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { actor } = useActor();
  const { data, isLoading } = useQuery({
    queryKey: ["homepageData"],
    queryFn: () => actor!.getHomepageData(),
    enabled: !!actor,
    staleTime: 60_000,
  });

  const services = data?.services ?? [];
  const featuredProjects = data?.featuredProjects ?? [];
  const testimonials = data?.testimonials ?? [];

  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative w-full overflow-hidden hero-gradient"
        style={{ minHeight: "580px" }}
        data-ocid="hero.section"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-blob hero-blob-3" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center py-28 gap-6">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur border border-border/60 text-foreground text-sm font-medium px-4 py-1.5 rounded-full shadow-sm">
            <MapPin size={14} className="text-primary" />
            Basados en Málaga, España 🇪🇸
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
            Transformamos tus ideas{" "}
            <span className="text-primary">en realidad digital</span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
            Desarrollo web y soluciones tecnológicas para negocios y
            particulares en Málaga, España
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              to="/portafolio"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/30"
              data-ocid="hero.primary_button"
            >
              Ver Nuestro Trabajo <ArrowRight size={16} />
            </Link>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 bg-background/80 backdrop-blur border border-border text-foreground font-semibold px-6 py-3 rounded-xl hover:border-primary hover:bg-background transition-all"
              data-ocid="hero.secondary_button"
            >
              Solicitar Presupuesto
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      {(isLoading || services.length > 0) && (
        <section
          className="py-20 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"
          data-ocid="services.section"
        >
          <SectionHeader
            title="Nuestros Servicios"
            subtitle="Soluciones adaptadas a tus necesidades"
            linkLabel="Ver Todos los Servicios"
            linkTo="/servicios"
            ocid="services.link"
          />
          {isLoading ? (
            <SectionSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((s) => (
                <ServiceCard key={String(s.id)} service={s} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Projects ─────────────────────────────────────────────────────── */}
      {(isLoading || featuredProjects.length > 0) && (
        <section className="py-20 bg-muted/40" data-ocid="projects.section">
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <SectionHeader
              title="Proyectos Destacados"
              subtitle="Algunos de nuestros trabajos recientes"
              linkLabel="Ver Todo el Portafolio"
              linkTo="/portafolio"
              ocid="projects.link"
            />
            {isLoading ? (
              <SectionSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredProjects.map((p) => (
                  <ProjectCard key={String(p.id)} project={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      {(isLoading || testimonials.length > 0) && (
        <section
          className="py-20 mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8"
          data-ocid="testimonials.section"
        >
          <SectionHeader
            title="Lo Que Dicen Nuestros Clientes"
            subtitle="Experiencias de quienes han confiado en nosotros"
            linkLabel="Ver Todos los Testimonios"
            linkTo="/testimonios"
            ocid="testimonials.link"
          />
          {isLoading ? (
            <div className="animate-pulse rounded-2xl bg-muted h-52 max-w-2xl mx-auto" />
          ) : (
            <TestimonialsCarousel testimonials={testimonials} />
          )}
        </section>
      )}
    </div>
  );
}

export { HomePage };
