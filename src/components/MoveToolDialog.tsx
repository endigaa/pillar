import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Tool, Workshop, Project, LocationType } from '@shared/types';
import { toast } from 'sonner';
const locationTypes: [LocationType, ...LocationType[]] = ['Workshop', 'Project', 'Other'];
const moveToolSchema = z.object({
  locationType: z.enum(locationTypes),
  locationId: z.string().optional(),
});
type MoveToolFormValues = z.infer<typeof moveToolSchema>;
interface MoveToolDialogProps {
  tool: Tool;
  onFinished: () => void;
}
export function MoveToolDialog({ tool, onFinished }: MoveToolDialogProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const form = useForm<MoveToolFormValues>({
    resolver: zodResolver(moveToolSchema),
    defaultValues: {
      locationType: 'Workshop',
      locationId: '',
    },
  });
  const locationType = form.watch('locationType');
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [wsData, projData] = await Promise.all([
          api<Workshop[]>('/api/workshops'),
          api<Project[]>('/api/projects')
        ]);
        setWorkshops(wsData);
        setProjects(projData);
      } catch (err) {
        toast.error('Failed to load locations.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // Reset location ID when type changes
  useEffect(() => {
    form.setValue('locationId', '');
  }, [locationType, form]);
  const { isSubmitting } = form.formState;
  const onSubmit = async (values: MoveToolFormValues) => {
    try {
      // Resolve location name
      let locationName = 'Other';
      if (values.locationType === 'Workshop') {
          const ws = workshops.find(w => w.id === values.locationId);
          if (ws) locationName = ws.name;
      } else if (values.locationType === 'Project') {
          const proj = projects.find(p => p.id === values.locationId);
          if (proj) locationName = proj.name;
      }
      await api(`/api/tools/${tool.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          locationType: values.locationType,
          locationId: values.locationType === 'Other' ? undefined : values.locationId,
          locationName: locationName
        }),
      });
      toast.success('Tool moved successfully!');
      onFinished();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move tool.');
    }
  };
  return (
    <DialogContent className="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Move Tool</DialogTitle>
        <DialogDescription>Select a new location for {tool.name}.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 border rounded-md bg-muted/20 mb-4">
            <p className="text-sm font-medium">Current Location</p>
            <p className="text-xs text-muted-foreground">
                {tool.locationName || 'Unassigned'} {tool.locationType && `(${tool.locationType})`}
            </p>
          </div>
          <FormField
            control={form.control}
            name="locationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Location Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locationTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {locationType !== 'Other' && (
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select {locationType}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder={`Select ${locationType}`} /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locationType === 'Workshop'
                        ? workshops.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)
                        : projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Move Tool
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}