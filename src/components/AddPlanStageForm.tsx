import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Star } from 'lucide-react';
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
  // Filter out the current stage from potential dependencies to avoid self-reference
  const availableDependencies = existingPlanStages.filter(s => s.id !== initialValues?.id);
  return (
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
              <Select onValueChange={field.onChange} value={field.value || ''} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage to link tasks" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
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
                        <FormLabel>Assign Personnel (Tentative)</FormLabel>
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
                        <FormLabel>Assign Sub-contractors (Tentative)</FormLabel>
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
  );
}