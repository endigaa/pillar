import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { WorksiteMaterialIssue } from '@shared/types';
import { toast } from 'sonner';
const returnSchema = z.object({
  quantity: z.number().min(1, { message: 'Quantity must be at least 1.' }),
});
type ReturnFormValues = z.infer<typeof returnSchema>;
interface ReturnMaterialDialogProps {
  projectId: string;
  materialIssue: WorksiteMaterialIssue;
  onFinished: () => void;
}
export function ReturnMaterialDialog({ projectId, materialIssue, onFinished }: ReturnMaterialDialogProps) {
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      quantity: 1,
    },
  });
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: ReturnFormValues) => {
    if (values.quantity > materialIssue.quantity) {
      form.setError('quantity', { message: `Cannot return more than issued (${materialIssue.quantity}).` });
      return;
    }
    try {
      await api(`/api/projects/${projectId}/return-material`, {
        method: 'POST',
        body: JSON.stringify({
          worksiteMaterialId: materialIssue.id,
          quantity: values.quantity,
        }),
      });
      toast.success('Material returned to inventory successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to return material.');
    }
  };
  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Return Material to Inventory</DialogTitle>
        <DialogDescription>
          Return unused items back to the workshop. This will increase workshop stock and decrease project usage.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/20 mb-4">
            <p className="text-sm font-medium">Returning: {materialIssue.materialName}</p>
            <p className="text-xs text-muted-foreground">Currently Issued: {materialIssue.quantity} {materialIssue.unit}</p>
          </div>
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity to Return</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Max: {materialIssue.quantity}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Return Items
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}