import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

interface PublicHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  onMenuClose: () => void;
}

const navLinks = [
  { label: "Servicios", to: "/servicios" },
  { label: "Proyectos", to: "/portafolio" },
  { label: "Testimonios", to: "/testimonios" },
  { label: "Contacto", to: "/contacto" },
  { label: "Privacidad", to: "/privacidad" },
];

export function PublicHeader({
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
}: PublicHeaderProps) {
  return (
    <div className="sticky top-0 z-40 w-full" data-ocid="public.header_wrapper">
      {/* Main header bar */}
      <header
        className="w-full bg-background/95 backdrop-blur border-b border-border"
        data-ocid="public.header"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" data-ocid="public.header.link">
              <img
                src="https://i.imgur.com/pIzPFRP.png"
                alt="Aldotelico"
                style={{ width: "200px", height: "auto" }}
                className="object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-6"
              data-ocid="public.nav.panel"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  activeProps={{ className: "text-primary font-semibold" }}
                  data-ocid="public.nav.link"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger / X */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={onMenuToggle}
              aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={isMenuOpen}
              data-ocid="public.nav.toggle"
            >
              <span
                className="block transition-all duration-200"
                style={{
                  transform: isMenuOpen ? "rotate(90deg)" : "rotate(0deg)",
                  opacity: 1,
                }}
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile expanding menu — below header bar, pushes content down */}
      <div
        className={`md:hidden w-full bg-background border-b border-border overflow-hidden transition-all ease-in-out ${
          isMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ transitionDuration: "250ms" }}
        data-ocid="public.mobile_menu"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-4">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={onMenuClose}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-accent"
              aria-label="Cerrar menú"
              data-ocid="public.mobile_menu.close"
            >
              <X size={16} />
              Cerrar
            </button>
          </div>

          {/* Nav items */}
          <nav
            className="flex flex-col gap-2"
            data-ocid="public.mobile_menu.nav"
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={onMenuClose}
                className="w-full text-center py-3 px-4 rounded-lg text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors border border-border"
                activeProps={{
                  className:
                    "w-full text-center py-3 px-4 rounded-lg text-base font-medium text-primary bg-accent border border-primary/30",
                }}
                data-ocid="public.mobile_menu.link"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
