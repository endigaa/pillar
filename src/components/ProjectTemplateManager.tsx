import { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Pencil, Trash2, Loader2, Copy } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { ProjectTemplate, ConstructionStage } from '@shared/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from '@/components/ui/checkbox';
const stageSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  constructionStageId: z.string().optional(),
  durationDays: z.number().min(1, 'Duration must be at least 1 day'),
  startDayOffset: z.number().min(0, 'Offset must be non-negative'),
  dependencies: z.array(z.string()).optional(),
});
const templateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  description: z.string().optional(),
  stages: z.array(stageSchema),
});
type TemplateFormValues = z.infer<typeof templateSchema>;
export function ProjectTemplateManager() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [constructionStages, setConstructionStages] = useState<ConstructionStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      stages: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'stages',
  });
  const watchedStages = useWatch({
    control: form.control,
    name: 'stages',
  });
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [templatesData, stagesData] = await Promise.all([
        api<ProjectTemplate[]>('/api/project-templates'),
        api<ConstructionStage[]>('/api/construction-stages'),
      ]);
      setTemplates(templatesData);
      setConstructionStages(stagesData);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (editingTemplate) {
      form.reset({
        name: editingTemplate.name,
        description: editingTemplate.description || '',
        stages: editingTemplate.stages.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description || '',
          constructionStageId: s.constructionStageId || '',
          durationDays: s.durationDays,
          startDayOffset: s.startDayOffset,
          dependencies: s.dependencies || [],
        })),
      });
      setIsDialogOpen(true);
    } else {
      form.reset({
        name: '',
        description: '',
        stages: [],
      });
    }
  }, [editingTemplate, form]);
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingTemplate(null);
  };
  const onSubmit = async (values: TemplateFormValues) => {
    try {
      if (editingTemplate) {
        await api(`/api/project-templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        });
        toast.success('Template updated successfully');
      } else {
        await api('/api/project-templates', {
          method: 'POST',
          body: JSON.stringify(values),
        });
        toast.success('Template created successfully');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to save template');
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api(`/api/project-templates/${id}`, { method: 'DELETE' });
      toast.success('Template deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };
  const handleDuplicate = async (template: ProjectTemplate) => {
    try {
      // Generate new IDs for the duplicated stages to avoid conflicts
      // We also need to remap dependencies to the new IDs
      const idMap = new Map<string, string>();
      template.stages.forEach(s => idMap.set(s.id, uuidv4()));
      const newStages = template.stages.map(s => ({
        ...s,
        id: idMap.get(s.id)!,
        dependencies: (s.dependencies || []).map(depId => idMap.get(depId)).filter((id): id is string => !!id),
      }));
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        stages: newStages,
      };
      await api('/api/project-templates', {
        method: 'POST',
        body: JSON.stringify(newTemplate),
      });
      toast.success('Template duplicated');
      fetchData();
    } catch (err) {
      toast.error('Failed to duplicate template');
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Plan Templates</CardTitle>
          <CardDescription>Create reusable project structures with predefined stages and timelines.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
              <DialogDescription>Define the template details and stages.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Standard Residential Build" {...field} />
                        </FormControl>
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
                          <Textarea placeholder="Brief description of this template..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Template Stages</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ 
                        id: uuidv4(),
                        name: '', 
                        durationDays: 1, 
                        startDayOffset: 0, 
                        description: '', 
                        constructionStageId: '',
                        dependencies: []
                      })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Stage
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 border rounded-md p-4">
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No stages added yet. Click "Add Stage" to begin.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const currentStageId = watchedStages[index]?.id;
                          // Filter out the current stage to prevent self-dependency
                          const otherStages = watchedStages.filter((s) => s.id !== currentStageId);
                          return (
                            <div key={field.id} className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-muted/20 relative">
                              <div className="col-span-4 space-y-2">
                                <FormField
                                  control={form.control}
                                  name={`stages.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Stage Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Stage Name" {...field} className="h-8" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`stages.${index}.constructionStageId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Type</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {constructionStages.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="col-span-3 space-y-2">
                                <FormField
                                  control={form.control}
                                  name={`stages.${index}.startDayOffset`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Start Day (Offset)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          {...field}
                                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                          className="h-8"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`stages.${index}.durationDays`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Duration (Days)</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          {...field}
                                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                          className="h-8"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="col-span-4">
                                <FormField
                                  control={form.control}
                                  name={`stages.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs">Description</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Details..." {...field} className="h-[72px] resize-none" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              {/* Dependencies Section */}
                              <div className="col-span-12 border-t pt-2 mt-2">
                                <FormLabel className="text-xs mb-2 block font-semibold">Prerequisites (Dependencies)</FormLabel>
                                <div className="flex flex-wrap gap-4">
                                  {otherStages.length > 0 ? (
                                    otherStages.map((otherStage) => (
                                      <FormField
                                        key={otherStage.id}
                                        control={form.control}
                                        name={`stages.${index}.dependencies`}
                                        render={({ field: depField }) => (
                                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                            <FormControl>
                                              <Checkbox
                                                checked={depField.value?.includes(otherStage.id)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? depField.onChange([...(depField.value || []), otherStage.id])
                                                    : depField.onChange(depField.value?.filter((value) => value !== otherStage.id));
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal text-xs cursor-pointer">
                                              {otherStage.name || 'Untitled Stage'}
                                            </FormLabel>
                                          </FormItem>
                                        )}
                                      />
                                    ))
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No other stages available to link.</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                <div className="flex justify-end pt-4 border-t mt-auto">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Stages</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="text-muted-foreground">{template.description || '-'}</TableCell>
                  <TableCell>{template.stages.length} stages</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)} title="Duplicate">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditingTemplate(template)} title="Edit">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No templates found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}