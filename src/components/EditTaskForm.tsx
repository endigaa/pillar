import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task, SubContractor, Supplier, Personnel, Tool, ResourceType, ConstructionStage } from '@shared/types';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddSubContractorForm } from './AddSubContractorForm';
import { AddSupplierForm } from './AddSupplierForm';
import { AddPersonnelForm } from './AddPersonnelForm';
import { AddToolForm } from './AddToolForm';
import { SimpleCategoryForm } from './SimpleCategoryForm';
const resourceTypes: ResourceType[] = ['SubContractor', 'Supplier', 'Personnel', 'Tool'];
const taskFormSchema = z.object({
  description: z.string().min(3, { message: 'Description must be at least 3 characters.' }),
  dueDate: z.date(),
  isPublic: z.boolean(),
  assigneeType: z.enum(['SubContractor', 'Supplier', 'Personnel', 'Tool'] as [ResourceType, ...ResourceType[]]).optional(),
  assigneeId: z.string().optional(),
  isAssigneePublic: z.boolean().optional(),
  constructionStageId: z.string().optional(),
});
type TaskFormValues = z.infer<typeof taskFormSchema>;
interface EditTaskFormProps {
  initialValues: Task;
  onSubmit: (values: Partial<Task>) => Promise<void>;
  onFinished: () => void;
}
export function EditTaskForm({ initialValues, onSubmit, onFinished }: EditTaskFormProps) {
  const [subContractors, setSubContractors] = useState<SubContractor[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [stages, setStages] = useState<ConstructionStage[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  // Dialog states
  const [isNewStageOpen, setIsNewStageOpen] = useState(false);
  const [isNewResourceOpen, setIsNewResourceOpen] = useState(false);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      description: initialValues.description,
      dueDate: new Date(initialValues.dueDate),
      isPublic: initialValues.isPublic,
      assigneeType: initialValues.assigneeType,
      assigneeId: initialValues.assigneeId,
      isAssigneePublic: initialValues.isAssigneePublic,
      constructionStageId: initialValues.constructionStageId,
    },
  });
  const assigneeType = form.watch('assigneeType');
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoadingResources(true);
        const [scData, suppData, persData, toolData, stageData] = await Promise.all([
          api<SubContractor[]>('/api/subcontractors'),
          api<Supplier[]>('/api/suppliers'),
          api<Personnel[]>('/api/personnel'),
          api<Tool[]>('/api/tools'),
          api<ConstructionStage[]>('/api/construction-stages'),
        ]);
        setSubContractors(scData);
        setSuppliers(suppData);
        setPersonnel(persData);
        setTools(toolData);
        setStages(stageData);
      } catch (err) {
        toast.error('Failed to load resources for assignment.');
      } finally {
        setIsLoadingResources(false);
      }
    };
    fetchResources();
  }, []);
  // Reset assigneeId when type changes, but only if it's user interaction
  useEffect(() => {
    if (assigneeType !== initialValues.assigneeType && form.getValues('assigneeId') === initialValues.assigneeId) {
        form.setValue('assigneeId', '');
    }
  }, [assigneeType, initialValues.assigneeType, initialValues.assigneeId, form]);
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: TaskFormValues) => {
    const taskData: Partial<Task> = {
      description: values.description,
      dueDate: values.dueDate.toISOString(),
      isPublic: values.isPublic,
      assigneeType: values.assigneeType || undefined,
      assigneeId: values.assigneeType ? values.assigneeId : undefined,
      isAssigneePublic: values.assigneeType ? values.isAssigneePublic : false,
      constructionStageId: values.constructionStageId || undefined,
    };
    await onSubmit(taskData);
    onFinished();
  };
  const getResourceOptions = () => {
    switch (assigneeType) {
      case 'SubContractor': return subContractors.map(r => ({ id: r.id, name: r.name }));
      case 'Supplier': return suppliers.map(r => ({ id: r.id, name: r.name }));
      case 'Personnel': return personnel.map(r => ({ id: r.id, name: r.name }));
      case 'Tool': return tools.map(r => ({ id: r.id, name: r.name }));
      default: return [];
    }
  };
  // Creation Handlers
  const handleCreateStage = async (name: string) => {
    try {
      const newStage = await api<ConstructionStage>('/api/construction-stages', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setStages(prev => [...prev, newStage]);
      form.setValue('constructionStageId', newStage.id);
      setIsNewStageOpen(false);
      toast.success('Stage created and selected!');
    } catch (err) {
      toast.error('Failed to create stage.');
    }
  };
  const handleCreateSubContractor = async (values: Omit<SubContractor, 'id'>) => {
    try {
      const newItem = await api<SubContractor>('/api/subcontractors', { method: 'POST', body: JSON.stringify(values) });
      setSubContractors(prev => [...prev, newItem]);
      form.setValue('assigneeId', newItem.id);
      setIsNewResourceOpen(false);
      toast.success('Sub-contractor created!');
    } catch (err) { toast.error('Failed to create sub-contractor'); }
  };
  const handleCreateSupplier = async (values: Omit<Supplier, 'id' | 'materials'>) => {
    try {
      const newItem = await api<Supplier>('/api/suppliers', { method: 'POST', body: JSON.stringify(values) });
      setSuppliers(prev => [...prev, newItem]);
      form.setValue('assigneeId', newItem.id);
      setIsNewResourceOpen(false);
      toast.success('Supplier created!');
    } catch (err) { toast.error('Failed to create supplier'); }
  };
  const handleCreatePersonnel = async (values: Omit<Personnel, 'id' | 'associatedExpenseIds'>) => {
    try {
      const newItem = await api<Personnel>('/api/personnel', { method: 'POST', body: JSON.stringify(values) });
      setPersonnel(prev => [...prev, newItem]);
      form.setValue('assigneeId', newItem.id);
      setIsNewResourceOpen(false);
      toast.success('Personnel created!');
    } catch (err) { toast.error('Failed to create personnel'); }
  };
  const handleCreateTool = async (values: Omit<Tool, 'id'>) => {
    try {
      const newItem = await api<Tool>('/api/tools', { method: 'POST', body: JSON.stringify(values) });
      setTools(prev => [...prev, newItem]);
      form.setValue('assigneeId', newItem.id);
      setIsNewResourceOpen(false);
      toast.success('Tool created!');
    } catch (err) { toast.error('Failed to create tool'); }
  };
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Finalize plumbing fixtures" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
            name="constructionStageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Construction Stage (Optional)</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoadingResources}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={isLoadingResources ? "Loading..." : "Select a stage"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsNewStageOpen(true)}
                    title="Add New Stage"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="assigneeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource</FormLabel>
                  <div className="flex gap-2">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ''}
                      disabled={!assigneeType || isLoadingResources}
                    >
                      <FormControl>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={isLoadingResources ? "Loading..." : "Select resource"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getResourceOptions().map(option => (
                          <SelectItem key={option.id} value={option.id}>{option.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={!assigneeType}
                      onClick={() => setIsNewResourceOpen(true)}
                      title={`Add New ${assigneeType || 'Resource'}`}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {assigneeType && (
            <FormField
              control={form.control}
              name="isAssigneePublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Assignee to Client</FormLabel>
                    <FormDescription>
                      If enabled, the client will see who is assigned to this task.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Share Task with Client</FormLabel>
                  <FormDescription>
                    Make this task visible to the client in their portal.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Task
              </Button>
          </div>
        </form>
      </Form>
      {/* Dialogs */}
      <Dialog open={isNewStageOpen} onOpenChange={setIsNewStageOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Construction Stage</DialogTitle>
            <DialogDescription>Create a new stage for project tracking.</DialogDescription>
          </DialogHeader>
          <SimpleCategoryForm
            onSubmit={handleCreateStage}
            onCancel={() => setIsNewStageOpen(false)}
            label="Stage Name"
            placeholder="e.g., Demolition"
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isNewResourceOpen} onOpenChange={setIsNewResourceOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New {assigneeType}</DialogTitle>
            <DialogDescription>Create a new {assigneeType} record instantly.</DialogDescription>
          </DialogHeader>
          {assigneeType === 'SubContractor' && <AddSubContractorForm onSubmit={handleCreateSubContractor} onFinished={() => {}} />}
          {assigneeType === 'Supplier' && <AddSupplierForm onSubmit={handleCreateSupplier} onFinished={() => {}} />}
          {assigneeType === 'Personnel' && <AddPersonnelForm onSubmit={handleCreatePersonnel} onFinished={() => {}} />}
          {assigneeType === 'Tool' && <AddToolForm onSubmit={handleCreateTool} onFinished={() => {}} />}
        </DialogContent>
      </Dialog>
    </>
  );
}