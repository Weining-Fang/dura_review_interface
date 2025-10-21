# Dura-Europos Spatial Research Interface

An interactive spatial research platform for Dura-Europos archaeological data, featuring coordinated views of maps, image galleries, and structured annotations.

## Features

- **Interactive Map** - Spatial visualization of archaeological sites with PostGIS
- **Image Gallery** - Small multiples view with faceted filtering
- **IIIF Viewer** - Zoom/pan image viewer with annotation support
- **Faceted Search** - Filter by building type, period, season, annotations
- **Nearby Sites** - Spatial k-NN queries to discover adjacent structures
- **Comparison View** - Side-by-side analysis of multiple sites
- **Export** - CSV, GeoJSON, and IIIF manifest exports

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see SETUP.md)
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run database setup in Supabase SQL Editor
# (paste contents of sql/01_setup_postgis.sql)

# Migrate data
node scripts/migrate_data.js

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup instructions
- **[dura-europos-mvp.plan.md](./dura-europos-mvp.plan.md)** - Complete architecture and roadmap
- **[SQL Schema](./sql/01_setup_postgis.sql)** - Database structure

## Architecture

- **Frontend:** React 19, Next.js 15, TypeScript, Tailwind CSS
- **Mapping:** MapLibre GL JS with PostGIS spatial queries
- **State:** Zustand for coordinated views
- **Backend:** Supabase (PostgreSQL + PostGIS)
- **Standards:** IIIF Presentation 3.0, W3C Web Annotations, GeoJSON

## Tech Stack

- React 19 + Next.js 15
- TypeScript
- Supabase with PostGIS
- MapLibre GL JS
- Zustand (state management)
- Tailwind CSS

## Project Structure

```
dura_review_interface/
├── components/          # React components
│   ├── Layout.tsx       # Three-panel layout
│   ├── MapView.tsx      # Interactive map with PostGIS
│   ├── Gallery.tsx      # Image grid with keyboard nav
│   ├── FacetBar.tsx     # Filters and search
│   ├── IIIFViewer.tsx   # Image detail viewer
│   └── ...
├── pages/
│   ├── index.tsx        # Main application
│   └── api/             # API routes
│       ├── sites/       # Site endpoints
│       ├── images/      # Image endpoints
│       ├── annotations.js
│       ├── search.js
│       └── iiif/        # IIIF manifest generation
├── store/
│   └── useStore.ts      # Global state management
├── sql/
│   └── 01_setup_postgis.sql  # Database schema
├── scripts/
│   └── migrate_data.js  # Data migration script
└── public/
    ├── field_url_0801.json    # Source data
    └── sites.geojson          # Building footprints (optional)
```

## Keyboard Shortcuts

- `Arrow keys` - Navigate images in gallery
- `Enter` - Open detail view
- `Esc` - Back to gallery / clear selection
- `/` - Focus search
- `N` - Next nearby site
- `+/-` - Zoom in/out (detail view)
- `0` - Reset zoom

## Contributing

This is a research prototype. For production use:
1. Add authentication (Supabase Auth)
2. Add Row Level Security policies
3. Optimize image loading (lazy load, thumbnails)
4. Add proper error boundaries
5. Implement undo/redo for annotations
6. Add polygon/polyline drawing tools

## License

MIT (update as needed)

## Acknowledgments

Built for archaeological research at Dura-Europos using data from:
- Yale University Art Gallery Digital Archives
- Wikimedia Commons Dura-Europos collection
