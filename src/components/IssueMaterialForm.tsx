import { useState, useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { WorkshopMaterial } from '@shared/types';
import { toast } from 'sonner';
const issueMaterialSchema = z.object({
  workshopMaterialId: z.string().min(1, { message: 'Please select a material.' }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
  isBillable: z.boolean(),
});
interface IssueMaterialFormValues {
  workshopMaterialId: string;
  quantity: number;
  isBillable: boolean;
}
interface IssueMaterialFormProps {
  projectId: string;
  onFinished: () => void;
}
export function IssueMaterialForm({ projectId, onFinished }: IssueMaterialFormProps) {
  const [materials, setMaterials] = useState<WorkshopMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<IssueMaterialFormValues>({
    resolver: zodResolver(issueMaterialSchema),
    defaultValues: {
      workshopMaterialId: '',
      quantity: 1,
      isBillable: false,
    },
  });
  const selectedMaterialId = form.watch('workshopMaterialId');
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setIsLoading(true);
        const data = await api<WorkshopMaterial[]>('/api/workshop-materials');
        setMaterials(data);
      } catch (err) {
        toast.error('Failed to load workshop inventory.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMaterials();
  }, []);
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: IssueMaterialFormValues) => {
    if (selectedMaterial && values.quantity > selectedMaterial.quantity) {
        form.setError('quantity', { message: `Only ${selectedMaterial.quantity} available.` });
        return;
    }
    try {
      await api(`/api/projects/${projectId}/issue-material`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Material issued successfully!');
      onFinished();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to issue material.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="workshopMaterialId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Material</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select material from inventory"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {materials.map((material) => (
                    <SelectItem key={material.id} value={material.id} disabled={material.quantity <= 0}>
                      {material.name} ({material.quantity} {material.unit} available)
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity to Issue</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  {...field}
                  onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </FormControl>
              {selectedMaterial && (
                <FormDescription>
                  Available: {selectedMaterial.quantity} {selectedMaterial.unit}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isBillable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Billable to Client
                </FormLabel>
                <FormDescription>
                  If checked, this item can be added to client invoices.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Issue Material
          </Button>
        </div>
      </form>
    </Form>
  );
}