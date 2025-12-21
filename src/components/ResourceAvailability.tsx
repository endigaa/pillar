import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Tool, Personnel } from '@shared/types';
import { format, isPast, isToday, parseISO, isValid } from 'date-fns';
import { Search, Filter, Wrench, User, MapPin, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
type ResourceType = 'All' | 'Tool' | 'Personnel';
type AvailabilityStatus = 'All' | 'Available' | 'Assigned' | 'Overdue';
interface ResourceItem {
  id: string;
  type: 'Tool' | 'Personnel';
  name: string;
  categoryOrRole: string;
  status: string;
  location: string;
  assignmentStart?: string;
  assignmentEnd?: string;
  availableFrom: Date | 'Now' | 'Indefinite';
}
export function ResourceAvailability() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType>('All');
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus>('All');
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [toolsData, personnelData] = await Promise.all([
          api<Tool[]>('/api/tools'),
          api<Personnel[]>('/api/personnel'),
        ]);
        setTools(toolsData);
        setPersonnel(personnelData);
      } catch (err) {
        toast.error('Failed to load resource data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const resources: ResourceItem[] = useMemo(() => {
    const toolItems: ResourceItem[] = tools.map(t => {
      let availableFrom: Date | 'Now' | 'Indefinite' = 'Now';
      if (t.status !== 'Available') {
        if (t.assignmentEndDate) {
          const date = parseISO(t.assignmentEndDate);
          availableFrom = isValid(date) ? date : 'Indefinite';
        } else {
          availableFrom = 'Indefinite';
        }
      }
      return {
        id: t.id,
        type: 'Tool',
        name: t.name,
        categoryOrRole: t.category,
        status: t.status,
        location: t.locationName || (t.locationType === 'Other' ? 'Other' : 'Unassigned'),
        assignmentStart: t.assignmentStartDate,
        assignmentEnd: t.assignmentEndDate,
        availableFrom,
      };
    });
    const personnelItems: ResourceItem[] = personnel.map(p => {
      // Determine status based on location/assignment
      // Personnel don't have a strict 'status' field like tools, so we infer it
      const isAssigned = p.locationType === 'Project';
      const status = isAssigned ? 'Assigned' : 'Available';
      let availableFrom: Date | 'Now' | 'Indefinite' = 'Now';
      if (isAssigned) {
        if (p.assignmentEndDate) {
           const date = parseISO(p.assignmentEndDate);
           availableFrom = isValid(date) ? date : 'Indefinite';
        } else {
          availableFrom = 'Indefinite';
        }
      }
      return {
        id: p.id,
        type: 'Personnel',
        name: p.name,
        categoryOrRole: p.role,
        status: status,
        location: p.locationName || p.currentLocation || (p.locationType === 'Other' ? 'Other' : 'Unassigned'),
        assignmentStart: p.assignmentStartDate,
        assignmentEnd: p.assignmentEndDate,
        availableFrom,
      };
    });
    return [...toolItems, ...personnelItems];
  }, [tools, personnel]);
  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.categoryOrRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'All' || item.type === typeFilter;
      let matchesStatus = true;
      if (statusFilter !== 'All') {
        if (statusFilter === 'Available') {
          matchesStatus = item.status === 'Available';
        } else if (statusFilter === 'Assigned') {
          matchesStatus = item.status !== 'Available';
        } else if (statusFilter === 'Overdue') {
          if (item.availableFrom instanceof Date) {
             matchesStatus = isPast(item.availableFrom) && !isToday(item.availableFrom);
          } else {
             matchesStatus = false;
          }
        }
      }
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, searchTerm, typeFilter, statusFilter]);
  const getStatusBadge = (item: ResourceItem) => {
    if (item.status === 'Available') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
    }
    // Check for overdue
    if (item.availableFrom instanceof Date && isPast(item.availableFrom) && !isToday(item.availableFrom)) {
       return <Badge variant="destructive">Overdue</Badge>;
    }
    if (item.status === 'Under Maintenance') {
        return <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Maintenance</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">Assigned</Badge>;
  };
  const formatAvailability = (val: Date | 'Now' | 'Indefinite') => {
    if (val === 'Now') return <span className="text-green-600 font-medium">Now</span>;
    if (val === 'Indefinite') return <span className="text-muted-foreground">Indefinite</span>;
    return <span>{format(val, 'MMM d, yyyy')}</span>;
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle>Resource Availability</CardTitle>
            <CardDescription>Track assignments and schedule availability for tools and personnel.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search resources..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Tool">Tools</SelectItem>
                <SelectItem value="Personnel">Personnel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AvailabilityStatus)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource Name</TableHead>
                <TableHead>Type / Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Location</TableHead>
                <TableHead>Assignment Period</TableHead>
                <TableHead>Available From</TableHead>
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
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredResources.length > 0 ? (
                filteredResources.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.type === 'Tool' ? <Wrench className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell>{item.categoryOrRole}</TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.assignmentStart || item.assignmentEnd ? (
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarClock className="h-3 w-3" />
                          <span>
                            {item.assignmentStart ? format(parseISO(item.assignmentStart), 'MMM d') : 'Start'} 
                            {' - '}
                            {item.assignmentEnd ? format(parseISO(item.assignmentEnd), 'MMM d, yyyy') : 'Ongoing'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAvailability(item.availableFrom)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No resources found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}