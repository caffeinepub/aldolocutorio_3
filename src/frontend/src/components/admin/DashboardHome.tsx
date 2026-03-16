import { useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FolderOpen,
  Inbox,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";

const dashboardCards = [
  { icon: FolderOpen, label: "Portafolio", to: "/admin/portfolio" as const },
  { icon: FileText, label: "Blog", to: "/admin/blog" as const },
  { icon: Wrench, label: "Servicios", to: "/admin/services" as const },
  {
    icon: MessageSquare,
    label: "Testimonios",
    to: "/admin/testimonials" as const,
  },
  { icon: Inbox, label: "Buzón de Contacto", to: null },
  {
    icon: Settings,
    label: "Config. Contacto",
    to: "/admin/contact-settings" as const,
  },
  { icon: SlidersHorizontal, label: "Ajustes", to: "/admin/settings" as const },
];

export function DashboardHome() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Panel de Control
      </h1>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-3 gap-4">
        {dashboardCards.map((card, i) => (
          <button
            type="button"
            key={card.label}
            data-ocid={`dashboard.card.${i + 1}`}
            onClick={() => card.to && navigate({ to: card.to })}
            disabled={!card.to}
            className="bg-card rounded-xl shadow-card p-6 flex flex-col items-center justify-center gap-3 h-40 transition-all duration-200 hover:shadow-card-hover hover:scale-[1.02] cursor-pointer disabled:cursor-default disabled:opacity-70 disabled:hover:scale-100 disabled:hover:shadow-card text-center group"
          >
            <card.icon className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="font-display text-base font-semibold text-foreground">
              {card.label}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile list */}
      <div className="md:hidden flex flex-col gap-3">
        {dashboardCards.map((card, i) => (
          <button
            type="button"
            key={card.label}
            data-ocid={`dashboard.card.${i + 1}`}
            onClick={() => card.to && navigate({ to: card.to })}
            disabled={!card.to}
            className="bg-card rounded-xl shadow-card px-5 flex items-center gap-4 h-20 w-full text-left disabled:opacity-70 disabled:cursor-default transition-colors hover:bg-accent"
          >
            <card.icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <span className="font-display text-base font-semibold text-foreground">
              {card.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
