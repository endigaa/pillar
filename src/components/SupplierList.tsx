import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Search, Phone, Mail, MapPin, ArrowRight, User, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Supplier, SupplyReach } from '@shared/types';
import { AddSupplierForm } from './AddSupplierForm';
import { Toaster, toast } from '@/components/ui/sonner';
import { Skeleton } from './ui/skeleton';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
export function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewSupplierOpen, setNewSupplierOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [reachFilter, setReachFilter] = useState<SupplyReach | 'all'>('all');
  const navigate = useNavigate();
  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await api<Supplier[]>('/api/suppliers');
      setSuppliers(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    setIsLoading(true);
    fetchSuppliers();
  }, [fetchSuppliers]);
  const handleCreateSupplier = async (values: Omit<Supplier, 'id' | 'materials'>) => {
    try {
      await api('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Supplier added successfully!');
      fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add supplier.');
    }
  };
  const handleDeleteSupplier = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent card click navigation
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone.')) return;
    try {
      await api(`/api/suppliers/${id}`, { method: 'DELETE' });
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (err) {
      toast.error('Failed to delete supplier');
    }
  };
  const uniqueCategories = useMemo(() => {
    const categories = new Set(suppliers.map(s => s.category).filter(Boolean));
    return ['all', ...Array.from(categories)];
  }, [suppliers]);
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;
      const matchesReach = reachFilter === 'all' || supplier.supplyReach === reachFilter;
      return matchesSearch && matchesCategory && matchesReach;
    });
  }, [suppliers, searchTerm, categoryFilter, reachFilter]);
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 p-4 border rounded-lg bg-card">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reachFilter} onValueChange={(value) => setReachFilter(value as SupplyReach | 'all')}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by reach" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reaches</SelectItem>
              <SelectItem value="Local">Local</SelectItem>
              <SelectItem value="National">National</SelectItem>
              <SelectItem value="Radius">Radius</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isNewSupplierOpen} onOpenChange={setNewSupplierOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Enter the supplier's details to add them to your directory.</DialogDescription>
            </DialogHeader>
            <AddSupplierForm onSubmit={handleCreateSupplier} onFinished={() => setNewSupplierOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className="flex flex-col hover:shadow-md transition-shadow group relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-bold truncate pr-8">{supplier.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">{supplier.category}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDeleteSupplier(e, supplier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="truncate">{supplier.contactPerson}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                </div>
                {supplier.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{supplier.location}</span>
                    </div>
                )}
                <div className="flex flex-wrap gap-1 pt-2">
                     <Badge variant="outline" className="text-xs font-normal">{supplier.supplyReach}{supplier.supplyReach === 'Radius' ? ` (${supplier.supplyRadiusKm}km)` : ''}</Badge>
                     {supplier.constructionStages.slice(0, 2).map(stage => (
                         <Badge key={stage} variant="outline" className="text-xs font-normal">{stage}</Badge>
                     ))}
                     {supplier.constructionStages.length > 2 && (
                         <Badge variant="outline" className="text-xs font-normal">+{supplier.constructionStages.length - 2}</Badge>
                     )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button className="w-full" variant="outline" onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Suppliers Found</h3>
          <p className="text-muted-foreground mt-2">Your search or filter criteria did not match any suppliers.</p>
        </div>
      )}
      <Toaster richColors />
    </>
  );
}