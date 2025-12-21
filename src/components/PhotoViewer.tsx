import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface Photo {
  id: string;
  url: string;
  description: string;
  date?: string;
}
interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
export function PhotoViewer({ photos, initialIndex, isOpen, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
    }
  }, [isOpen, initialIndex]);
  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setScale(1);
    }
  }, [currentIndex, photos.length]);
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setScale(1);
    }
  }, [currentIndex]);
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  }, [isOpen, onClose, handleNext, handlePrev]);
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  if (!isOpen) return null;
  const currentPhoto = photos[currentIndex];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-[110]">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setScale(s => Math.min(s + 0.5, 3))}>
              <ZoomIn className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setScale(s => Math.max(s - 0.5, 1))}>
              <ZoomOut className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => window.open(currentPhoto.url, '_blank')}>
              <Download className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[110] h-12 w-12 rounded-full"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {currentIndex < photos.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-[110] h-12 w-12 rounded-full"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-4">
            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative flex items-center justify-center w-full h-full"
            >
              <motion.img
                src={currentPhoto.url}
                alt={currentPhoto.description}
                className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
                style={{ scale }}
                drag={scale > 1}
                dragConstraints={{ left: -100 * scale, right: 100 * scale, top: -100 * scale, bottom: 100 * scale }}
              />
            </motion.div>
          </div>
          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white z-[110]">
            <div className="max-w-4xl mx-auto text-center">
              <h3 className="text-lg font-semibold">{currentPhoto.description}</h3>
              {currentPhoto.date && (
                <p className="text-sm text-gray-300">{new Date(currentPhoto.date).toLocaleDateString()}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}