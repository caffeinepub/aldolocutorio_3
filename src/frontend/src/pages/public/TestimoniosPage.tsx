import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Testimonial } from "../../backend";
import { useActor } from "../../hooks/useActor";
import { safeBigIntToString } from "../../utils/BigIntSerializer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStars(rating: bigint) {
  const r = Number(rating);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Valoración: ${r} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="text-2xl leading-none select-none"
          style={{ color: n <= r ? "#FBBF24" : "#D1D5DB" }}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function calcAverage(testimonials: Testimonial[]): string {
  if (!testimonials.length) return "0.0";
  const sum = testimonials.reduce((acc, t) => acc + Number(t.rating), 0);
  return (sum / testimonials.length).toFixed(1);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[12px] border border-border bg-card p-8 animate-pulse space-y-5">
      <div className="h-6 w-24 bg-muted rounded" />
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
        <div className="h-4 w-4/6 bg-muted rounded" />
      </div>
      <div className="flex items-center gap-4 bg-muted/40 rounded-lg p-4">
        <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-3 w-28 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────

interface TestimonialCardProps {
  testimonial: Testimonial;
  isHighlighted: boolean;
  index: number;
}

function TestimonialCard({
  testimonial,
  isHighlighted,
  index,
}: TestimonialCardProps) {
  const tid = safeBigIntToString(testimonial.id);
  const ocids = [
    "testimonials.item.1",
    "testimonials.item.2",
    "testimonials.item.3",
  ];
  const ocid = ocids[index] ?? "testimonials.item.1";
  const initials = testimonial.authorName.charAt(0).toUpperCase();

  return (
    <article
      id={tid}
      className={`rounded-[12px] border border-border bg-card shadow-sm p-8 scroll-mt-24 transition-all duration-500 hover:shadow-lg ${
        isHighlighted ? "ring-2 ring-primary/60 bg-primary/5" : ""
      }`}
      data-ocid={ocid}
    >
      {/* Stars */}
      {renderStars(testimonial.rating)}

      {/* Quote */}
      <blockquote className="text-lg md:text-xl italic text-foreground/80 leading-relaxed my-6">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Author section */}
      <div className="bg-muted/40 rounded-lg p-4 mt-4 flex items-center gap-4">
        {testimonial.photo ? (
          <img
            src={testimonial.photo.getDirectURL()}
            alt={testimonial.authorName}
            className="w-14 h-14 rounded-full object-cover shrink-0"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="font-bold text-base text-foreground">
            {testimonial.authorName}
          </p>
          <p className="text-sm text-muted-foreground">
            {testimonial.jobTitle}
          </p>
          <p className="text-sm text-muted-foreground italic">
            {testimonial.companyName}
          </p>
        </div>
      </div>

      {/* Linked project */}
      {testimonial.linkedPortfolioId !== undefined &&
        testimonial.linkedPortfolioId !== null && (
          <div className="mt-4">
            <Link
              to="/portafolio/$projectid"
              params={{
                projectid: safeBigIntToString(testimonial.linkedPortfolioId),
              }}
              className="inline-flex items-center gap-2 border border-border rounded-lg px-4 py-2 text-sm hover:bg-muted transition-colors"
              data-ocid="testimonials.link"
            >
              Ver proyecto relacionado →
            </Link>
          </div>
        )}
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TestimoniosPage() {
  const params = useParams({ strict: false }) as { testimonioid?: string };
  const queryClient = useQueryClient();
  const { actor, isFetching: actorFetching } = useActor();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const scrolledRef = useRef(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["testimonials", "all-visible"],
    queryFn: () =>
      actor!.getTestimonials(1n, 1000n, {
        isVisible: true,
        minRating: undefined,
        maxRating: undefined,
        search: undefined,
      }),
    enabled: Boolean(actor) && !actorFetching,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["testimonials", "all-visible"] });
    };
  }, [queryClient]);

  const testimonials = (data?.items ?? []).filter((t) => t.isVisible === true);

  // Error toast
  useEffect(() => {
    if (isError) {
      toast.error("Error al cargar los testimonios", {
        description:
          "No se pudo obtener la información. Por favor, inténtalo de nuevo.",
      });
    }
  }, [isError]);

  // Deep-link scroll (if ever linked to a specific testimonial)
  useEffect(() => {
    if (!testimonials.length || scrolledRef.current) return;
    const tid = params.testimonioid;
    if (!tid) return;
    const exists = testimonials.some((t) => safeBigIntToString(t.id) === tid);
    if (!exists) {
      toast.error("Testimonio no encontrado", {
        description: "El testimonio solicitado no existe.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    scrolledRef.current = true;
    setTimeout(() => {
      const el = document.getElementById(tid);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setHighlightedId(tid);
    }, 150);
  }, [testimonials, params.testimonioid]);

  useEffect(() => {
    if (!highlightedId) return;
    const timer = setTimeout(() => setHighlightedId(null), 2000);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  // ── Schema.org structured data ───────────────────────────────────────────────
  const avgRating = calcAverage(testimonials);
  const schemaData = testimonials.length
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ItemList",
            itemListElement: testimonials.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: {
                "@type": "Review",
                reviewBody: t.quote,
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: Number(t.rating),
                  bestRating: 5,
                  worstRating: 1,
                },
                author: {
                  "@type": "Person",
                  name: t.authorName,
                  jobTitle: t.jobTitle,
                },
                itemReviewed: {
                  "@type": "Organization",
                  name: t.companyName,
                },
              },
            })),
          },
          {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: testimonials.length,
            bestRating: 5,
            worstRating: 1,
          },
        ],
      })
    : null;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-14 animate-pulse space-y-3">
          <div className="h-10 w-72 bg-muted rounded-xl mx-auto" />
          <div className="h-5 w-96 bg-muted rounded-lg mx-auto" />
        </div>
        <div className="h-10 w-56 bg-muted rounded-full mx-auto mb-10" />
        <div className="space-y-8" data-ocid="testimonials.loading_state">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="testimonials.error_state"
      >
        <div className="max-w-sm mx-auto bg-card border border-border rounded-2xl p-8 space-y-4">
          <p className="text-lg font-semibold text-foreground">
            Error al cargar los testimonios
          </p>
          <p className="text-sm text-muted-foreground">
            No se pudo obtener la información. Por favor, inténtalo de nuevo.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            data-ocid="testimonials.primary_button"
          >
            Reintentar
          </button>
          <div>
            <Link
              to="/"
              className="text-sm text-primary hover:underline"
              data-ocid="testimonials.link"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (!testimonials.length) {
    return (
      <div
        className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-24 text-center"
        data-ocid="testimonials.empty_state"
      >
        <p className="text-lg text-muted-foreground mb-4">
          Actualmente no hay testimonios disponibles. Por favor, vuelve más
          tarde.
        </p>
        <Link
          to="/"
          className="text-primary hover:underline text-sm"
          data-ocid="testimonials.link"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // ── Full page ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16">
      {/* Schema.org */}
      {schemaData && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
          dangerouslySetInnerHTML={{ __html: schemaData }}
        />
      )}

      {/* Page header */}
      <header className="text-center mb-10" data-ocid="testimonials.section">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Testimonios de Clientes
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Lo que dicen nuestros clientes sobre su experiencia trabajando con
          nosotros
        </p>
      </header>

      {/* Stats bar */}
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center gap-2 bg-muted/60 border border-border rounded-full px-5 py-2 text-sm font-medium text-foreground">
          <span className="text-base" aria-hidden="true">
            ⭐
          </span>
          <span>
            {avgRating}/5 basado en {testimonials.length} testimonios
          </span>
        </div>
      </div>

      {/* Testimonials list */}
      <div className="space-y-8" data-ocid="testimonials.list">
        {testimonials.map((testimonial, i) => (
          <TestimonialCard
            key={safeBigIntToString(testimonial.id)}
            testimonial={testimonial}
            isHighlighted={highlightedId === safeBigIntToString(testimonial.id)}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
