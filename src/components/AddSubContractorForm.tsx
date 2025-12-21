import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle } from 'lucide-react';
import type { SubContractor, ConstructionStage } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleCategoryForm } from './SimpleCategoryForm';
const subContractorFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  specialization: z.string().min(1, { message: 'Please select a specialization.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 digits.' }),
  location: z.string().optional(),
});
type SubContractorFormValues = z.infer<typeof subContractorFormSchema>;
interface AddSubContractorFormProps {
  onSubmit: (values: Omit<SubContractor, 'id'>) => Promise<void>;
  onFinished: () => void;
}
export function AddSubContractorForm({ onSubmit, onFinished }: AddSubContractorFormProps) {
  const [stages, setStages] = useState<ConstructionStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewStageOpen, setIsNewStageOpen] = useState(false);
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const data = await api<ConstructionStage[]>('/api/construction-stages');
        setStages(data);
      } catch (err) {
        toast.error('Failed to load specializations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStages();
  }, []);
  const form = useForm<SubContractorFormValues>({
    resolver: zodResolver(subContractorFormSchema),
    defaultValues: { name: '', specialization: '', email: '', phone: '', location: '' },
  });
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: SubContractorFormValues) => {
    await onSubmit(values);
    onFinished();
  };
  const handleCreateStage = async (name: string) => {
    try {
      const newStage = await api<ConstructionStage>('/api/construction-stages', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setStages(prev => [...prev, newStage]);
      form.setValue('specialization', newStage.name);
      setIsNewStageOpen(false);
      toast.success('Specialization created and selected!');
    } catch (err) {
      toast.error('Failed to create specialization.');
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company/Full Name</FormLabel>
                <FormControl><Input placeholder="e.g., Apex Electricians" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="specialization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specialization</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select a specialization"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewStageOpen(true)}
                    title="Add New Specialization"
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., North District" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="contact@apex.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="555-789-1234" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {(isSubmitting || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Sub-contractor
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Specialization</DialogTitle>
            <DialogDescription>Create a new specialization (construction stage).</DialogDescription>
          </DialogHeader>
          <SimpleCategoryForm
            onSubmit={handleCreateStage}
            onCancel={() => setIsNewStageOpen(false)}
            label="Specialization Name"
            placeholder="e.g., Electrical, Plumbing"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}