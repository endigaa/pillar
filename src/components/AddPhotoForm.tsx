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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { ProgressPhoto } from '@shared/types';
const photoFormSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
});
type PhotoFormValues = z.infer<typeof photoFormSchema>;
interface AddPhotoFormProps {
  onSubmit: (values: Omit<ProgressPhoto, 'id' | 'date'>) => Promise<void>;
  onFinished: () => void;
}
export function AddPhotoForm({ onSubmit, onFinished }: AddPhotoFormProps) {
  const form = useForm<PhotoFormValues>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      url: '',
      description: '',
    },
  });
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: PhotoFormValues) => {
    await onSubmit(values);
    onFinished();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Framing completed" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Photo
          </Button>
        </div>
      </form>
    </Form>
  );
}