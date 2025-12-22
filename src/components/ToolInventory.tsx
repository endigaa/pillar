import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, ArrowRightLeft, Pencil, Image as ImageIcon, Trash2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Tool } from '@shared/types';
import { AddToolForm } from './AddToolForm';
import { EditToolForm } from './EditToolForm';
import { MoveToolDialog } from './MoveToolDialog';
import { Toaster, toast } from '@/components/ui/sonner';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/DataTablePagination';
export function ToolInventory() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewToolOpen, setNewToolOpen] = useState(false);
  const [moveTool, setMoveTool] = useState<Tool | null>(null);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const fetchTools = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<Tool[]>('/api/tools');
      setTools(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch tools');
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);
  const {
    currentData: currentTools,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage
  } = usePagination(tools, 10);
  const handleCreateTool = async (values: Omit<Tool, 'id'>) => {
    try {
      await api('/api/tools', {
        method: 'POST',
        body: JSON.stringify(values),
      });
      toast.success('Tool added successfully!');
      fetchTools();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add tool.');
    }
  };
  const handleDeleteTool = async (toolId: string) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    try {
      await api(`/api/tools/${toolId}`, { method: 'DELETE' });
      toast.success('Tool deleted successfully');
      fetchTools();
    } catch (err) {
      toast.error('Failed to delete tool');
    }
  };
  const handleMoveFinished = () => {
      setMoveTool(null);
      fetchTools();
  };
  const handleEditFinished = () => {
      setEditTool(null);
      fetchTools();
  };
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tool Inventory</CardTitle>
            <CardDescription>A list of all your tools and equipment.</CardDescription>
          </div>
          <Dialog open={isNewToolOpen} onOpenChange={setNewToolOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Tool</DialogTitle>
                <DialogDescription>Enter the details of the new tool to add it to your inventory.</DialogDescription>
              </DialogHeader>
              <AddToolForm onSubmit={handleCreateTool} onFinished={() => setNewToolOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : currentTools.length > 0 ? (
                currentTools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                        {tool.imageUrl ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <img src={tool.imageUrl} alt={tool.name} className="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80" />
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden">
                                    <img src={tool.imageUrl} alt={tool.name} className="w-full h-auto" />
                                </PopoverContent>
                            </Popover>
                        ) : (
                            <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="font-medium">
                        {tool.name}
                        {tool.properties && tool.properties.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                                {tool.properties.length} properties
                            </div>
                        )}
                    </TableCell>
                    <TableCell>{tool.category}</TableCell>
                    <TableCell>
                      {tool.locationType === 'Other' ? 'Other' : (tool.locationName || 'Unassigned')}
                      {tool.locationType && <span className="text-xs text-muted-foreground ml-1">({tool.locationType})</span>}
                    </TableCell>
                    <TableCell>{new Date(tool.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={tool.status === 'Available' ? 'default' : 'secondary'}>{tool.status}</Badge></TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditTool(tool)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setMoveTool(tool)}>
                                <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTool(tool.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No tools found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <DataTablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            onNext={nextPage}
            onPrevious={prevPage}
          />
        </CardContent>
      </Card>
      <Dialog open={!!moveTool} onOpenChange={(open) => !open && setMoveTool(null)}>
          {moveTool && <MoveToolDialog tool={moveTool} onFinished={handleMoveFinished} />}
      </Dialog>
      <Dialog open={!!editTool} onOpenChange={(open) => !open && setEditTool(null)}>
          <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                  <DialogTitle>Edit Tool</DialogTitle>
                  <DialogDescription>Update tool details and properties.</DialogDescription>
              </DialogHeader>
              {editTool && <EditToolForm initialValues={editTool} onFinished={handleEditFinished} />}
          </DialogContent>
      </Dialog>
      <Toaster richColors />
    </>
  );
}