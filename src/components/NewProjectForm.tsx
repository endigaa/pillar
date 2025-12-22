import { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
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
import type { Project, Client } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';
import { NewClientForm } from '@/components/NewClientForm';
const projectFormSchema = z.object({
  name: z.string().min(5, { message: 'Project name must be at least 5 characters.' }),
  clientId: z.string().min(1, { message: 'Please select a client.' }),
  location: z.string().min(5, { message: 'Location must be at least 5 characters.' }),
  gpsLat: z.number().optional(),
  gpsLon: z.number().optional(),
  budget: z.number().positive({ message: 'Budget must be a positive number.' }),
  feeType: z.enum(['Percentage', 'Fixed']),
  feeValue: z.number().min(0, { message: 'Fee value must be non-negative.' }),
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate >= data.startDate, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
});
type ProjectFormValues = z.infer<typeof projectFormSchema>;
interface NewProjectFormProps {
  onSubmit: (values: Omit<Project, 'id' | 'expenses' | 'clientName' | 'status' | 'deposits' | 'photos' | 'tasks' | 'clientDocuments' | 'invoiceIds' | 'worksiteMaterials' | 'quoteIds' | 'journalEntries' | 'clientFeedback' | 'changeOrderIds' | 'planStages'>) => Promise<void>;
  onFinished: () => void;
}
export function NewProjectForm({ onSubmit, onFinished }: NewProjectFormProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoadingClients(true);
        const clientData = await api<Client[]>('/api/clients');
        setClients(clientData);
      } catch (error) {
        toast.error('Failed to load clients.');
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, []);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: '',
      clientId: '',
      location: '',
      budget: 0,
      feeType: 'Percentage',
      feeValue: 15,
      startDate: new Date(),
      endDate: new Date(),
    }
  });
  const feeType = form.watch('feeType');
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: ProjectFormValues) => {
    const { gpsLat, gpsLon, ...rest } = values;
    // If Fixed fee, convert dollars to cents. If Percentage, keep as is.
    const finalFeeValue = values.feeType === 'Fixed' ? Math.round(values.feeValue * 100) : values.feeValue;
    const projectData = {
      ...rest,
      budget: Math.round(values.budget * 100), // Convert to cents
      feeValue: finalFeeValue,
      // Backward compatibility mapping
      contractorFeePercentage: values.feeType === 'Percentage' ? values.feeValue : 0,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      gpsCoordinates: gpsLat && gpsLon ? { lat: gpsLat, lon: gpsLon } : undefined,
      areas: [], // Initialize empty areas array
    };
    await onSubmit(projectData);
    onFinished();
  };
  const handleCreateClient = async (values: Omit<Client, 'id'>) => {
    try {
      const newClient = await api<Client>('/api/clients', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      setClients(prev => [...prev, newClient]);
      form.setValue('clientId', newClient.id);
      setIsNewClientOpen(false);
      toast.success('Client created and selected!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client.');
    }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Downtown Office Renovation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingClients}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingClients ? "Loading clients..." : "Select a client"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client: Client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewClientOpen(true)}
                    title="Add New Client"
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
                <FormLabel>Project Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gpsLat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="34.0522"
                      {...field}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gpsLon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="any"
                      placeholder="-118.2437"
                      {...field}
                      onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="100"
                    placeholder="50000"
                    {...field}
                    onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="feeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Structure</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage of BOM</SelectItem>
                      <SelectItem value="Fixed">Fixed Flat Fee</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feeValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{feeType === 'Percentage' ? 'Percentage (%)' : 'Amount ($)'}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={feeType === 'Percentage' ? "0.1" : "100"}
                      placeholder={feeType === 'Percentage' ? "15" : "5000"}
                      {...field}
                      onChange={e => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isLoadingClients}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Project
              </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Create a new client record instantly.</DialogDescription>
          </DialogHeader>
          <NewClientForm onSubmit={handleCreateClient} onFinished={() => {}} />
        </DialogContent>
      </Dialog>
    </>
  );
}