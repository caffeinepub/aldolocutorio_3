# AldoLocutorio

## Current State
- `/admin/services` exists as a placeholder stub (18 lines, no functionality)
- Portfolio and Testimonials are fully implemented in `main.mo` and `backend.did.js`
- Shared utilities exist: BigIntSerializer, SafeSelect, NumericConverter, ApiResponseHandler, StorageClient
- Blob-storage and authorization components are integrated

## Requested Changes (Diff)

### Add
- Service data type in `main.mo`: id, title, icon (Storage.ExternalBlob), shortDescription, fullDescription, useCases, processSteps, targetAudience, faqs, displayOrder, isVisible, createdDate, lastUpdatedDate
- Backend CRUD functions: createService, updateService, deleteService, getService, getServices, reorderServices, bulkUpdateServiceVisibility, bulkDeleteServices
- Service IDL types and methods in `backend.did.js`
- Full `/admin/services` page with: header (H2 + Agregar/Filtros buttons), desktop table view, mobile card view, lazy-loaded pagination (10/25/50), drag-and-drop reorder, add/edit modal with all form sections, icon picker (upload or URL), filter panel, bulk operations

### Modify
- `main.mo`: append Service types and functions (no separate .mo file)
- `backend.did.js`: add Service IDL types and methods to idlService and idlFactory
- `ServicesPage.tsx`: replace stub with full implementation

### Remove
- Placeholder stub content in ServicesPage.tsx

## Implementation Plan
1. Add Service types + CRUD to main.mo
2. Add Service IDL to backend.did.js (both idlService and idlFactory)
3. Build ServicesPage.tsx with all required features
4. Validate and deploy
