import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import type { Personnel, Project, Workshop, LocationType } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const nextOfKinSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Name is required.' }),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
  relationship: z.string().min(2, { message: 'Relationship is required.' }),
});
const locationTypes: [LocationType, ...LocationType[]] = ['Workshop', 'Project', 'Other'];
const personnelFormSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  role: z.string().min(2, { message: 'Role is required.' }),
  email: z.string().email({ message: 'A valid email is required.' }),
  phone: z.string().min(10, { message: 'A valid phone number is required.' }),
  hireDate: z.date(),
  separationDate: z.date().optional(),
  employmentType: z.enum(['Permanent', 'Casual']),
  rate: z.number().positive({ message: 'Rate must be a positive number.' }),
  rateType: z.enum(['Annually', 'Monthly', 'Weekly', 'Daily']),
  nextOfKin: z.array(nextOfKinSchema).min(1, { message: 'At least one next of kin is required.' }),
  specialization: z.string().optional(),
  locationType: z.enum(locationTypes),
  locationId: z.string().optional(),
});
type PersonnelFormValues = z.infer<typeof personnelFormSchema>;
interface EditPersonnelFormProps {
  initialValues: Personnel;
  onFinished: () => void;
}
export function EditPersonnelForm({ initialValues, onFinished }: EditPersonnelFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [projData, wsData] = await Promise.all([
          api<Project[]>('/api/projects'),
          api<Workshop[]>('/api/workshops')
        ]);
        setProjects(projData);
        setWorkshops(wsData);
      } catch (err) {
        toast.error('Failed to load locations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const form = useForm<PersonnelFormValues>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      name: initialValues.name,
      role: initialValues.role,
      email: initialValues.email,
      phone: initialValues.phone,
      hireDate: new Date(initialValues.hireDate),
      separationDate: initialValues.separationDate ? new Date(initialValues.separationDate) : undefined,
      employmentType: initialValues.employmentType,
      rate: initialValues.rate / 100, // Convert cents to dollars
      rateType: initialValues.rateType,
      nextOfKin: initialValues.nextOfKin,
      specialization: initialValues.specialization,
      locationType: initialValues.locationType || 'Other',
      locationId: initialValues.locationId || '',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "nextOfKin",
  });
  const locationType = form.watch('locationType');
  // Reset location ID when type changes, but only if it's user interaction
  useEffect(() => {
    if (locationType !== initialValues.locationType && form.getValues('locationId') === initialValues.locationId) {
        form.setValue('locationId', '');
    }
  }, [locationType, initialValues.locationType, initialValues.locationId, form]);
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: PersonnelFormValues) => {
    const personnelData = {
      ...values,
      hireDate: values.hireDate.toISOString(),
      separationDate: values.separationDate ? values.separationDate.toISOString() : undefined,
      rate: Math.round(values.rate * 100), // Convert to cents
      nextOfKin: values.nextOfKin.map(nok => ({ ...nok, id: nok.id || crypto.randomUUID() })), // Preserve ID if exists
      locationId: values.locationType === 'Other' ? undefined : values.locationId,
    };
    try {
        await api(`/api/personnel/${initialValues.id}`, {
            method: 'PUT',
            body: JSON.stringify(personnelData),
        });
        toast.success('Personnel updated successfully!');
        onFinished();
    } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update personnel.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="e.g., Mike Foreman" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><FormControl><Input placeholder="e.g., Site Foreman" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {locationType !== 'Other' && (
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select {locationType}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={`Select ${locationType}`} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationType === 'Workshop'
                        ? workshops.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)
                        : projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField control={form.control} name="specialization" render={({ field }) => (<FormItem><FormLabel>Specialization (Optional)</FormLabel><FormControl><Input placeholder="e.g., Finish Carpentry" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="mike.f@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="555-010-1111" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="hireDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Hire Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="separationDate" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Separation Date (Optional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="employmentType" render={({ field }) => (<FormItem><FormLabel>Employment Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Permanent">Permanent</SelectItem><SelectItem value="Casual">Casual</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="rateType" render={({ field }) => (<FormItem><FormLabel>Pay Rate Type</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select rate" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Annually">Annually</SelectItem><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Daily">Daily</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
        </div>
        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pay Rate ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="100"
                  placeholder="75000"
                  {...field}
                  onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <div>
          <h3 className="text-sm font-medium mb-2">Next of Kin</h3>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name={`nextOfKin.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Sarah Foreman" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name={`nextOfKin.${index}.phone`} render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input placeholder="555-010-1112" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name={`nextOfKin.${index}.relationship`} render={({ field }) => (<FormItem><FormLabel>Relationship</FormLabel><FormControl><Input placeholder="e.g., Spouse" {...field} /></FormControl><FormMessage /></FormItem>)} />
                {fields.length > 1 && (
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', phone: '', relationship: '' })}><PlusCircle className="mr-2 h-4 w-4" /> Add Next of Kin</Button>
            <FormField control={form.control} name="nextOfKin" render={({ fieldState }) => <FormMessage>{fieldState.error?.message || fieldState.error?.root?.message}</FormMessage>} />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Personnel
          </Button>
        </div>
      </form>
    </Form>
  );
}