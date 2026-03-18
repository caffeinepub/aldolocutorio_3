# AldoLocutorio

## Current State
The `/portafolio` route exists as a placeholder page with no real content. The `App.tsx` has a single route `portafolioPublicRoute` for `/portafolio` but no deep-link route for `/portafolio/$projectid`. The backend exposes `getPortfolioProjects(page, pageSize, filter)` returning `PaginatedPortfolioProjects` with `items: PortfolioProject[]`.

## Requested Changes (Diff)

### Add
- `/portafolio/$projectid` deep-link route in `App.tsx`
- Full `PortafolioPage` replacing the placeholder, with:
  - Page header ("Nuestro Trabajo" / "Selección de proyectos recientes")
  - Vertical list of `ProjectCard` components (one per row)
  - `GalleryCarousel` component for `galleryImages: ExternalBlob[]`
  - Description, Technologies & Tags two-column, Results sections
  - Loading skeletons (2-3 cards)
  - Empty/error states with Spanish messages
  - Deep-link scroll + highlight for `/portafolio/$projectid`

### Modify
- `App.tsx`: add `portafolioProjectRoute` for `/portafolio/$projectid`
- `src/frontend/src/pages/public/PortafolioPage.tsx`: replace placeholder

### Remove
- Placeholder content from PortafolioPage

## Implementation Plan
1. Update `App.tsx` to add `/portafolio/$projectid` route pointing to the same `PortafolioPage` component
2. Rewrite `PortafolioPage.tsx` with:
   - `useActor` stable actor pattern + `useQuery` fetching `getPortfolioProjects(1n, 1000n, { status: PublishStatus.published, category: undefined, search: undefined })`
   - `GalleryCarousel` sub-component with left/right nav, dot indicators, touch swipe, lazy loading via IntersectionObserver
   - `ProjectCard` sub-component with id attribute for deep linking
   - Deep-link: after data loads, scroll to card matching `projectid` param and apply highlight class
   - Loading: 2-3 skeleton cards
   - Empty/error states
   - `useQueryClient` cleanup on unmount
   - Use `safeBigIntToString()` for ID conversions
