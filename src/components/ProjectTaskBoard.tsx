import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent
} from '@dnd-kit/core';
import type { Task, TaskStatus } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CalendarIcon, User, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
interface ProjectTaskBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}
const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'To Do': return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    case 'In Progress': return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case 'Done': return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
  }
};
function TaskCard({ task, onEdit, isOverlay = false }: { task: Task; onEdit?: (task: Task) => void; isOverlay?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isOverlay, // Disable dragging logic for the overlay itself
  });
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative p-3 rounded-lg border bg-card shadow-sm transition-all touch-none",
        isDragging ? "opacity-30" : "opacity-100 hover:shadow-md",
        isOverlay && "opacity-100 shadow-xl cursor-grabbing scale-105 rotate-2 z-50"
      )}
    >
      <div className="flex items-start gap-2">
        <div {...listeners} {...attributes} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => !isDragging && onEdit?.(task)}>
          <p className={cn("text-sm font-medium leading-tight mb-2 cursor-pointer hover:text-primary", task.status === 'Done' && "line-through text-muted-foreground")}>
            {task.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
            {task.assigneeName && (
              <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full">
                <User className="h-3 w-3" />
                <span className="truncate max-w-[80px]">{task.assigneeName}</span>
              </div>
            )}
          </div>
          {task.constructionStageName && (
            <Badge variant="outline" className="mt-2 text-[10px] px-1.5 py-0 h-5 font-normal">
              {task.constructionStageName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
function TaskColumn({ status, tasks, onEdit }: { status: TaskStatus; tasks: Task[]; onEdit: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });
  return (
    <div className="flex flex-col h-full min-h-[500px] rounded-lg bg-muted/30 border border-border/50">
      <div className={cn("p-3 border-b font-semibold text-sm flex items-center justify-between", getStatusColor(status))}>
        {status}
        <Badge variant="secondary" className="bg-background/50">{tasks.length}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 transition-colors",
          isOver && "bg-primary/5"
        )}
      >
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-muted rounded-md m-1">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
export function ProjectTaskBoard({ tasks, onUpdateTaskStatus, onEditTask }: ProjectTaskBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts to allow clicks
      },
    })
  );
  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      onUpdateTaskStatus(taskId, newStatus);
    }
  };
  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {COLUMNS.map(status => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            onEdit={onEditTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}