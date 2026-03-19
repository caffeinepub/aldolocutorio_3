# AldoLocutorio

## Current State
The admin portfolio page (`PortfolioPage.tsx`) has gallery image management in the add/edit modal with up/down reorder arrows, a delete button, and an order badge. The public portfolio page (`PortafolioPage.tsx`) has a full `ImageLightbox` component (`pages/public/ImageLightbox.tsx`) for full-screen image preview.

Currently:
- `ImageLightbox.tsx` lives in `pages/public/` — not reusable by admin
- Admin gallery thumbnails have no preview capability
- Order badge is at `bottom-1 right-1`

## Requested Changes (Diff)

### Add
- Move `ImageLightbox.tsx` to `src/components/ImageLightbox.tsx` (shared location)
- Add Eye (preview) button at bottom-right of each admin gallery thumbnail
- Add lightbox state (`galleryLightboxOpen`, `galleryLightboxIndex`) in admin PortfolioPage modal
- Render `<ImageLightbox>` inside the admin modal for gallery preview

### Modify
- Move order badge from `bottom-1 right-1` to `bottom-1 left-1` in admin gallery items
- Update import path in `PortafolioPage.tsx` (public) to use shared component
- Add `Eye` icon to lucide-react imports in admin `PortfolioPage.tsx`

### Remove
- `pages/public/ImageLightbox.tsx` (replaced by `components/ImageLightbox.tsx`)

## Implementation Plan
1. Create `src/frontend/src/components/ImageLightbox.tsx` (copy of current public version)
2. Update `PortafolioPage.tsx` import to `../../components/ImageLightbox`
3. In admin `PortfolioPage.tsx`:
   - Import `ImageLightbox` from shared location
   - Add `Eye` to lucide-react imports
   - Add `galleryLightboxOpen` and `galleryLightboxIndex` state
   - Move order badge to `bottom-1 left-1`
   - Add Eye button at `bottom-1 right-1` that opens lightbox
   - Map gallery items to `{ id, url, filename }` for lightbox
   - Render `<ImageLightbox>` inside Dialog (after ScrollArea)
