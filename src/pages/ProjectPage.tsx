import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api-client';
import type { Project, Expense, Deposit, ProgressPhoto, Task, TaskStatus, Invoice, Quote } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Share2, Copy, FileText, ExternalLink, MapPin, Calculator, Pencil, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { EditExpenseForm } from '@/components/EditExpenseForm';
import { ProjectDeposits } from '@/components/ProjectDeposits';
import { ProjectPhotos } from '@/components/ProjectPhotos';
import { ProjectTasks } from '@/components/ProjectTasks';
import { Toaster, toast } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuickQuote } from '@/components/QuickQuote';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateInvoiceForm } from '@/components/CreateInvoiceForm';
import { QuoteComparison } from '@/components/QuoteComparison';
import { ProjectJournal } from '@/components/ProjectJournal';
import { ChangeOrderList } from '@/components/ChangeOrderList';
import { ProjectFeedback } from '@/components/ProjectFeedback';
import { ProjectPlan } from '@/components/ProjectPlan';
import { ProjectAnalytics } from '@/components/ProjectAnalytics';
import { EditProjectForm } from '@/components/EditProjectForm';
import { ProjectMaterials } from '@/components/ProjectMaterials';
import { ProjectResources } from '@/components/ProjectResources';
import { UnusedMaterialsReport } from '@/components/UnusedMaterialsReport';
import { calculateProjectFinancials, calculateTotalExpense, exportToCsv } from '@/lib/utils';
import { useCurrency } from '@/hooks/useCurrency';
export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isQuickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const [isCreateInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [isEditProjectOpen, setEditProjectOpen] = useState(false);
  const clientPortalLink = `${window.location.origin}/portal/${id}`;
  const { formatCurrency } = useCurrency();
  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      const projectData = await api<Project>(`/api/projects/${id}`);
      setProject(projectData);
      if (projectData.invoiceIds && projectData.invoiceIds.length > 0) {
        const invoicePromises = projectData.invoiceIds.map(invoiceId => api<Invoice>(`/api/invoices/${invoiceId}`));
        const invoiceResults = await Promise.all(invoicePromises);
        setInvoices(invoiceResults);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project details');
      toast.error('Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setIsLoading(true);
    fetchProjectData();
  }, [fetchProjectData]);
  const handleAddExpense = async (values: Omit<Expense, 'id'>) => {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/expenses`, { method: 'POST', body: JSON.stringify(values) });
      toast.success('Expense added successfully!');
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense.');
    }
  };
  const handleUpdateExpense = async (values: Omit<Expense, 'id'>) => {
    if (!id || !editingExpense) return;
    try {
      await api(`/api/projects/${id}/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      toast.success('Expense updated successfully!');
      setEditingExpense(null);
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update expense.');
    }
  };
  const handleDeleteExpense = async (expenseId: string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api(`/api/projects/${id}/expenses/${expenseId}`, { method: 'DELETE' });
      toast.success('Expense deleted successfully');
      fetchProjectData();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };
  const handleAddDeposit = async (values: Omit<Deposit, 'id'>) => {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/deposits`, { method: 'POST', body: JSON.stringify(values) });
      toast.success('Deposit added successfully!');
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add deposit.');
    }
  };
  const handleAddPhoto = async (values: Omit<ProgressPhoto, 'id' | 'date'>) => {
    if (!id) return;
    try {
      const photoData = { ...values, date: new Date().toISOString() };
      await api(`/api/projects/${id}/photos`, { method: 'POST', body: JSON.stringify(photoData) });
      toast.success('Photo added successfully!');
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add photo.');
    }
  };
  const handleAddTask = async (values: Omit<Task, 'id' | 'status'>) => {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/tasks`, { method: 'POST', body: JSON.stringify(values) });
      toast.success('Task added successfully!');
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task.');
    }
  };
  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status }) });
      toast.success('Task status updated!');
      fetchProjectData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task status.');
    }
  };
  const handleCreateInvoice = async (values: Omit<Invoice, 'id' | 'invoiceNumber' | 'clientName' | 'projectName'>) => {
    try {
      const newInvoice = await api<Invoice>('/api/invoices', { method: 'POST', body: JSON.stringify(values) });
      toast.success(`Invoice ${newInvoice.invoiceNumber} created!`);
      fetchProjectData();
      navigate(`/invoices/${newInvoice.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice.');
    }
  };
  const handleConvertQuote = async (quote: Quote) => {
    if (!id) return;
    try {
      await api(`/api/projects/${id}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          description: `Quote from ${quote.supplierName}`,
          amount: quote.totalAmount,
          date: new Date().toISOString(),
          category: 'Materials', // Default category
        })
      });
      toast.success('Quote converted to expense!');
      fetchProjectData();
    } catch (e) {
      toast.error('Failed to convert quote');
    }
  };
  const handleExportExpenses = () => {
    if (!project || !project.expenses || project.expenses.length === 0) {
      toast.error('No expenses to export.');
      return;
    }
    const data = project.expenses.map(exp => {
      const total = calculateTotalExpense(exp);
      const taxAmount = total - exp.amount;
      return {
        Date: new Date(exp.date).toLocaleDateString(),
        Description: exp.description,
        Category: exp.category,
        'Subtotal ($)': (exp.amount / 100).toFixed(2),
        'Tax ($)': (taxAmount / 100).toFixed(2),
        'Total ($)': (total / 100).toFixed(2),
        'Work Stage': exp.workStage || '',
        'Invoiced': exp.invoiced ? 'Yes' : 'No'
      };
    });
    exportToCsv(`${project.name.replace(/\s+/g, '_')}_BOM.csv`, data);
    toast.success('BOM exported successfully!');
  };
  const copyLink = () => {
    navigator.clipboard.writeText(clientPortalLink);
    toast.success('Client portal link copied!');
  };
  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }
  if (error) return <AppLayout><p className="text-destructive">{error}</p></AppLayout>;
  if (!project) return <AppLayout><p>Project not found.</p></AppLayout>;
  const { totalExpenses, totalMaterials, contractorFee, totalCost, budgetUtilization } = calculateProjectFinancials(project);
  const totalDeposits = (project.deposits || []).reduce((sum, deposit) => sum + deposit.amount, 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">{project.name}</h1>
            <p className="text-lg text-muted-foreground">Client: {project.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isQuickQuoteOpen} onOpenChange={setQuickQuoteOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary"><Calculator className="mr-2 h-4 w-4" /> Quick Quote / Change Order</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Quick Quote & Change Order</DialogTitle>
                  <DialogDescription>Calculate material costs or create a formal change order.</DialogDescription>
                </DialogHeader>
                <QuickQuote projectId={project.id} onFinished={() => { setQuickQuoteOpen(false); fetchProjectData(); }} />
              </DialogContent>
            </Dialog>
            <Dialog open={isEditProjectOpen} onOpenChange={setEditProjectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Edit Project</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Edit Project Details</DialogTitle>
                  <DialogDescription>Update project information, status, and budget.</DialogDescription>
                </DialogHeader>
                <EditProjectForm project={project} onFinished={() => { setEditProjectOpen(false); fetchProjectData(); }} />
              </DialogContent>
            </Dialog>
            <Popover><PopoverTrigger asChild><Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share</Button></PopoverTrigger><PopoverContent className="w-80"><div className="grid gap-4"><div className="space-y-2"><h4 className="font-medium leading-none">Client Portal Link</h4><p className="text-sm text-muted-foreground">Share this link with your client.</p></div><div className="flex items-center space-x-2"><Input value={clientPortalLink} readOnly className="h-9 flex-1" /><Button size="icon" className="h-9 w-9" onClick={copyLink}><Copy className="h-4 w-4" /></Button></div></div></PopoverContent></Popover>
          </div>
        </div>
        <Tabs defaultValue="details">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="plan">Plan & Timeline</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="usage">Usage Report</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-6">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle>Budget</CardTitle></CardHeader>
                  <CardContent><p className="text-2xl font-bold tabular-nums whitespace-nowrap">{formatCurrency(project.budget)}</p></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Total Expenses</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums whitespace-nowrap">{formatCurrency(totalExpenses)}</p>
                    {totalMaterials > 0 && <p className="text-xs text-muted-foreground mt-1">+ {formatCurrency(totalMaterials)} Materials</p>}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Contractor Fee</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums whitespace-nowrap">{formatCurrency(contractorFee)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project.feeType === 'Fixed' ? 'Fixed Fee' : `${project.feeValue}% of Costs`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Total Cost</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums whitespace-nowrap text-primary">{formatCurrency(totalCost)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Expenses + Materials + Fees</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Total Invoiced</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums whitespace-nowrap">{formatCurrency(totalInvoiced)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Collected</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tabular-nums whitespace-nowrap text-green-600">{formatCurrency(totalDeposits)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Deposits</p>
                  </CardContent>
                </Card>
              </div>
              {/* Status & Location */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                  <CardContent><Badge className="whitespace-nowrap">{project.status}</Badge></CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Location</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium flex items-center gap-2 whitespace-nowrap truncate" title={project.location}>
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" /> {project.location}
                    </p>
                    {project.gpsCoordinates && (<a href={`https://www.google.com/maps?q=${project.gpsCoordinates.lat},${project.gpsCoordinates.lon}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View on map</a>)}
                  </CardContent>
                </Card>
              </div>
              {/* Detailed Content */}
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div><CardTitle>Bill of Materials (BOM)</CardTitle><CardDescription>Detailed list of all project expenses.</CardDescription></div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportExpenses}>
                          <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Dialog open={isAddExpenseOpen} onOpenChange={setAddExpenseOpen}><DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Add Expense</Button></DialogTrigger><DialogContent className="sm:max-w-[480px]"><DialogHeader><DialogTitle>Add New Expense</DialogTitle><DialogDescription>Log a new cost against the project budget.</DialogDescription></DialogHeader><AddExpenseForm onSubmit={handleAddExpense} onFinished={() => setAddExpenseOpen(false)} /></DialogContent></Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TooltipProvider>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead className="w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(project.expenses || []).length > 0 ? ((project.expenses || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense: Expense) => (
                              <TableRow key={expense.id}>
                                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                                <TableCell><div>{expense.description}{expense.category === 'Materials' && expense.workStage && (<Badge variant="outline" className="ml-2">{expense.workStage}</Badge>)}</div></TableCell>
                                <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                                <TableCell className="text-right font-medium"><Tooltip><TooltipTrigger asChild><span>{formatCurrency(calculateTotalExpense(expense))}</span></TooltipTrigger><TooltipContent><div className="p-1 text-sm"><div className="flex justify-between gap-4"><span>Subtotal:</span><span>{formatCurrency(expense.amount)}</span></div>{(expense.taxes ?? []).map(tax => (<div key={tax.id} className="flex justify-between gap-4"><span>{tax.name} ({tax.rate}%):</span><span>{formatCurrency(expense.amount * (tax.rate / 100))}</span></div>))}</div></TooltipContent></Tooltip></TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => setEditingExpense(expense)}>
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No expenses logged yet.</TableCell></TableRow>)}
                          </TableBody>
                        </Table>
                      </TooltipProvider>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Client Documents</CardTitle><CardDescription>Files uploaded by the client.</CardDescription></CardHeader>
                    <CardContent>{(project.clientDocuments || []).length > 0 ? (<ul className="space-y-3">{(project.clientDocuments || []).map(doc => (<li key={doc.id} className="flex flex-col p-3 border rounded-md gap-2"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="font-medium">{doc.description}</p><p className="text-sm text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p></div></div><Button asChild variant="ghost" size="icon"><a href={doc.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button></div>{doc.tags && doc.tags.length > 0 && (<div className="flex gap-2 flex-wrap">{doc.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>)}</li>))}</ul>) : (<div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg"><p className="text-muted-foreground text-center">No documents have been uploaded by the client.</p></div>)}</CardContent>
                  </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <ProjectDeposits deposits={project.deposits ?? []} onAddDeposit={handleAddDeposit} />
                  <ProjectTasks tasks={project.tasks ?? []} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-6">
            <ProjectAnalytics project={project} invoices={invoices} />
          </TabsContent>
          <TabsContent value="plan" className="mt-6">
            <ProjectPlan project={project} onUpdate={fetchProjectData} />
          </TabsContent>
          <TabsContent value="resources" className="mt-6">
            <ProjectResources projectId={project.id} />
          </TabsContent>
          <TabsContent value="materials" className="mt-6">
            <ProjectMaterials project={project} onUpdate={fetchProjectData} />
          </TabsContent>
          <TabsContent value="usage" className="mt-6">
            <UnusedMaterialsReport />
          </TabsContent>
          <TabsContent value="change-orders" className="mt-6">
            <ChangeOrderList projectId={project.id} />
          </TabsContent>
          <TabsContent value="quotes" className="mt-6">
            <QuoteComparison projectId={project.id} onConvertQuote={handleConvertQuote} />
          </TabsContent>
          <TabsContent value="invoices" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Project Invoices</CardTitle><CardDescription>Invoices generated for this project.</CardDescription></div>
                <Dialog open={isCreateInvoiceOpen} onOpenChange={setCreateInvoiceOpen}><DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4" />Create Invoice</Button></DialogTrigger><DialogContent className="sm:max-w-3xl"><DialogHeader><DialogTitle>Create New Invoice</DialogTitle><DialogDescription>Build a new invoice for this project. Add line items and tax as needed.</DialogDescription></DialogHeader><CreateInvoiceForm project={project} invoices={invoices} onSubmit={handleCreateInvoice} onFinished={() => setCreateInvoiceOpen(false)} /></DialogContent></Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Issue Date</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>{invoices.length > 0 ? (invoices.map(invoice => (<TableRow key={invoice.id} onClick={() => navigate(`/invoices/${invoice.id}`)} className="cursor-pointer hover:bg-muted/50"><TableCell className="font-medium">{invoice.invoiceNumber}</TableCell><TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell><TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell><TableCell><Badge>{invoice.status}</Badge></TableCell><TableCell className="text-right font-mono">{formatCurrency(invoice.total)}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No invoices for this project yet.</TableCell></TableRow>)}</TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="photos" className="mt-6">
            <ProjectPhotos photos={project.photos ?? []} onAddPhoto={handleAddPhoto} />
          </TabsContent>
          <TabsContent value="journal" className="mt-6">
            <ProjectJournal projectId={project.id} entries={project.journalEntries ?? []} onEntryAdded={fetchProjectData} />
          </TabsContent>
          <TabsContent value="feedback" className="mt-6">
            <ProjectFeedback feedback={project.clientFeedback ?? []} />
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Modify the details of this expense.</DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <EditExpenseForm
              initialValues={editingExpense}
              onSubmit={handleUpdateExpense}
              onFinished={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Toaster richColors />
    </AppLayout>
  );
}