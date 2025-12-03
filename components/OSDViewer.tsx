import React, { ReactNode, useEffect, useRef } from 'react';
import type OpenSeadragonType from 'openseadragon';

interface OSDViewerProps {
  imageUrl: string;
  overlay?: ReactNode;
  onReady?: (viewer: OpenSeadragonType.Viewer) => void;
  className?: string;
}

export default function OSDViewer({ imageUrl, overlay, onReady, className }: OSDViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdRef = useRef<OpenSeadragonType.Viewer | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    let isMounted = true;

    const init = async () => {
      if (!viewerRef.current) return;

      const { default: OpenSeadragon } = await import('openseadragon');
      if (!isMounted || !viewerRef.current) return;

      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }

      osdRef.current = OpenSeadragon({
        element: viewerRef.current,
        prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
        showNavigationControl: true,
        animationTime: 0.2,
        springStiffness: 5,
        gestureSettingsMouse: {
          clickToZoom: true,
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

      if (onReady && osdRef.current) {
        onReady(osdRef.current);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (osdRef.current) {
        osdRef.current.destroy();
        osdRef.current = null;
      }
    };
  }, [imageUrl]);

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <div
        ref={viewerRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'black'
        }}
      />
      {overlay && (
        <div className="pointer-events-none absolute inset-0">
          {overlay}
        </div>
      )}
    </div>
  );
}

