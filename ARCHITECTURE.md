# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MapView    │  │   Gallery    │  │  FacetBar    │          │
│  │  (MapLibre)  │  │ (Small Mult) │  │  (Filters)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│                    ┌──────▼────────┐                            │
│                    │ Zustand Store │ (Global State)             │
│                    │  - Sites      │                            │
│                    │  - Images     │                            │
│                    │  - Facets     │                            │
│                    │  - Selection  │                            │
│                    └──────┬────────┘                            │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                     (HTTP Requests)
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                    Next.js API Routes                             │
├─────────────────────────────────────────────────────────────────┤
│  /api/sites              → List sites, filter by type/period     │
│  /api/sites/[id]/images  → Get images for site                   │
│  /api/sites/[id]/nearby  → PostGIS k-NN spatial query           │
│  /api/images/[id]        → Get image + annotations               │
│  /api/annotations        → CRUD for annotations                  │
│  /api/search             → Full-text + faceted search            │
│  /api/export             → CSV/GeoJSON/IIIF exports              │
│  /api/iiif/[id]/manifest → Generate IIIF Presentation 3.0        │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                     (SQL Queries)
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│                  Supabase (PostgreSQL + PostGIS)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │   sites     │  │   images    │  │ annotations  │            │
│  │ ┌─────────┐ │  │             │  │              │            │
│  │ │geometry │ │  │ site_id  ───┼──┤ image_id  ───┼──┐         │
│  │ │(POLYGON)│ │  │ url         │  │ geometry     │  │         │
│  │ │centroid │ │  │ description │  │ label        │  │         │
│  │ └─────────┘ │  │ season      │  │ note         │  │         │
│  │ name        │  │ keywords[]  │  │ confidence   │  │         │
│  │ type        │  │             │  │ annotator    │  │         │
│  │ period[]    │  │             │  │              │  │         │
│  └─────────────┘  └─────────────┘  └──────────────┘  │         │
│         ▲                                             │         │
│         │                                             │         │
│  ┌──────┴─────────────────────────────────────────────┘         │
│  │  Spatial Index (GIST)                                        │
│  │  nearby_sites(id, limit) → k-NN query                        │
│  │  ST_Distance, ST_Centroid, etc.                              │
│  └──────────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load
```
User → Opens app
  ↓
index.tsx → useEffect()
  ↓
GET /api/sites?with_images=true
  ↓
Supabase → SELECT sites JOIN images
  ↓
Client ← sites[] with image counts
  ↓
MapView renders polygons
Gallery shows empty state
```

### 2. Site Selection
```
User → Clicks site on map
  ↓
MapView → onSiteSelect(siteId)
  ↓
GET /api/sites/[id]/images?with_annotations=true
  ↓
Supabase → SELECT images WHERE site_id = ?
  ↓
Store → setImages(images[])
  ↓
Gallery → Renders thumbnails
ContextPane → GET /api/sites/[id]/nearby
  ↓
PostGIS → nearby_sites(siteId, 5)
  ↓
ContextPane → Shows nearest neighbors
```

### 3. Faceted Filtering
```
User → Checks "temple" + searches "painting"
  ↓
FacetBar → Updates store.facets
  ↓
index.tsx → useEffect watches facets
  ↓
Client-side filter on store.images
  ↓
Gallery → Re-renders with filtered subset
Map → (future) Highlights matching sites
```

### 4. Image Detail View
```
User → Clicks image thumbnail
  ↓
Gallery → setCurrentImageId(id)
  ↓
User → Presses Enter or double-clicks
  ↓
Store → setViewMode('detail')
  ↓
IIIFViewer → Mounts
  ↓
GET /api/iiif/[id]/manifest.json
  ↓
Supabase → SELECT image + annotations
  ↓
IIIFViewer ← IIIF Presentation 3.0 JSON
  ↓
Renders zoomable image + annotation list
```

### 5. Multi-Site Comparison
```
User → Cmd+Click on nearby sites (3 selected)
  ↓
Store → selectedSiteIds = [h4, h2, h5]
  ↓
ComparisonStrip → Mounts
  ↓
Promise.all([
  GET /api/sites/h4/images,
  GET /api/sites/h2/images,
  GET /api/sites/h5/images
])
  ↓
Renders 3×3 grids side-by-side
```

### 6. Export
```
User → Navigates to /api/export?format=csv
  ↓
Server → Queries annotations + images + sites
  ↓
Generates CSV with proper headers
  ↓
Client ← Content-Disposition: attachment
  ↓
Browser downloads file
```

## Component Hierarchy

```
pages/index.tsx (Main App)
├── WorkflowSidebar (Map → Schematic → Annotation steps)
├── Main Column
│   ├── MapView + ContextPane (workflowStep === 'map')
│   ├── ComparisonStrip (if multi-select, schematic workflow)
│   └── SiteSchematic (draggable board)
├── Right Panel
│   ├── SearchBar (filters facets)
│   └── SelectedImagePreview (metadata snapshot)
└── Annotation Overlay
    └── IIIFViewer (modal editor launched from schematic)
```

## State Management (Zustand)

