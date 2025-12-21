import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Project, Expense, WorksiteMaterialIssue } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
interface MaterialItem {
  id: string;
  type: 'expense' | 'issue';
  name: string;
  totalQuantity: number;
  unit: string;
  unitCost: number; // in cents
  unusedQuantity: number;
  imageUrl?: string;
}
export function UnusedMaterialsReport() {
  const { id: projectId } = useParams<{ id: string }>();
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const project = await api<Project>(`/api/projects/${projectId}`);
      const materialExpenses = (project.expenses || [])
        .filter(e => e.category === 'Materials' && e.quantity && e.quantity > 0)
        .map(e => ({
          id: e.id,
          type: 'expense' as const,
          name: e.description,
          totalQuantity: e.quantity || 0,
          unit: e.unit || 'units',
          unitCost: Math.round(e.amount / (e.quantity || 1)),
          unusedQuantity: e.unusedQuantity || 0,
          imageUrl: undefined // Expenses don't have images in current schema
        }));
      const issuedMaterials = (project.worksiteMaterials || []).map(m => ({
        id: m.id,
        type: 'issue' as const,
        name: m.materialName,
        totalQuantity: m.quantity,
        unit: m.unit,
        unitCost: m.unitCost || 0,
        unusedQuantity: m.unusedQuantity || 0,
        imageUrl: m.imageUrl
      }));
      setItems([...materialExpenses, ...issuedMaterials]);
    } catch (err) {
      toast.error('Failed to load material data');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);
  const handleSave = async (item: MaterialItem) => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      if (item.type === 'expense') {
        await api(`/api/projects/${projectId}/expenses/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ unusedQuantity: editValue }),
        });
      } else {
        await api(`/api/projects/${projectId}/worksite-materials/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ unusedQuantity: editValue }),
        });
      }
      toast.success('Updated unused quantity');
      setEditingId(null);
      fetchProjectData();
    } catch (err) {
      toast.error('Failed to update quantity');
    } finally {
      setIsSaving(false);
    }
  };
  const totalUnusedValue = items.reduce((sum, item) => sum + (item.unusedQuantity * item.unitCost), 0);
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Usage Report</CardTitle>
        <CardDescription>Track unused materials to report back to the client.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Unused Qty</TableHead>
              <TableHead className="text-right">Unused Value</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? (
              items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80 border"
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0 overflow-hidden border-none shadow-xl">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-auto" />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="h-8 w-8 bg-muted rounded flex items-center justify-center border">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.totalQuantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        className="w-24 h-8"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        min={0}
                        max={item.totalQuantity}
                      />
                    ) : (
                      <span className={item.unusedQuantity > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}>
                        {item.unusedQuantity}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.unusedQuantity * item.unitCost)}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleSave(item)} disabled={isSaving}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={isSaving}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => { setEditingId(item.id); setEditValue(item.unusedQuantity); }}>
                        Update
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No trackable materials found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6} className="text-right font-bold">Total Unused Value</TableCell>
              <TableCell className="text-right font-bold text-orange-600">{formatCurrency(totalUnusedValue)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}