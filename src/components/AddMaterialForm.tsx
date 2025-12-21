import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Material } from '@shared/types';
const materialFormSchema = z.object({
  name: z.string().min(3, { message: 'Material name must be at least 3 characters.' }),
  unit: z.string().min(1, { message: 'Unit is required (e.g., sq ft, piece, bag).' }),
  price: z.number().positive({ message: 'Price must be a positive number.' }),
});
type MaterialFormValues = z.infer<typeof materialFormSchema>;
interface AddMaterialFormProps {
  supplierId: string;
  onSubmit: (values: Omit<Material, 'id'>) => Promise<void>;
  onFinished: () => void;
}
export function AddMaterialForm({ supplierId, onSubmit, onFinished }: AddMaterialFormProps) {
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: { name: '', unit: '', price: 0 },
  });
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: MaterialFormValues) => {
    const materialData = {
      ...values,
      supplierId,
      price: Math.round(values.price * 100), // Convert to cents
    };
    await onSubmit(materialData);
    onFinished();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Name</FormLabel>
              <FormControl><Input placeholder="e.g., 2x4 Lumber, 8ft" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl><Input placeholder="e.g., piece" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="5.75" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Material
          </Button>
        </div>
      </form>
    </Form>
  );
}