import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Download,
  FileText,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  Upload,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useAdminStore } from "../../store/adminStore";

const navItems = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/admin" as const,
  },
  {
    id: "portfolio",
    icon: FolderOpen,
    label: "Portafolio",
    to: "/admin/portfolio" as const,
  },
  { id: "blog", icon: FileText, label: "Blog", to: "/admin/blog" as const },
  {
    id: "services",
    icon: Wrench,
    label: "Servicios",
    to: "/admin/services" as const,
  },
  {
    id: "testimonials",
    icon: MessageSquare,
    label: "Testimonios",
    to: "/admin/testimonials" as const,
  },
  { id: "inbox", icon: Inbox, label: "Buzón de Contacto", to: null as null },
  {
    id: "contact-settings",
    icon: Settings,
    label: "Config. Contacto",
    to: "/admin/contact-settings" as const,
  },
  {
    id: "data-export",
    icon: Upload,
    label: "Exportar Datos",
    to: "/admin/data-export" as const,
  },
  {
    id: "data-import",
    icon: Download,
    label: "Importar Datos",
    to: "/admin/data-import" as const,
  },
  {
    id: "settings",
    icon: SlidersHorizontal,
    label: "Ajustes",
    to: "/admin/settings" as const,
  },
];

function NavItemContent({
  icon: Icon,
  label,
  expanded,
}: { icon: React.ElementType; label: string; expanded: boolean }) {
  return (
    <>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className={expanded ? "" : "lg:hidden"}>{label}</span>
    </>
  );
}

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { clear } = useInternetIdentity();
  const { clearAuth } = useAdminStore();
  const location = useLocation();

  const handleLogout = () => {
    clear();
    clearAuth();
  };

  const getItemClass = (active: boolean, expanded: boolean) =>
    [
      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm font-medium",
      active
        ? "bg-accent text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
      !expanded && "lg:justify-center lg:px-2",
    ].join(" ");

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop closes on click only
        <div
          className="fixed inset-0 bg-foreground/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 h-full bg-card border-r border-border z-30 transition-all duration-200 flex flex-col",
          "lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarExpanded ? "w-60" : "lg:w-20 w-60",
        ].join(" ")}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          {sidebarExpanded && (
            <span className="font-display font-semibold text-sm text-primary truncate">
              AldoLocutorio
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item, idx) => {
            const active =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : item.to
                  ? location.pathname.startsWith(item.to)
                  : false;

            return item.to ? (
              <Link
                key={item.id}
                to={item.to}
                data-ocid={`nav.link.${idx + 1}`}
                onClick={() => setSidebarOpen(false)}
                className={`block ${getItemClass(active, sidebarExpanded)}`}
              >
                <NavItemContent
                  icon={item.icon}
                  label={item.label}
                  expanded={sidebarExpanded}
                />
              </Link>
            ) : (
              <div
                key={item.id}
                data-ocid={`nav.link.${idx + 1}`}
                className={`block cursor-default ${getItemClass(false, sidebarExpanded)}`}
              >
                <NavItemContent
                  icon={item.icon}
                  label={item.label}
                  expanded={sidebarExpanded}
                />
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 relative">
          <button
            type="button"
            data-ocid="dashboard.toggle"
            onClick={() => {
              if (window.innerWidth >= 1024) {
                setSidebarExpanded((prev) => !prev);
              } else {
                setSidebarOpen((prev) => !prev);
              }
            }}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            aria-label="Alternar menú lateral"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            to="/admin"
            data-ocid="dashboard.link"
            className="font-display font-semibold text-lg text-foreground hover:text-primary transition-colors absolute left-1/2 -translate-x-1/2"
          >
            AldoLocutorio
          </Link>

          <button
            type="button"
            data-ocid="dashboard.primary_button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
