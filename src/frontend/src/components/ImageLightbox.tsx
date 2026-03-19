import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface LightboxImage {
  id: string;
  url: string;
  filename: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const originalOverflow = useRef<string>("");

  // Reset index when lightbox opens or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      originalOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalOverflow.current;
    }
    return () => {
      document.body.style.overflow = originalOverflow.current;
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setCurrentIndex((i) => (i > 0 ? i - 1 : i));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : i));
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, images.length, onClose]);

  if (!isOpen || images.length === 0) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < images.length - 1;
  const image = images[currentIndex];

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) >= 50) {
      if (delta > 0 && canNext) setCurrentIndex((i) => i + 1);
      else if (delta < 0 && canPrev) setCurrentIndex((i) => i - 1);
    }
    touchStartX.current = null;
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay close is supplemental; Escape key is the primary keyboard handler
    <div
      aria-label="Visor de im\u00e1genes"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image area — pointer-events none on img prevents propagation issues */}
      <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center pointer-events-none">
        <img
          src={image.url}
          alt={image.filename}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Cerrar visor"
        data-ocid="portfolio.close_button"
      >
        <X size={20} aria-hidden="true" />
      </button>

      {/* Previous button */}
      <button
        type="button"
        onClick={() => canPrev && setCurrentIndex((i) => i - 1)}
        disabled={!canPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Imagen anterior"
        data-ocid="portfolio.secondary_button"
      >
        <ChevronLeft size={24} aria-hidden="true" />
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={() => canNext && setCurrentIndex((i) => i + 1)}
        disabled={!canNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-3 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Siguiente imagen"
        data-ocid="portfolio.secondary_button"
      >
        <ChevronRight size={24} aria-hidden="true" />
      </button>

      {/* Counter */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white text-sm select-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
