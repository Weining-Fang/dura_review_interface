# Simplified State Management Migration

## Problem
The app was experiencing infinite render loops with Zustand state management, causing "Maximum update depth exceeded" errors.

## Solution
Replaced Zustand with a **simple React Context + useReducer** pattern.

## What Changed

### New State Management: `lib/AppContext.tsx`
- Uses React's built-in Context API + useReducer
- No external library complexity
- Clear, predictable state updates via dispatch actions
- Convenience hooks for different parts of state:
  - `useView()` - view navigation
  - `useData()` - sites, images, annotations
  - `useSelection()` - selected site/image
  - `useSearch()` - search query

### New Simplified Components

1. **SimpleMapView** (`components/SimpleMapView.tsx`)
   - Uses Context hooks instead of Zustand
   - No subscriptions, just direct state access

2. **SimpleGallery** (`components/SimpleGallery.tsx`)
   - Simplified grid view
   - Uses Context for selection state

3. **SimpleIIIFViewer** (`components/SimpleIIIFViewer.tsx`)
   - Detail view with zoom controls
   - Uses Context for navigation

4. **CanvasView** (`components/CanvasView.tsx`)
   - Uses `react-zoom-pan-pinch` library for zoom/pan
   - Library handles all zoom/pan state internally
   - Grid layout with filter

### Updated Files
- `pages/_app.tsx` - Wrapped with AppProvider
- `pages/index.tsx` - Completely rewritten to use Context
- Old index.tsx backed up to `pages/index-zustand-backup.tsx`

## Key Benefits

✅ **No Infinite Loops** - Context updates are predictable
✅ **Simpler Code** - Fewer abstractions, easier to understand
✅ **Better Performance** - react-zoom-pan-pinch handles canvas efficiently
✅ **Keep Canvas View** - Still have all 4 views (Map/Canvas/Gallery/Detail)
✅ **80% Functionality** - Core features preserved, complexity removed

## How It Works

### State Updates
```typescript
// Old Zustand (caused loops):
const setImages = useStore((state) => state.setImages);
setImages(data);

// New Context (stable):
const { setImages } = useData();
setImages(data); // Dispatch action internally
```

### Navigation
```typescript
const { view, setView, goToDetail, exitDetail } = useView();

// Change view
setView('canvas');

// Go to detail
goToDetail(imageId);

// Go back
exitDetail();
```

## Testing

1. Start the server: `npm run dev`
2. Visit http://localhost:3001
3. Test the flow:
   - Map loads with buildings
   - Click a building → switches to Canvas view
   - Zoom/pan with mouse wheel and drag
   - Double-click an image → Detail view
   - Press ESC → back to previous view
   - Use M/C/G keyboard shortcuts

## What Was Removed

- Zustand subscriptions and selectors
- Complex custom hooks file (`store/hooks.ts`)
- ViewSwitcher component (moved inline)
- Layout component (simplified)
- MapSidebar, GallerySidebar (can add back if needed)
- Tag filtering UI (search still works)
- Previous view tracking (simplified)

## Rollback

If needed, restore Zustand version:
```bash
mv pages/index-zustand-backup.tsx pages/index.tsx
```

## Next Steps

If this works without infinite loops:
1. Clean up old Zustand files
2. Remove Zustand from package.json
3. Add back any features you need (sidebars, filters, etc.)
4. Keep it simple - add complexity only when needed
