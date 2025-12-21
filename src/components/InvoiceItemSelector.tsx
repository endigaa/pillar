import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import type { Project, Expense, Supplier, Material, ChangeOrder, Invoice, WorksiteMaterialIssue } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { ScrollArea } from './ui/scroll-area';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInCents / 100);
};
interface InvoiceItemSelectorProps {
  project: Project;
  invoices: Invoice[];
  onAddItems: (items: (Expense | Material | ChangeOrder | WorksiteMaterialIssue)[], type: 'expense' | 'material' | 'change_order' | 'inventory_issue') => void;
}
export function InvoiceItemSelector({ project, invoices, onAddItems }: InvoiceItemSelectorProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExpenses, setSelectedExpenses] = useState<Record<string, Expense>>({});
  const [selectedMaterials, setSelectedMaterials] = useState<Record<string, Material>>({});
  const [selectedChangeOrders, setSelectedChangeOrders] = useState<Record<string, ChangeOrder>>({});
  const [selectedInventoryIssues, setSelectedInventoryIssues] = useState<Record<string, WorksiteMaterialIssue>>({});
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [suppliersData, changeOrdersData] = await Promise.all([
          api<Supplier[]>('/api/suppliers'),
          api<ChangeOrder[]>(`/api/projects/${project.id}/change-orders`)
        ]);
        setSuppliers(suppliersData);
        setChangeOrders(changeOrdersData);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [project.id]);
  // Safely handle undefined project.expenses
  const unbilledExpenses = useMemo(() => (project.expenses || []).filter(e => !e.invoiced), [project.expenses]);
  // Safely handle undefined materials in suppliers
  const allMaterials = useMemo(() => suppliers.flatMap(s => s.materials || []), [suppliers]);
  // Filter unbilled change orders
  const unbilledChangeOrders = useMemo(() => {
    const invoicedChangeOrderIds = new Set<string>();
    invoices.forEach(inv => {
      inv.lineItems.forEach(item => {
        if (item.sourceType === 'change_order' && item.sourceId) {
          invoicedChangeOrderIds.add(item.sourceId);
        }
      });
    });
    return changeOrders.filter(co => co.status === 'Approved' && !invoicedChangeOrderIds.has(co.id));
  }, [changeOrders, invoices]);
  // Filter unbilled inventory issues
  const unbilledInventoryIssues = useMemo(() => {
    return (project.worksiteMaterials || []).filter(m => m.isBillable && !m.invoiced);
  }, [project.worksiteMaterials]);
  const handleSelectExpense = (expense: Expense, checked: boolean) => {
    setSelectedExpenses(prev => {
      const newSelection = { ...prev };
      if (checked) {
        newSelection[expense.id] = expense;
      } else {
        delete newSelection[expense.id];
      }
      return newSelection;
    });
  };
  const handleSelectMaterial = (material: Material, checked: boolean) => {
    setSelectedMaterials(prev => {
      const newSelection = { ...prev };
      if (checked) {
        newSelection[material.id] = material;
      } else {
        delete newSelection[material.id];
      }
      return newSelection;
    });
  };
  const handleSelectChangeOrder = (co: ChangeOrder, checked: boolean) => {
    setSelectedChangeOrders(prev => {
      const newSelection = { ...prev };
      if (checked) {
        newSelection[co.id] = co;
      } else {
        delete newSelection[co.id];
      }
      return newSelection;
    });
  };
  const handleSelectInventoryIssue = (issue: WorksiteMaterialIssue, checked: boolean) => {
    setSelectedInventoryIssues(prev => {
        const newSelection = { ...prev };
        if (checked) {
            newSelection[issue.id] = issue;
        } else {
            delete newSelection[issue.id];
        }
        return newSelection;
    });
  };
  const handleAddSelected = (type: 'expense' | 'material' | 'change_order' | 'inventory_issue') => {
    if (type === 'expense') {
      onAddItems(Object.values(selectedExpenses), 'expense');
      setSelectedExpenses({});
    } else if (type === 'material') {
      onAddItems(Object.values(selectedMaterials), 'material');
      setSelectedMaterials({});
    } else if (type === 'change_order') {
      onAddItems(Object.values(selectedChangeOrders), 'change_order');
      setSelectedChangeOrders({});
    } else {
      onAddItems(Object.values(selectedInventoryIssues), 'inventory_issue');
      setSelectedInventoryIssues({});
    }
  };
  return (
    <Tabs defaultValue="expenses" className="mt-4">
      <TabsList>
        <TabsTrigger value="expenses">Project Expenses</TabsTrigger>
        <TabsTrigger value="materials">Supplier Materials</TabsTrigger>
        <TabsTrigger value="change_orders">Change Orders</TabsTrigger>
        <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unbilledExpenses.length > 0 ? (
                unbilledExpenses.map(expense => (
                  <TableRow key={expense.id}>
                    <TableCell><Checkbox onCheckedChange={(checked) => handleSelectExpense(expense, !!checked)} /></TableCell>
                    <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No unbilled expenses found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleAddSelected('expense')} disabled={Object.keys(selectedExpenses).length === 0}>
            Add {Object.keys(selectedExpenses).length} Selected Expenses
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="materials">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
              ) : allMaterials.length > 0 ? (
                allMaterials.map(material => (
                  <TableRow key={material.id}>
                    <TableCell><Checkbox onCheckedChange={(checked) => handleSelectMaterial(material, !!checked)} /></TableCell>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(material.price)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No materials found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleAddSelected('material')} disabled={Object.keys(selectedMaterials).length === 0}>
            Add {Object.keys(selectedMaterials).length} Selected Materials
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="change_orders">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
              ) : unbilledChangeOrders.length > 0 ? (
                unbilledChangeOrders.map(co => (
                  <TableRow key={co.id}>
                    <TableCell><Checkbox onCheckedChange={(checked) => handleSelectChangeOrder(co, !!checked)} /></TableCell>
                    <TableCell>{co.title}</TableCell>
                    <TableCell>{new Date(co.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(co.totalAmount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No unbilled approved change orders found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleAddSelected('change_order')} disabled={Object.keys(selectedChangeOrders).length === 0}>
            Add {Object.keys(selectedChangeOrders).length} Selected Change Orders
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="inventory">
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unbilledInventoryIssues.length > 0 ? (
                unbilledInventoryIssues.map(issue => (
                  <TableRow key={issue.id}>
                    <TableCell><Checkbox onCheckedChange={(checked) => handleSelectInventoryIssue(issue, !!checked)} /></TableCell>
                    <TableCell>{issue.materialName}</TableCell>
                    <TableCell>{issue.quantity} {issue.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(issue.unitCost || 0)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">No billable inventory items found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button onClick={() => handleAddSelected('inventory_issue')} disabled={Object.keys(selectedInventoryIssues).length === 0}>
            Add {Object.keys(selectedInventoryIssues).length} Selected Inventory Items
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}