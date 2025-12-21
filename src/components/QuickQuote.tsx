import { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api-client';
import type { Supplier, Material, ChangeOrder } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
interface QuoteItem {
  material: Material;
  quantity: number;
}
interface QuickQuoteProps {
  projectId?: string;
  onFinished?: () => void;
}
export function QuickQuote({ projectId, onFinished }: QuickQuoteProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setIsLoading(true);
        const data = await api<Supplier[]>('/api/suppliers');
        setSuppliers(data);
      } catch (error) {
        console.error("Failed to fetch suppliers", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);
  const allMaterials = useMemo(() => {
    return suppliers.flatMap(supplier =>
      supplier.materials.map(material => ({ ...material, supplierName: supplier.name }))
    );
  }, [suppliers]);
  const handleSelectMaterial = (material: Material) => {
    if (!quoteItems.some(item => item.material.id === material.id)) {
      setQuoteItems([...quoteItems, { material, quantity: 1 }]);
    }
    setOpen(false);
  };
  const updateQuantity = (materialId: string, quantity: number) => {
    setQuoteItems(
      quoteItems.map(item =>
        item.material.id === materialId ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  };
  const removeItem = (materialId: string) => {
    setQuoteItems(quoteItems.filter(item => item.material.id !== materialId));
  };
  const subtotal = useMemo(() => {
    return quoteItems.reduce((acc, item) => acc + item.material.price * item.quantity, 0);
  }, [quoteItems]);
  const handleSaveChangeOrder = async () => {
    if (!projectId) return;
    if (!title.trim()) {
      toast.error('Please enter a title for the change order.');
      return;
    }
    if (quoteItems.length === 0) {
      toast.error('Please add at least one item.');
      return;
    }
    setIsSaving(true);
    try {
      const changeOrderData = {
        projectId,
        title,
        description,
        totalAmount: subtotal,
        items: quoteItems.map(item => ({
          description: item.material.name,
          quantity: item.quantity,
          unitPrice: item.material.price,
          total: item.material.price * item.quantity,
          materialId: item.material.id,
        })),
      };
      await api('/api/change-orders', {
        method: 'POST',
        body: JSON.stringify(changeOrderData),
      });
      toast.success('Change Order created successfully!');
      if (onFinished) onFinished();
    } catch (err) {
      toast.error('Failed to create change order.');
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {projectId && (
        <div className="space-y-4 border-b pb-4">
          <div className="space-y-2">
            <Label htmlFor="title">Change Order Title</Label>
            <Input
              id="title"
              placeholder="e.g., Additional Electrical Outlets"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the reason for this change..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            Add a material to the quote...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[450px] p-0">
          <Command>
            <CommandInput placeholder="Search material..." />
            <CommandList>
              <CommandEmpty>No material found.</CommandEmpty>
              <CommandGroup>
                {allMaterials.map(material => (
                  <CommandItem
                    key={material.id}
                    value={material.name}
                    onSelect={() => handleSelectMaterial(material)}
                  >
                    {material.name} <span className="text-xs text-muted-foreground ml-2">({material.supplierName})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead className="w-[100px]">Unit Price</TableHead>
              <TableHead className="w-[100px]">Quantity</TableHead>
              <TableHead className="text-right w-[120px]">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quoteItems.length > 0 ? (
              quoteItems.map(item => (
                <TableRow key={item.material.id}>
                  <TableCell className="font-medium">{item.material.name}</TableCell>
                  <TableCell>{formatCurrency(item.material.price)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.material.id, parseInt(e.target.value, 10) || 0)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.material.price * item.quantity)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.material.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No materials added to the quote yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-bold text-lg">Grand Total</TableCell>
              <TableCell className="text-right font-bold text-lg">{formatCurrency(subtotal)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      {projectId && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChangeOrder} disabled={isSaving || quoteItems.length === 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save as Change Order
          </Button>
        </div>
      )}
    </div>
  );
}