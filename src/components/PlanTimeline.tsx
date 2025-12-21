import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { format, differenceInDays, addDays, min, max, isValid } from 'date-fns';
import type { PlanStage, Task } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
interface PlanTimelineProps {
  stages: PlanStage[];
  tasks: Task[];
  readOnly?: boolean;
  onStageClick?: (stage: PlanStage) => void;
}
export function PlanTimeline({ stages, tasks, readOnly = false, onStageClick }: PlanTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  const timelineData = useMemo(() => {
    if (stages.length === 0) return null;
    // Calculate overall date range
    const allDates: Date[] = [];
    stages.forEach(s => {
      if (s.startDate) allDates.push(new Date(s.startDate));
      if (s.endDate) allDates.push(new Date(s.endDate));
    });
    tasks.forEach(t => {
      if (t.createdAt) allDates.push(new Date(t.createdAt));
      if (t.dueDate) allDates.push(new Date(t.dueDate));
    });
    const validDates = allDates.filter(d => isValid(d));
    if (validDates.length === 0) return null;
    const minDate = min(validDates);
    const maxDate = max(validDates);
    // Add buffer
    const start = addDays(minDate, -7);
    const end = addDays(maxDate, 14);
    const totalDays = differenceInDays(end, start);
    return { start, end, totalDays };
  }, [stages, tasks]);
  const getPositionPercent = useCallback((dateStr: string) => {
    if (!timelineData) return 0;
    const date = new Date(dateStr);
    if (!isValid(date)) return 0;
    const diff = differenceInDays(date, timelineData.start);
    return (diff / timelineData.totalDays) * 100;
  }, [timelineData]);
  const getWidthPercent = useCallback((startStr: string, endStr: string) => {
    if (!timelineData) return 0;
    const s = new Date(startStr);
    const e = new Date(endStr);
    if (!isValid(s) || !isValid(e)) return 0;
    const diff = differenceInDays(e, s);
    return Math.max((diff / timelineData.totalDays) * 100, 0.5); // Min width 0.5%
  }, [timelineData]);
  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    if (!timelineData || containerWidth === 0) return [];
    const lines: JSX.Element[] = [];
    const ROW_HEIGHT = 88; // 64px height + 24px margin (space-y-6)
    const TOP_OFFSET = 16; // py-4
    const BAR_OFFSET_Y = 12; // Center of bar relative to row top (approx)
    // Map stage ID to index for row calculation
    const stageIndexMap = new Map(stages.map((s, i) => [s.id, i]));
    stages.forEach((stage, index) => {
      if (!stage.dependencies || stage.dependencies.length === 0) return;
      const targetY = TOP_OFFSET + index * ROW_HEIGHT + BAR_OFFSET_Y;
      const targetXPercent = getPositionPercent(stage.startDate);
      const targetX = (targetXPercent / 100) * containerWidth;
      stage.dependencies.forEach(depId => {
        const sourceIndex = stageIndexMap.get(depId);
        if (sourceIndex === undefined) return;
        const sourceStage = stages[sourceIndex];
        const sourceY = TOP_OFFSET + sourceIndex * ROW_HEIGHT + BAR_OFFSET_Y;
        const sourceXPercent = getPositionPercent(sourceStage.endDate);
        const sourceX = (sourceXPercent / 100) * containerWidth;
        // Draw curve
        const controlPointOffset = 20;
        const path = `M ${sourceX} ${sourceY + 12} C ${sourceX + controlPointOffset} ${sourceY + 12}, ${targetX - controlPointOffset} ${targetY + 12}, ${targetX} ${targetY + 12}`;
        lines.push(
          <path
            key={`${depId}-${stage.id}`}
            d={path}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
            opacity="0.5"
          />
        );
      });
    });
    return lines;
  }, [stages, containerWidth, timelineData, getPositionPercent]);
  if (!timelineData) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No timeline data available. Add plan stages to see the timeline.
        </CardContent>
      </Card>
    );
  }
  const { start, end } = timelineData;
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Project Timeline: Plan vs Actual</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-full flex-col" style={{ minWidth: '800px' }}>
            {/* Header Row */}
            <div className="flex h-8 items-center border-b bg-muted/50 px-4 text-xs text-muted-foreground sticky top-0 z-10">
              <span>{format(start, 'MMM d, yyyy')}</span>
              <span className="ml-auto">{format(end, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex flex-col py-4 space-y-6 px-4 relative" ref={containerRef}>
              {/* Dependency Lines Overlay */}
              <svg className="absolute inset-0 pointer-events-none z-0" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" opacity="0.5" />
                  </marker>
                </defs>
                {dependencyLines}
              </svg>
              {stages.map(stage => {
                // Find linked tasks
                const stageTasks = tasks.filter(t => t.constructionStageId === stage.constructionStageId);
                // Calculate Actuals
                let actualStart: string | undefined;
                let actualEnd: string | undefined;
                if (stageTasks.length > 0) {
                  const taskDates = stageTasks.flatMap(t => {
                    const d = [];
                    if (t.createdAt) d.push(new Date(t.createdAt));
                    if (t.dueDate) d.push(new Date(t.dueDate));
                    return d;
                  }).filter(isValid);
                  if (taskDates.length > 0) {
                    actualStart = min(taskDates).toISOString();
                    actualEnd = max(taskDates).toISOString();
                  }
                }
                return (
                  <div key={stage.id} className="relative h-16 w-full z-10">
                    {/* Stage Label */}
                    <div className="absolute -top-5 left-0 text-sm font-medium truncate max-w-[200px]" title={stage.name}>
                      {stage.name}
                    </div>
                    {/* Planned Bar */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute top-0 h-6 rounded bg-blue-500/80 transition-colors ${!readOnly ? 'cursor-pointer hover:bg-blue-600 hover:shadow-sm' : ''}`}
                            style={{
                              left: `${getPositionPercent(stage.startDate)}%`,
                              width: `${getWidthPercent(stage.startDate, stage.endDate)}%`
                            }}
                            onClick={(e) => {
                              if (!readOnly && onStageClick) {
                                e.stopPropagation();
                                onStageClick(stage);
                              }
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-bold">Planned</p>
                          <p>{format(new Date(stage.startDate), 'PP')} - {format(new Date(stage.endDate), 'PP')}</p>
                          <p>{stage.description}</p>
                          {!readOnly && <p className="text-xs text-muted-foreground mt-1">(Click to edit)</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {/* Actual Bar */}
                    {actualStart && actualEnd && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-7 h-4 rounded bg-green-500/80 hover:bg-green-600 transition-colors cursor-default"
                              style={{
                                left: `${getPositionPercent(actualStart)}%`,
                                width: `${getWidthPercent(actualStart, actualEnd)}%`
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">Actual (Tasks)</p>
                            <p>{format(new Date(actualStart), 'PP')} - {format(new Date(actualEnd), 'PP')}</p>
                            <p>{stageTasks.length} linked tasks</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex gap-4 p-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500/80" />
            <span>Planned Schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500/80" />
            <span>Actual Progress (Tasks)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}