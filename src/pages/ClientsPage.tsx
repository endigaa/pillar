import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, FileText, Info, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Client } from '@shared/types';
import { NewClientForm } from '@/components/NewClientForm';
import { EditClientForm } from '@/components/EditClientForm';
import { Toaster, toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewClientOpen, setNewClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const navigate = useNavigate();
  const fetchClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<Client[]>('/api/clients');
      setClients(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);
  const handleCreateClient = async (values: Omit<Client, 'id'>) => {
    try {
      await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Client created successfully!');
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create client.');
    }
  };
  const handleUpdateClient = async (values: Partial<Client>) => {
    if (!editingClient) return;
    try {
      await api(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Client updated successfully!');
      setEditingClient(null);
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update client.');
    }
  };
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) return;
    try {
      await api(`/api/clients/${clientId}`, { method: 'DELETE' });
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (err) {
      toast.error('Failed to delete client');
    }
  };
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Clients</h1>
            <p className="text-muted-foreground">Manage your clients and their contact information.</p>
          </div>
          <Dialog open={isNewClientOpen} onOpenChange={setNewClientOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Enter the client's details to add them to your directory.</DialogDescription>
              </DialogHeader>
              <NewClientForm onSubmit={handleCreateClient} onFinished={() => setNewClientOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>A list of all your clients.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
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
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : clients.length > 0 ? (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{client.name}</span>
                            {client.notes && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{client.notes}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditingClient(client)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${client.id}/statement`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Statement
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No clients found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client's contact information.</DialogDescription>
          </DialogHeader>
          {editingClient && (
            <EditClientForm
              initialValues={editingClient}
              onSubmit={handleUpdateClient}
              onFinished={() => setEditingClient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </AppLayout>
  );
}