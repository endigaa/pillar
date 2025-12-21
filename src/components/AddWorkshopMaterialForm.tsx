import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { CustomProperty } from '@shared/types';
import { toast } from 'sonner';
import { DynamicPropertiesEditor } from './DynamicPropertiesEditor';
import { ImageUpload } from './ImageUpload';
const materialSchema = z.object({
  name: z.string().min(2, { message: 'Material name is required.' }),
  quantity: z.number().min(0, { message: 'Quantity must be non-negative.' }),
  unit: z.string().min(1, { message: 'Unit is required.' }),
  costPerUnit: z.number().min(0, { message: 'Cost must be non-negative.' }).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  imageUrl: z.string().optional().or(z.literal('')),
});
type MaterialFormValues = z.infer<typeof materialSchema>;
interface AddWorkshopMaterialFormProps {
  workshopId: string;
  onFinished: () => void;
}
export function AddWorkshopMaterialForm({ workshopId, onFinished }: AddWorkshopMaterialFormProps) {
  const [properties, setProperties] = useState<CustomProperty[]>([]);
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { name: '', quantity: 0, unit: '', costPerUnit: 0, lowStockThreshold: 10, imageUrl: '' },
  });
  const onSubmit = async (values: MaterialFormValues) => {
    try {
      await api('/api/workshop-materials', {
        method: 'POST',
        body: JSON.stringify({
            ...values,
            workshopId,
            costPerUnit: values.costPerUnit ? Math.round(values.costPerUnit * 100) : 0, // Convert to cents
            status: 'Available',
            properties,
        })
      });
      toast.success('Material added to workshop inventory!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add material.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Material Name</FormLabel><FormControl><Input placeholder="e.g., 3-inch Drywall Screws" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="10"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., box, piece, gallon" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="costPerUnit"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Cost per Unit ($)</FormLabel>
                    <FormControl>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Low Stock Alert At</FormLabel>
                    <FormControl>
                    <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material Image</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DynamicPropertiesEditor properties={properties} onChange={setProperties} />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Material
          </Button>
        </div>
      </form>
    </Form>
  );
}