import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";

interface PublicHeaderProps {
  onMenuToggle: () => void;
}

const navLinks = [
  { label: "Servicios", to: "/servicios" },
  { label: "Trabajo", to: "/portafolio" },
  { label: "Compañía", to: "/sobre-nosotros" },
  { label: "Recursos", to: "/sobre-nosotros" },
  { label: "Testimonios", to: "/testimonios" },
];

export function PublicHeader({ onMenuToggle }: PublicHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border"
      data-ocid="public.header"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" data-ocid="public.header.link">
            <img
              src="https://i.imgur.com/xGJXblj.png"
              alt="AldoLocutorio"
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

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            data-ocid="public.nav.toggle"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
