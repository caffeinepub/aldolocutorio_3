import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const navLinks = [
  { label: "Servicios", to: "/servicios" },
  { label: "Trabajo", to: "/portafolio" },
  { label: "Compañía", to: "/sobre-nosotros" },
  { label: "Recursos", to: "/sobre-nosotros" },
  { label: "Testimonios", to: "/testimonios" },
];

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label="Cerrar menú"
        className={`fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        data-ocid="public.sidepanel.backdrop"
      />

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-background border-r border-border shadow-xl md:hidden
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        data-ocid="public.sidepanel.panel"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img
            src="https://i.imgur.com/pIzPFRP.png"
            alt="Aldotelico"
            style={{ height: "36px" }}
            className="object-contain"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Cerrar menú"
            data-ocid="public.sidepanel.close_button"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={onClose}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              activeProps={{
                className:
                  "px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-accent",
              }}
              data-ocid="public.sidepanel.link"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
