import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { Tool, Personnel } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Wrench, Users, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AssignResourceForm } from './AssignResourceForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
interface ProjectResourcesProps {
  projectId: string;
}
export function ProjectResources({ projectId }: ProjectResourcesProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignToolOpen, setAssignToolOpen] = useState(false);
  const [isAssignPersonnelOpen, setAssignPersonnelOpen] = useState(false);
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allTools, allPersonnel] = await Promise.all([
        api<Tool[]>('/api/tools'),
        api<Personnel[]>('/api/personnel')
      ]);
      // Filter for this project
      setTools(allTools.filter(t => t.locationType === 'Project' && t.locationId === projectId));
      setPersonnel(allPersonnel.filter(p => p.locationType === 'Project' && p.locationId === projectId));
    } catch (err) {
      toast.error('Failed to load project resources.');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAssignFinished = () => {
    setAssignToolOpen(false);
    setAssignPersonnelOpen(false);
    fetchData();
  };
  const formatAssignmentDate = (start?: string, end?: string) => {
    if (!start && !end) return <span className="text-muted-foreground text-xs">Indefinite</span>;
    const startDate = start ? format(new Date(start), 'MMM d, yyyy') : 'Start';
    const endDate = end ? format(new Date(end), 'MMM d, yyyy') : 'Ongoing';
    return <span className="text-xs">{startDate} - {endDate}</span>;
  };
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assigned Personnel
            </CardTitle>
            <CardDescription>Staff currently assigned to this project site.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAssignPersonnelOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign Personnel
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assignment Period</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personnel.length > 0 ? (
                personnel.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.role}</TableCell>
                    <TableCell><Badge variant="outline">{p.employmentType}</Badge></TableCell>
                    <TableCell>{formatAssignmentDate(p.assignmentStartDate, p.assignmentEndDate)}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No personnel assigned.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Assigned Tools
            </CardTitle>
            <CardDescription>Equipment and tools currently located at this project.</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAssignToolOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Assign Tool
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignment Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tools.length > 0 ? (
                tools.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.category}</TableCell>
                    <TableCell><Badge variant={t.status === 'Available' ? 'default' : 'secondary'}>{t.status}</Badge></TableCell>
                    <TableCell>{formatAssignmentDate(t.assignmentStartDate, t.assignmentEndDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No tools assigned.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isAssignPersonnelOpen} onOpenChange={setAssignPersonnelOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Personnel</DialogTitle>
            <DialogDescription>Move a staff member to this project location.</DialogDescription>
          </DialogHeader>
          <AssignResourceForm
            projectId={projectId}
            resourceType="personnel"
            onFinished={handleAssignFinished}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isAssignToolOpen} onOpenChange={setAssignToolOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Tool</DialogTitle>
            <DialogDescription>Move a tool or equipment to this project location.</DialogDescription>
          </DialogHeader>
          <AssignResourceForm
            projectId={projectId}
            resourceType="tool"
            onFinished={handleAssignFinished}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}