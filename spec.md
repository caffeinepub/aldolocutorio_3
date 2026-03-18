# AldoLocutorio

## Current State
- Public layout (header, footer, side panel) is live with placeholder pages.
- Backend `getHomepageData()` returns `HomepageData { services, featuredProjects, testimonials }` (max 3 each).
- Homepage (`/`) is a minimal placeholder with no dynamic content.
- Logo currently uses `height: 40px` (header) and `height: 60px` (footer).

## Requested Changes (Diff)

### Add
- `HomePage` component with hero section, services grid, featured projects grid, testimonials carousel.
- `ServiceCard` component.
- `ProjectCard` component.
- `TestimonialCard` component.
- `TestimonialsCarousel` component with auto-rotate, prev/next, dot indicators, swipe support.
- Loading skeleton shown during `getHomepageData()` fetch.

### Modify
- Replace placeholder `HomePage` with the full dynamic implementation.
- Update logo width to 200px everywhere (header + footer) while keeping height auto.

### Remove
- Placeholder homepage text.

## Implementation Plan
1. Update `PublicHeader` logo: `width: 200px, height: auto`.
2. Update `PublicFooter` logo: `width: 200px, height: auto`.
3. Create `src/pages/public/HomePage.tsx` with:
   - `useQuery` calling `actor.getHomepageData()` (stable actor from `useActor`).
   - HeroSection (hardcoded).
   - ServicesSection (ServiceCard grid, max 3, hidden if empty).
   - FeaturedProjectsSection (ProjectCard grid, max 3, hidden if empty).
   - TestimonialsSection (carousel, max 3, hidden if empty).
   - Loading skeleton while fetching.
4. Validate and build.
