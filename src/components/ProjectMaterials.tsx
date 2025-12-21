import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Package, RotateCcw } from 'lucide-react';
import type { Project, WorksiteMaterialIssue } from '@shared/types';
import { IssueMaterialForm } from './IssueMaterialForm';
import { ReturnMaterialDialog } from './ReturnMaterialDialog';
import { Badge } from '@/components/ui/badge';
interface ProjectMaterialsProps {
  project: Project;
  onUpdate: () => void;
}
const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountInCents / 100);
};
export function ProjectMaterials({ project, onUpdate }: ProjectMaterialsProps) {
  const [isIssueOpen, setIssueOpen] = useState(false);
  const [returnMaterial, setReturnMaterial] = useState<WorksiteMaterialIssue | null>(null);
  const handleFinished = () => {
    setIssueOpen(false);
    setReturnMaterial(null);
    onUpdate();
  };
  const materials = project.worksiteMaterials || [];
  const sortedMaterials = [...materials].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Project Materials</CardTitle>
            <CardDescription>Materials issued from workshop inventory to this project.</CardDescription>
          </div>
          <Dialog open={isIssueOpen} onOpenChange={setIssueOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Issue Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>Issue Material</DialogTitle>
                <DialogDescription>Select items from your workshop inventory to use on this project.</DialogDescription>
              </DialogHeader>
              <IssueMaterialForm projectId={project.id} onFinished={handleFinished} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Date Issued</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.length > 0 ? (
                sortedMaterials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {item.materialName}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatCurrency(item.unitCost || 0)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                          {item.isBillable && (
                              <Badge variant="outline" className="border-blue-500 text-blue-500">Billable</Badge>
                          )}
                          {item.invoiced && (
                              <Badge variant="default" className="bg-green-500">Invoiced</Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {new Date(item.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setReturnMaterial(item)} title="Return to Inventory">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No materials issued from inventory yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!returnMaterial} onOpenChange={(open) => !open && setReturnMaterial(null)}>
        {returnMaterial && (
          <ReturnMaterialDialog
            projectId={project.id}
            materialIssue={returnMaterial}
            onFinished={handleFinished}
          />
        )}
      </Dialog>
    </>
  );
}