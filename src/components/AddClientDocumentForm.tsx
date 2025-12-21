import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, UploadCloud, File, X } from 'lucide-react';
import type { ClientDocument } from '@shared/types';
import { toast } from 'sonner';
const clientDocumentFormSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  tags: z.string().optional(),
  // We don't validate URL here because it's generated from the file
});
type ClientDocumentFormValues = z.infer<typeof clientDocumentFormSchema>;
interface AddClientDocumentFormProps {
  onSubmit: (values: Omit<ClientDocument, 'id' | 'uploadedAt'>) => Promise<void>;
  onFinished: () => void;
}
export function AddClientDocumentForm({ onSubmit, onFinished }: AddClientDocumentFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const form = useForm<ClientDocumentFormValues>({
    resolver: zodResolver(clientDocumentFormSchema),
    defaultValues: {
      description: '',
      tags: '',
    },
  });
  const { isSubmitting } = form.formState;
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill description if empty
      if (!form.getValues('description')) {
        form.setValue('description', file.name.split('.')[0]);
      }
    }
  };
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };
  const handleFormSubmit = async (values: ClientDocumentFormValues) => {
    if (!selectedFile) {
      toast.error('Please select a file to upload.');
      return;
    }
    setIsUploading(true);
    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Generate a mock URL based on file type
      // In a real app, this would be the URL returned from the storage bucket
      const isImage = selectedFile.type.startsWith('image/');
      const mockUrl = isImage
        ? `https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2070` // Generic document image
        : `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`; // Dummy PDF
      const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
      const documentData = {
        url: mockUrl,
        description: values.description,
        tags: tagsArray,
      };
      await onSubmit(documentData);
      onFinished();
    } catch (error) {
      toast.error('Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="space-y-2">
          <FormLabel>Document File</FormLabel>
          {!selectedFile ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/5 hover:bg-muted/10 border-muted-foreground/25 hover:border-primary/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, JPG, PNG (MAX. 10MB)</p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <File className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
                <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )}
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Signed contract, Floor plans, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="contract, signed, important (comma separated)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting || isUploading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Form>
  );
}