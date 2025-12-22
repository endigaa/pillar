import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CalendarView, type CalendarEvent } from '@/components/CalendarView';
import { api } from '@/lib/api-client';
import type { Project, Personnel } from '@shared/types';
import { eachDayOfInterval, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
export function SchedulePage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [projects, personnel] = await Promise.all([
          api<Project[]>('/api/projects'),
          api<Personnel[]>('/api/personnel'),
        ]);
        const calendarEvents: CalendarEvent[] = [];
        // Process Projects
        projects.forEach(project => {
          // Project Start
          if (project.startDate) {
            const date = parseISO(project.startDate);
            if (isValid(date)) {
              calendarEvents.push({
                id: `proj-start-${project.id}`,
                title: `Start: ${project.name}`,
                date: date,
                type: 'project-start',
                description: `Client: ${project.clientName}`
              });
            }
          }
          // Project End
          if (project.endDate) {
            const date = parseISO(project.endDate);
            if (isValid(date)) {
              calendarEvents.push({
                id: `proj-end-${project.id}`,
                title: `Due: ${project.name}`,
                date: date,
                type: 'project-end',
                description: `Status: ${project.status}`
              });
            }
          }
          // Project Tasks
          project.tasks?.forEach(task => {
            if (task.dueDate && task.status !== 'Done') {
              const date = parseISO(task.dueDate);
              if (isValid(date)) {
                calendarEvents.push({
                  id: `task-${task.id}`,
                  title: task.description,
                  date: date,
                  type: 'task',
                  description: `Project: ${project.name}`
                });
              }
            }
          });
        });
        // Process Personnel Time Off
        personnel.forEach(person => {
          person.daysOff?.forEach(dayOff => {
            if (dayOff.startDate && dayOff.endDate) {
              const start = parseISO(dayOff.startDate);
              const end = parseISO(dayOff.endDate);
              if (isValid(start) && isValid(end) && end >= start) {
                const days = eachDayOfInterval({ start, end });
                days.forEach((day, idx) => {
                  calendarEvents.push({
                    id: `leave-${person.id}-${dayOff.id}-${idx}`,
                    title: `${person.name} (${dayOff.reason})`,
                    date: day,
                    type: 'time-off',
                    description: `Reason: ${dayOff.reason}`
                  });
                });
              }
            }
          });
        });
        setEvents(calendarEvents);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load schedule data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <AppLayout>
      <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Schedule</h1>
          <p className="text-muted-foreground">Global timeline of projects, tasks, and team availability.</p>
        </div>
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-lg" />
          ) : (
            <CalendarView events={events} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}