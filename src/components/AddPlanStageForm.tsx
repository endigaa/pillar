import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Star, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { PlanStage, ConstructionStage, Personnel, SubContractor, Project } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleCategoryForm } from './SimpleCategoryForm';
import { AddPersonnelForm } from './AddPersonnelForm';
import { AddSubContractorForm } from './AddSubContractorForm';
const planStageSchema = z.object({
  name: z.string().min(2, { message: 'Name is required.' }),
  startDate: z.date(),
  endDate: z.date(),
  description: z.string().optional(),
  status: z.enum(['Not Started', 'In Progress', 'Completed']),
  constructionStageId: z.string().optional(),
  assignedPersonnelIds: z.array(z.string()).optional(),
  assignedSubContractorIds: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});
type PlanStageFormValues = z.infer<typeof planStageSchema>;
interface AddPlanStageFormProps {
  projectId: string;
  initialValues?: PlanStage;
  onSubmit: (values: Omit<PlanStage, 'id'>) => Promise<void>;
  onFinished: () => void;
}
export function AddPlanStageForm({ projectId, initialValues, onSubmit, onFinished }: AddPlanStageFormProps) {
  const [stages, setStages] = useState<ConstructionStage[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [subContractors, setSubContractors] = useState<SubContractor[]>([]);
  const [existingPlanStages, setExistingPlanStages] = useState<PlanStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Dialog states
  const [isNewStageOpen, setIsNewStageOpen] = useState(false);
  const [isNewPersonnelOpen, setIsNewPersonnelOpen] = useState(false);
  const [isNewSubContractorOpen, setIsNewSubContractorOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stagesData, personnelData, subData, projectData] = await Promise.all([
            api<ConstructionStage[]>('/api/construction-stages'),
            api<Personnel[]>('/api/personnel'),
            api<SubContractor[]>('/api/subcontractors'),
            api<Project>(`/api/projects/${projectId}`)
        ]);
        setStages(stagesData);
        setPersonnel(personnelData);
        setSubContractors(subData);
        setExistingPlanStages(projectData.planStages || []);
      } catch (err) {
        toast.error('Failed to load form data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);
  const form = useForm<PlanStageFormValues>({
    resolver: zodResolver(planStageSchema),
    defaultValues: {
      name: initialValues?.name || '',
      startDate: initialValues?.startDate ? new Date(initialValues.startDate) : new Date(),
      endDate: initialValues?.endDate ? new Date(initialValues.endDate) : new Date(),
      description: initialValues?.description || '',
      status: initialValues?.status || 'Not Started',
      constructionStageId: initialValues?.constructionStageId || '',
      assignedPersonnelIds: initialValues?.assignedPersonnelIds || [],
      assignedSubContractorIds: initialValues?.assignedSubContractorIds || [],
      dependencies: initialValues?.dependencies || [],
    },
  });
  const selectedStageId = form.watch('constructionStageId');
  const sortedSubContractors = useMemo(() => {
    if (!selectedStageId) return subContractors;
    const selectedStage = stages.find(s => s.id === selectedStageId);
    if (!selectedStage) return subContractors;
    const stageName = selectedStage.name.toLowerCase();
    const suggested: SubContractor[] = [];
    const others: SubContractor[] = [];
    subContractors.forEach(sc => {
      const spec = sc.specialization.toLowerCase();
      if (spec.includes(stageName) || stageName.includes(spec)) {
        suggested.push(sc);
      } else {
        others.push(sc);
      }
    });
    return [...suggested, ...others];
  }, [subContractors, selectedStageId, stages]);
  const isSuggested = (sc: SubContractor) => {
    if (!selectedStageId) return false;
    const selectedStage = stages.find(s => s.id === selectedStageId);
    if (!selectedStage) return false;
    const stageName = selectedStage.name.toLowerCase();
    const spec = sc.specialization.toLowerCase();
    return spec.includes(stageName) || stageName.includes(spec);
  };
  const { isSubmitting } = form.formState;
  const handleFormSubmit = async (values: PlanStageFormValues) => {
    const stageData = {
      ...values,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      constructionStageId: values.constructionStageId || undefined,
      assignedPersonnelIds: values.assignedPersonnelIds || [],
      assignedSubContractorIds: values.assignedSubContractorIds || [],
      dependencies: values.dependencies || [],
    };
    await onSubmit(stageData);
    onFinished();
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
  const handleCreatePersonnel = async (values: Omit<Personnel, 'id' | 'associatedExpenseIds'>) => {
    try {
      const newPersonnel = await api<Personnel>('/api/personnel', { method: 'POST', body: JSON.stringify(values) });
      setPersonnel(prev => [...prev, newPersonnel]);
      // Auto-select the new personnel
      const currentIds = form.getValues('assignedPersonnelIds') || [];
      form.setValue('assignedPersonnelIds', [...currentIds, newPersonnel.id]);
      setIsNewPersonnelOpen(false);
      toast.success('Personnel created and selected!');
    } catch (err) { toast.error('Failed to create personnel'); }
  };
  const handleCreateSubContractor = async (values: Omit<SubContractor, 'id'>) => {
    try {
      const newItem = await api<SubContractor>('/api/subcontractors', { method: 'POST', body: JSON.stringify(values) });
      setSubContractors(prev => [...prev, newItem]);
      // Auto-select
      const currentIds = form.getValues('assignedSubContractorIds') || [];
      form.setValue('assignedSubContractorIds', [...currentIds, newItem.id]);
      setIsNewSubContractorOpen(false);
      toast.success('Sub-contractor created and selected!');
    } catch (err) { toast.error('Failed to create sub-contractor'); }
  };
  // Filter out the current stage from potential dependencies to avoid self-reference
  const availableDependencies = existingPlanStages.filter(s => s.id !== initialValues?.id);
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Foundation Work" {...field} />
                </FormControl>
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
          <FormField
            control={form.control}
            name="dependencies"
            render={() => (
              <FormItem>
                <FormLabel>Prerequisites (Dependencies)</FormLabel>
                <ScrollArea className="h-32 w-full rounded-md border p-4">
                  {availableDependencies.length > 0 ? (
                    <div className="space-y-2">
                      {availableDependencies.map((stage) => (
                        <FormField
                          key={stage.id}
                          control={form.control}
                          name="dependencies"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(stage.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), stage.id])
                                      : field.onChange(field.value?.filter((value) => value !== stage.id));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm cursor-pointer">
                                {stage.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No other stages available to link.</p>
                  )}
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="constructionStageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link to Construction Stage (Optional)</FormLabel>
                <div className="flex gap-2">
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select stage to link tasks" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Details about this stage..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="assignedPersonnelIds"
                  render={() => (
                      <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Assign Personnel</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setIsNewPersonnelOpen(true)}
                            >
                              <PlusCircle className="mr-1 h-3 w-3" /> Add New
                            </Button>
                          </div>
                          <ScrollArea className="h-48 w-full rounded-md border p-4">
                              <div className="space-y-2">
                                  {personnel.map((p) => (
                                      <FormField
                                          key={p.id}
                                          control={form.control}
                                          name="assignedPersonnelIds"
                                          render={({ field }) => (
                                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                                  <FormControl>
                                                      <Checkbox
                                                          checked={field.value?.includes(p.id)}
                                                          onCheckedChange={(checked) => {
                                                              return checked
                                                                  ? field.onChange([...(field.value || []), p.id])
                                                                  : field.onChange(field.value?.filter((value) => value !== p.id));
                                                          }}
                                                      />
                                                  </FormControl>
                                                  <FormLabel className="font-normal text-sm cursor-pointer">
                                                      {p.name} <span className="text-muted-foreground text-xs">({p.role})</span>
                                                  </FormLabel>
                                              </FormItem>
                                          )}
                                      />
                                  ))}
                              </div>
                          </ScrollArea>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="assignedSubContractorIds"
                  render={() => (
                      <FormItem>
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Assign Sub-contractors</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => setIsNewSubContractorOpen(true)}
                            >
                              <PlusCircle className="mr-1 h-3 w-3" /> Add New
                            </Button>
                          </div>
                          <ScrollArea className="h-48 w-full rounded-md border p-4">
                              <div className="space-y-2">
                                  {sortedSubContractors.map((sc) => {
                                    const suggested = isSuggested(sc);
                                    return (
                                      <FormField
                                          key={sc.id}
                                          control={form.control}
                                          name="assignedSubContractorIds"
                                          render={({ field }) => (
                                              <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 p-1 rounded", suggested && "bg-blue-50 dark:bg-blue-900/20")}>
                                                  <FormControl>
                                                      <Checkbox
                                                          checked={field.value?.includes(sc.id)}
                                                          onCheckedChange={(checked) => {
                                                              return checked
                                                                  ? field.onChange([...(field.value || []), sc.id])
                                                                  : field.onChange(field.value?.filter((value) => value !== sc.id));
                                                          }}
                                                      />
                                                  </FormControl>
                                                  <div className="flex-1">
                                                    <FormLabel className="font-normal text-sm cursor-pointer flex items-center justify-between w-full">
                                                        <span>{sc.name} <span className="text-muted-foreground text-xs">({sc.specialization})</span></span>
                                                        {suggested && <Badge variant="secondary" className="text-[10px] h-4 px-1 flex items-center gap-0.5"><Star className="h-2 w-2 fill-current" /> Suggested</Badge>}
                                                    </FormLabel>
                                                  </div>
                                              </FormItem>
                                          )}
                                      />
                                    );
                                  })}
                              </div>
                          </ScrollArea>
                          <FormMessage />
                      </FormItem>
                  )}
              />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialValues ? 'Update Stage' : 'Add Stage'}
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
      <Dialog open={isNewPersonnelOpen} onOpenChange={setIsNewPersonnelOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Personnel</DialogTitle>
            <DialogDescription>Create a new personnel record instantly.</DialogDescription>
          </DialogHeader>
          <AddPersonnelForm onSubmit={handleCreatePersonnel} onFinished={() => {}} />
        </DialogContent>
      </Dialog>
      <Dialog open={isNewSubContractorOpen} onOpenChange={setIsNewSubContractorOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Sub-contractor</DialogTitle>
            <DialogDescription>Create a new sub-contractor record instantly.</DialogDescription>
          </DialogHeader>
          <AddSubContractorForm onSubmit={handleCreateSubContractor} onFinished={() => {}} />
        </DialogContent>
      </Dialog>
    </>
  );
}