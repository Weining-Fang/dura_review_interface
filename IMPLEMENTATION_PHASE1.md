# Three-View UI Redesign - Phase 1 Complete

## ✅ Completed Features

### 1. Core Architecture Refactor

**Type System** ([types/view.ts](types/view.ts))
- `PrimaryView`: Centralized view state (map | canvas | gallery | detail)
- `CanvasSettings`: Viewport, tools, colors, grid configuration
- `TagFilters`: Multi-level filtering for images and annotations
- `AnnotationTool`: Drawing tool types for spatial canvas

**State Management** ([store/useStore.ts](store/useStore.ts))
- Expanded to support three-view navigation with previous view tracking
- Added canvas settings: viewport zoom/pan, active tool, colors, grid options
- Integrated tag filtering infrastructure for images and annotations
- Enhanced interfaces: `Site` (added distance_m), `Image` (added tags, photographer), `Annotation` (added tags, color, confidence)
- Navigation actions: `setPrimaryView`, `goToDetail`, `exitDetail`

**Custom Hooks** ([store/hooks.ts](store/hooks.ts))
- `useViewState`: View navigation and flags
- `useCanvasState`: Canvas settings and viewport
- `useTagFilterState`: Tag filtering
- `useSelectionState`: Site and image selection
- `useDataState`: Sites, images, annotations
- `useFacetsState`: Search facets
- `useMapState`: Map-specific state
- `useDetailState`: Detail view state
- `useKeyboardNavigation`: Reusable keyboard handler

### 2. Navigation System

**ViewSwitcher Component** ([components/ViewSwitcher.tsx](components/ViewSwitcher.tsx))
- Top navigation bar with Map / Canvas / Gallery buttons
- Keyboard shortcuts:
  - `M` → Map view
  - `C` → Canvas view (disabled when no site selected)
  - `G` → Gallery view
  - `ESC` → Exit detail view / navigate back
- Automatic hiding in detail mode
- Visual feedback for active view

**Layout Component** ([components/Layout.tsx](components/Layout.tsx))
- Redesigned for full-bleed primary view
- Optional left sidebar (context-sensitive)
- Optional right utility rail (search, metadata, annotations)
- Integrated ViewSwitcher in top bar
- Responsive width management

### 3. Sidebar Components

**MapSidebar** ([components/map/MapSidebar.tsx](components/map/MapSidebar.tsx))
- Current site selection display
- Building type filters with counts
- Nearby sites with distance calculations
- Quick navigation to Canvas/Gallery
- Multi-select support (cmd/ctrl + click)

**GallerySidebar** ([components/gallery/GallerySidebar.tsx](components/gallery/GallerySidebar.tsx))
- Tag filtering with chip UI
- Season filters (checkbox list)
- Depiction filters
- Photographer filters
- Dynamic extraction from current image set

**GlobalSearchBar** ([components/GlobalSearchBar.tsx](components/GlobalSearchBar.tsx))
- Universal search across images
- Debounced input (300ms)
- Keyboard shortcut: `/` to focus
- Clear button when active

### 4. Main Application

**Updated Index Page** ([pages/index.tsx](pages/index.tsx))
- Three-view router: Map → Canvas → Gallery ⟷ Detail
- Dynamic sidebar rendering based on current view
- Coordinated filtering: search queries, tags, seasons, annotations
- Proper `useCallback` to prevent infinite loops
- Granular Zustand selectors for optimized re-renders
- Error handling and loading states

### 5. Component Updates

**Fixed Navigation API**
- [Gallery.tsx](components/Gallery.tsx): Uses `goToDetail` for Enter/double-click
- [IIIFViewer.tsx](components/IIIFViewer.tsx): Uses `exitDetail` for ESC/back button
- [ComparisonStrip.tsx](components/ComparisonStrip.tsx): Uses `goToDetail` for image clicks

**Infinite Loop Fixes**
- Removed Zustand actions from dependency arrays (they're stable)
- Added eslint-disable comments where appropriate
- Used granular selectors to minimize re-renders

## 🎯 Navigation Flow

```
┌─────────────┐
│  Map View   │──── Click building ────▶ Canvas View
└─────────────┘                          (site layout)
       │                                       │
       │                                       │
   Press M                              Click image
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│Gallery View │◀──── Press G ──────────│Detail View  │
└─────────────┘                        │(IIIF viewer)│
       │                                └─────────────┘
       │                                       │
       └────────── Press ESC ─────────────────┘
          (returns to previous view)
```

## 🎹 Keyboard Shortcuts

### Global
- `/` - Focus search bar
- `ESC` - Exit detail or clear selection

### View Navigation (not in detail mode)
- `M` - Switch to Map view
- `C` - Switch to Canvas view (requires site selection)
- `G` - Switch to Gallery view

### Gallery Navigation
- `← / →` - Navigate between images
- `Enter` - Open detail view for selected image
- `;` - Next image (quick advance)

### Detail View
- `ESC` - Exit to previous view
- `+/-` - Zoom in/out (IIIF viewer)

## 🔧 Technical Details

### Zustand Store Actions
All Zustand actions are stable references and don't need to be in dependency arrays:
- `setSites`, `setImages`, `setAnnotations`
- `setPrimaryView`, `goToDetail`, `exitDetail`
- `setTagFilters`, `setFacets`

### Performance Optimizations
- Granular Zustand selectors to minimize re-renders
- `useCallback` for event handlers passed to children
- `useMemo` for expensive computations (filtered images, sorted lists)
- Debounced search input (300ms)

### Type Safety
- All views properly typed with `PrimaryView` enum
- TypeScript strict mode compliance
- No `any` types in navigation logic

## 📊 Current Status

**Working:**
- ✅ Three-view navigation (Map, Canvas, Gallery)
- ✅ Detail view overlay with ESC to exit
- ✅ Keyboard shortcuts
- ✅ Tag filtering infrastructure
- ✅ Search across images
- ✅ Sidebar context switching
- ✅ No infinite render loops

**Next Steps (Future Phases):**
- Enhanced map with hover cards and building clusters
- Spatial Canvas component with advanced tools
- Gallery tree view with site organization
- Tag infrastructure in API and database
- Canvas annotation tools and color palettes
- Temple of Bel curated dataset

## 🚀 Running the Application

```bash
npm run dev
```

The app will be available at http://localhost:3000 (or 3001 if 3000 is in use).

### Testing the Navigation

1. Start on Map view
2. Click a building → switches to Canvas
3. Press `G` → switches to Gallery
4. Click an image → opens Detail view
5. Press `ESC` → returns to Gallery
6. Press `M` → returns to Map

All transitions should be smooth with no console errors or infinite loops.
