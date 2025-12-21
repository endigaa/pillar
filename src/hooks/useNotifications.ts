import { create } from 'zustand';
import { api } from '@/lib/api-client';
import type { Project, Tool, WorkshopMaterial } from '@shared/types';
import { differenceInDays, parseISO, isValid } from 'date-fns';
export interface Notification {
  id: string;
  message: string;
  projectId?: string;
  link?: string;
  type: 'task' | 'project' | 'feedback' | 'inventory';
}
interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  fetchNotifications: () => Promise<void>;
}
export const useNotifications = create<NotificationState>((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  isInitialized: false,
  fetchNotifications: async () => {
    // Prevent redundant fetches
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const [projects, tools, materials] = await Promise.all([
        api<Project[]>('/api/projects'),
        api<Tool[]>('/api/tools'),
        api<WorkshopMaterial[]>('/api/workshop-materials'),
      ]);
      const newNotifications: Notification[] = [];
      const today = new Date();
      projects.forEach(project => {
        // Check for overdue tasks
        project.tasks.forEach(task => {
          if (task.status !== 'Done' && new Date(task.dueDate) < today) {
            newNotifications.push({
              id: `task-${task.id}`,
              message: `Task "${task.description}" in project "${project.name}" is overdue.`,
              projectId: project.id,
              type: 'task',
            });
          }
        });
        // Check for projects nearing deadline
        const daysUntilDeadline = differenceInDays(new Date(project.endDate), today);
        if (project.status === 'In Progress' && daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
          newNotifications.push({
            id: `project-deadline-${project.id}`,
            message: `Project "${project.name}" is due in ${daysUntilDeadline} day(s).`,
            projectId: project.id,
            type: 'project',
          });
        }
        // Check for unread client feedback
        project.clientFeedback?.forEach(feedback => {
          if (!feedback.isRead) {
            newNotifications.push({
              id: `feedback-${feedback.id}`,
              message: `New feedback from ${project.clientName}: "${feedback.message.substring(0, 30)}${feedback.message.length > 30 ? '...' : ''}"`,
              projectId: project.id,
              type: 'feedback',
            });
          }
        });
      });
      // Inventory Date Notifications
      const checkProperties = (item: Tool | WorkshopMaterial, typeName: string) => {
        if (!item.properties) return;
        item.properties.forEach(prop => {
          if (prop.type === 'date' && prop.value) {
            const date = parseISO(prop.value);
            if (isValid(date)) {
              const diff = differenceInDays(date, today);
              // Notify if overdue or due within next 7 days
              if (diff < 0) {
                 newNotifications.push({
                  id: `inventory-overdue-${item.id}-${prop.name}`,
                  message: `${typeName} "${item.name}": ${prop.name} was due on ${date.toLocaleDateString()}.`,
                  link: '/resources',
                  type: 'inventory',
                });
              } else if (diff <= 7) {
                 newNotifications.push({
                  id: `inventory-upcoming-${item.id}-${prop.name}`,
                  message: `${typeName} "${item.name}": ${prop.name} is due in ${diff} day(s).`,
                  link: '/resources',
                  type: 'inventory',
                });
              }
            }
          }
        });
      };
      tools.forEach(t => checkProperties(t, 'Tool'));
      materials.forEach(m => checkProperties(m, 'Material'));
      set({ notifications: newNotifications, isLoading: false, isInitialized: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch notifications';
      set({ error, isLoading: false });
    }
  },
}));