```typescript
useStore {
  // Data
  sites: Site[]
  images: Image[]
  annotations: Annotation[]
  
  // Selection
  selectedSiteIds: string[]
  currentImageId: string | null
  hoveredSiteId: string | null
  
  // Filtering
  facets: {
    buildingTypes: string[]
    periods: string[]
    seasons: string[]
    hasAnnotations: boolean
    searchQuery: string
  }
  filteredImageIds: string[]
  
  // Workflow
  workflowStep: 'map' | 'schematic' | 'annotation'
  isAnnotationOpen: boolean
  isMapReady: boolean
  
  // Context
  nearbySites: Site[]
  lastAnnotationLabel: string | null
  
  // Actions
  setSelectedSites(), toggleSite()
  setFacets(), addFacetValue(), removeFacetValue()
  setWorkflowStep(), setAnnotationOpen(), setCurrentImageId()
  ...
}
```

## Database Schema

```sql
sites {
  id: TEXT PRIMARY KEY           -- e.g., "h4", "h2"
  name: TEXT                      -- e.g., "Temple of Artemis"
  geometry: GEOMETRY(POLYGON)     -- PostGIS spatial column
  centroid: GEOMETRY(POINT)       -- Auto-calculated
  building_type: TEXT             -- e.g., "temple", "house"
  period: TEXT[]                  -- e.g., ["Hellenistic", "Roman"]
  excavation_seasons: JSONB       -- e.g., {"1928": 15, "1929": 42}
  notes: TEXT
  created_at, updated_at: TIMESTAMPTZ
}

images {
  id: TEXT PRIMARY KEY           -- Wikimedia object_id
  site_id: TEXT → sites(id)
  url: TEXT                      -- Wikimedia Commons URL
  filename: TEXT
  description: TEXT
  season: TEXT                   -- e.g., "1928-29"
  keywords: TEXT[]               -- For search
  depict_l1, depict_l2: TEXT     -- Categories
  photographer, date_taken: ...
}

annotations {
  id: UUID PRIMARY KEY
  image_id: TEXT → images(id)
  geometry: JSONB                -- SVG path or coords
  label: TEXT                    -- From vocabulary
  note: TEXT
  confidence: TEXT               -- low/medium/high
  annotator: TEXT
  created_at, updated_at: TIMESTAMPTZ
}

vocabulary {
  id: SERIAL
  category: TEXT                 -- e.g., "feature_type"
  value: TEXT                    -- e.g., "wall"
  description: TEXT
}
```

## API Endpoints Summary

| Method | Endpoint | Purpose | Returns |
|--------|----------|---------|---------|
| GET | `/api/sites` | List all sites | `{sites: Site[]}` |
| GET | `/api/sites/[id]/images` | Get site images | `{images: Image[]}` |
| GET | `/api/sites/[id]/nearby` | Spatial k-NN query | `{nearby_sites: Site[]}` |
| GET | `/api/images/[id]` | Get single image | `{image: Image, annotations: Annotation[]}` |
| GET | `/api/annotations` | List annotations | `{annotations: Annotation[]}` |
| POST | `/api/annotations` | Create annotation | `{annotation: Annotation}` |
| PUT | `/api/annotations` | Update annotation | `{annotation: Annotation}` |
| DELETE | `/api/annotations?id=...` | Delete annotation | `{success: true}` |
| GET | `/api/search` | Faceted search | `{sites: [], images: [], facetCounts: {}}` |
| GET | `/api/export?format=csv` | Export annotations | CSV file download |
| GET | `/api/export?format=geojson` | Export sites | GeoJSON file download |
| GET | `/api/iiif/[id]/manifest.json` | IIIF manifest | IIIF Presentation 3.0 JSON |

## Key Technologies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript | Component UI |
| Framework | Next.js 15 | SSR, API routes, routing |
| State | Zustand | Global state management |
| Styling | Tailwind CSS | Utility-first styling |
| Mapping | MapLibre GL JS | Interactive vector maps |
| Spatial | PostGIS | Spatial queries, k-NN, ST_ functions |
| Database | PostgreSQL (Supabase) | Relational data + spatial |
| Standards | IIIF Presentation 3.0 | Image interoperability |
| Standards | W3C Web Annotations | Annotation format |
| Standards | GeoJSON | Spatial data exchange |

## Performance Optimizations

1. **Spatial Indexes:** GIST indexes on geometry columns for fast spatial queries
2. **Batch Operations:** Migration inserts in batches of 100
3. **Connection Pooling:** Supabase handles connection pooling
4. **Lazy Loading:** Gallery images load on-demand
5. **Debouncing:** Search input debounced 300ms
6. **Client Filtering:** Gallery filters locally without API calls
7. **Optimized Selects:** Only fetch needed columns with Supabase select
8. **Generated Columns:** Centroid auto-calculated by database

## Security Considerations

**Current (MVP):**
- No authentication implemented
- Service key used server-side only
- Public read access to all data
- No Row Level Security (RLS)

**Production TODO:**
- Add Supabase Auth
- Enable RLS policies
- Separate viewer/annotator/admin roles
- API rate limiting
- Input validation & sanitization
- CORS restrictions

## Scalability Considerations

**Current capacity:**
- 150 sites, 12,500 images tested
- Supabase free tier limits:
  - 500 MB database
  - 2 GB bandwidth/month
  - Connection pool limits

**To scale:**
- Upgrade Supabase plan
- Add image CDN (CloudFlare, Imgix)
- Implement pagination (currently loads all)
- Add Redis caching layer
- Optimize map tile rendering
- Consider separating read/write databases

## Monitoring & Observability

**Implemented:**
- Console.log statements for debugging
- Browser DevTools for client issues
- Supabase dashboard for database logs

**Production TODO:**
- Add Sentry for error tracking
- Implement analytics (Plausible, Google Analytics)
- Database query performance monitoring
- API endpoint latency tracking
- User interaction analytics

---

**Last Updated:** October 2025

