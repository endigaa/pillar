import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Wrench, HardHat, Hammer, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { PortalResources } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
interface SiteResourcesProps {
  projectId: string;
}
export function SiteResources({ projectId }: SiteResourcesProps) {
  const [resources, setResources] = useState<PortalResources | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchResources = async () => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const data = await api<PortalResources>(`/api/portal/${projectId}/resources`);
        setResources(data);
      } catch (err) {
        console.error('Failed to fetch site resources', err);
        setError('Unable to load site resources.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, [projectId]);
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            On-Site Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error || !resources) {
    return null; // Hide component on error or empty
  }
  const hasPersonnel = resources.personnel.length > 0;
  const hasTools = resources.tools.length > 0;
  if (!hasPersonnel && !hasTools) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            On-Site Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No active resources currently assigned to this site.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardHat className="h-5 w-5 text-primary" />
          Active Site Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {/* Personnel Section */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
            <Users className="h-4 w-4" /> Personnel
          </h4>
          {hasPersonnel ? (
            <div className="space-y-2">
              {resources.personnel.map((person, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border">
                  <span className="font-medium text-sm">{person.name}</span>
                  <Badge variant="outline" className="text-xs font-normal">{person.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No personnel currently assigned.</p>
          )}
        </div>
        {/* Tools Section */}
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3 text-muted-foreground">
            <Wrench className="h-4 w-4" /> Equipment & Tools
          </h4>
          {hasTools ? (
            <div className="space-y-2">
              {resources.tools.map((tool, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    {tool.imageUrl ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <img
                            src={tool.imageUrl}
                            alt={tool.name}
                            className="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80 border"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 overflow-hidden border-none shadow-xl">
                          <img src={tool.imageUrl} alt={tool.name} className="w-full h-auto" />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center border">
                        <Hammer className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-medium text-sm">{tool.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tool.category}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No equipment currently assigned.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}