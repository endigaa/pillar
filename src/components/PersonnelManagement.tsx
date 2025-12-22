import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Personnel } from '@shared/types';
import { AddPersonnelForm } from './AddPersonnelForm';
import { EditPersonnelForm } from './EditPersonnelForm';
import { Toaster, toast } from '@/components/ui/sonner';
import { Badge } from './ui/badge';
import { ManageDaysOffDialog } from './ManageDaysOffDialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
export function PersonnelManagement() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewPersonnelOpen, setNewPersonnelOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const fetchPersonnel = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<Personnel[]>('/api/personnel');
      setPersonnel(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch personnel');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchPersonnel();
  }, [fetchPersonnel]);
  const handleCreatePersonnel = async (values: Omit<Personnel, 'id' | 'associatedExpenseIds'>) => {
    try {
      await api('/api/personnel', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Personnel added successfully!');
      fetchPersonnel();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add personnel.');
    }
  };
  const handleDeletePersonnel = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this personnel record?')) return;
    try {
      await api(`/api/personnel/${id}`, { method: 'DELETE' });
      toast.success('Personnel deleted successfully');
      fetchPersonnel();
    } catch (err) {
      toast.error('Failed to delete personnel');
    }
  };
  const formatRate = (p: Personnel) => {
    const amount = formatCurrency(p.rate);
    switch (p.rateType) {
      case 'Annually': return `${amount}/yr`;
      case 'Monthly': return `${amount}/mo`;
      case 'Weekly': return `${amount}/wk`;
      case 'Daily': return `${amount}/day`;
      default: return amount;
    }
  };
  const isTerminated = (p: Personnel) => {
    if (!p.separationDate) return false;
    return new Date(p.separationDate) <= new Date();
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Personnel Management</CardTitle>
            <CardDescription>A list of all your employees and staff.</CardDescription>
          </div>
          <Dialog open={isNewPersonnelOpen} onOpenChange={setNewPersonnelOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Personnel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Personnel</DialogTitle>
                <DialogDescription>Enter the details of the new employee or staff member.</DialogDescription>
              </DialogHeader>
              <AddPersonnelForm onSubmit={handleCreatePersonnel} onFinished={() => setNewPersonnelOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role / Specialization</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Employment</TableHead>
                <TableHead>Pay Rate</TableHead>
                <TableHead>Next of Kin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : personnel.length > 0 ? (
                personnel.map((p) => {
                  const terminated = isTerminated(p);
                  return (
                    <TableRow key={p.id} className={cn(terminated && "bg-muted/50 opacity-70")}>
                      <TableCell className="font-medium">
                        {p.name}
                        {terminated && <Badge variant="destructive" className="ml-2 text-[10px] h-5 px-1.5">Terminated</Badge>}
                      </TableCell>
                      <TableCell>
                        <div>{p.role}</div>
                        {p.specialization && <div className="text-xs text-muted-foreground">{p.specialization}</div>}
                      </TableCell>
                      <TableCell>
                        {p.locationName || p.currentLocation ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {p.locationName || p.currentLocation}
                            {p.locationType && p.locationType !== 'Other' && <span className="text-xs text-muted-foreground">({p.locationType})</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{p.email}</div>
                        <div className="text-xs text-muted-foreground">{p.phone}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.employmentType === 'Permanent' ? 'default' : 'secondary'}>{p.employmentType}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">Hired: {new Date(p.hireDate).toLocaleDateString()}</div>
                        {p.separationDate && (
                          <div className="text-xs text-red-500 font-medium">Left: {new Date(p.separationDate).toLocaleDateString()}</div>
                        )}
                      </TableCell>
                      <TableCell>{formatRate(p)}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-auto py-0.5 px-2">
                              {p.nextOfKin.length} record(s)
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">Next of Kin</h4>
                                <p className="text-sm text-muted-foreground">
                                  Emergency contacts for {p.name}.
                                </p>
                              </div>
                              <div className="grid gap-2">
                                {p.nextOfKin.map(nok => (
                                  <div key={nok.id} className="grid grid-cols-[1fr_auto] items-center gap-4">
                                    <div>
                                      <p className="text-sm font-medium leading-none">{nok.name} <span className="text-xs text-muted-foreground">({nok.relationship})</span></p>
                                      <p className="text-sm text-muted-foreground">{nok.phone}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingPersonnel(p)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePersonnel(p.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Days Off
                              </Button>
                            </DialogTrigger>
                            <ManageDaysOffDialog personnel={p} onUpdate={fetchPersonnel} />
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No personnel found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editingPersonnel} onOpenChange={(open) => !open && setEditingPersonnel(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Personnel</DialogTitle>
            <DialogDescription>Update details for {editingPersonnel?.name}.</DialogDescription>
          </DialogHeader>
          {editingPersonnel && (
            <EditPersonnelForm
              initialValues={editingPersonnel}
              onFinished={() => { setEditingPersonnel(null); fetchPersonnel(); }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </>
  );
}