# AldoLocutorio

## Current State
PortfolioProject type has no URL field. Admin portfolio page has no URL input. Public portfolio page shows results as the last card section.

## Requested Changes (Diff)

### Add
- `projectUrl : ?Text` field to `PortfolioProject`, `PortfolioProjectInput`, `PortfolioProjectUpdate` types
- URL input field in admin portfolio modal (Configuración section, below displayOrder)
- Clickable URL link display on public `/portafolio` page (after Results section)

### Modify
- `createPortfolioProject`: include `projectUrl = input.projectUrl`
- `updatePortfolioProject`: include `projectUrl = input.projectUrl`
- `importData` (all 3 portfolio modes): include `projectUrl = p.projectUrl` (or null fallback)
- Admin portfolio form state: add `projectUrl: string` with empty default
- Admin form submit: pass `projectUrl = projectUrl.trim() === '' ? null : ?projectUrl.trim()`
- Public PortafolioPage ProjectCard: add URL link element after results section

### Remove
- Nothing

## Implementation Plan
1. Update main.mo: add `projectUrl` to all 3 types and all creation/update/import locations
2. Update admin PortfolioPage.tsx: form state, URL input field, submit handler
3. Update public PortafolioPage.tsx: add URL link display in ProjectCard
