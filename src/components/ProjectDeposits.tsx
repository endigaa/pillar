import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';
import { AddDepositForm } from './AddDepositForm';
import type { Deposit } from '@shared/types';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
interface ProjectDepositsProps {
  deposits: Deposit[];
  onAddDeposit: (values: Omit<Deposit, 'id'>) => Promise<void>;
}
export function ProjectDeposits({ deposits = [], onAddDeposit }: ProjectDepositsProps) {
  const [isAddDepositOpen, setAddDepositOpen] = useState(false);
  // Safe copy for sorting
  const sortedDeposits = [...deposits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Client Deposits</CardTitle>
          <CardDescription>Record of payments received from the client.</CardDescription>
        </div>
        <Dialog open={isAddDepositOpen} onOpenChange={setAddDepositOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add New Deposit</DialogTitle>
              <DialogDescription>Enter the amount and date for the new deposit.</DialogDescription>
            </DialogHeader>
            <AddDepositForm onSubmit={onAddDeposit} onFinished={() => setAddDepositOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDeposits.length > 0 ? (
              sortedDeposits.map((deposit) => (
                <TableRow key={deposit.id}>
                  <TableCell>{new Date(deposit.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-muted-foreground">{deposit.reference || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(deposit.amount)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">No deposits logged yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}