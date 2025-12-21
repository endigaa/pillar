import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { Project, GeneralExpense } from '@shared/types';
import { DollarSign, Briefcase, Users, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { getFinancialYearRange } from '@/lib/utils';
import { InventoryAlerts } from '@/components/InventoryAlerts';
import { useCurrency } from '@/hooks/useCurrency';
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
export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [generalExpenses, setGeneralExpenses] = useState<GeneralExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, fetchProfile } = useCompanyProfile();
  const { formatCurrency } = useCurrency();
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [projectsData, generalExpensesData] = await Promise.all([
          api<Project[]>('/api/projects'),
          api<GeneralExpense[]>('/api/general-expenses'),
        ]);
        setProjects(projectsData);
        setGeneralExpenses(generalExpensesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const totalRevenue = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalProjectExpenses = projects.reduce((sum, p) => sum + p.expenses.reduce((expSum, e) => expSum + e.amount, 0), 0);
  const totalGeneralExpenses = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = totalProjectExpenses + totalGeneralExpenses;
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  // Chart Data Preparation based on Financial Year
  const chartData = useMemo(() => {
    if (!profile) return [];
    const { start, end } = getFinancialYearRange(profile.financialYearStartMonth, profile.financialYearStartDay);
    const data = [];
    let currentMonth = start;
    // Iterate through each month of the financial year
    while (currentMonth <= end) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const monthLabel = format(currentMonth, 'MMM');
      let monthlyIncome = 0;
      let monthlyExpenses = 0;
      projects.forEach(project => {
        // Income from deposits
        project.deposits.forEach(deposit => {
          if (isWithinInterval(new Date(deposit.date), { start: monthStart, end: monthEnd })) {
            monthlyIncome += deposit.amount;
          }
        });
        // Expenses from project expenses
        project.expenses.forEach(expense => {
          if (isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })) {
            monthlyExpenses += expense.amount;
          }
        });
      });
      // General expenses
      generalExpenses.forEach(expense => {
        if (isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })) {
          monthlyExpenses += expense.amount;
        }
      });
      data.push({
        name: monthLabel,
        Income: monthlyIncome / 100,
        Expenses: monthlyExpenses / 100,
      });
      currentMonth = addMonths(currentMonth, 1);
    }
    return data;
  }, [projects, generalExpenses, profile]);
  // Activity Feed Preparation
  const activityFeed = useMemo(() => {
    const activities: { id: string; type: string; description: string; date: string; project?: string }[] = [];
    projects.forEach(project => {
      // New Projects (using startDate as proxy for creation)
      activities.push({
        id: `new-proj-${project.id}`,
        type: 'New Project',
        description: `Started project "${project.name}"`,
        date: project.startDate,
        project: project.name,
      });
      // Completed Tasks
      project.tasks.forEach(task => {
        if (task.status === 'Done') {
          activities.push({
            id: `task-${task.id}`,
            type: 'Task Completed',
            description: `Completed task: ${task.description}`,
            date: task.dueDate,
            project: project.name,
          });
        }
      });
      // Journal Entries
      project.journalEntries?.forEach(entry => {
        activities.push({
          id: `journal-${entry.id}`,
          type: 'Journal Entry',
          description: entry.content.substring(0, 50) + (entry.content.length > 50 ? '...' : ''),
          date: entry.date,
          project: project.name,
        });
      });
    });
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [projects]);
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">A high-level overview of your construction business.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Revenue" value={formatCurrency(totalRevenue, { notation: 'compact' })} icon={DollarSign} isLoading={isLoading} />
          <StatCard title="Active Projects" value={activeProjects.toString()} icon={Briefcase} isLoading={isLoading} />
          <StatCard title="Total Expenses" value={formatCurrency(totalExpenses, { notation: 'compact' })} icon={Users} isLoading={isLoading} />
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Financial Trends (Current FY)</CardTitle>
              <CardDescription>Income vs Expenses for the current financial year.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoading || !profile ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip formatter={(value: number) => [`${formatCurrency(value * 100)}`, undefined]} />
                      <Legend />
                      <Bar dataKey="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all projects.</CardDescription>
                </CardHeader>
                <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                    {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                    ) : activityFeed.length > 0 ? (
                    <div className="space-y-4">
                        {activityFeed.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                            <div className="mt-1">
                            {activity.type === 'New Project' && <Briefcase className="h-4 w-4 text-blue-500" />}
                            {activity.type === 'Task Completed' && <Activity className="h-4 w-4 text-green-500" />}
                            {activity.type === 'Journal Entry' && <Calendar className="h-4 w-4 text-orange-500" />}
                            </div>
                            <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{activity.type}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(activity.date).toLocaleDateString()} • {activity.project}</p>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
                    )}
                </ScrollArea>
                </CardContent>
            </Card>
            <InventoryAlerts />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}