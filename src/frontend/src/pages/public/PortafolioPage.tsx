import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ExternalBlob, PortfolioProject } from "../../backend";
import { PortfolioCategory, PublishStatus } from "../../backend";
import ImageLightbox from "../../components/ImageLightbox";
import { useActor } from "../../hooks/useActor";
import { useSEO } from "../../hooks/useSEO";
import { safeBigIntToString } from "../../utils/BigIntSerializer";

// ─── Constants ────────────────────────────────────────────────────────────────

const HEADER_OFFSET = 88;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scrollToElement(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}

function categoryLabel(cat: PortfolioCategory): string {
  const map: Record<PortfolioCategory, string> = {
    [PortfolioCategory.web]: "Web",
    [PortfolioCategory.mobile]: "Mobile",
    [PortfolioCategory.saas]: "SaaS",
    [PortfolioCategory.ai]: "IA",
    [PortfolioCategory.blockchain]: "Blockchain",
    [PortfolioCategory.branding]: "Branding",
  };
  return map[cat] ?? String(cat);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[12px] border border-border bg-card p-6 md:p-8 animate-pulse space-y-6">
      <div className="h-7 w-2/3 bg-muted rounded" />
      <div className="h-5 w-1/3 bg-muted rounded" />
      <div className="aspect-video bg-muted rounded-xl" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
        <div className="h-4 w-4/6 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-muted rounded" />
        <div className="h-20 bg-muted rounded" />
      </div>
    </div>
  );
}

// ─── Gallery Carousel ────────────────────────────────────────────────────────

interface GalleryCarouselProps {
  images: ExternalBlob[];
}

