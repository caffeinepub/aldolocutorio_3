# AldoLocutorio

## Current State
Fully functional public website with header, footer, and all public pages. Public layout (`PublicLayout`) wraps all public pages. Privacy policy page exists at `/privacidad`.

## Requested Changes (Diff)

### Add
- `CookieConsentBanner` component with localStorage persistence (12-month expiry), entrance/exit animations, pill-shaped buttons, mobile responsive stacked layout, and keyboard accessibility (Escape key = decline)
- Integration into `PublicLayout` — shown on all public pages except `/privacidad`

### Modify
- `PublicLayout`: render `CookieConsentBanner` conditionally (exclude `/privacidad` route)

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/components/CookieConsentBanner.tsx` with full implementation
2. Add component to `PublicLayout` with route exclusion for `/privacidad`
