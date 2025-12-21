import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, ArrowRightLeft, Warehouse, Pencil, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { WorkshopMaterial, Workshop } from '@shared/types';
import { Toaster, toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddWorkshopForm } from './AddWorkshopForm';
import { MoveInventoryForm } from './MoveInventoryForm';
import { EditWorkshopMaterialForm } from './EditWorkshopMaterialForm';
import { AddWorkshopMaterialForm } from './AddWorkshopMaterialForm';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInCents / 100);
};
export function WorkshopInventory() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [materials, setMaterials] = useState<WorkshopMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeWorkshopId, setActiveWorkshopId] = useState<string>('');
  const [isNewMaterialOpen, setNewMaterialOpen] = useState(false);
  const [isNewWorkshopOpen, setNewWorkshopOpen] = useState(false);
  const [moveMaterial, setMoveMaterial] = useState<WorkshopMaterial | null>(null);
  const [editMaterial, setEditMaterial] = useState<WorkshopMaterial | null>(null);
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wsData, matData] = await Promise.all([
        api<Workshop[]>('/api/workshops'),
        api<WorkshopMaterial[]>('/api/workshop-materials')
      ]);
      setWorkshops(wsData);
      setMaterials(matData);
      if (wsData.length > 0 && !activeWorkshopId) {
        setActiveWorkshopId(wsData[0].id);
      }
    } catch (err) {
      toast.error('Failed to fetch inventory data');
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkshopId]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleFormFinished = () => {
    setNewMaterialOpen(false);
    setNewWorkshopOpen(false);
    setMoveMaterial(null);
    setEditMaterial(null);
    fetchData();
  };
  const filteredMaterials = materials.filter(m => m.workshopId === activeWorkshopId);
  const getStatusColor = (status?: string) => {
      switch (status) {
          case 'Available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
          case 'Reserved': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
          case 'Maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
          case 'Expired':
          case 'Damaged': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
          default: return 'bg-gray-100 text-gray-800';
      }
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Workshop Inventory</CardTitle>
            <CardDescription>Manage materials across multiple locations.</CardDescription>
          </div>
          <Dialog open={isNewWorkshopOpen} onOpenChange={setNewWorkshopOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Warehouse className="mr-2 h-4 w-4" />
                Create Workshop
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Create New Workshop</DialogTitle>
                <DialogDescription>Add a new storage location.</DialogDescription>
              </DialogHeader>
              <AddWorkshopForm onFinished={handleFormFinished} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : workshops.length > 0 ? (
            <Tabs value={activeWorkshopId} onValueChange={setActiveWorkshopId}>
              <TabsList className="flex flex-wrap h-auto mb-4">
                {workshops.map(ws => (
                  <TabsTrigger key={ws.id} value={ws.id}>{ws.name}</TabsTrigger>
                ))}
              </TabsList>
              {workshops.map(ws => (
                <TabsContent key={ws.id} value={ws.id} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{ws.location} {ws.description && `- ${ws.description}`}</p>
                    <Dialog open={isNewMaterialOpen} onOpenChange={setNewMaterialOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Material
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Add to {ws.name}</DialogTitle>
                          <DialogDescription>Enter details for new inventory item.</DialogDescription>
                        </DialogHeader>
                        <AddWorkshopMaterialForm workshopId={ws.id} onFinished={handleFormFinished} />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Material Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMaterials.length > 0 ? (
                          filteredMaterials.map((material) => (
                            <TableRow key={material.id}>
                              <TableCell>
                                {material.imageUrl ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <img src={material.imageUrl} alt={material.name} className="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80" />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 p-0 overflow-hidden">
                                            <img src={material.imageUrl} alt={material.name} className="w-full h-auto" />
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {material.name}
                                {material.properties && material.properties.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {material.properties.length} properties
                                    </div>
                                )}
                              </TableCell>
                              <TableCell>{material.quantity}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell>{formatCurrency(material.costPerUnit || 0)}</TableCell>
                              <TableCell>
                                  <Badge className={getStatusColor(material.status)} variant="outline">
                                      {material.status || 'Available'}
                                  </Badge>
                              </TableCell>
                              <TableCell>{material.lowStockThreshold || 10}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setEditMaterial(material)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setMoveMaterial(material)}>
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center h-24">
                              No materials in this workshop.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No workshops defined.</p>
              <Button onClick={() => setNewWorkshopOpen(true)}>Create Your First Workshop</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!moveMaterial} onOpenChange={(open) => !open && setMoveMaterial(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Move Inventory</DialogTitle>
            <DialogDescription>Transfer items to another workshop.</DialogDescription>
          </DialogHeader>
          {moveMaterial && (
            <MoveInventoryForm sourceMaterial={moveMaterial} onFinished={handleFormFinished} />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editMaterial} onOpenChange={(open) => !open && setEditMaterial(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>Update material details and status.</DialogDescription>
          </DialogHeader>
          {editMaterial && (
            <EditWorkshopMaterialForm initialValues={editMaterial} onFinished={handleFormFinished} />
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </>
  );
}