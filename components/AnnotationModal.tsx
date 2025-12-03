import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AnnotationWorkspace from './AnnotationWorkspace';
import { useStore } from '../store/useStore';

export default function AnnotationModal() {
  const {
    annotationModalImageId,
    images,
    closeAnnotationModal
  } = useStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!annotationModalImageId) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [annotationModalImageId]);

  if (!annotationModalImageId || !isMounted) {
    return null;
  }

  const image = images.find((img) => img.id === annotationModalImageId) || null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeAnnotationModal}
      />
      <div className="relative flex h-full w-full items-stretch justify-center pt-16 pb-6 px-6 pointer-events-none">
        <div className="relative flex h-full w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gray-900 pointer-events-auto">
          <AnnotationWorkspace
            imageId={annotationModalImageId}
            image={image}
            onExit={closeAnnotationModal}
            exitLabel="× Close"
            className="flex-1"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}

