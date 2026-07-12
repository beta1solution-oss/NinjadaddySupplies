import { useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Package } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title?: string;
}

export default function ImageGallery({ images, title = '' }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  // Touch/swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const safeImages = images?.length ? images : [];

  if (!safeImages.length) {
    return (
      <div className="aspect-square bg-[#F0F0ED] rounded-2xl flex flex-col items-center justify-center gap-2">
        <Package className="w-12 h-12 text-[#CCCCCC]" />
        <p className="text-sm text-[#AAAAAA]">No images</p>
      </div>
    );
  }

  const prev = () => setActiveIdx(i => (i - 1 + safeImages.length) % safeImages.length);
  const next = () => setActiveIdx(i => (i + 1) % safeImages.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe horizontally if horizontal movement > vertical
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') { setLightbox(false); setZoomed(false); }
  }, []);

  const openLightbox = (idx: number) => {
    setActiveIdx(idx);
    setLightbox(true);
    setZoomed(false);
  };

  return (
    <div>
      {/* Main Image */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden bg-[#F0F0ED] group cursor-zoom-in select-none"
        onClick={() => openLightbox(activeIdx)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={safeImages[activeIdx]}
          alt={`${title} - image ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          draggable={false}
        />

        {/* Nav arrows */}
        {safeImages.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="w-9 h-9 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Counter */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-3 right-3 pointer-events-none">
            <span className="text-xs px-2.5 py-1 bg-black/60 text-white rounded-full font-600">
              {activeIdx + 1} / {safeImages.length}
            </span>
          </div>
        )}

        {/* Dot indicators */}
        {safeImages.length > 1 && safeImages.length <= 8 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {safeImages.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIdx ? 'bg-[#E6C200] w-3' : 'bg-white/50'
              }`} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-[#E6C200] ring-2 ring-[#E6C200]/30'
                  : 'border-[#E0E0DC] hover:border-[#E6C200]/50'
              }`}
            >
              <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* ─── LIGHTBOX ─── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          onClick={() => { setLightbox(false); setZoomed(false); }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ outline: 'none' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close */}
          <button
            onClick={() => { setLightbox(false); setZoomed(false); }}
            className="absolute top-4 right-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10">
            <span className="text-sm text-white/60 font-600 bg-black/40 px-3 py-1.5 rounded-full">
              {activeIdx + 1} / {safeImages.length}
            </span>
          </div>

          {/* Zoom hint */}
          <div className="absolute bottom-16 right-4 z-10">
            <span className="text-xs text-white/40 font-500">
              {zoomed ? 'Click to zoom out' : 'Click image to zoom in'}
            </span>
          </div>

          {/* Prev / Next */}
          {safeImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-3 sm:left-6 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-3 sm:right-6 z-10 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {/* Main lightbox image */}
          <div
            className={`px-14 sm:px-20 py-12 flex items-center justify-center w-full h-full transition-transform duration-200 ${
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={e => { e.stopPropagation(); setZoomed(z => !z); }}
          >
            <img
              src={safeImages[activeIdx]}
              alt={`${title} - ${activeIdx + 1}`}
              className={`rounded-lg shadow-2xl object-contain transition-all duration-300 select-none ${
                zoomed
                  ? 'max-w-none max-h-none w-auto h-auto scale-150'
                  : 'max-w-full max-h-[80vh]'
              }`}
              draggable={false}
            />
          </div>

          {/* Dot navigation */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActiveIdx(i); setZoomed(false); }}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeIdx
                      ? 'w-6 h-2 bg-[#E6C200]'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Thumbnail strip at bottom */}
          {safeImages.length > 1 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden sm:flex gap-2 px-4">
              {safeImages.map((img, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setActiveIdx(i); setZoomed(false); }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    i === activeIdx ? 'border-[#E6C200]' : 'border-white/20 hover:border-white/50'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
