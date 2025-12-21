import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
const saveTemplateSchema = z.object({
  name: z.string().min(2, { message: 'Template name is required.' }),
  description: z.string().optional(),
});
type SaveTemplateFormValues = z.infer<typeof saveTemplateSchema>;
interface SaveTemplateDialogProps {
  onSave: (values: SaveTemplateFormValues) => Promise<void>;
  onCancel: () => void;
}
export function SaveTemplateDialog({ onSave, onCancel }: SaveTemplateDialogProps) {
  const form = useForm<SaveTemplateFormValues>({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  const { isSubmitting } = form.formState;
  const handleSubmit = async (values: SaveTemplateFormValues) => {
    await onSave(values);
  };
  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogDescription>
          Create a reusable template from the current project plan.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Custom Kitchen Remodel" {...field} />
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
                  <Textarea placeholder="Brief description of this template..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}