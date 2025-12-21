import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Workshop } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const workshopSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  location: z.string().min(2, { message: 'Location is required.' }),
  description: z.string().optional(),
});
type WorkshopFormValues = z.infer<typeof workshopSchema>;
interface AddWorkshopFormProps {
  onFinished: () => void;
}
export function AddWorkshopForm({ onFinished }: AddWorkshopFormProps) {
  const form = useForm<WorkshopFormValues>({
    resolver: zodResolver(workshopSchema),
    defaultValues: { name: '', location: '', description: '' },
  });
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: WorkshopFormValues) => {
    try {
      await api('/api/workshops', { method: 'POST', body: JSON.stringify(values) });
      toast.success('Workshop created successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create workshop.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workshop Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Main Warehouse" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location / Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Industrial Blvd" {...field} />
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
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Details about this location..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Workshop
          </Button>
        </div>
      </form>
    </Form>
  );
}