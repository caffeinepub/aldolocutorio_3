# AldoLocutorio

## Current State
Full admin panel exists with portfolio, testimonials, services, contact settings, data export/import pages. All backend logic in main.mo. Frontend uses TanStack Router with routes under /admin. The root `/` route renders an empty div. No public-facing pages exist yet.

## Requested Changes (Diff)

### Add
- `HomepageData` type and `getHomepageData()` query function to main.mo
- `HomepageData` interface + `getHomepageData` to backend.d.ts and backend.did.js
- `PublicLayout` component (header + footer + container wrapper + Outlet)
- `PublicHeader` component (logo, desktop nav, hamburger)
- `SidePanel` component (mobile slide-in navigation overlay)
- `PublicFooter` component (4-column desktop, stacked mobile, legal links)
- Placeholder pages: Home, Servicios, Portafolio, Sobre Nosotros, Contacto, Privacidad, Terminos, Testimonios
- Public routes in App.tsx: /, /servicios, /portafolio, /sobre-nosotros, /contacto, /privacidad, /terminos, /testimonios

### Modify
- App.tsx: replace the empty `/` route with PublicLayout and all public sub-routes
- backend.d.ts: add HomepageData and getHomepageData to backendInterface
- backend.did.js: add HomepageData IDL record and getHomepageData function

### Remove
- The empty `indexRoute` component (`() => <div />`) replaced by public layout routes

## Implementation Plan
1. Add `HomepageData` type and `getHomepageData()` to main.mo (filter visible services, published projects, visible testimonials; sort by displayOrder; take first 3 each)
2. Add `HomepageData` to backend.d.ts and idlService/idlFactory in backend.did.js
3. Create src/frontend/src/components/public/ directory with PublicHeader, SidePanel, PublicFooter, PublicLayout
4. Create placeholder page components for all 8 public routes
5. Update App.tsx with public route tree using PublicLayout as parent
