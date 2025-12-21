import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Invoice, InvoiceStatus, CompanyProfile } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInCents / 100);
};
const getStatusColor = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'Void': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100';
  }
};
export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [invoiceData, profileData] = await Promise.all([
        api<Invoice>(`/api/invoices/${id}`),
        api<CompanyProfile>('/api/company-profile')
      ]);
      setInvoice(invoiceData);
      setCompanyProfile(profileData);
    } catch (err) {
      toast.error('Failed to load invoice details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!id) return;
    try {
      const updatedInvoice = await api<Invoice>(`/api/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setInvoice(updatedInvoice);
      toast.success(`Invoice marked as ${status}.`);
    } catch (err) {
      toast.error('Failed to update invoice status.');
    }
  };
  if (isLoading) {
    return <AppLayout><div className="max-w-4xl mx-auto"><Skeleton className="h-[800px] w-full" /></div></AppLayout>;
  }
  if (!invoice || !companyProfile) {
    return <AppLayout><p>Invoice not found.</p></AppLayout>;
  }
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-muted-foreground">for project: {invoice.projectName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStatusChange('Sent')}>Mark as Sent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Paid')}>Mark as Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Void')} className="text-destructive">Void Invoice</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Card className="p-8 print:shadow-none print:border-none">
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="font-bold text-lg">{companyProfile.companyName}</h2>
                <p className="text-sm text-muted-foreground">{companyProfile.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}</p>
                <p className="text-sm text-muted-foreground">{companyProfile.email}</p>
                <p className="text-sm text-muted-foreground">{companyProfile.phone}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-3xl mb-2">INVOICE</h2>
                <Badge className={cn("text-lg", getStatusColor(invoice.status))}>{invoice.status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold mb-1">Bill To</h3>
                <p className="font-medium">{invoice.clientName}</p>
              </div>
              <div className="text-right">
                <p><span className="font-semibold">Invoice Number:</span> {invoice.invoiceNumber}</p>
                <p><span className="font-semibold">Issue Date:</span> {new Date(invoice.issueDate).toLocaleDateString()}</p>
                <p><span className="font-semibold">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right">Subtotal</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right">Tax</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.tax)}</TableCell>
                </TableRow>
                <TableRow className="font-bold text-lg">
                  <TableCell colSpan={3} className="text-right">Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}