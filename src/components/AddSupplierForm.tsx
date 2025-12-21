import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import type { Supplier, SupplyReach, SupplierCategory, ConstructionStage } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleCategoryForm } from './SimpleCategoryForm';
const supplyReachOptions: [SupplyReach, ...SupplyReach[]] = ['Local', 'National', 'Radius'];
const supplierFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  contactPerson: z.string().min(2, { message: 'Contact person must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  location: z.string().optional(),
  category: z.string().min(1, { message: 'Category is required.' }),
  constructionStages: z.array(z.string()).min(1, { message: 'At least one stage is required.' }),
  supplyReach: z.enum(supplyReachOptions),
  supplyRadiusKm: z.number().optional(),
}).refine(data => {
    if (data.supplyReach === 'Radius') {
        return data.supplyRadiusKm !== undefined && data.supplyRadiusKm > 0;
    }
    return true;
}, {
    message: 'Radius is required when supply reach is "Radius"',
    path: ['supplyRadiusKm'],
});
type SupplierFormValues = z.infer<typeof supplierFormSchema>;
interface AddSupplierFormProps {
  onSubmit: (values: Omit<Supplier, 'id' | 'materials'>) => Promise<void>;
  onFinished: () => void;
}
export function AddSupplierForm({ onSubmit, onFinished }: AddSupplierFormProps) {
  const [categories, setCategories] = useState<SupplierCategory[]>([]);
  const [stages, setStages] = useState<ConstructionStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, stageData] = await Promise.all([
          api<SupplierCategory[]>('/api/supplier-categories'),
          api<ConstructionStage[]>('/api/construction-stages'),
        ]);
        setCategories(catData);
        setStages(stageData);
      } catch (err) {
        toast.error("Failed to load form data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      location: '',
      category: '',
      constructionStages: [],
      supplyReach: 'Local',
    },
  });
  const { isSubmitting } = form.formState;
  const supplyReach = form.watch('supplyReach');
  const handleFormSubmit = async (values: SupplierFormValues) => {
    const submissionData = {
        ...values,
        supplyRadiusKm: values.supplyReach === 'Radius' ? values.supplyRadiusKm : undefined,
    };
    await onSubmit(submissionData);
    onFinished();
  };
  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await api<SupplierCategory>('/api/supplier-categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setCategories(prev => [...prev, newCategory]);
      form.setValue('category', newCategory.name);
      setIsNewCategoryOpen(false);
      toast.success('Category created and selected!');
    } catch (err) {
      toast.error('Failed to create category.');
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Supplier Name</FormLabel><FormControl><Input placeholder="e.g., ProBuild Lumber" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g., Sarah Connor" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" placeholder="sarah@probuild.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="555-987-6543" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location (Optional)</FormLabel><FormControl><Input placeholder="e.g., Anytown County" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
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
          <FormField control={form.control} name="constructionStages" render={() => (<FormItem><FormLabel>Construction Stages Supported</FormLabel><ScrollArea className="h-32 w-full rounded-md border p-4"><div className="space-y-2">{stages.map((item) => (<FormField key={item.id} control={form.control} name="constructionStages" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.name)} onCheckedChange={(checked) => { return checked ? field.onChange([...(field.value || []), item.name]) : field.onChange(field.value?.filter((value) => value !== item.name))}} /></FormControl><FormLabel className="font-normal">{item.name}</FormLabel></FormItem>)} />))}</div></ScrollArea><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="supplyReach"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supply Reach</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supply reach" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {supplyReachOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {supplyReach === 'Radius' && (
            <FormField
              control={form.control}
              name="supplyRadiusKm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supply Radius (km)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Supplier
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Supplier Category</DialogTitle>
            <DialogDescription>Create a new category for organizing suppliers.</DialogDescription>
          </DialogHeader>
          <SimpleCategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => setIsNewCategoryOpen(false)}
            label="Category Name"
            placeholder="e.g., Concrete, Roofing"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}