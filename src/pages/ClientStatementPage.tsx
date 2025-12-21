import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { ClientStatement, CompanyProfile } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Printer, Calendar as CalendarIcon, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amountInCents / 100);
};
const StatCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType; }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);
export function ClientStatementPage() {
  const { id } = useParams<{ id: string }>();
  const [statement, setStatement] = useState<ClientStatement | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 90),
    to: new Date(),
  });
  const fetchData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (date?.from) query.append('startDate', date.from.toISOString());
      if (date?.to) query.append('endDate', date.to.toISOString());
      const [statementData, profileData] = await Promise.all([
        api<ClientStatement>(`/api/clients/${id}/statement?${query.toString()}`),
        api<CompanyProfile>('/api/company-profile')
      ]);
      setStatement(statementData);
      setCompanyProfile(profileData);
    } catch (err) {
      toast.error('Failed to load client statement.');
    } finally {
      setIsLoading(false);
    }
  }, [id, date]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  if (isLoading) {
    return <AppLayout><div className="max-w-5xl mx-auto"><Skeleton className="h-[800px] w-full" /></div></AppLayout>;
  }
  if (!statement || !companyProfile) {
    return <AppLayout><p>Client statement not found.</p></AppLayout>;
  }
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-bold">Client Statement</h1>
            <p className="text-muted-foreground">for {statement.client.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (date.to ? <>{format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}</> : format(date.from, "LLL dd, y")) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </div>
        </div>
        <Card className="p-8 print:shadow-none print:border-none">
          <CardContent className="p-0">
            <header className="grid grid-cols-2 gap-8 mb-12">
              <div>
                <h2 className="font-bold text-lg">{companyProfile.companyName}</h2>
                <p className="text-sm text-muted-foreground">{companyProfile.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br /></span>)}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-3xl mb-2">STATEMENT</h2>
                <p className="text-sm text-muted-foreground">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </header>
            <div className="mb-8">
              <h3 className="font-semibold mb-1">Statement For</h3>
              <p className="font-medium">{statement.client.name}</p>
              <p className="text-sm text-muted-foreground">{statement.client.email}</p>
              <p className="text-sm text-muted-foreground">{statement.client.phone}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <StatCard title="Total Deposits" value={formatCurrency(statement.summary.totalDeposits)} icon={TrendingUp} />
              <StatCard title="Total Expenses" value={formatCurrency(statement.summary.totalExpenses)} icon={TrendingDown} />
              <StatCard title="Account Balance" value={formatCurrency(statement.summary.balance)} icon={Wallet} />
            </div>
            <h3 className="text-lg font-semibold mb-4">Transactions</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Deposits</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.transactions.map((tx, i) => (
                    <TableRow key={i}>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell>{tx.project}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell className="text-right text-green-600">{tx.type === 'Deposit' ? formatCurrency(tx.amount) : ''}</TableCell>
                      <TableCell className="text-right text-red-600">{tx.type === 'Expense' ? formatCurrency(tx.amount) : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(statement.summary.totalDeposits)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(statement.summary.totalExpenses)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}