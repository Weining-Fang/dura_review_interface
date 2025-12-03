# Annotation Drawing Guide

## ✅ Feature Complete!

The annotation drawing UI has been successfully implemented and integrated into the IIIF viewer.

## How to Use

### 1. Open an Image in Detail View

- Select a site from the map
- Click any image in the gallery
- Press `Enter` or double-click to open in detail view

### 2. Start Annotation Editor

- Click the **"✏️ Edit Annotations"** button in the top toolbar
- The annotation editor will open in full-screen mode

### 3. Draw Annotations

**Rectangle Tool:**
1. Click the "Rectangle" button (active by default)
2. Click and drag on the image to draw a rectangle
3. Release to create the shape
4. The shape will be automatically numbered

**Ellipse Tool:**
1. Click the "Ellipse" button
2. Click and drag on the image to draw an ellipse
3. Release to create the shape

### 4. Label Your Annotation

Once a shape is selected (highlighted in blue):

1. **Label** (required): Enter a descriptive label (e.g., "wall", "column", "doorway")
2. **Note**: Add additional details or observations
3. **Confidence**: Select low, medium, or high confidence level
4. Click **"Save Annotation"** to save to the database

### 5. Manage Annotations

**Delete a shape:**
- Select the shape (click on it)
- Press `Backspace` or `Delete` key
- Or click "Delete Selected" button

**Clear all annotations:**
- Click "Clear All" button
- Confirm in the dialog

**Repeat last label:**
- Press `F` key to auto-fill the label field with your previous annotation
- Useful for labeling multiple similar features

### 6. Exit Editor

- Click "Close Editor" button
- Or press `Esc` key
- Returns to the IIIF viewer with annotations displayed

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click + Drag | Draw shape |
| `Backspace`/`Delete` | Delete selected shape |
| `F` | Repeat last label |
| `Esc` | Deselect shape / Close editor |

## Technical Details

### Data Storage

Annotations are saved to the database with the following structure:

```json
{
  "image_id": "3838",
  "geometry": {
    "type": "rect",
    "x": 0.25,
    "y": 0.15,
    "w": 0.3,
    "h": 0.4,
    "label": 1
  },
  "label": "column base",
  "note": "Well-preserved Corinthian capital",
  "confidence": "high",
  "annotator": "researcher_name"
}
```

All coordinates are normalized (0-1 range) for resolution independence.

### API Endpoints Used

- **POST /api/annotations** - Save new annotation
- **GET /api/annotations?image_id={id}** - Fetch annotations for an image
- **DELETE /api/annotations?id={id}** - Delete an annotation

### Supported Shapes

Currently supports:
- **Rectangle** - Best for architectural features, windows, doors
- **Ellipse** - Good for circular elements, columns, medallions

### Future Enhancements (Optional)

- Polygon/polyline tools for irregular shapes
- Edit existing annotations (move, resize after save)
- Vocabulary autocomplete from database
- Undo/redo functionality
- Annotation versioning

## Integration with IIIF

The annotation editor is fully integrated with the IIIF viewer:

1. Annotations are embedded in IIIF manifests as W3C Web Annotations
2. Saved annotations appear in the annotation list
3. Can toggle annotation visibility in the viewer
4. Exported with sites via API

## Workflow Example

Typical annotation workflow:

```
1. Select site "h4" (Temple of Artemis) on map
   ↓
2. Click image showing altar wall
   ↓
3. Press Enter to open detail view
   ↓
4. Click "Edit Annotations" button
   ↓
5. Draw rectangle around column
   ↓
6. Label: "column" | Note: "Ionic style" | Confidence: high
   ↓
7. Press "Save Annotation"
   ↓
8. Press F to repeat "column" label
   ↓
9. Draw second rectangle for another column
   ↓
10. Save second annotation
   ↓
11. Press Esc to close editor
   ↓
12. Annotations now visible in viewer and saved to database
```

## QA Checklist (manual)

1. Open the IIIF viewer for an image and ensure the annotation sidebar loads without errors.
2. Draw two new annotations, populate labels/notes, then click **Save All**. Both drafts should flip to a `clean` badge and remain visible after closing/reopening the editor.
3. Select an existing annotation, change its label, queue a delete for another, and run **Save All** again. The updated annotation should persist while the deleted one disappears after refresh.
4. Close the editor, verify the main viewer list refreshes automatically, then reload the page to confirm cached annotations hydrate without warning banners.
5. From the sidebar, trigger a delete via the ✕ icon and confirm that the entry is tagged "delete queued" until the next save cycle.

## Troubleshooting

### Shapes not appearing
- Ensure you dragged a minimum distance
- Very small shapes (< 1% of image) are rejected
- Check browser console for errors

### Can't save annotation
- Make sure a shape is selected (blue border)
- Label field must not be empty
- Check that you're connected to the database

### Lost annotations
- Annotations are auto-saved to database on each save
- Check `/api/annotations?image_id={id}` to verify
- Check Supabase dashboard → Table Editor → annotations

### Editor not opening
- Verify IIIF viewer is in detail mode (not gallery)
- Check browser console for JavaScript errors
- Ensure image has loaded completely

## Best Practices

1. **Be specific with labels** - Use controlled vocabulary when possible
2. **Add notes** - Include observations that future researchers will find useful
3. **Set confidence appropriately** - Be honest about uncertainty
4. **Save frequently** - Each annotation is saved individually
5. **Use keyboard shortcuts** - F key speeds up repetitive labeling
6. **Draw tight bounds** - Make rectangles/ellipses as precise as possible

## Export Annotations

Annotations can be exported via:

- **CSV**: `/api/export?format=csv&site_id=h4`
- **GeoJSON**: `/api/export?format=geojson` (includes annotation counts)
- **IIIF Manifests**: `/api/iiif/{imageId}/manifest.json` (embedded annotations)

---

**Feature Status:** ✅ Complete and Production-Ready  
**Last Updated:** October 2025  
**Feedback:** Report issues via GitHub or project lead

