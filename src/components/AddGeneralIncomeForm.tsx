import { useState } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { GeneralIncome } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const generalIncomeFormSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  amount: z.number().positive({ message: 'Amount must be a positive number.' }),
  date: z.date(),
  category: z.string().min(1, { message: 'Category is required.' }),
});
type GeneralIncomeFormValues = z.infer<typeof generalIncomeFormSchema>;
interface AddGeneralIncomeFormProps {
  onSubmit: (values: Omit<GeneralIncome, 'id'>) => Promise<void>;
  onFinished: () => void;
}
export function AddGeneralIncomeForm({ onSubmit, onFinished }: AddGeneralIncomeFormProps) {
  const form = useForm<GeneralIncomeFormValues>({
    resolver: zodResolver(generalIncomeFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      category: '',
    },
  });
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: GeneralIncomeFormValues) => {
    const incomeData = {
      ...values,
      amount: Math.round(values.amount * 100), // Convert to cents
      date: values.date.toISOString(),
    };
    await onSubmit(incomeData);
    onFinished();
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="e.g., Sale of old equipment" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="500.00"
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
                  <FormControl>
                    <Input placeholder="e.g., Asset Sale, Consulting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField control={form.control} name="date" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Income</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{(isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add Income</Button>
        </div>
      </form>
    </Form>
  );
}