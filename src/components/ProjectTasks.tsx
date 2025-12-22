import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Eye, EyeOff, User, Wrench, Truck, HardHat, Pencil, Trash2 } from 'lucide-react';
import { AddTaskForm } from './AddTaskForm';
import { EditTaskForm } from './EditTaskForm';
import type { Task, TaskStatus, ResourceType } from '@shared/types';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
interface ProjectTasksProps {
  tasks: Task[];
  onAddTask: (values: Omit<Task, 'id' | 'status'>) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
}
export function ProjectTasks({ tasks = [], onAddTask, onUpdateTaskStatus }: ProjectTasksProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const [isAddTaskOpen, setAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
  };
  const getResourceIcon = (type?: ResourceType) => {
    switch (type) {
      case 'SubContractor': return <HardHat className="h-3 w-3 mr-1" />;
      case 'Supplier': return <Truck className="h-3 w-3 mr-1" />;
      case 'Personnel': return <User className="h-3 w-3 mr-1" />;
      case 'Tool': return <Wrench className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };
  const handleUpdateTask = async (values: Partial<Task>) => {
    if (!projectId || !editingTask) return;
    try {
      await api(`/api/projects/${projectId}/tasks/${editingTask.id}/details`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Task updated successfully!');
      // Trigger refresh via parent callback mechanism (reusing status update to force fetch)
      onUpdateTaskStatus(editingTask.id, editingTask.status);
    } catch (err) {
      toast.error('Failed to update task.');
    }
  };
  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api(`/api/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' });
      toast.success('Task deleted successfully');
      // Trigger refresh via parent callback mechanism (reusing status update to force fetch)
      // We pass 'Done' just to trigger the fetch, the status doesn't matter as task is gone
      onUpdateTaskStatus(taskId, 'Done');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };
  // Safe copy for sorting
  const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Tasks</CardTitle>
          <CardDescription>A to-do list for this project.</CardDescription>
        </div>
        <Dialog open={isAddTaskOpen} onOpenChange={setAddTaskOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>Describe the task and set a due date. You can also assign resources.</DialogDescription>
            </DialogHeader>
            <AddTaskForm onSubmit={onAddTask} onFinished={() => setAddTaskOpen(false)} />
          </DialogContent>
        </Dialog>
        <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Modify task details.</DialogDescription>
            </DialogHeader>
            {editingTask && (
              <EditTaskForm
                initialValues={editingTask}
                onSubmit={handleUpdateTask}
                onFinished={() => setEditingTask(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTasks.length > 0 ? (
            <TooltipProvider>
              {sortedTasks.map((task) => (
                <div key={task.id} className="flex flex-col space-y-2 p-3 rounded-md border group">
                  <div className="flex items-start space-x-4">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === 'Done'}
                      onCheckedChange={(checked) => onUpdateTaskStatus(task.id, checked ? 'Done' : 'To Do')}
                      className="mt-1"
                    />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`task-${task.id}`}
                            className={cn(
                              "text-sm font-medium leading-none cursor-pointer",
                              task.status === 'Done' && "line-through text-muted-foreground"
                            )}
                          >
                            {task.description}
                          </label>
                          {task.constructionStageName && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                              {task.constructionStageName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn("whitespace-nowrap", getStatusColor(task.status))}>{task.status}</Badge>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingTask(task)}
                            >
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        {task.assigneeName && (
                          <div className="flex items-center ml-2 bg-muted px-2 py-0.5 rounded-full">
                            {getResourceIcon(task.assigneeType)}
                            <span className="font-medium">{task.assigneeName}</span>
                            {!task.isAssigneePublic && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <EyeOff className="h-3 w-3 ml-1.5 text-muted-foreground/70" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Assignee hidden from client</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
                        {task.isPublic && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Eye className="h-3 w-3 ml-auto text-blue-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Visible to Client</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </TooltipProvider>
          ) : (
            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No tasks created yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}