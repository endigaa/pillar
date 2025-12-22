import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import type { Project, Invoice, ChangeOrder } from '@shared/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, CheckCircle2, Clock, DollarSign, TrendingUp, Activity, FileSignature, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { calculateProjectFinancials, calculateTotalExpense } from '@/lib/utils';
// Helper for currency formatting
const formatCurrency = (amountInCents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountInCents / 100);
};
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
interface ProjectAnalyticsProps {
  project: Project;
  invoices: Invoice[];
}
export function ProjectAnalytics({ project, invoices }: ProjectAnalyticsProps) {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchChangeOrders = async () => {
      if (!project.id) return;
      try {
        setIsLoading(true);
        const data = await api<ChangeOrder[]>(`/api/projects/${project.id}/change-orders`);
        setChangeOrders(data);
      } catch (error) {
        console.error('Failed to fetch change orders', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChangeOrders();
  }, [project.id]);
  const metrics = useMemo(() => {
    // Financials using centralized utility
    const { totalCost, totalExpenses, totalMaterials } = calculateProjectFinancials(project);
    const originalBudget = project.budget;
    const approvedChangeOrders = changeOrders.filter(co => co.status === 'Approved');
    const approvedCOValue = approvedChangeOrders.reduce((sum, co) => sum + co.totalAmount, 0);
    const currentBudget = originalBudget + approvedCOValue;
    const invoicedAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const collectedAmount = (project.deposits ?? []).reduce((sum, d) => sum + d.amount, 0);
    // Timeline
    const tasks = project.tasks ?? [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < now);
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    // Operational
    const pendingChangeOrders = changeOrders.filter(co => co.status === 'Sent' || co.status === 'Draft');
    const unreadFeedback = (project.clientFeedback ?? []).filter(f => !f.isRead);
    // Expense Distribution (using calculateTotalExpense for consistency)
    const expenses = project.expenses ?? [];
    const expenseByCategory = expenses.reduce((acc, curr) => {
      const amountWithTax = calculateTotalExpense(curr);
      acc[curr.category] = (acc[curr.category] || 0) + amountWithTax;
      return acc;
    }, {} as Record<string, number>);
    // Add materials as a category if there are any
    if (totalMaterials > 0) {
        expenseByCategory['Inventory Materials'] = (expenseByCategory['Inventory Materials'] || 0) + totalMaterials;
    }
    const expenseChartData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value: value / 100 // Convert to dollars for chart
    })).sort((a, b) => b.value - a.value);
    // Area Analysis
    const areaCosts: Record<string, number> = {};
    // Expenses by Area
    expenses.forEach(expense => {
      const amount = calculateTotalExpense(expense);
      const areaName = expense.areaName || 'Unassigned';
      areaCosts[areaName] = (areaCosts[areaName] || 0) + amount;
    });
    // Materials by Area
    (project.worksiteMaterials || []).forEach(material => {
      const amount = (material.quantity * (material.unitCost || 0));
      const areaName = material.areaName || 'Unassigned';
      areaCosts[areaName] = (areaCosts[areaName] || 0) + amount;
    });
    const areaChartData = Object.entries(areaCosts)
      .map(([name, value]) => ({
        name,
        value: value / 100
      }))
      .sort((a, b) => b.value - a.value);
    return {
      financials: {
        originalBudget,
        approvedCOValue,
        currentBudget,
        totalCost,
        invoicedAmount,
        collectedAmount,
        totalExpenses
      },
      timeline: {
        totalTasks,
        completedTasks,
        overdueTasks,
        progress
      },
      operational: {
        pendingChangeOrders,
        unreadFeedback
      },
      charts: {
        budget: [
          { name: 'Original Budget', amount: originalBudget / 100 },
          { name: 'Current Budget', amount: currentBudget / 100 },
          { name: 'Actual Cost', amount: totalCost / 100 },
        ],
        cashFlow: [
          { name: 'Invoiced', amount: invoicedAmount / 100 },
          { name: 'Collected', amount: collectedAmount / 100 },
        ],
        expenses: expenseChartData,
        areaCosts: areaChartData
      }
    };
  }, [project, invoices, changeOrders]);
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Health Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.financials.totalCost)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatCurrency(metrics.financials.currentBudget)} budget
            </p>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${metrics.financials.totalCost > metrics.financials.currentBudget ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${Math.min((metrics.financials.totalCost / metrics.financials.currentBudget) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timeline Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.timeline.progress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.timeline.completedTasks} of {metrics.timeline.totalTasks} tasks completed
            </p>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${metrics.timeline.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.financials.collectedAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected vs {formatCurrency(metrics.financials.invoicedAmount)} Invoiced
            </p>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${metrics.financials.invoicedAmount > 0 ? Math.min((metrics.financials.collectedAmount / metrics.financials.invoicedAmount) * 100, 100) : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Change Orders</CardTitle>
            <FileSignature className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.financials.approvedCOValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Added to original budget
            </p>
            <div className="mt-2 flex gap-2">
              {metrics.operational.pendingChangeOrders.length > 0 && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {metrics.operational.pendingChangeOrders.length} Pending
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Analysis</CardTitle>
            <CardDescription>Original vs Current Budget vs Actual Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.charts.budget}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `${value/1000}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value * 100), 'Amount']}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <CardDescription>Breakdown by category (including taxes & materials)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.charts.expenses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.charts.expenses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.charts.expenses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No expenses recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Area Cost Analysis */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution by Area (Unit)</CardTitle>
            <CardDescription>Spending breakdown across different construction units.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {metrics.charts.areaCosts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.charts.areaCosts} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} width={100} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value * 100), 'Cost']}
                      cursor={{ fill: 'transparent' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No area-specific costs recorded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Operational Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {metrics.timeline.overdueTasks.length > 0 ? (
                  metrics.timeline.overdueTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0">
                      <Clock className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">{task.description}</p>
                        <p className="text-xs text-muted-foreground">Due: {format(new Date(task.dueDate), 'MMM d')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                    <p>No overdue tasks</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-yellow-600" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {metrics.operational.pendingChangeOrders.length > 0 ? (
                  metrics.operational.pendingChangeOrders.map(co => (
                    <div key={co.id} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0">
                      <div className="mt-0.5 shrink-0 h-2 w-2 rounded-full bg-yellow-500" />
                      <div>
                        <p className="font-medium">{co.title}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(co.totalAmount)} • {co.status}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                    <p>No pending change orders</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              Unread Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {metrics.operational.unreadFeedback.length > 0 ? (
                  metrics.operational.unreadFeedback.map(fb => (
                    <div key={fb.id} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0">
                      <div className="mt-0.5 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="font-medium line-clamp-2">{fb.message}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(fb.date), 'MMM d')}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                    <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                    <p>All feedback read</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}