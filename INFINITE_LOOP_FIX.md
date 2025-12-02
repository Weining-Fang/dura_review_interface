# Infinite Loop Fix - React/Zustand Integration

## Problem

The application was experiencing "Maximum update depth exceeded" errors due to improper use of Zustand store selectors and React hooks.

## Root Causes

### 1. **Object Destructuring from useStore**
```typescript
// ❌ WRONG - Causes re-renders on ANY state change
const { images, currentImageId, setImages } = useStore();
```

When you destructure multiple values from a single `useStore()` call, the component re-renders whenever ANY of those values change in the store, even if the component only uses some of them.

### 2. **Zustand Actions in Dependency Arrays**
```typescript
// ❌ WRONG - Even though Zustand actions are stable, they can cause issues
useEffect(() => {
  // ...
}, [someState, setImages, setAnnotations]);
```

While Zustand guarantees action stability, including them in dependency arrays was causing unnecessary effect re-runs.

### 3. **Unstable References in Dependencies**
```typescript
// ❌ WRONG - sortedImages is recreated every render
const sortedImages = [...images].sort(...);

useEffect(() => {
  // ...
}, [sortedImages]); // New array reference every time!
```

## Solutions Applied

### 1. **Use Granular Selectors**

**Before:**
```typescript
const { images, currentImageId, setImages } = useStore();
```

**After:**
```typescript
const images = useStore((state) => state.images);
const currentImageId = useStore((state) => state.currentImageId);
const setImages = useStore((state) => state.setImages);
```

This ensures each component only re-renders when the specific piece of state it needs changes.

### 2. **Remove Zustand Actions from Dependencies**

**Before:**
```typescript
useEffect(() => {
  setImages(data);
}, [data, setImages]);
```

**After:**
```typescript
useEffect(() => {
  setImages(data);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [data]);
```

Zustand actions are stable and don't need to be in dependency arrays.

### 3. **Memoize Computed Values**

**Before:**
```typescript
const sortedImages = [...images].sort((a, b) => ...);
```

**After:**
```typescript
const sortedImages = React.useMemo(() => {
  return [...images].sort((a, b) => ...);
}, [images, sortBy]);
```

This creates a stable reference that only changes when dependencies change.

## Files Fixed

### Main Application
- [pages/index.tsx](pages/index.tsx)
  - Converted to granular selectors
  - Removed Zustand actions from all dependency arrays
  - Used `useCallback` properly for `loadSiteImages` and `handleSiteSelect`

### Components
- [components/Gallery.tsx](components/Gallery.tsx)
  - Granular selectors
  - Memoized `sortedImages`
  - Removed actions from dependencies

- [components/GlobalSearchBar.tsx](components/GlobalSearchBar.tsx)
  - Granular selectors
  - Removed `setFacets` from dependency array

- [components/ViewSwitcher.tsx](components/ViewSwitcher.tsx)
  - Removed `setPrimaryView` and `exitDetail` from dependencies
  - Only state values remain

- [components/map/MapSidebar.tsx](components/map/MapSidebar.tsx)
  - Removed `setNearbySites` from dependencies

- [components/IIIFViewer.tsx](components/IIIFViewer.tsx)
  - Granular selectors
  - Removed actions from dependencies

- [components/MapView.tsx](components/MapView.tsx)
  - Granular selectors for all store values

- [components/ComparisonStrip.tsx](components/ComparisonStrip.tsx)
  - Granular selectors
  - Removed unnecessary `setCurrentImageId`

- [components/SelectedImagePreview.tsx](components/SelectedImagePreview.tsx)
  - Granular selectors

## Best Practices Going Forward

### ✅ DO:
1. **Use granular selectors** for each piece of state
   ```typescript
   const value = useStore((state) => state.value);
   ```

2. **Memoize computed values** that are used in dependency arrays
   ```typescript
   const computed = useMemo(() => expensiveCalc(data), [data]);
   ```

3. **Use `useCallback`** for functions passed to children
   ```typescript
   const handler = useCallback(() => { /* ... */ }, [deps]);
   ```

4. **Exclude Zustand actions** from dependency arrays
   ```typescript
   // They're stable, no need to include them
   useEffect(() => {
     setData(value);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [value]);
   ```

### ❌ DON'T:
1. **Don't destructure multiple values** from one `useStore` call
   ```typescript
   // ❌ Bad
   const { a, b, c } = useStore();
   ```

2. **Don't put unstable references** in dependency arrays
   ```typescript
   // ❌ Bad - creates new array every render
   const sorted = data.sort(...);
   useEffect(() => {}, [sorted]);
   ```

3. **Don't include Zustand actions** in dependencies
   ```typescript
   // ❌ Unnecessary
   useEffect(() => {}, [setState]);
   ```

## Verification

Run the development server:
```bash
npm run dev
```

The app should:
- ✅ Load without errors
- ✅ Navigate between views smoothly
- ✅ No console errors about maximum update depth
- ✅ Responsive to user interactions
- ✅ Proper state synchronization

## Testing Checklist

- [x] Page loads without infinite loop errors
- [x] Map view renders correctly
- [x] Can select a site and navigate to Canvas
- [x] Can navigate to Gallery view
- [x] Can open detail view for an image
- [x] ESC key returns to previous view
- [x] Keyboard shortcuts (M/C/G) work
- [x] Search bar updates without loops
- [x] Tag filters work correctly
- [x] No performance issues or excessive re-renders
