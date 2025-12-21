import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Supplier, Quote } from '@shared/types';
import { toast } from 'sonner';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddSupplierForm } from './AddSupplierForm';
const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price must be non-negative'),
});
const quoteFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
});
type QuoteFormValues = z.infer<typeof quoteFormSchema>;
interface AddQuoteFormProps {
  projectId: string;
  onFinished: () => void;
}
export function AddQuoteForm({ projectId, onFinished }: AddQuoteFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await api<Supplier[]>('/api/suppliers');
        setSuppliers(data);
      } catch (err) {
        toast.error('Failed to load suppliers');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      supplierId: '',
      notes: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: QuoteFormValues) => {
    try {
      const totalAmount = values.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * 100), 0);
      const quoteData = {
        projectId,
        supplierId: values.supplierId,
        notes: values.notes,
        totalAmount,
        items: values.items.map(item => ({
          ...item,
          unitPrice: Math.round(item.unitPrice * 100),
          total: Math.round(item.quantity * item.unitPrice * 100),
        })),
      };
      await api('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData),
      });
      toast.success('Quote added successfully');
      onFinished();
    } catch (err) {
      toast.error('Failed to add quote');
    }
  };
  const handleCreateSupplier = async (values: Omit<Supplier, 'id' | 'materials'>) => {
    try {
      const newSupplier = await api<Supplier>('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setSuppliers(prev => [...prev, newSupplier]);
      form.setValue('supplierId', newSupplier.id);
      setIsNewSupplierOpen(false);
      toast.success('Supplier created and selected!');
    } catch (err) {
      toast.error('Failed to create supplier');
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select a supplier"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewSupplierOpen(true)}
                    title="Add New Supplier"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Includes delivery" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Line Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Qty"
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
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="w-24">
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          {...field}
                          onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="mt-0.5"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <FormField
              control={form.control}
              name="items"
              render={({ fieldState }) => (
                <FormMessage>{fieldState.error?.root?.message || fieldState.error?.message}</FormMessage>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Quote
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewSupplierOpen} onOpenChange={setIsNewSupplierOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Create a new supplier record instantly.</DialogDescription>
          </DialogHeader>
          <AddSupplierForm onSubmit={handleCreateSupplier} onFinished={() => {}} />
        </DialogContent>
      </Dialog>
    </>
  );
}