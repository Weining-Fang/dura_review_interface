/**
 * IIIFViewer Component - Simple IIIF image viewer with zoom/pan
 * Uses basic HTML/CSS for MVP, can be replaced with Mirador later
 */

import React, { useCallback } from 'react';
import { useStore } from '../store/useStore';
import AnnotationWorkspace from './AnnotationWorkspace';

interface IIIFViewerProps {
  imageId: string;
}

export default function IIIFViewer({ imageId }: IIIFViewerProps) {
  const { images, setViewMode, setAppStage } = useStore();
  const image = images.find((img) => img.id === imageId) || null;

  const handleBack = useCallback(() => {
    setViewMode('gallery');
    setAppStage('images');
  }, [setViewMode, setAppStage]);

  return (
    <AnnotationWorkspace imageId={imageId} image={image} onExit={handleBack} />
  );
}