function GalleryCarousel({ images }: GalleryCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const openLightbox = useCallback((idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  }, []);

  // Map ExternalBlob[] to lightbox-compatible format
  const lightboxImages = images.map((img, idx) => ({
    id: String(idx),
    url: img.getDirectURL(),
    filename: `imagen-${idx + 1}`,
  }));

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Sin imágenes</span>
      </div>
    );
  }

  const showControls = images.length > 1;

  return (
    <>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl group"
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return;
          const delta = touchStart - e.changedTouches[0].clientX;
          if (Math.abs(delta) > 40) {
            if (delta > 0) next();
            else prev();
          }
          setTouchStart(null);
        }}
      >
        {/* Clickable image */}
        <div className="aspect-video bg-muted">
          {isVisible ? (
            <button
              type="button"
              className="w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={() => openLightbox(current)}
              aria-label={`Ampliar imagen ${current + 1} de ${images.length}`}
            >
              <img
                src={images[current].getDirectURL()}
                alt={`Imagen ${current + 1}`}
                className="w-full h-full object-contain pointer-events-none"
                loading="lazy"
              />
            </button>
          ) : (
            <div className="w-full h-full animate-pulse bg-muted" />
          )}
        </div>

        {/* Navigation arrows */}
        {showControls && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm hover:bg-background transition-all md:opacity-0 md:group-hover:opacity-100"
              aria-label="Imagen anterior"
              data-ocid="portfolio.secondary_button"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-sm hover:bg-background transition-all md:opacity-0 md:group-hover:opacity-100"
              aria-label="Siguiente imagen"
              data-ocid="portfolio.secondary_button"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {showControls && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((img, dotIndex) => (
              <button
                key={img.getDirectURL()}
                type="button"
                onClick={() => setCurrent(dotIndex)}
                className={`w-2 h-2 rounded-full transition-all ${
                  dotIndex === current
                    ? "bg-white scale-110"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Ir a imagen ${dotIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: PortfolioProject;
  isHighlighted: boolean;
  index: number;
}

function ProjectCard({ project, isHighlighted, index }: ProjectCardProps) {
  const projectId = safeBigIntToString(project.id);
  const ocids = ["portfolio.item.1", "portfolio.item.2", "portfolio.item.3"];
  const ocid = ocids[index] ?? "portfolio.item.1";

  return (
    <article
      id={projectId}
      className={`rounded-[12px] border border-border bg-card shadow-sm p-6 md:p-8 scroll-mt-24 transition-all duration-500 ${
        isHighlighted ? "ring-2 ring-primary/60 bg-primary/5" : ""
      }`}
      data-ocid={ocid}
    >
      {/* Card header */}
      <header className="mb-5">
        <h2 className="text-2xl font-bold text-foreground mb-1">
          {project.title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {categoryLabel(project.category)} • {project.industry}
        </p>
      </header>

      {/* Gallery */}
      <div className="mb-6">
        <GalleryCarousel images={project.galleryImages} />
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Descripción
        </p>
        <p className="text-sm text-foreground leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Technologies + Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {project.technologiesUsed.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Tecnologías
            </p>
            <ul className="space-y-1.5">
              {project.technologiesUsed.map((tech) => (
                <li
                  key={tech}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        )}
        {project.tags.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Tags
            </p>
            <ul className="space-y-1.5">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Results */}
      {project.results.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Resultados
          </p>
          <ul className="space-y-1.5">
            {project.results.map((result) => (
              <li
                key={result}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {result}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project URL */}
      {project.projectUrl && (
        <div className="pt-1">
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visitar sitio web del proyecto: ${project.projectUrl}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline max-w-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="truncate">{project.projectUrl}</span>
          </a>
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            abre en nueva pestaña
          </p>
        </div>
      )}
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortafolioPage() {
  useSEO({
    title: "Portafolio de Proyectos | Aldotelico Málaga",
    description:
      "Explora nuestro portafolio de proyectos de desarrollo software en Málaga: tiendas online, plataformas e-commerce, soluciones para restaurantes, aplicaciones web descentralizadas y sistemas de gestión empresarial.",
    keywords:
      "portafolio desarrollo software Málaga, proyectos web Málaga, tiendas online ejemplos, aplicaciones restaurantes, casos de éxito desarrollo, clientes Aldotelico",
    canonical: "https://aldotelico.es/portafolio",
  });
  const params = useParams({ strict: false }) as { projectid?: string };
  const queryClient = useQueryClient();
  const { actor, isFetching: actorFetching } = useActor();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const scrolledRef = useRef(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portfolio", "all-published"],
    queryFn: () =>
      actor!.getPortfolioProjects(1n, 1000n, {
        status: PublishStatus.published,
        category: undefined,
        search: undefined,
      }),
    enabled: Boolean(actor) && !actorFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    if (!params.projectid) {
      window.scrollTo(0, 0);
    }
  }, [params.projectid]);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["portfolio", "all-published"] });
    };
  }, [queryClient]);

  const projects = (data?.items ?? []).filter(
    (p) => p.publishStatus === PublishStatus.published,
  );

  // Deep-link scroll
  useEffect(() => {
    if (!projects.length || scrolledRef.current) return;
    const pid = params.projectid;
    if (!pid) return;

    const exists = projects.some((p) => safeBigIntToString(p.id) === pid);
    if (!exists) {
      toast.error("Proyecto no encontrado", {
        description: "El proyecto solicitado no existe.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    scrolledRef.current = true;
    setTimeout(() => {
      scrollToElement(pid);
      setHighlightedId(pid);
    }, 150);
  }, [projects, params.projectid]);

  // Auto-clear highlight after 2s
  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14 animate-pulse space-y-3">
          <div className="h-10 w-64 bg-muted rounded-xl mx-auto" />
          <div className="h-5 w-80 bg-muted rounded-lg mx-auto" />
        </div>
        <div className="space-y-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="portfolio.error_state"
      >
        <div className="max-w-sm mx-auto bg-card border border-border rounded-2xl p-8 space-y-4">
          <p className="text-lg font-semibold text-foreground">
            Error al cargar los proyectos
          </p>
          <p className="text-sm text-muted-foreground">
            No se pudo obtener la información. Por favor, inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            data-ocid="portfolio.primary_button"
          >
            Reintentar
          </button>
          <div>
            <Link
              to="/"
              className="text-sm text-primary hover:underline"
              data-ocid="portfolio.link"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="portfolio.empty_state"
      >
        <p className="text-lg text-muted-foreground mb-4">
          Actualmente no hay proyectos disponibles. Por favor, vuelve más tarde.
        </p>
        <Link
          to="/"
          className="text-primary hover:underline text-sm"
          data-ocid="portfolio.link"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
      {/* Page header */}
      <header className="text-center mb-14" data-ocid="portfolio.section">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Nuestro Trabajo
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Selección de proyectos recientes
        </p>
      </header>

      {/* Projects list */}
      <div className="space-y-8" data-ocid="portfolio.list">
        {projects.map((project, i) => (
          <ProjectCard
            key={safeBigIntToString(project.id)}
            project={project}
            isHighlighted={highlightedId === safeBigIntToString(project.id)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
