import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image } from '../store/useStore';

interface SiteSchematicProps {
  siteId: string;
  images: Image[];
  onImageSelect?: (imageId: string) => void;
}

type Position = { x: number; y: number };
type PositionsMap = Record<string, Position>;

export default function SiteSchematic({ siteId, images, onImageSelect }: SiteSchematicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<PositionsMap>({});
  const positionsRef = useRef<PositionsMap>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [showIds, setShowIds] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const hasCenteredRef = useRef<string | null>(null);
  const mouseDownAbsRef = useRef<Position | null>(null);
  const lastMouseAbsRef = useRef<Position | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number; hasMoved: boolean; isActive: boolean }>({
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    hasMoved: false,
    isActive: false
  });

  // Keep positionsRef in sync with positions state
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // Virtual board size (scrollable area)
  const BOARD_WIDTH = 4096;
  const BOARD_HEIGHT = 4096;

  // Fetch saved positions
  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/sites/${siteId}/image-positions`)
      .then(r => r.json())
      .then(data => {
        const saved: PositionsMap = data.positions || {};
        setPositions(saved);
      })
      .catch(() => setPositions({}));
  }, [siteId]);

  const containerSize = useSize(containerRef);

  // Center scroll on board center when site changes or container first lays out
  useEffect(() => {
    if (!containerRef.current) return;
    if (hasCenteredRef.current === siteId) return;
    const c = containerRef.current;
    const left = Math.max(0, (BOARD_WIDTH - c.clientWidth) / 2);
    const top = Math.max(0, (BOARD_HEIGHT - c.clientHeight) / 2);
    c.scrollTo({ left, top });
    hasCenteredRef.current = siteId;
  }, [siteId, containerSize.width, containerSize.height]);

  // Verify container can scroll horizontally
  useEffect(() => {
    if (!containerRef.current || !boardRef.current) return;
    const container = containerRef.current;
    const board = boardRef.current;
    
    // Ensure board is wide enough to be scrollable
    if (board.scrollWidth < BOARD_WIDTH) {
      board.style.width = `${BOARD_WIDTH}px`;
    }
    
    // Verify horizontal scrollability
    const canScrollHorizontal = container.scrollWidth > container.clientWidth;
    if (!canScrollHorizontal && container.clientWidth > 0) {
      console.warn('SiteSchematic: Container cannot scroll horizontally. Board width:', BOARD_WIDTH, 'Container width:', container.clientWidth);
    }
  }, [containerSize.width, containerSize.height]);

  // Compute auto-grid for images missing positions (around center)
  const autoGrid = useMemo(() => {
    const thumb = 128;
    const gap = 24;
    const idsNeeding = images
      .map(img => img.id)
      .filter(id => positions[id] === undefined);
    if (idsNeeding.length === 0) return {} as PositionsMap;

    // Create spiral grid around (0,0)
    const result: PositionsMap = {};
    let ring = 0;
    let placed = 0;
    const step = thumb + gap;
    const maxPerRing = (n: number) => (n === 0 ? 1 : n * 8);
    for (const id of idsNeeding) {
      if (ring === 0) {
        result[id] = { x: 0, y: 0 };
        ring = 1;
        placed++;
        continue;
      }
      // positions on a square ring
      const per = maxPerRing(ring);
      const indexInRing = (placed - 1) % per; // 0..per-1
      const sideLen = ring * 2;
      const coords: Array<{ x: number; y: number }> = [];
      // build ring coordinates centered at 0
      for (let i = -ring; i < ring; i++) coords.push({ x: i, y: -ring });
      for (let i = -ring; i < ring; i++) coords.push({ x: ring, y: i });
      for (let i = ring; i > -ring; i--) coords.push({ x: i, y: ring });
      for (let i = ring; i > -ring; i--) coords.push({ x: -ring, y: i });
      const cell = coords[indexInRing % coords.length];
      result[id] = { x: cell.x * step, y: cell.y * step };
      placed++;
      if ((placed - 1) % per === 0) ring++;
    }
    return result;
  }, [images, positions]);

  // If there are new positions from autoGrid, merge them and save once
  useEffect(() => {
    const newIds = Object.keys(autoGrid);
    if (newIds.length === 0) return;
    const merged = { ...positions, ...autoGrid };
    setPositions(merged);
    // Save once for initialization
    savePositionsDebounced(merged, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGrid]);

  const centerToAbsolute = useCallback((p: Position): Position => {
    return {
      x: (BOARD_WIDTH / 2) + p.x,
      y: (BOARD_HEIGHT / 2) + p.y,
    };
  }, [BOARD_WIDTH, BOARD_HEIGHT]);

  const absoluteToCenter = useCallback((p: Position): Position => {
    return {
      x: p.x - (BOARD_WIDTH / 2),
      y: p.y - (BOARD_HEIGHT / 2),
    };
  }, [BOARD_WIDTH, BOARD_HEIGHT]);

  const clampToBounds = useCallback((abs: Position, thumbW: number, thumbH: number): Position => {
    const x = Math.max(thumbW / 2, Math.min(BOARD_WIDTH - thumbW / 2, abs.x));
    const y = Math.max(thumbH / 2, Math.min(BOARD_HEIGHT - thumbH / 2, abs.y));
    return { x, y };
  }, [BOARD_WIDTH, BOARD_HEIGHT]);

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (isPanning) {
      e.preventDefault();
      return;
    }
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const target = e.currentTarget as HTMLDivElement;
    const targetRect = target.getBoundingClientRect();

    // Mouse position relative to board (account for scroll)
    const mouseX = (e.clientX - containerRect.left) + containerRef.current.scrollLeft;
    const mouseY = (e.clientY - containerRect.top) + containerRef.current.scrollTop;

    // Element center relative to board
    const centerX = (targetRect.left - containerRect.left + targetRect.width / 2) + containerRef.current.scrollLeft;
    const centerY = (targetRect.top - containerRect.top + targetRect.height / 2) + containerRef.current.scrollTop;

    setDraggingId(id);
    setDragOffset({ dx: mouseX - centerX, dy: mouseY - centerY });
    mouseDownAbsRef.current = { x: mouseX, y: mouseY };
    lastMouseAbsRef.current = { x: mouseX, y: mouseY };
  };

  // Global mouse move handler (replaces React synthetic event)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const currentPanRef = panRef.current;
      const currentContainer = containerRef.current;
      const currentDraggingId = draggingId;
      const currentDragOffset = dragOffset;

      // Check if we should start panning (mouse moved on container without dragging an image)
      // Only start panning if mouse moves significantly to distinguish from scroll gestures
      if (!isPanning && !currentDraggingId && currentContainer && currentPanRef.isActive) {
        const dx = Math.abs(e.clientX - currentPanRef.startX);
        const dy = Math.abs(e.clientY - currentPanRef.startY);
        const MOVE_THRESHOLD = 5; // pixels - increased to better distinguish from scroll gestures
        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
          setIsPanning(true);
          currentPanRef.hasMoved = true;
          e.preventDefault();
        }
      }

      if (isPanning && currentContainer) {
        e.preventDefault();
        const dx = e.clientX - currentPanRef.startX;
        const dy = e.clientY - currentPanRef.startY;
        currentContainer.scrollLeft = currentPanRef.scrollLeft - dx;
        currentContainer.scrollTop = currentPanRef.scrollTop - dy;
        return;
      }

      if (!currentDraggingId || !currentContainer) return;
      e.preventDefault();
      const thumbW = 64;
      const thumbH = 64;
      const containerRect = currentContainer.getBoundingClientRect();
      const mouseX = (e.clientX - containerRect.left) + currentContainer.scrollLeft;
      const mouseY = (e.clientY - containerRect.top) + currentContainer.scrollTop;
      const abs = clampToBounds({ x: mouseX - currentDragOffset.dx, y: mouseY - currentDragOffset.dy }, thumbW, thumbH);
      const rel = absoluteToCenter(abs);
      setPositions(prev => {
        const updated = { ...prev, [currentDraggingId]: rel };
        positionsRef.current = updated;
        return updated;
      });
      lastMouseAbsRef.current = { x: mouseX, y: mouseY };
    };

    // Only attach listener when panning, dragging, or mouse is down on container
    if (isPanning || draggingId || isMouseDown) {
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isPanning, draggingId, isMouseDown, dragOffset, clampToBounds, absoluteToCenter]);

  // Global mouse up handler (replaces React synthetic event)
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsMouseDown(false);
      if (isPanning) {
        setIsPanning(false);
        panRef.current = { startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, hasMoved: false, isActive: false };
        return;
      }
      if (!draggingId) {
        // Reset pan ref if no drag was happening
        panRef.current = { startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, hasMoved: false, isActive: false };
        return;
      }
      const id = draggingId;
      setDraggingId(null);

      const CLICK_THRESHOLD = 5;
      const start = mouseDownAbsRef.current;
      const last = lastMouseAbsRef.current;
      mouseDownAbsRef.current = null;
      lastMouseAbsRef.current = null;

      if (start && last) {
        const dx = last.x - start.x;
        const dy = last.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= CLICK_THRESHOLD) {
          if (onImageSelect) onImageSelect(id);
          return;
        }
      }

      // Use positionsRef to get the most current positions
      savePositionsDebounced(positionsRef.current);
    };

    const handleMouseLeave = () => {
      // Reset if mouse leaves window
      setIsMouseDown(false);
      if (isPanning) {
        setIsPanning(false);
        panRef.current = { startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0, hasMoved: false, isActive: false };
      }
      if (draggingId) {
        setDraggingId(null);
        savePositionsDebounced(positionsRef.current);
      }
    };

    // Only attach listener when panning, dragging, or mouse is down on container
    if (isPanning || draggingId || isMouseDown) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isPanning, draggingId, isMouseDown, onImageSelect]);

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (e.button !== 0) return; // Only handle left mouse button
    // Don't prevent default immediately - allow native scrolling
    // Only start panning if mouse actually moves (not a scroll gesture)
    // Check if user is holding shift (common for horizontal scrolling) - don't start panning
    if (e.shiftKey) return;
    
    setIsMouseDown(true);
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
      hasMoved: false,
      isActive: true
    };
  };

  const savePositionsDebounced = (next: PositionsMap, immediate = false) => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const run = () => {
      fetch(`/api/sites/${siteId}/image-positions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positions: next })
      }).catch(() => void 0);
    };
    if (immediate) run();
    else saveTimer.current = window.setTimeout(run, 400);
  };

  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  const renderNorthArrow = () => (
    <div
      className="absolute -translate-x-1/2 text-gray-700 select-none pointer-events-none flex flex-col items-center z-10"
      style={{ left: BOARD_WIDTH / 2, top: BOARD_HEIGHT / 2 - 46 }}
    >
      <svg className="relative top-[2px]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l4 7h-8l4-7z" />
      </svg>
      <div className="text-xs font-semibold">N</div>
    </div>
  );

  const renderCenterDot = () => (
    <div className="absolute z-10" style={{ left: BOARD_WIDTH / 2 - 3, top: BOARD_HEIGHT / 2 - 3 }}>
      <div className="w-1.5 h-1.5 rounded-full bg-red-600 opacity-80 pointer-events-none" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="text-sm text-gray-600">{images.length} image{images.length !== 1 ? 's' : ''}</div>
        <div className="flex items-center gap-2">
          <button
            className="text-sm border border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
            onClick={() => {
              const next = { ...positions };
              // Remove only those with existing positions so autoGrid re-adds them
              for (const img of images) delete next[img.id];
              setPositions(next);
            }}
          >
            Reset layout
          </button>
          <label className="text-sm text-gray-600 inline-flex items-center gap-1">
            <input type="checkbox" checked={showIds} onChange={(e) => setShowIds(e.target.checked)} /> Show IDs
          </label>
        </div>
      </div>

      {/* Board */}
      <div
        ref={containerRef}
        className={`flex-1 relative overflow-auto bg-white ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ overflowX: 'auto', overflowY: 'auto' }}
        onMouseDown={handleContainerMouseDown}
        onWheel={(e) => {
          // Allow native scrolling - don't prevent default
          // This ensures horizontal scrolling works with trackpads and mouse wheels
        }}
      >
        <div
          ref={boardRef}
          className="relative"
            style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, backgroundImage: 'repeating-linear-gradient(0deg, #f7fafc, #f7fafc 24px, #edf2f7 24px, #edf2f7 25px), repeating-linear-gradient(90deg, #f7fafc, #f7fafc 24px, #edf2f7 24px, #edf2f7 25px)' }}
        >
          {renderNorthArrow()}
          {renderCenterDot()}

          {images.map((img) => {
            const rel = positions[img.id];
            const fallbackAbs = { x: BOARD_WIDTH / 2, y: BOARD_HEIGHT / 2 };
            const abs = rel ? centerToAbsolute(rel) : fallbackAbs;
            const size = 64;
            const style: React.CSSProperties = {
              position: 'absolute',
              left: abs.x - size / 2,
              top: abs.y - size / 2,
              width: size,
              height: size,
              cursor: draggingId === img.id ? 'grabbing' : 'grab',
              boxShadow: draggingId === img.id ? '0 8px 16px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.08)' ,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#fff',
              border: '2px solid #e5e7eb'
            };
            return (
              <div key={img.id} style={style} onMouseDown={(e) => handleMouseDown(e, img.id)} onDoubleClick={() => onImageSelect && onImageSelect(img.id)}>
                <img
                  src={img.url}
                  alt={img.description || img.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none', pointerEvents: 'none' }}
                  draggable={false}
                />
                {showIds && (
                  <div className="absolute bottom-0 left-0 right-0 text-[10px] bg-black/50 text-white px-1 py-0.5">{img.id}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function useSize(ref: React.RefObject<HTMLElement>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    });
    observer.observe(el);
    setSize({ width: el.clientWidth, height: el.clientHeight });
    return () => observer.disconnect();
  }, [ref]);
  return size;
}


