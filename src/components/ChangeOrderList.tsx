import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { ChangeOrder, ChangeOrderStatus } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
const getStatusColor = (status: ChangeOrderStatus) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};
interface ChangeOrderListProps {
  projectId: string;
}
export function ChangeOrderList({ projectId }: ChangeOrderListProps) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchChangeOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<ChangeOrder[]>(`/api/projects/${projectId}/change-orders`);
      setChangeOrders(data);
    } catch (err) {
      toast.error('Failed to load change orders');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchChangeOrders();
  }, [fetchChangeOrders]);
  const handleMarkAsSent = async (id: string) => {
    try {
      await api(`/api/change-orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'Sent' }),
      });
      toast.success('Change order marked as sent');
      fetchChangeOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Orders</CardTitle>
        <CardDescription>Manage change requests and client approvals.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : changeOrders.length > 0 ? (
              changeOrders.map((co) => (
                <TableRow key={co.id}>
                  <TableCell className="font-medium">
                    <div>{co.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{co.description}</div>
                  </TableCell>
                  <TableCell>{new Date(co.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto py-0 px-2">
                          {co.items.length} items <Eye className="ml-1 h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Items</h4>
                          <div className="text-sm text-muted-foreground">
                            {co.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-1 border-b last:border-0">
                                <span>{item.quantity}x {item.description}</span>
                                <span>{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(co.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(co.status)} variant="outline">{co.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {co.status === 'Draft' && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkAsSent(co.id)}>
                        <Send className="mr-2 h-3 w-3" /> Mark Sent
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">No change orders yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}