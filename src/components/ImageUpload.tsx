import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}
export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      // Pass empty headers to let browser set Content-Type with boundary
      const res = await api<{ url: string }>('/api/upload-file', {
        method: 'POST',
        body: formData,
        headers: {},
      });
      onChange(res.url);
      toast.success('Image uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed (though unlikely after success)
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  const handleRemove = () => {
    onChange('');
  };
  const triggerUpload = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className={cn("w-full", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
          <img
            src={value}
            alt="Uploaded inventory item"
            className="h-full w-full object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-8 w-8 rounded-full shadow-sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={triggerUpload}
          className={cn(
            "flex flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/5 px-6 py-10 text-center transition hover:bg-muted/10 cursor-pointer",
            isUploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-muted p-4">
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-muted-foreground">
                SVG, PNG, JPG or GIF (max. 5MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}