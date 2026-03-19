import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AccessDenied } from "./components/admin/AccessDenied";
import { DashboardHome } from "./components/admin/DashboardHome";
import { DashboardLayout } from "./components/admin/DashboardLayout";
import { FullPageSpinner } from "./components/admin/FullPageSpinner";
import { LoginPage } from "./components/admin/LoginPage";
import { PublicLayout } from "./components/public/PublicLayout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ContactSettingsPage from "./pages/admin/ContactSettingsPage";
import DataExportPage from "./pages/admin/DataExportPage";
import DataImportPage from "./pages/admin/DataImportPage";
import PortfolioPage from "./pages/admin/PortfolioPage";
import ServicesPage from "./pages/admin/ServicesPage";
import TestimonialsPage from "./pages/admin/TestimonialsPage";
import ContactoPage from "./pages/public/ContactoPage";
import HomePage from "./pages/public/HomePage";
import PortafolioPage from "./pages/public/PortafolioPage";
import PrivacidadPage from "./pages/public/PrivacidadPage";
import ServiciosPage from "./pages/public/ServiciosPage";
import TestimoniosPage from "./pages/public/TestimoniosPage";
import { useAdminStore } from "./store/adminStore";

function AdminPage() {
  const { identity, isInitializing, isLoginSuccess } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  const { isAdmin, setPrincipal, setAdminStatus, hasValidSession } =
    useAdminStore();
  const [isVerifying, setIsVerifying] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (!identity || isFetching || !actor) return;

    const principal = identity.getPrincipal().toString();
    setPrincipal(principal);

    if (hasValidSession()) {
      verifiedRef.current = true;
      return;
    }

    if (verifiedRef.current) return;

    if (isLoginSuccess || !hasValidSession()) {
      verifiedRef.current = true;
      setIsVerifying(true);
      actor
        ._initializeAccessControlWithSecret("")
        .then(() => actor.isCallerAdmin())
        .then((adminStatus: boolean) => {
          setAdminStatus(adminStatus);
        })
        .catch(() => {
          setAdminStatus(false);
        })
        .finally(() => {
          setIsVerifying(false);
        });
    }
  }, [
    identity,
    actor,
    isFetching,
    isLoginSuccess,
    setPrincipal,
    setAdminStatus,
    hasValidSession,
  ]);

  if (isInitializing) return <FullPageSpinner />;
  if (!identity) return <LoginPage />;
  if (isVerifying || (isFetching && !hasValidSession()))
    return <FullPageSpinner />;
  if (isAdmin === true) return <DashboardLayout />;
  if (isAdmin === false) return <AccessDenied />;
  return <FullPageSpinner />;
}

const rootRoute = createRootRoute({ component: () => <Outlet /> });

// ── Public routes ──────────────────────────────────────────────
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: HomePage,
});

const serviciosRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/servicios",
  component: ServiciosPage,
});

const serviciosServiceRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/servicios/$serviceid",
  component: ServiciosPage,
});

const portafolioPublicRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/portafolio",
  component: PortafolioPage,
});

const portafolioProjectRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/portafolio/$projectid",
  component: PortafolioPage,
});

const contactoRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/contacto",
  component: ContactoPage,
});

const privacidadRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/privacidad",
  component: PrivacidadPage,
});

const testimoniosPublicRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/testimonios",
  component: TestimoniosPage,
});

// ── Admin routes ──────────────────────────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/",
  component: DashboardHome,
});

const portfolioRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/portfolio",
  component: PortfolioPage,
});

const servicesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/services",
  component: ServicesPage,
});

const testimonialsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/testimonials",
  component: TestimonialsPage,
});

const contactSettingsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/contact-settings",
  component: ContactSettingsPage,
});

const dataExportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/data-export",
  component: DataExportPage,
});

const dataImportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "/data-import",
  component: DataImportPage,
});

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([
    homeRoute,
    serviciosRoute,
    serviciosServiceRoute,
    portafolioPublicRoute,
    portafolioProjectRoute,
    contactoRoute,
    privacidadRoute,
    testimoniosPublicRoute,
  ]),
  adminRoute.addChildren([
    adminIndexRoute,
    portfolioRoute,
    servicesRoute,
    testimonialsRoute,
    contactSettingsRoute,
    dataExportRoute,
    dataImportRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
