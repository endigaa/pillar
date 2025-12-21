// This component is created for future use but is not yet integrated in this phase.
// It provides the UI for managing materials for a specific supplier.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import type { Material } from '@shared/types';
import { AddMaterialForm } from './AddMaterialForm';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
interface MaterialListProps {
  materials: Material[];
  supplierId: string;
  onAddMaterial: (values: Omit<Material, 'id'>) => Promise<void>;
}
export function MaterialList({ materials, supplierId, onAddMaterial }: MaterialListProps) {
  const [isNewMaterialOpen, setNewMaterialOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Material Price List</CardTitle>
          <CardDescription>List of materials provided by this supplier.</CardDescription>
        </div>
        <Dialog open={isNewMaterialOpen} onOpenChange={setNewMaterialOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>Enter the material details and price.</DialogDescription>
            </DialogHeader>
            <AddMaterialForm supplierId={supplierId} onSubmit={onAddMaterial} onFinished={() => setNewMaterialOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length > 0 ? (
              materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(material.price)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  No materials found for this supplier.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}