import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PlusCircle, Loader2, Pencil, Trash2, Check, X } from 'lucide-react';
interface Category {
  id: string;
  name: string;
}
const categorySchema = z.object({
  name: z.string().min(2, { message: 'Category name must be at least 2 characters.' }),
});
type CategoryFormValues = z.infer<typeof categorySchema>;
interface CategoryListProps {
  title: string;
  description: string;
  fetchUrl: string;
  addUrl?: string;
  updateUrl?: string;
  deleteUrl?: string;
}
function CategoryList({ title, description, fetchUrl, addUrl, updateUrl, deleteUrl }: CategoryListProps) {
  const [items, setItems] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api<Category[]>(fetchUrl);
      setItems(data);
    } catch (err) {
      toast.error(`Failed to load ${title.toLowerCase()}.`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl, title]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const onSubmit = async (values: CategoryFormValues) => {
    if (!addUrl) return;
    try {
      await api(addUrl, { method: 'POST', body: JSON.stringify(values) });
      toast.success(`${title.slice(0, -1)} added successfully!`);
      form.reset();
      fetchData();
    } catch (err) {
      toast.error(`Failed to add ${title.slice(0, -1).toLowerCase()}.`);
    }
  };
  const handleDelete = async (id: string) => {
    if (!deleteUrl) return;
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api(`${deleteUrl}/${id}`, { method: 'DELETE' });
      toast.success('Category deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };
  const startEdit = (item: Category) => {
    setEditingId(item.id);
    setEditName(item.name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };
  const saveEdit = async (id: string) => {
    if (!updateUrl || !editName.trim()) return;
    setIsUpdating(true);
    try {
      await api(`${updateUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName }),
      });
      toast.success('Category updated successfully');
      setEditingId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {addUrl && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder={`New ${title.slice(0, -1)} Name`} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                  <span className="ml-2">Add</span>
                </Button>
              </form>
            </Form>
          )}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : items.length > 0 ? (
                  items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {editingId === item.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          item.name
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.id ? (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveEdit(item.id)} disabled={isUpdating}>
                              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit} disabled={isUpdating}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(item)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center h-24">No items found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export function CategoryManager() {
  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <CategoryList
        title="Expense Categories"
        description="Manage categories for logging project expenses."
        fetchUrl="/api/expense-categories"
        addUrl="/api/expense-categories"
        updateUrl="/api/expense-categories"
        deleteUrl="/api/expense-categories"
      />
      <CategoryList
        title="Supplier Categories"
        description="Manage categories for organizing suppliers."
        fetchUrl="/api/supplier-categories"
        addUrl="/api/supplier-categories"
        updateUrl="/api/supplier-categories"
        deleteUrl="/api/supplier-categories"
      />
      <CategoryList
        title="Construction Stages"
        description="Manage the different stages of a construction project."
        fetchUrl="/api/construction-stages"
        addUrl="/api/construction-stages"
        updateUrl="/api/construction-stages"
        deleteUrl="/api/construction-stages"
      />
    </div>
  );
}