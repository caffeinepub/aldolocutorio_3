# AldoLocutorio — Portfolio Management

## Current State
The app has:
- Internet Identity authentication with admin role check
- Dashboard with navigation to /admin/portfolio (placeholder page)
- Backend: authorization + blob-storage mixins only
- Error prevention utilities: BigIntSerializer, SafeSelect, NumericConverter, ApiResponseHandler
- TanStack Router v6, TanStack Query, Zustand store

## Requested Changes (Diff)

### Add
- Backend: PortfolioProject type + CRUD functions in main.mo:
  - `createPortfolioProject(project: PortfolioProjectInput): async PortfolioProject`
  - `updatePortfolioProject(id: Nat, project: PortfolioProjectInput): async ?PortfolioProject`
  - `deletePortfolioProject(id: Nat): async Bool`
  - `getPortfolioProjects(page: Nat, pageSize: Nat, filters: PortfolioFilters): async PaginatedPortfolioResult`
  - `getPortfolioProject(id: Nat): async ?PortfolioProject`
  - `reorderPortfolioProjects(ids: [Nat]): async Bool`
  - `bulkUpdatePortfolioStatus(ids: [Nat], status: PortfolioStatus): async Nat`
  - `bulkDeletePortfolioProjects(ids: [Nat]): async Nat`
- Frontend: Full /admin/portfolio page replacing the placeholder
  - Header with H2 "Portafolio" + Agregar Proyecto (plus icon) + Filtros (filter icon) buttons
  - Desktop table view (≥768px): columns Orden (drag), Título, Cliente, Industria, Categoría, Estado, Acciones
  - Mobile card grid (<768px): 1-per-row cards with drag handle
  - Pagination: lazy-loaded 10/25/50 per page, Previous/Next, page numbers, "Mostrando X-X de Y proyectos"
  - Add/Edit modal with all form sections
  - Filter panel (slide-in)
  - Bulk actions bar
  - Image upload with blob storage (thumbnail + gallery)
  - Loading skeletons during page transitions

### Modify
- `src/backend/main.mo`: Add portfolio types and CRUD functions (no new .mo file)
- `src/frontend/src/pages/admin/PortfolioPage.tsx`: Replace placeholder with full implementation

### Remove
- Placeholder content in PortfolioPage.tsx

## Implementation Plan
1. Update main.mo with PortfolioProject type + all CRUD functions
2. Regenerate backend bindings (generate_motoko_code)
3. Build PortfolioPage with:
   - usePortfolioProjects hook (TanStack Query with keepPreviousData, prefetch next page)
   - PortfolioTable (desktop) + PortfolioCards (mobile)
   - ProjectModal (add/edit form with all sections, blob storage uploads)
   - FilterPanel (category, industry, status, tags, search)
   - BulkActionsBar
   - Pagination controls
   - Image upload hooks with progress, retry, cancel, concurrency limit
   - Blob cleanup on delete/replace
4. Use SafeSelect for all dropdowns, parseJSONWithBigInt/stringifyWithBigInt, safeConvertToNumber
5. All text in Spanish
