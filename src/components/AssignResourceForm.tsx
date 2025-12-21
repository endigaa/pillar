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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, CalendarIcon, PlusCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Tool, Personnel } from '@shared/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddToolForm } from './AddToolForm';
import { AddPersonnelForm } from './AddPersonnelForm';
const assignSchema = z.object({
  resourceId: z.string().min(1, { message: 'Please select a resource.' }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});
type AssignFormValues = z.infer<typeof assignSchema>;
interface AssignResourceFormProps {
  projectId: string;
  resourceType: 'tool' | 'personnel';
  onFinished: () => void;
}
export function AssignResourceForm({ projectId, resourceType, onFinished }: AssignResourceFormProps) {
  const [resources, setResources] = useState<(Tool | Personnel)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewResourceOpen, setIsNewResourceOpen] = useState(false);
  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      resourceId: '',
    },
  });
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        let data: (Tool | Personnel)[] = [];
        if (resourceType === 'tool') {
          data = await api<Tool[]>('/api/tools');
        } else {
          data = await api<Personnel[]>('/api/personnel');
        }
        setResources(data);
      } catch (err) {
        toast.error(`Failed to load ${resourceType}s.`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [resourceType]);
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: AssignFormValues) => {
    try {
      const endpoint = resourceType === 'tool' ? `/api/tools/${values.resourceId}` : `/api/personnel/${values.resourceId}`;
      await api(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          locationType: 'Project',
          locationId: projectId,
          assignmentStartDate: values.startDate ? values.startDate.toISOString() : undefined,
          assignmentEndDate: values.endDate ? values.endDate.toISOString() : undefined,
        }),
      });
      toast.success(`${resourceType === 'tool' ? 'Tool' : 'Personnel'} assigned successfully!`);
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign resource.');
    }
  };
  const handleCreateResource = async (values: any) => {
    try {
      if (resourceType === 'tool') {
        const newTool = await api<Tool>('/api/tools', { method: 'POST', body: JSON.stringify(values) });
        setResources(prev => [...prev, newTool]);
        form.setValue('resourceId', newTool.id);
        toast.success('Tool created and selected!');
      } else {
        const newPersonnel = await api<Personnel>('/api/personnel', { method: 'POST', body: JSON.stringify(values) });
        setResources(prev => [...prev, newPersonnel]);
        form.setValue('resourceId', newPersonnel.id);
        toast.success('Personnel created and selected!');
      }
      setIsNewResourceOpen(false);
    } catch (err) {
      toast.error(`Failed to create ${resourceType}.`);
    }
  };
  const getResourceLabel = (r: Tool | Personnel) => {
    let location = 'Unassigned';
    if (r.locationType === 'Project' && r.locationId === projectId) {
      location = 'Current Project';
    } else if (r.locationName) {
      location = r.locationName;
    } else if (r.locationType) {
      location = r.locationType;
    }
    const status = 'status' in r ? ` - ${r.status}` : '';
    return `${r.name} (${location}${status})`;
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="resourceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select {resourceType === 'tool' ? 'Tool' : 'Personnel'}</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoading ? "Loading..." : `Select ${resourceType}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resources.map((r) => (
                        <SelectItem key={r.id} value={r.id} disabled={r.locationType === 'Project' && r.locationId === projectId}>
                          {getResourceLabel(r)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewResourceOpen(true)}
                    title={`Add New ${resourceType === 'tool' ? 'Tool' : 'Personnel'}`}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormDescription>
                  Assigning will move the resource to this project location.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
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
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign {resourceType === 'tool' ? 'Tool' : 'Personnel'}
            </Button>
          </div>
        </form>
      </Form>
      <Dialog open={isNewResourceOpen} onOpenChange={setIsNewResourceOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New {resourceType === 'tool' ? 'Tool' : 'Personnel'}</DialogTitle>
            <DialogDescription>Create a new {resourceType} record instantly.</DialogDescription>
          </DialogHeader>
          {resourceType === 'tool' ? (
            <AddToolForm onSubmit={handleCreateResource} onFinished={() => {}} />
          ) : (
            <AddPersonnelForm onSubmit={handleCreateResource} onFinished={() => {}} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}