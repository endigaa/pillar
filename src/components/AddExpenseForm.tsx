import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Expense, ExpenseCategory, Personnel } from '@shared/types';
import { Separator } from './ui/separator';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { SimpleCategoryForm } from '@/components/SimpleCategoryForm';
import { AddPersonnelForm } from '@/components/AddPersonnelForm';
const taxSchema = z.object({
  name: z.string().min(1, { message: 'Tax name is required.' }),
  rate: z.number().min(0, { message: 'Rate must be non-negative.' }).max(100, { message: 'Rate cannot exceed 100.' }),
});
const expenseFormSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  amount: z.number().positive({ message: 'Amount must be a positive number.' }),
  date: z.date(),
  category: z.string().min(1, { message: 'Please select a category.' }),
  workStage: z.string().optional(),
  taxes: z.array(taxSchema).optional(),
  personnelId: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
});
type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
interface AddExpenseFormProps {
  onSubmit: (values: Omit<Expense, 'id'>) => Promise<void>;
  onFinished: () => void;
}
export function AddExpenseForm({ onSubmit, onFinished }: AddExpenseFormProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [isNewPersonnelOpen, setIsNewPersonnelOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, personnelData] = await Promise.all([
          api<ExpenseCategory[]>('/api/expense-categories'),
          api<Personnel[]>('/api/personnel'),
        ]);
        setCategories(catData);
        setPersonnel(personnelData);
      } catch (err) {
        toast.error('Failed to load form data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      category: '',
      workStage: '',
      taxes: [],
      personnelId: '',
      quantity: 0,
      unit: '',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "taxes",
  });
  const category = form.watch('category');
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: ExpenseFormValues) => {
    const expenseData = {
      ...values,
      amount: Math.round(values.amount * 100), // Convert to cents
      date: values.date.toISOString(),
      taxes: values.taxes?.map(tax => ({ ...tax, id: crypto.randomUUID() })),
      workStage: values.category === 'Materials' ? values.workStage : undefined,
      personnelId: values.personnelId || undefined,
      quantity: values.category === 'Materials' ? values.quantity : undefined,
      unit: values.category === 'Materials' ? values.unit : undefined,
      unusedQuantity: 0, // Initialize unused quantity to 0
    };
    await onSubmit(expenseData);
    onFinished();
  };
  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await api<ExpenseCategory>('/api/expense-categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCategories(prev => [...prev, newCategory]);
      form.setValue('category', newCategory.name);
      setIsNewCategoryOpen(false);
      toast.success('Category created and selected!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category.');
    }
  };
  const handleCreatePersonnel = async (values: Omit<Personnel, 'id' | 'associatedExpenseIds'>) => {
    try {
      const newPersonnel = await api<Personnel>('/api/personnel', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setPersonnel(prev => [...prev, newPersonnel]);
      form.setValue('personnelId', newPersonnel.id);
      setIsNewPersonnelOpen(false);
      toast.success('Personnel created and selected!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create personnel.');
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Lumber for framing" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (Subtotal, $)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="150.00"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select a category"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsNewCategoryOpen(true)}
                        title="Add New Category"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
          {category === 'Materials' && (
            <>
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
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., pcs, bags" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField control={form.control} name="workStage" render={({ field }) => (<FormItem><FormLabel>Work Stage (Optional)</FormLabel><FormControl><Input placeholder="e.g., Framing, Foundation" {...field} /></FormControl><FormMessage /></FormItem>)} />
            </>
          )}
          <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Expense</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="personnelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Associate with Personnel (Optional)</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select personnel"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {personnel.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewPersonnelOpen(true)}
                    title="Add New Personnel"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-2">Taxes (Optional)</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField control={form.control} name={`taxes.${index}.name`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Tax Name (e.g., GST)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField
                    control={form.control}
                    name={`taxes.${index}.rate`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Rate %"
                            {...field}
                            className="w-28"
                            onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', rate: 0 })}><PlusCircle className="mr-2 h-4 w-4" /> Add Tax</Button>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>{(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Expense</Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Expense Category</DialogTitle>
            <DialogDescription>Create a new category for organizing expenses.</DialogDescription>
          </DialogHeader>
          <SimpleCategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => setIsNewCategoryOpen(false)}
            label="Category Name"
            placeholder="e.g., Travel, Equipment"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isNewPersonnelOpen} onOpenChange={setIsNewPersonnelOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Personnel</DialogTitle>
            <DialogDescription>Create a new personnel record instantly.</DialogDescription>
          </DialogHeader>
          <AddPersonnelForm
            onSubmit={handleCreatePersonnel}
            onFinished={() => {}} // Dialog closes via state in handleCreatePersonnel
          />
        </DialogContent>
      </Dialog>
    </>
  );
}