import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Invoice, Project, Expense, Material, ChangeOrder, WorksiteMaterialIssue } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { InvoiceItemSelector } from './InvoiceItemSelector';
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.number().min(0.1, 'Quantity must be positive.'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative.'),
  sourceId: z.string().optional(),
  sourceType: z.enum(['expense', 'material', 'change_order', 'custom', 'inventory_issue']).optional(),
});
const invoiceFormSchema = z.object({
  issueDate: z.date(),
  dueDate: z.date(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required.'),
  tax: z.number().min(0).optional(),
});
type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
interface CreateInvoiceFormProps {
  project: Project;
  invoices: Invoice[];
  onSubmit: (values: Omit<Invoice, 'id' | 'invoiceNumber' | 'clientName' | 'projectName'>) => Promise<void>;
  onFinished: () => void;
}
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInCents / 100);
};
export function CreateInvoiceForm({ project, invoices, onSubmit, onFinished }: CreateInvoiceFormProps) {
  const [isItemSelectorOpen, setItemSelectorOpen] = useState(false);
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      lineItems: [],
      tax: 0,
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "lineItems" });
  const { isSubmitting } = form.formState;
  const lineItems = useWatch({ control: form.control, name: 'lineItems' });
  const taxRate = useWatch({ control: form.control, name: 'tax' }) || 0;
  const subtotal = lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  const handleAddItems = (items: (Expense | Material | ChangeOrder | WorksiteMaterialIssue)[], type: 'expense' | 'material' | 'change_order' | 'inventory_issue') => {
    items.forEach(item => {
      if (type === 'expense' && 'amount' in item) {
        append({
          description: item.description,
          quantity: 1,
          unitPrice: item.amount / 100,
          sourceId: item.id,
          sourceType: 'expense',
        });
      } else if (type === 'material' && 'price' in item) {
        append({
          description: item.name,
          quantity: 1,
          unitPrice: item.price / 100,
          sourceId: item.id,
          sourceType: 'material',
        });
      } else if (type === 'change_order' && 'totalAmount' in item) {
        append({
          description: `Change Order: ${item.title}`,
          quantity: 1,
          unitPrice: item.totalAmount / 100,
          sourceId: item.id,
          sourceType: 'change_order',
        });
      } else if (type === 'inventory_issue' && 'unitCost' in item) {
        append({
            description: `Inventory: ${item.materialName}`,
            quantity: item.quantity,
            unitPrice: (item.unitCost || 0) / 100,
            sourceId: item.id,
            sourceType: 'inventory_issue',
        });
      }
    });
    setItemSelectorOpen(false);
  };
  const handleFormSubmit = async (values: InvoiceFormValues) => {
    const subtotalInCents = Math.round(subtotal * 100);
    const taxInCents = Math.round(taxAmount * 100);
    const totalInCents = Math.round(total * 100);
    const invoiceData = {
      projectId: project.id,
      clientId: project.clientId,
      issueDate: values.issueDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      lineItems: values.lineItems.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.unitPrice * 100),
        total: Math.round(item.quantity * item.unitPrice * 100),
        sourceId: item.sourceId,
        sourceType: item.sourceType,
      })),
      subtotal: subtotalInCents,
      tax: taxInCents,
      total: totalInCents,
      status: 'Draft' as const,
    };
    await onSubmit(invoiceData);
    onFinished();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="issueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="dueDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Line Items</h3>
          <div className="border rounded-md">
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead className="w-28">Quantity</TableHead><TableHead className="w-32">Unit Price</TableHead><TableHead className="text-right w-32">Total</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell><FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => <Input placeholder="Item description" {...field} />} /></TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.quantity`}
                        render={({ field }) => (
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lineItems.${index}.unitPrice`}
                        render={({ field }) => (
                          <Input
                            type="number"
                            placeholder="100.00"
                            {...field}
                            onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency((lineItems[index]?.quantity || 0) * (lineItems[index]?.unitPrice || 0) * 100)}</TableCell>
                    <TableCell><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unitPrice: 0, sourceType: 'custom' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Custom Item</Button>
            <Dialog open={isItemSelectorOpen} onOpenChange={setItemSelectorOpen}>
              <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add from Project</Button></DialogTrigger>
              <DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Select Billable Items</DialogTitle><DialogDescription>Choose unbilled expenses, materials, or change orders to add to the invoice.</DialogDescription></DialogHeader><InvoiceItemSelector project={project} invoices={invoices} onAddItems={handleAddItems} /></DialogContent>
            </Dialog>
          </div>
          <FormField control={form.control} name="lineItems" render={({ fieldState }) => <FormMessage>{fieldState.error?.message || fieldState.error?.root?.message}</FormMessage>} />
        </div>
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal * 100)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tax (%)</span>
              <FormField
                control={form.control}
                name="tax"
                render={({ field }) => (
                  <Input
                    type="number"
                    className="w-24 h-8"
                    placeholder="0"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                )}
              />
            </div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax Amount</span><span>{formatCurrency(taxAmount * 100)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span >Total</span><span>{formatCurrency(total * 100)}</span></div>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Invoice</Button>
        </div>
      </form>
    </Form>
  );
}