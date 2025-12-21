import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Tool, ToolCategory, ToolStatus, LocationType, Workshop, Project, CustomProperty } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { DynamicPropertiesEditor } from './DynamicPropertiesEditor';
import { ImageUpload } from './ImageUpload';
const toolCategories: [ToolCategory, ...ToolCategory[]] = ['Power Tool', 'Hand Tool', 'Vehicle', 'Safety Equipment', 'Miscellaneous'];
const toolStatuses: [ToolStatus, ...ToolStatus[]] = ['Available', 'In Use', 'Under Maintenance'];
const locationTypes: [LocationType, ...LocationType[]] = ['Workshop', 'Project', 'Other'];
const toolFormSchema = z.object({
  name: z.string().min(3, { message: 'Tool name must be at least 3 characters.' }),
  category: z.enum(toolCategories),
  purchaseDate: z.date(),
  status: z.enum(toolStatuses),
  locationType: z.enum(locationTypes),
  locationId: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal('')),
});
type ToolFormValues = z.infer<typeof toolFormSchema>;
interface EditToolFormProps {
  initialValues: Tool;
  onFinished: () => void;
}
export function EditToolForm({ initialValues, onFinished }: EditToolFormProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState<CustomProperty[]>(initialValues.properties || []);
  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      name: initialValues.name,
      purchaseDate: new Date(initialValues.purchaseDate),
      category: initialValues.category,
      status: initialValues.status,
      locationType: initialValues.locationType || 'Workshop',
      locationId: initialValues.locationId || '',
      imageUrl: initialValues.imageUrl || '',
    },
  });
  const locationType = form.watch('locationType');
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [wsData, projData] = await Promise.all([
          api<Workshop[]>('/api/workshops'),
          api<Project[]>('/api/projects')
        ]);
        setWorkshops(wsData);
        setProjects(projData);
      } catch (err) {
        toast.error('Failed to load locations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // Reset location ID when type changes, but only if it's user interaction
  useEffect(() => {
    if (locationType !== initialValues.locationType && form.getValues('locationId') === initialValues.locationId) {
        form.setValue('locationId', '');
    }
  }, [locationType, initialValues.locationType, initialValues.locationId, form]);
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: ToolFormValues) => {
    const toolData = {
      ...values,
      purchaseDate: values.purchaseDate.toISOString(),
      locationId: values.locationType === 'Other' ? undefined : values.locationId,
      properties,
    };
    try {
      await api(`/api/tools/${initialValues.id}`, {
        method: 'PUT',
        body: JSON.stringify(toolData),
      });
      toast.success('Tool updated successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tool.');
    }
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., DeWalt Circular Saw" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {toolCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {toolStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="purchaseDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Purchase Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date()} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Image</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DynamicPropertiesEditor properties={properties} onChange={setProperties} />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Tool
          </Button>
        </div>
      </form>
    </Form>
  );
}