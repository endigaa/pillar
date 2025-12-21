import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Project, GeneralExpense, WorkshopMaterial } from '@shared/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Upload, Download, PlusCircle, CalendarIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TransactionImporter } from '@/components/TransactionImporter';
import { AddGeneralExpenseForm } from '@/components/AddGeneralExpenseForm';
import { exportToCsv, cn, getFinancialYearRange } from '@/lib/utils';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { useCurrency } from '@/hooks/useCurrency';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string; value: string; icon: React.ElementType; isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-3/4" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);
export function FinancialsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
  const [workshopMaterials, setWorkshopMaterials] = useState<WorkshopMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isAddGeneralExpenseOpen, setAddGeneralExpenseOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { profile, fetchProfile } = useCompanyProfile();
  const [hasInitializedDateRange, setHasInitializedDateRange] = useState(false);
  const { formatCurrency } = useCurrency();
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  useEffect(() => {
    if (profile && !hasInitializedDateRange) {
      const { start, end } = getFinancialYearRange(profile.financialYearStartMonth, profile.financialYearStartDay);
      setDateRange({ from: start, to: end });
      setHasInitializedDateRange(true);
    } else if (!profile && !hasInitializedDateRange && !isLoading) {
      // Fallback if profile fails or takes too long, though fetchProfile handles loading state
      const { start, end } = getFinancialYearRange();
      setDateRange({ from: start, to: end });
      setHasInitializedDateRange(true);
    }
  }, [profile, hasInitializedDateRange, isLoading]);
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [projectData, generalExpenseData, materialData] = await Promise.all([
        api<Project[]>('/api/projects'),
        api<GeneralExpense[]>('/api/general-expenses'),
        api<WorkshopMaterial[]>('/api/workshop-materials'),
      ]);
      setProjects(projectData);
      setGeneralExpenses(generalExpenseData);
      setWorkshopMaterials(materialData);
    } catch (err) {
      toast.error("Failed to load financial data.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const handleImportSuccess = () => {
    setImportOpen(false);
    fetchData(); // Refresh data after successful import
  };
  const handleAddGeneralExpense = async (values: Omit<GeneralExpense, 'id'>) => {
    try {
      await api('/api/general-expenses', { method: 'POST', body: JSON.stringify(values) });
      toast.success('General expense added successfully!');
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense.');
    }
  };
  // Filter data based on date range
  const filteredProjects = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return projects;
    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);
    return projects.map(p => ({
      ...p,
      expenses: p.expenses.filter(e => isWithinInterval(new Date(e.date), { start, end })),
      deposits: p.deposits.filter(d => isWithinInterval(new Date(d.date), { start, end })),
    }));
  }, [projects, dateRange]);
  const filteredGeneralExpenses = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return generalExpenses;
    const start = startOfDay(dateRange.from);
    const end = endOfDay(dateRange.to);
    return generalExpenses.filter(e => isWithinInterval(new Date(e.date), { start, end }));
  }, [generalExpenses, dateRange]);
  const allProjectExpenses = filteredProjects.flatMap(p => p.expenses);
  const totalCollected = filteredProjects.flatMap(p => p.deposits).reduce((sum, d) => sum + d.amount, 0);
  const totalProjectExpenses = allProjectExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalGeneralExpenses = filteredGeneralExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalProjectExpenses + totalGeneralExpenses;
  const netProfit = totalCollected - totalExpenses; // Cash basis P&L for the period
  const expenseByCategory = [...allProjectExpenses, ...filteredGeneralExpenses].reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const sortedExpenseCategories = Object.entries(expenseByCategory).sort(([, a], [, b]) => b - a);
  const pieChartData = sortedExpenseCategories.map(([name, value]) => ({
    name,
    value: value / 100,
  }));
  const barChartData = filteredProjects.map(project => {
      const expenses = project.expenses.reduce((sum, e) => sum + e.amount, 0);
      const revenue = project.deposits.reduce((sum, d) => sum + d.amount, 0); // Use collected for period
      if (expenses === 0 && revenue === 0) return null;
      return {
          name: project.name.split(' ').slice(0, 2).join(' '),
          Revenue: revenue / 100,
          Expenses: expenses / 100,
      }
  }).filter(Boolean);
  // Simplified Balance Sheet data
  const bsProjects = projects; // Use all projects for cumulative BS
  const bsDate = dateRange?.to || new Date();
  const bsExpenses = bsProjects.flatMap(p => p.expenses).filter(e => new Date(e.date) <= bsDate);
  const bsDeposits = bsProjects.flatMap(p => p.deposits).filter(d => new Date(d.date) <= bsDate);
  const bsGeneralExpenses = generalExpenses.filter(e => new Date(e.date) <= bsDate);
  const totalBsExpenses = bsExpenses.reduce((sum, e) => sum + e.amount, 0) + bsGeneralExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBsDeposits = bsDeposits.reduce((sum, d) => sum + d.amount, 0);
  const totalBsRevenue = bsProjects.reduce((sum, p) => sum + p.budget, 0); // Total contract value
  const cash = totalBsDeposits - totalBsExpenses;
  const accountsReceivable = totalBsRevenue - totalBsDeposits; // Rough estimate
  // Inventory Value Calculation
  const totalInventoryValue = workshopMaterials.reduce((sum, m) => sum + (m.quantity * (m.costPerUnit || 0)), 0);
  const totalAssets = cash + accountsReceivable + totalInventoryValue;
  const totalLiabilities = 0;
  const equity = totalAssets - totalLiabilities;
  const ledgerItems = useMemo(() => {
    const items: { date: string; project: string; description: string; type: 'Income' | 'Expense'; amount: number }[] = [];
    filteredProjects.forEach(project => {
      project.deposits.forEach(deposit => {
        let description = 'Client Deposit';
        if (deposit.reference) {
          description += ` (Ref: ${deposit.reference})`;
        }
        items.push({
          date: deposit.date,
          project: project.name,
          description,
          type: 'Income',
          amount: deposit.amount,
        });
      });
      project.expenses.forEach(expense => {
        items.push({
          date: expense.date,
          project: project.name,
          description: expense.description,
          type: 'Expense',
          amount: expense.amount,
        });
      });
    });
    filteredGeneralExpenses.forEach(expense => {
        items.push({
            date: expense.date,
            project: 'General',
            description: expense.description,
            type: 'Expense',
            amount: expense.amount,
        });
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredProjects, filteredGeneralExpenses]);
  const handleExport = async (type: 'ledger' | 'pnl' | 'balance-sheet') => {
    try {
      if (type === 'ledger') {
        const formattedData = ledgerItems.map(item => ({
          Date: new Date(item.date).toLocaleDateString(),
          Project: item.project,
          Description: item.description,
          Type: item.type,
          Amount: (item.amount / 100).toFixed(2),
        }));
        exportToCsv('ledger.csv', formattedData);
      } else if (type === 'pnl') {
        const formattedData = [
          { Item: 'INCOME', Amount: '' },
          { Item: 'Project Deposits (Revenue)', Amount: (totalCollected / 100).toFixed(2) },
          { Item: 'Total Income', Amount: (totalCollected / 100).toFixed(2) },
          { Item: '', Amount: '' },
          { Item: 'EXPENSES', Amount: '' },
          ...sortedExpenseCategories.map(([cat, amount]) => ({
            Item: cat,
            Amount: (amount / 100).toFixed(2)
          })),
          { Item: 'Total Expenses', Amount: (totalExpenses / 100).toFixed(2) },
          { Item: '', Amount: '' },
          { Item: 'Net Profit / (Loss)', Amount: (netProfit / 100).toFixed(2) },
        ];
        exportToCsv('profit_and_loss.csv', formattedData);
      } else if (type === 'balance-sheet') {
        const formattedData = [
          { Category: 'Assets', Item: 'Cash', Amount: (cash / 100).toFixed(2) },
          { Category: 'Assets', Item: 'Accounts Receivable', Amount: (accountsReceivable / 100).toFixed(2) },
          { Category: 'Assets', Item: 'Inventory Assets', Amount: (totalInventoryValue / 100).toFixed(2) },
          { Category: 'Assets', Item: 'Total Assets', Amount: (totalAssets / 100).toFixed(2) },
          { Category: 'Liabilities & Equity', Item: 'Total Liabilities', Amount: (totalLiabilities / 100).toFixed(2) },
          { Category: 'Liabilities & Equity', Item: "Owner's Equity", Amount: (equity / 100).toFixed(2) },
        ];
        exportToCsv('balance_sheet.csv', formattedData);
      }
      toast.success('Data exported successfully!');
    } catch (err) {
      toast.error('Failed to export data.');
    }
  };
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Financials</h1>
            <p className="text-muted-foreground">An overview of your business's financial health.</p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</> : format(dateRange.from, "LLL dd, y")) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="general_expenses">General Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-8 mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <StatCard title="Collected Revenue" value={formatCurrency(totalCollected)} icon={TrendingUp} isLoading={isLoading} />
              <StatCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} isLoading={isLoading} />
              <StatCard title="Net Profit (Cash)" value={formatCurrency(netProfit)} icon={DollarSign} isLoading={isLoading} />
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Financials (Period)</CardTitle>
                  <CardDescription>Revenue vs Expenses for selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> :
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value/1000)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend />
                      <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    }
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    {isLoading ? <Skeleton className="h-full w-full" /> :
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Legend />
                    </PieChart>
                    }
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Profit & Loss (Cash Basis)</CardTitle>
                            <CardDescription>For the selected period.</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Export</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('pnl')}><Download className="mr-2 h-4 w-4" />Download as CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {/* Income Section */}
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={2} className="font-semibold">Income</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="pl-6">Project Deposits (Revenue)</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totalCollected)}</TableCell>
                                </TableRow>
                                <TableRow className="border-t-2 border-border">
                                    <TableCell className="font-bold">Total Income</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(totalCollected)}</TableCell>
                                </TableRow>
                                {/* Spacer */}
                                <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>
                                {/* Expenses Section */}
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={2} className="font-semibold">Expenses</TableCell>
                                </TableRow>
                                {sortedExpenseCategories.map(([category, amount]) => (
                                    <TableRow key={category}>
                                        <TableCell className="pl-6">{category}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="border-t-2 border-border">
                                    <TableCell className="font-bold">Total Expenses</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(totalExpenses)}</TableCell>
                                </TableRow>
                                {/* Spacer */}
                                <TableRow><TableCell colSpan={2} className="h-4"></TableCell></TableRow>
                                {/* Net Profit Section */}
                                <TableRow className="border-t-4 border-double border-border">
                                    <TableCell className="font-bold text-lg">Net Profit / (Loss)</TableCell>
                                    <TableCell className={cn("text-right font-bold text-lg", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
                                        {formatCurrency(netProfit)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Balance Sheet</CardTitle>
                            <CardDescription>Cumulative as of {dateRange?.to ? format(dateRange.to, 'PP') : 'Today'}.</CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Export</Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleExport('balance-sheet')}><Download className="mr-2 h-4 w-4" />Download as CSV</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow><TableCell className="font-semibold" colSpan={2}>Assets</TableCell></TableRow>
                                <TableRow><TableCell className="pl-6">Cash</TableCell><TableCell className="text-right">{formatCurrency(cash)}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-6">Accounts Receivable</TableCell><TableCell className="text-right">{formatCurrency(accountsReceivable)}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-6">Inventory Assets</TableCell><TableCell className="text-right">{formatCurrency(totalInventoryValue)}</TableCell></TableRow>
                                <TableRow className="font-bold"><TableCell>Total Assets</TableCell><TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell></TableRow>
                                <TableRow><TableCell className="font-semibold" colSpan={2}>Liabilities & Equity</TableCell></TableRow>
                                <TableRow><TableCell className="pl-6">Total Liabilities</TableCell><TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell></TableRow>
                                <TableRow><TableCell className="pl-6">Owner's Equity</TableCell><TableCell className="text-right">{formatCurrency(equity)}</TableCell></TableRow>
                                <TableRow className="font-bold"><TableCell>Total Liabilities & Equity</TableCell><TableCell className="text-right">{formatCurrency(totalLiabilities + equity)}</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          </TabsContent>
          <TabsContent value="ledger" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>General Ledger</CardTitle>
                  <CardDescription>Transactions for the selected period.</CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Import Transactions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Import Transactions from CSV</DialogTitle>
                          <DialogDescription>Upload a CSV file with columns: date, projectName, description, amount, type (Expense/Deposit).</DialogDescription>
                        </DialogHeader>
                        <TransactionImporter onImportSuccess={handleImportSuccess} />
                      </DialogContent>
                    </Dialog>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline">Export</Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExport('ledger')}><Download className="mr-2 h-4 w-4" />Download as CSV</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : ledgerItems.length > 0 ? (
                      ledgerItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{item.project}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>
                            <Badge variant={item.type === 'Income' ? 'default' : 'secondary'}>{item.type}</Badge>
                          </TableCell>
                          <TableCell className={`text-right font-mono ${item.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'Income' ? '+' : '-'}{formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          No transactions found for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="general_expenses" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>General Business Expenses</CardTitle>
                  <CardDescription>Costs not associated with a specific project.</CardDescription>
                </div>
                <Dialog open={isAddGeneralExpenseOpen} onOpenChange={setAddGeneralExpenseOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add General Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                      <DialogTitle>Add General Expense</DialogTitle>
                      <DialogDescription>Log a new business cost not tied to a project.</DialogDescription>
                    </DialogHeader>
                    <AddGeneralExpenseForm onSubmit={handleAddGeneralExpense} onFinished={() => setAddGeneralExpenseOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredGeneralExpenses.length > 0 ? (
                      filteredGeneralExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{expense.description}</TableCell>
                          <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">
                          No general expenses found for this period.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}