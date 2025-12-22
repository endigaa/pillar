import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, MapPin, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { SubContractor } from '@shared/types';
import { AddSubContractorForm } from './AddSubContractorForm';
import { EditSubContractorForm } from './EditSubContractorForm';
import { Toaster, toast } from '@/components/ui/sonner';
export function SubContractors() {
  const [subContractors, setSubContractors] = useState<SubContractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSubContractorOpen, setNewSubContractorOpen] = useState(false);
  const [editingSubContractor, setEditingSubContractor] = useState<SubContractor | null>(null);
  const fetchSubContractors = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<SubContractor[]>('/api/subcontractors');
      setSubContractors(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch sub-contractors');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchSubContractors();
  }, [fetchSubContractors]);
  const handleCreateSubContractor = async (values: Omit<SubContractor, 'id'>) => {
    try {
      await api('/api/subcontractors', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Sub-contractor added successfully!');
      fetchSubContractors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add sub-contractor.');
    }
  };
  const handleUpdateSubContractor = async (values: Partial<SubContractor>) => {
    if (!editingSubContractor) return;
    try {
      await api(`/api/subcontractors/${editingSubContractor.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Sub-contractor updated successfully!');
      setEditingSubContractor(null);
      fetchSubContractors();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update sub-contractor.');
    }
  };
  const handleDeleteSubContractor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sub-contractor?')) return;
    try {
      await api(`/api/subcontractors/${id}`, { method: 'DELETE' });
      toast.success('Sub-contractor deleted successfully');
      fetchSubContractors();
    } catch (err) {
      toast.error('Failed to delete sub-contractor');
    }
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sub-contractor Directory</CardTitle>
            <CardDescription>A list of all your trusted sub-contractors.</CardDescription>
          </div>
          <Dialog open={isNewSubContractorOpen} onOpenChange={setNewSubContractorOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Sub-contractor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add New Sub-contractor</DialogTitle>
                <DialogDescription>Enter the sub-contractor's details to add them to your directory.</DialogDescription>
              </DialogHeader>
              <AddSubContractorForm onSubmit={handleCreateSubContractor} onFinished={() => setNewSubContractorOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
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
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : subContractors.length > 0 ? (
                subContractors.map((sc) => (
                  <TableRow key={sc.id}>
                    <TableCell className="font-medium">{sc.name}</TableCell>
                    <TableCell>{sc.specialization}</TableCell>
                    <TableCell>
                      {sc.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {sc.location}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>{sc.email}</TableCell>
                    <TableCell>{sc.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setEditingSubContractor(sc)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSubContractor(sc.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No sub-contractors found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editingSubContractor} onOpenChange={(open) => !open && setEditingSubContractor(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Sub-contractor</DialogTitle>
            <DialogDescription>Update the sub-contractor's details.</DialogDescription>
          </DialogHeader>
          {editingSubContractor && (
            <EditSubContractorForm
              initialValues={editingSubContractor}
              onSubmit={handleUpdateSubContractor}
              onFinished={() => setEditingSubContractor(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </>
  );
}