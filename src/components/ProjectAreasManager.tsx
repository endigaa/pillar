import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Trash2, MapPin } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Project, ProjectArea } from '@shared/types';
import { toast } from 'sonner';
import { SimpleCategoryForm } from './SimpleCategoryForm';
interface ProjectAreasManagerProps {
  project: Project;
  onUpdate: () => void;
}
export function ProjectAreasManager({ project, onUpdate }: ProjectAreasManagerProps) {
  const [isAddAreaOpen, setAddAreaOpen] = useState(false);
  const handleAddArea = async (name: string) => {
    try {
      await api(`/api/projects/${project.id}/areas`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      toast.success('Area added successfully!');
      setAddAreaOpen(false);
      onUpdate();
    } catch (err) {
      toast.error('Failed to add area.');
    }
  };
  const handleDeleteArea = async (areaId: string) => {
    if (!confirm('Are you sure you want to delete this area? Items tagged with this area will remain but lose the tag.')) return;
    try {
      await api(`/api/projects/${project.id}/areas/${areaId}`, {
        method: 'DELETE',
      });
      toast.success('Area deleted successfully!');
      onUpdate();
    } catch (err) {
      toast.error('Failed to delete area.');
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Areas / Units</CardTitle>
          <CardDescription>Define specific units of construction (e.g., 'Gazebo', 'Main House') to tag expenses and tasks.</CardDescription>
        </div>
        <Dialog open={isAddAreaOpen} onOpenChange={setAddAreaOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Area
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Add Project Area</DialogTitle>
              <DialogDescription>Create a new zone for tracking costs and activities.</DialogDescription>
            </DialogHeader>
            <SimpleCategoryForm
              onSubmit={handleAddArea}
              onCancel={() => setAddAreaOpen(false)}
              label="Area Name"
              placeholder="e.g., Guest House"
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {project.areas && project.areas.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.areas.map((area: ProjectArea) => (
              <Badge key={area.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {area.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-destructive/20 hover:text-destructive rounded-full"
                  onClick={() => handleDeleteArea(area.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No areas defined for this project yet.</p>
        )}
      </CardContent>
    </Card>
  );
}