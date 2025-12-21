import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Pencil, Trash2, Users, HardHat, Download, CalendarIcon, Loader2, Save } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Project, PlanStage, ProjectTemplate } from '@shared/types';
import { PlanTimeline } from './PlanTimeline';
import { AddPlanStageForm } from './AddPlanStageForm';
import { SaveTemplateDialog } from './SaveTemplateDialog';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, min, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
interface ProjectPlanProps {
  project: Project;
  onUpdate: () => void;
}
export function ProjectPlan({ project, onUpdate }: ProjectPlanProps) {
  const [isAddStageOpen, setAddStageOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PlanStage | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [planStartDate, setPlanStartDate] = useState<Date>(new Date());
  const [isImporting, setIsImporting] = useState(false);
  const handleAddStage = async (values: Omit<PlanStage, 'id'>) => {
    try {
      await api(`/api/projects/${project.id}/plan-stages`, {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Plan stage added successfully!');
      onUpdate();
    } catch (err) {
      toast.error('Failed to add plan stage.');
    }
  };
  const handleUpdateStage = async (values: Omit<PlanStage, 'id'>) => {
    if (!editingStage) return;
    try {
      await api(`/api/projects/${project.id}/plan-stages/${editingStage.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Plan stage updated successfully!');
      setEditingStage(null);
      onUpdate();
    } catch (err) {
      toast.error('Failed to update plan stage.');
    }
  };
  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;
    try {
      await api(`/api/projects/${project.id}/plan-stages/${stageId}`, {
        method: 'DELETE',
      });
      toast.success('Plan stage deleted successfully!');
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete plan stage.');
    }
  };
  const fetchTemplates = async () => {
    try {
      const data = await api<ProjectTemplate[]>('/api/project-templates');
      setTemplates(data);
    } catch (err) {
      toast.error('Failed to load templates');
    }
  };
  const handleImportTemplate = async () => {
    if (!selectedTemplateId) return;
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    setIsImporting(true);
    try {
      // 1. Create a map to translate template stage IDs to new project stage IDs
      const idMap = new Map<string, string>();
      // 2. Generate new IDs and basic stage objects
      const stagesWithNewIds = template.stages.map(stage => {
        const newId = uuidv4();
        idMap.set(stage.id, newId);
        const startDate = addDays(planStartDate, stage.startDayOffset);
        const endDate = addDays(startDate, stage.durationDays);
        return {
          id: newId,
          name: stage.name,
          description: stage.description,
          constructionStageId: stage.constructionStageId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'Not Started' as const,
          assignedPersonnelIds: [],
          assignedSubContractorIds: [],
          dependencies: stage.dependencies || [], // Temporary, will remap next
        };
      });
      // 3. Remap dependencies using the new IDs
      const finalStages = stagesWithNewIds.map(stage => ({
        ...stage,
        dependencies: stage.dependencies
          .map(oldDepId => idMap.get(oldDepId))
          .filter((newId): newId is string => !!newId) // Filter out undefined if mapping fails
      }));
      // 4. Send to backend
      await api(`/api/projects/${project.id}/plan-stages/batch`, {
        method: 'POST',
        body: JSON.stringify(finalStages),
      });
      toast.success(`Imported ${finalStages.length} stages from template`);
      setImportOpen(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to import template');
    } finally {
      setIsImporting(false);
    }
  };
  const handleSaveAsTemplate = async (values: { name: string; description?: string }) => {
    if (!project.planStages || project.planStages.length === 0) {
      toast.error('No stages to save as template.');
      return;
    }
    try {
      // Find the earliest start date to use as base
      const startDates = project.planStages.map(s => new Date(s.startDate));
      const baseDate = min(startDates);
      // Create ID map for template scope
      const idMap = new Map<string, string>();
      project.planStages.forEach(s => idMap.set(s.id, uuidv4()));
      const stages = project.planStages.map(stage => {
        const start = new Date(stage.startDate);
        const end = new Date(stage.endDate);
        const startDayOffset = differenceInDays(start, baseDate);
        const durationDays = Math.max(1, differenceInDays(end, start)); // Ensure at least 1 day
        return {
          id: idMap.get(stage.id)!, // Use new template-scoped ID
          name: stage.name,
          description: stage.description,
          constructionStageId: stage.constructionStageId,
          durationDays,
          startDayOffset,
          dependencies: (stage.dependencies || [])
            .map(depId => idMap.get(depId))
            .filter((id): id is string => !!id),
        };
      });
      await api('/api/project-templates', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          stages,
        }),
      });
      toast.success('Template saved successfully!');
      setIsSaveTemplateOpen(false);
    } catch (err) {
      toast.error('Failed to save template.');
    }
  };
  const sortedStages = [...(project.planStages || [])].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  return (
    <div className="space-y-8">
      <PlanTimeline
        stages={sortedStages}
        tasks={project.tasks || []}
        onStageClick={setEditingStage}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Plan Stages</CardTitle>
            <CardDescription>Manage the project timeline and phases.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save as Template
                </Button>
              </DialogTrigger>
              <SaveTemplateDialog
                onSave={handleSaveAsTemplate}
                onCancel={() => setIsSaveTemplateOpen(false)}
              />
            </Dialog>
            <Dialog open={isImportOpen} onOpenChange={(open) => { setImportOpen(open); if(open) fetchTemplates(); }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Import Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Import Plan Template</DialogTitle>
                  <DialogDescription>Select a template to auto-generate plan stages.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Template</label>
                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                      <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
                      <SelectContent>
                        {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.stages.length} stages)</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex flex-col">
                    <label className="text-sm font-medium">Plan Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !planStartDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {planStartDate ? format(planStartDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={planStartDate} onSelect={(date) => date && setPlanStartDate(date)} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button className="w-full" onClick={handleImportTemplate} disabled={!selectedTemplateId || isImporting}>
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import Plan
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddStageOpen} onOpenChange={setAddStageOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Stage
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add Plan Stage</DialogTitle>
                  <DialogDescription>Define a new phase for the project timeline.</DialogDescription>
                </DialogHeader>
                <AddPlanStageForm projectId={project.id} onSubmit={handleAddStage} onFinished={() => setAddStageOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStages.length > 0 ? (
                sortedStages.map((stage) => (
                  <TableRow key={stage.id}>
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell>{new Date(stage.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(stage.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <div className="flex gap-2">
                            {(stage.assignedPersonnelIds?.length || 0) > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {stage.assignedPersonnelIds?.length}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{stage.assignedPersonnelIds?.length} Personnel Assigned</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {(stage.assignedSubContractorIds?.length || 0) > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <HardHat className="h-3 w-3" /> {stage.assignedSubContractorIds?.length}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{stage.assignedSubContractorIds?.length} Sub-contractors Assigned</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            {(!stage.assignedPersonnelIds?.length && !stage.assignedSubContractorIds?.length) && (
                                <span className="text-muted-foreground text-xs">-</span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={stage.status === 'Completed' ? 'default' : stage.status === 'In Progress' ? 'secondary' : 'outline'}>
                        {stage.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingStage(stage)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No plan stages defined yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editingStage} onOpenChange={(open) => !open && setEditingStage(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Plan Stage</DialogTitle>
            <DialogDescription>Update the details of this project phase.</DialogDescription>
          </DialogHeader>
          {editingStage && (
            <AddPlanStageForm
              projectId={project.id}
              initialValues={editingStage}
              onSubmit={handleUpdateStage}
              onFinished={() => setEditingStage(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}