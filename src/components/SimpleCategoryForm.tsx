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
import { Loader2 } from 'lucide-react';
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});
type CategoryFormValues = z.infer<typeof categorySchema>;
interface SimpleCategoryFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
  label?: string;
}
export function SimpleCategoryForm({ onSubmit, onCancel, placeholder = "Name", label = "Name" }: SimpleCategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
    },
  });
  const { isSubmitting } = form.formState;
  const handleSubmit = async (values: CategoryFormValues) => {
    await onSubmit(values.name);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label}</FormLabel>
              <FormControl>
                <Input placeholder={placeholder} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
}