/**
 * AnnotoriousViewer Component
 * Uses Annotorious library for OpenSeadragon annotation display and editing
 * Handles all coordinate transformations and rendering automatically
 */

import React, { useEffect, useRef } from 'react';
import type OpenSeadragonType from 'openseadragon';

interface AnnotoriousViewerProps {
  imageUrl: string;
  annotations?: any[];
  showAnnotations?: boolean;
  readOnly?: boolean;
  onReady?: (viewer: OpenSeadragonType.Viewer) => void;
}

export default function AnnotoriousViewer({
  imageUrl,
  annotations = [],
  showAnnotations = true,
  readOnly = true,
  onReady
}: AnnotoriousViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<OpenSeadragonType.Viewer | null>(null);
  const annoRef = useRef<any>(null);

  useEffect(() => {
    if (!imageUrl) return;
    let isMounted = true;

    const init = async () => {
      if (!viewerRef.current) return;

      // Import OpenSeadragon and Annotorious
      const [{ default: OpenSeadragon }, AnnotoriousModule] = await Promise.all([
        import('openseadragon'),
        import('@recogito/annotorious-openseadragon')
      ]);

      if (!isMounted || !viewerRef.current) return;

      // Clean up previous instances
      if (annoRef.current) {
        annoRef.current.destroy();
        annoRef.current = null;
      }
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }

      // Create OpenSeadragon viewer
      osdRef.current = OpenSeadragon({
        element: viewerRef.current,
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        showNavigationControl: true,
        animationTime: 0.2,
        springStiffness: 5,
        gestureSettingsMouse: {
          clickToZoom: false, // Disable to allow annotation interactions
          dblClickToZoom: true,
          scrollToZoom: true,
          pinchToZoom: true,
          flickEnabled: true
        },
        visibilityRatio: 1,
        minZoomLevel: 0.1,
        maxZoomLevel: 10,
        tileSources: {
          type: 'image',
          url: imageUrl
        }
      });

      // Initialize Annotorious
      annoRef.current = AnnotoriousModule.default(osdRef.current, {
        readOnly,
        allowEmpty: false,
        disableEditor: readOnly
      });

      // Load annotations in Web Annotation format
      if (annotations.length > 0) {
        const webAnnotations = annotations.map((ann, idx) => {
          const geometry = typeof ann.geometry === 'string'
            ? JSON.parse(ann.geometry)
            : ann.geometry;

          // Convert to Web Annotation format
          let selector: any;
          if (geometry.type === 'rect') {
            selector = {
              type: 'FragmentSelector',
              conformsTo: 'http://www.w3.org/TR/media-frags/',
              value: `xywh=pixel:${geometry.x},${geometry.y},${geometry.w},${geometry.h}`
            };
          } else if (geometry.type === 'ellipse') {
            // For ellipses, approximate with SVG
            selector = {
              type: 'SvgSelector',
              value: `<svg><ellipse cx="${geometry.cx}" cy="${geometry.cy}" rx="${geometry.rx}" ry="${geometry.ry}"/></svg>`
            };
          }

          return {
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            id: ann.id || `#annotation-${idx}`,
            type: 'Annotation',
            body: [
              {
                type: 'TextualBody',
                value: ann.label || `Annotation ${geometry.label || idx + 1}`,
                purpose: 'tagging'
              }
            ],
            target: {
              source: imageUrl,
              selector
            }
          };
        });

        annoRef.current.setAnnotations(webAnnotations);
      }

      // Toggle visibility
      if (!showAnnotations) {
        annoRef.current.disableSelect = true;
        // Hide annotations by setting opacity
        const annotationLayer = document.querySelector('.a9s-annotationlayer');
        if (annotationLayer) {
          (annotationLayer as HTMLElement).style.display = 'none';
        }
      }

      if (onReady && osdRef.current) {
        onReady(osdRef.current);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (annoRef.current) {
        annoRef.current.destroy();
        annoRef.current = null;
      }
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, [imageUrl]);

  // Update annotations when they change
  useEffect(() => {
    if (!annoRef.current) return;
    // Annotations are set during initialization
  }, [annotations]);

  // Update visibility
  useEffect(() => {
    if (!annoRef.current) return;
    const annotationLayer = document.querySelector('.a9s-annotationlayer');
    if (annotationLayer) {
      (annotationLayer as HTMLElement).style.display = showAnnotations ? '' : 'none';
    }
  }, [showAnnotations]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={viewerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'black'
        }}
      />
    </div>
  );
}
