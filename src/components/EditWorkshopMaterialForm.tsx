import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { WorkshopMaterial, WorkshopMaterialStatus, CustomProperty } from '@shared/types';
import { toast } from 'sonner';
import { DynamicPropertiesEditor } from './DynamicPropertiesEditor';
import { ImageUpload } from './ImageUpload';
const materialStatusOptions: [WorkshopMaterialStatus, ...WorkshopMaterialStatus[]] = ['Available', 'Reserved', 'Maintenance', 'Expired', 'Damaged'];
const editMaterialSchema = z.object({
  name: z.string().min(2, { message: 'Material name is required.' }),
  quantity: z.number().min(0, { message: 'Quantity must be non-negative.' }),
  unit: z.string().min(1, { message: 'Unit is required.' }),
  costPerUnit: z.number().min(0, { message: 'Cost must be non-negative.' }).optional(),
  lowStockThreshold: z.number().min(0).optional(),
  status: z.enum(materialStatusOptions).optional(),
  imageUrl: z.string().optional().or(z.literal('')),
});
type EditMaterialFormValues = z.infer<typeof editMaterialSchema>;
interface EditWorkshopMaterialFormProps {
  initialValues: WorkshopMaterial;
  onFinished: () => void;
}
export function EditWorkshopMaterialForm({ initialValues, onFinished }: EditWorkshopMaterialFormProps) {
  const [properties, setProperties] = useState<CustomProperty[]>(initialValues.properties || []);
  const form = useForm<EditMaterialFormValues>({
    resolver: zodResolver(editMaterialSchema),
    defaultValues: {
      name: initialValues.name,
      quantity: initialValues.quantity,
      unit: initialValues.unit,
      costPerUnit: (initialValues.costPerUnit || 0) / 100, // Convert cents to dollars for display
      lowStockThreshold: initialValues.lowStockThreshold || 10,
      status: initialValues.status || 'Available',
      imageUrl: initialValues.imageUrl || '',
    },
  });
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: EditMaterialFormValues) => {
    try {
      await api(`/api/workshop-materials/${initialValues.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...values,
          costPerUnit: values.costPerUnit ? Math.round(values.costPerUnit * 100) : 0, // Convert back to cents
          properties,
        }),
      });
      toast.success('Material updated successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update material.');
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
              <FormLabel>Material Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 3-inch Drywall Screws" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., box" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {materialStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div className="flex justify-end pt-4 space-x-2">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}