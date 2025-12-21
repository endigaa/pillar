import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, CheckCircle, XCircle, Eye, FilePlus } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { Quote, QuoteStatus } from '@shared/types';
import { AddQuoteForm } from './AddQuoteForm';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
interface QuoteComparisonProps {
  projectId: string;
  onConvertQuote?: (quote: Quote) => Promise<void>;
}
export function QuoteComparison({ projectId, onConvertQuote }: QuoteComparisonProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddQuoteOpen, setAddQuoteOpen] = useState(false);
  const fetchQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api<Quote[]>(`/api/projects/${projectId}/quotes`);
      setQuotes(data);
    } catch (err) {
      toast.error('Failed to load quotes');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);
  const handleUpdateStatus = async (quoteId: string, status: QuoteStatus) => {
    try {
      await api(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Quote marked as ${status}`);
      fetchQuotes();
    } catch (err) {
      toast.error('Failed to update quote status');
    }
  };
  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Supplier Quotes</CardTitle>
          <CardDescription>Compare and manage quotes from different suppliers.</CardDescription>
        </div>
        <Dialog open={isAddQuoteOpen} onOpenChange={setAddQuoteOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Quote</DialogTitle>
              <DialogDescription>Enter details from a supplier quote.</DialogDescription>
            </DialogHeader>
            <AddQuoteForm projectId={projectId} onFinished={() => { setAddQuoteOpen(false); fetchQuotes(); }} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
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
            ) : quotes.length > 0 ? (
              quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium">{quote.supplierName}</TableCell>
                  <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-auto py-0 px-2">
                          {quote.items.length} items <Eye className="ml-1 h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Quote Items</h4>
                          <div className="text-sm text-muted-foreground">
                            {quote.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between py-1 border-b last:border-0">
                                <span>{item.quantity}x {item.description}</span>
                                <span>{formatCurrency(item.total)}</span>
                              </div>
                            ))}
                          </div>
                          {quote.notes && (
                            <div className="pt-2 border-t mt-2">
                              <span className="text-xs font-semibold">Notes:</span>
                              <p className="text-xs text-muted-foreground">{quote.notes}</p>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(quote.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(quote.status)} variant="outline">{quote.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {quote.status === 'Pending' && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(quote.id, 'Approved')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approve Quote</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(quote.id, 'Rejected')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reject Quote</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}
                      {quote.status === 'Approved' && onConvertQuote && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onConvertQuote(quote)}>
                                <FilePlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Convert to Expense</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">No quotes added yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}