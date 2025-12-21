import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Workshop, WorkshopMaterial } from '@shared/types';
import { toast } from 'sonner';
const moveSchema = z.object({
  targetWorkshopId: z.string().min(1, { message: 'Target workshop is required.' }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
});
type MoveFormValues = z.infer<typeof moveSchema>;
interface MoveInventoryFormProps {
  sourceMaterial: WorkshopMaterial;
  onFinished: () => void;
}
export function MoveInventoryForm({ sourceMaterial, onFinished }: MoveInventoryFormProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<MoveFormValues>({
    resolver: zodResolver(moveSchema),
    defaultValues: { targetWorkshopId: '', quantity: 1 },
  });
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        setIsLoading(true);
        const data = await api<Workshop[]>('/api/workshops');
        // Filter out current workshop
        setWorkshops(data.filter(w => w.id !== sourceMaterial.workshopId));
      } catch (err) {
        toast.error('Failed to load workshops.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkshops();
  }, [sourceMaterial.workshopId]);
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: MoveFormValues) => {
    if (values.quantity > sourceMaterial.quantity) {
      form.setError('quantity', { message: `Only ${sourceMaterial.quantity} available.` });
      return;
    }
    try {
      await api('/api/workshop-materials/move', {
        method: 'POST',
        body: JSON.stringify({
          sourceMaterialId: sourceMaterial.id,
          targetWorkshopId: values.targetWorkshopId,
          quantity: values.quantity,
        }),
      });
      toast.success('Inventory moved successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move inventory.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-4 border rounded-md bg-muted/20 mb-4">
          <p className="text-sm font-medium">Moving: {sourceMaterial.name}</p>
          <p className="text-xs text-muted-foreground">Current Location: {sourceMaterial.workshopName}</p>
          <p className="text-xs text-muted-foreground">Available: {sourceMaterial.quantity} {sourceMaterial.unit}</p>
        </div>
        <FormField
          control={form.control}
          name="targetWorkshopId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To Workshop</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Loading..." : "Select destination"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workshops.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
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
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>Max: {sourceMaterial.quantity}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || isLoading || workshops.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Items
          </Button>
        </div>
      </form>
    </Form>
  );
}