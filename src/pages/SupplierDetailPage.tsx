import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Supplier, Quote, Material } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail, MapPin, Truck, FileText, User, Pencil } from 'lucide-react';
import { MaterialList } from '@/components/MaterialList';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EditSupplierForm } from '@/components/EditSupplierForm';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const [supplierData, quotesData] = await Promise.all([
        api<Supplier>(`/api/suppliers/${id}`),
        api<Quote[]>(`/api/suppliers/${id}/quotes`)
      ]);
      setSupplier(supplierData);
      setQuotes(quotesData);
    } catch (err) {
      toast.error('Failed to load supplier details');
      navigate('/suppliers');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleAddMaterial = async (values: Omit<Material, 'id'>) => {
    try {
      await api('/api/materials', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Material added successfully!');
      fetchData();
    } catch (err) {
      toast.error('Failed to add material');
    }
  };
  const handleUpdateSupplier = async (values: Partial<Supplier>) => {
    if (!id) return;
    try {
      await api(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Supplier updated successfully!');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to update supplier');
    }
  };
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }
  if (!supplier) return null;
  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/suppliers')} className="pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Suppliers
        </Button>
        <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl font-bold">{supplier.name}</CardTitle>
                            <CardDescription className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary">{supplier.category}</Badge>
                                <Badge variant="outline">{supplier.supplyReach}</Badge>
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Supplier
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                                <p className="font-medium">{supplier.contactPerson}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="font-medium">{supplier.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                                <p className="font-medium">{supplier.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Location</p>
                                <p className="font-medium">{supplier.location || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Materials</span>
                        </div>
                        <span className="text-xl font-bold">{supplier.materials.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Quotes</span>
                        </div>
                        <span className="text-xl font-bold">{quotes.length}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
        <Tabs defaultValue="materials">
            <TabsList>
                <TabsTrigger value="materials">Material Catalog</TabsTrigger>
                <TabsTrigger value="quotes">Quote History</TabsTrigger>
            </TabsList>
            <TabsContent value="materials" className="mt-4">
                <MaterialList
                    materials={supplier.materials}
                    supplierId={supplier.id}
                    onAddMaterial={handleAddMaterial}
                />
            </TabsContent>
            <TabsContent value="quotes" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Quote History</CardTitle>
                        <CardDescription>Past quotes received from this supplier.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {quotes.length > 0 ? (
                                    quotes.map(quote => (
                                        <TableRow key={quote.id}>
                                            <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{quote.items.length} items</TableCell>
                                            <TableCell>
                                                <Badge variant={quote.status === 'Approved' ? 'default' : 'secondary'}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(quote.totalAmount)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No quotes found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </div>
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
            <DialogDescription>Update the supplier's details.</DialogDescription>
          </DialogHeader>
          <EditSupplierForm
            initialValues={supplier}
            onSubmit={handleUpdateSupplier}
            onFinished={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}