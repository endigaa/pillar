import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, ZoomIn } from 'lucide-react';
import { AddPhotoForm } from './AddPhotoForm';
import { PhotoViewer } from './PhotoViewer';
import type { ProgressPhoto } from '@shared/types';
interface ProjectPhotosProps {
  photos: ProgressPhoto[];
  onAddPhoto: (values: Omit<ProgressPhoto, 'id' | 'date'>) => Promise<void>;
}
export function ProjectPhotos({ photos = [], onAddPhoto }: ProjectPhotosProps) {
  const [isAddPhotoOpen, setAddPhotoOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // Safe copy for sorting
  const sortedPhotos = [...photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Progress Photos</CardTitle>
            <CardDescription>Visual timeline of the project's progress.</CardDescription>
          </div>
          <Dialog open={isAddPhotoOpen} onOpenChange={setAddPhotoOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add New Photo</DialogTitle>
                <DialogDescription>Provide a URL and description for the new progress photo.</DialogDescription>
              </DialogHeader>
              <AddPhotoForm onSubmit={onAddPhoto} onFinished={() => setAddPhotoOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {sortedPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedPhotos.map((photo, index) => (
                <div 
                  key={photo.id} 
                  className="group relative cursor-pointer overflow-hidden rounded-lg"
                  onClick={() => setViewerIndex(index)}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.description} 
                    className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ZoomIn className="text-white h-8 w-8 drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-sm font-semibold truncate">{photo.description}</p>
                    <p className="text-xs opacity-80">{new Date(photo.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <PhotoViewer 
        photos={sortedPhotos}
        initialIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
    </>
  );
}