import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Copy,
  Download,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Upload,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  {
    id: "contact-settings",
    icon: Mail,
    label: "Contacto",
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
];

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { clear } = useInternetIdentity();
  const { clearAuth, principal } = useAdminStore();
  const location = useLocation();

  const handleLogout = () => {
    clear();
    clearAuth();
  };

  const truncatedPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-5)}`
    : "—";

  const handleCopyPrincipal = async () => {
    if (!principal) return;
    try {
      await navigator.clipboard.writeText(principal);
      toast.success("Principal ID copiado");
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = principal;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast.success("Principal ID copiado");
    }
  };

  const getItemClass = (active: boolean, expanded: boolean) =>
    [
      "flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-150 text-sm font-medium",
      active
        ? "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none -ml-0"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      !expanded && "lg:justify-center lg:px-0",
    ].join(" ");

  return (
    <div className="min-h-screen bg-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
        <div
          className="fixed inset-0 bg-foreground/20 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed full height */}
      <aside
        className={[
          "fixed top-0 left-0 h-screen bg-card border-r border-border z-30 transition-all duration-200 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarExpanded ? "w-64" : "w-64 lg:w-16",
        ].join(" ")}
      >
        {/* Brand */}
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

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          {navItems.map((item, idx) => {
            const active =
              item.to === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.to);

            return (
              <Link
                key={item.id}
                to={item.to}
                data-ocid={`nav.link.${idx + 1}`}
                title={!sidebarExpanded ? item.label : undefined}
                onClick={() => setSidebarOpen(false)}
                className={`block ${getItemClass(active, sidebarExpanded)}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={sidebarExpanded ? "" : "lg:hidden"}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Principal - pinned bottom */}
        <div className="border-t border-border p-4 flex-shrink-0">
          {sidebarExpanded ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground font-mono flex-1 truncate">
                {truncatedPrincipal}
              </span>
              <button
                type="button"
                onClick={handleCopyPrincipal}
                title="Copiar Principal ID"
                data-ocid="dashboard.secondary_button"
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleCopyPrincipal}
                title={principal || "Principal ID"}
                data-ocid="dashboard.secondary_button"
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main column - offset by sidebar width */}
      <div
        className={[
          "flex flex-col min-h-screen transition-all duration-200",
          sidebarExpanded ? "lg:pl-64" : "lg:pl-16",
        ].join(" ")}
      >
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0 sticky top-0 z-10">
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
