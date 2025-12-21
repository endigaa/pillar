import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard } from '@/components/ProjectCard';
import { api } from '@/lib/api-client';
import type { Project } from '@shared/types';
import { PlusCircle, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { NewProjectForm } from '@/components/NewProjectForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';
const getStatusColor = (status: Project['status']) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'On Hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Not Started': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};
export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewProjectOpen, setNewProjectOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const projectsData = await api<Project[]>('/api/projects');
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, []);
  const handleCreateProject = async (values: Omit<Project, 'id' | 'expenses' | 'clientName' | 'status' | 'deposits' | 'photos' | 'tasks' | 'clientDocuments' | 'invoiceIds' | 'worksiteMaterials' | 'quoteIds' | 'journalEntries' | 'clientFeedback' | 'changeOrderIds' | 'planStages'>) => {
    try {
      const newProject = await api<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Project created successfully!');
      setNewProjectOpen(false);
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project.');
    }
  };
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    });
  }, [projects, statusFilter]);
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage your construction projects.</p>
          </div>
          <Dialog open={isNewProjectOpen} onOpenChange={setNewProjectOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Fill in the details below to start a new construction project.</DialogDescription>
              </DialogHeader>
              <NewProjectForm onSubmit={handleCreateProject} onFinished={() => setNewProjectOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">All Projects</h2>
              <div className="flex items-center border rounded-md bg-background ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-none rounded-l-md ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-none rounded-r-md ${viewMode === 'list' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="In Progress">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-destructive">{error}</p>}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </CardContent>
                    </Card>
                  ))
                : filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">No projects found with status "{statusFilter === 'all' ? 'Any' : statusFilter}".</p>
                    </div>
                  )
              }
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Budget</TableHead>
                      <TableHead className="text-right">Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>{project.clientName}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{project.location}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(project.budget, { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {new Date(project.endDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          No projects found with status "{statusFilter === 'all' ? 'Any' : statusFilter}".
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}