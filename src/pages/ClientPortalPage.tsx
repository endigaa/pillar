import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Project, ClientDocument, ChangeOrder } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, DollarSign, TrendingUp, TrendingDown, Wallet, CheckCircle2, MapPin, Upload, FileText, ExternalLink, MessageSquare, FileSignature, Check, X, User, ZoomIn, HardHat, Recycle, Image as ImageIcon, Eye } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AddClientDocumentForm } from '@/components/AddClientDocumentForm';
import { Toaster, toast } from '@/components/ui/sonner';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { PhotoViewer } from '@/components/PhotoViewer';
import { PlanTimeline } from '@/components/PlanTimeline';
import { calculateProjectFinancials } from '@/lib/utils';
import { SiteResources } from '@/components/SiteResources';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChangeOrderDetailDialog } from '@/components/ChangeOrderDetailDialog';
import { useCurrency } from '@/hooks/useCurrency';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
const StatCard = ({ title, value, fullValue, icon: Icon, isLoading }: { title: string; value: string; fullValue?: string; icon: React.ElementType; isLoading: boolean }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-3/4" />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-2xl md:text-3xl font-bold text-primary truncate cursor-default">{value}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{fullValue || value}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </CardContent>
  </Card>
);
export function ClientPortalPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isFeedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewingChangeOrder, setViewingChangeOrder] = useState<ChangeOrder | null>(null);
  const { profile, fetchProfile, isLoading: isProfileLoading } = useCompanyProfile();
  const { formatCurrency } = useCurrency();
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);
  const fetchProject = useCallback(async () => {
    if (!id) {
      setError("Project ID is missing.");
      setIsLoading(false);
      return;
    }
    try {
      const [projectData, coData] = await Promise.all([
        api<Project>(`/api/projects/${id}`),
        api<ChangeOrder[]>(`/api/projects/${id}/change-orders`)
      ]);
      setProject(projectData);
      setChangeOrders(coData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch project details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);
  useEffect(() => {
    setIsLoading(true);
    fetchProject();
  }, [fetchProject]);
  const handleAddDocument = async (values: Omit<ClientDocument, 'id' | 'uploadedAt'>) => {
    if (!id) return;
    try {
      await api(`/api/portal/${id}/documents`, { method: 'POST', body: JSON.stringify(values) });
      toast.success('Document uploaded successfully!');
      fetchProject(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload document.');
    }
  };
  const handleSendFeedback = async () => {
    if (!id || !feedbackMessage.trim()) return;
    setIsSendingFeedback(true);
    try {
      await api(`/api/portal/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ message: feedbackMessage }),
      });
      toast.success('Feedback sent successfully!');
      setFeedbackMessage('');
      setFeedbackOpen(false);
      fetchProject(); // Refresh to show new message
    } catch (err) {
      toast.error('Failed to send feedback.');
    } finally {
      setIsSendingFeedback(false);
    }
  };
  const handleUpdateChangeOrderStatus = async (coId: string, status: 'Approved' | 'Rejected') => {
    try {
      await api(`/api/change-orders/${coId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      toast.success(`Change order ${status.toLowerCase()}`);
      fetchProject();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };
  const totalDeposits = project?.deposits.reduce((sum, d) => sum + d.amount, 0) ?? 0;
  // Use unified financial calculation
  const financials = project ? calculateProjectFinancials(project) : { totalCost: 0 };
  const totalUtilized = financials.totalCost;
  const balance = totalDeposits - totalUtilized;
  const publicTasks = project?.tasks.filter(task => task.isPublic) ?? [];
  const visibleChangeOrders = changeOrders.filter(co => co.status !== 'Draft');
  const sortedPhotos = project?.photos ? [...project.photos].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
  const sortedStages = project?.planStages ? [...project.planStages].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) : [];
  // Calculate unused materials for display
  const unusedMaterials = project ? [
    ...(project.expenses || [])
      .filter(e => e.category === 'Materials' && e.unusedQuantity && e.unusedQuantity > 0)
      .map(e => ({
        id: e.id,
        name: e.description,
        unusedQuantity: e.unusedQuantity || 0,
        unit: e.unit || 'units',
        value: (e.unusedQuantity || 0) * Math.round(e.amount / (e.quantity || 1)),
        imageUrl: undefined // Expenses don't have images in current schema
      })),
    ...(project.worksiteMaterials || [])
      .filter(m => m.unusedQuantity && m.unusedQuantity > 0)
      .map(m => ({
        id: m.id,
        name: m.materialName,
        unusedQuantity: m.unusedQuantity || 0,
        unit: m.unit,
        value: (m.unusedQuantity || 0) * (m.unitCost || 0),
        imageUrl: m.imageUrl
      }))
  ] : [];
  const totalUnusedValue = unusedMaterials.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="min-h-screen bg-pillar-gray dark:bg-gray-900">
      <ThemeToggle className="absolute top-6 right-6" />
      <header className="py-8 bg-background border-b">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isProfileLoading ? <Skeleton className="h-8 w-8" /> : <Building className="h-8 w-8 text-primary" />}
            {isProfileLoading ? <Skeleton className="h-7 w-48" /> : <h1 className="text-2xl font-bold">{profile?.companyName || 'Pillar Construction'}</h1>}
          </div>
          <Dialog open={isFeedbackOpen} onOpenChange={setFeedbackOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Feedback</DialogTitle>
                <DialogDescription>Have a question or comment? Send a message directly to the contractor.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button onClick={handleSendFeedback} disabled={isSendingFeedback || !feedbackMessage.trim()}>
                    {isSendingFeedback && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Message
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="container mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        {error ? (
          <Card className="text-center p-8"><p className="text-destructive">{error}</p></Card>
        ) : (
          <div className="space-y-8">
            <div>
              {isLoading ? <Skeleton className="h-10 w-3/4" /> : <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{project?.name}</h2>}
              {isLoading ? <Skeleton className="h-5 w-1/2 mt-2" /> : <p className="text-lg text-muted-foreground">Project Status: <span className="font-semibold text-primary">{project?.status}</span></p>}
              {isLoading ? <Skeleton className="h-5 w-2/3 mt-2" /> : project?.location && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{project.location}</span>
                </div>
              )}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Total Budget"
                value={formatCurrency(project?.budget ?? 0, { notation: 'compact', maximumFractionDigits: 2 })}
                fullValue={formatCurrency(project?.budget ?? 0)}
                icon={DollarSign}
                isLoading={isLoading}
              />
              <StatCard
                title="Funds Deposited"
                value={formatCurrency(totalDeposits, { notation: 'compact', maximumFractionDigits: 2 })}
                fullValue={formatCurrency(totalDeposits)}
                icon={TrendingUp}
                isLoading={isLoading}
              />
              <StatCard
                title="Funds Utilized"
                value={formatCurrency(totalUtilized, { notation: 'compact', maximumFractionDigits: 2 })}
                fullValue={formatCurrency(totalUtilized)}
                icon={TrendingDown}
                isLoading={isLoading}
              />
              <StatCard
                title="Remaining Balance"
                value={formatCurrency(balance, { notation: 'compact', maximumFractionDigits: 2 })}
                fullValue={formatCurrency(balance)}
                icon={Wallet}
                isLoading={isLoading}
              />
              <StatCard
                title="Active Personnel"
                value={project?.activePersonnelCount?.toString() || '0'}
                icon={Users}
                isLoading={isLoading}
              />
              <StatCard
                title="Casual Staff"
                value={project?.casualPersonnelCount?.toString() || '0'}
                icon={HardHat}
                isLoading={isLoading}
              />
            </div>
            {/* Project Timeline Section */}
            {sortedStages.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Project Timeline</h3>
                <PlanTimeline stages={sortedStages} tasks={project?.tasks || []} readOnly />
              </div>
            )}
            {/* Site Resources Section */}
            {id && (
              <div className="space-y-4">
                <SiteResources projectId={id} />
              </div>
            )}
            {/* Unused Materials Section */}
            {unusedMaterials.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-orange-500" />
                    Unused Materials
                  </CardTitle>
                  <CardDescription>Materials purchased but not fully utilized on-site.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Unused Qty</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unusedMaterials.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {item.imageUrl ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-8 w-8 object-cover rounded cursor-pointer hover:opacity-80 border"
                                  />
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0 overflow-hidden border-none shadow-xl">
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-auto" />
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center border">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.unusedQuantity} {item.unit}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Total Unused Value</TableCell>
                        <TableCell className="text-right font-bold text-orange-600">{formatCurrency(totalUnusedValue)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            )}
            {/* Change Orders Section */}
            {visibleChangeOrders.length > 0 && (
              <Card className="shadow-lg border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-blue-500" />
                    Change Requests
                  </CardTitle>
                  <CardDescription>Review and approve changes to the project scope.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleChangeOrders.map(co => (
                        <TableRow key={co.id}>
                          <TableCell className="font-medium">{co.title}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{co.description}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(co.totalAmount)}</TableCell>
                          <TableCell>
                            <Badge variant={co.status === 'Approved' ? 'default' : co.status === 'Rejected' ? 'destructive' : 'secondary'}>
                              {co.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setViewingChangeOrder(co)}>
                                    <Eye className="mr-2 h-4 w-4" /> View
                                </Button>
                                {co.status === 'Sent' && (
                                <>
                                    <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateChangeOrderStatus(co.id, 'Approved')}>
                                    <Check className="mr-1 h-4 w-4" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateChangeOrderStatus(co.id, 'Rejected')}>
                                    <X className="mr-1 h-4 w-4" /> Reject
                                    </Button>
                                </>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            {/* Feedback History */}
            {project?.clientFeedback && project.clientFeedback.length > 0 && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Message History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...project.clientFeedback].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(fb => (
                      <div key={fb.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">You wrote:</p>
                          <div className="flex items-center gap-2">
                            {fb.acknowledged && <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] px-1 py-0">Read</Badge>}
                            <span className="text-xs text-muted-foreground">{format(new Date(fb.date), 'PP p')}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{fb.message}</p>
                        {fb.response && (
                          <div className="ml-8 mt-2 p-3 bg-background border rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-semibold text-primary">Contractor Response:</span>
                              {fb.respondedAt && <span className="text-xs text-muted-foreground">{format(new Date(fb.respondedAt), 'PP p')}</span>}
                            </div>
                            <p className="text-sm">{fb.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <Card className="shadow-lg">
                  <CardHeader><CardTitle>Progress Photos</CardTitle><CardDescription>A visual log of our work on your project.</CardDescription></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-64 w-full" /> :
                      sortedPhotos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {sortedPhotos.map((photo, index) => (
                            <div
                              key={photo.id}
                              className="overflow-hidden rounded-lg group cursor-pointer relative"
                              onClick={() => setViewerIndex(index)}
                            >
                              <img src={photo.url} alt={photo.description} className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 rounded-full p-2">
                                  <ZoomIn className="text-white h-6 w-6" />
                                </div>
                              </div>
                              <div className="p-4 bg-background border-t">
                                <p className="font-semibold">{photo.description}</p>
                                <p className="text-sm text-muted-foreground">{new Date(photo.date).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                          <p className="text-muted-foreground">No progress photos have been uploaded yet.</p>
                        </div>
                      )
                    }
                  </CardContent>
                </Card>
                <Card className="shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Client Documents</CardTitle>
                      <CardDescription>Files you have shared with us.</CardDescription>
                    </div>
                    <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm"><Upload className="mr-2 h-4 w-4" /> Upload Document</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upload a New Document</DialogTitle>
                          <DialogDescription>Provide a URL and description for the document you want to share.</DialogDescription>
                        </DialogHeader>
                        <AddClientDocumentForm onSubmit={handleAddDocument} onFinished={() => setUploadOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-32 w-full" /> :
                      project?.clientDocuments && project.clientDocuments.length > 0 ? (
                        <ul className="space-y-3">
                          {project.clientDocuments.map(doc => (
                            <li key={doc.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{doc.description}</p>
                                  <p className="text-sm text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Button asChild variant="ghost" size="icon">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
                          <p className="text-muted-foreground text-center">No documents have been uploaded yet.</p>
                        </div>
                      )
                    }
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-1">
                <Card className="shadow-lg h-full">
                  <CardHeader><CardTitle>Project Milestones</CardTitle><CardDescription>Key tasks and their status.</CardDescription></CardHeader>
                  <CardContent>
                    {isLoading ? <Skeleton className="h-48 w-full" /> :
                      publicTasks.length > 0 ? (
                        <ul className="space-y-4">
                          {publicTasks.map(task => (
                            <li key={task.id} className="flex flex-col gap-1">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className={cn("h-5 w-5 mt-0.5 flex-shrink-0", task.status === 'Done' ? 'text-green-500' : 'text-gray-300 dark:text-gray-600')} />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={cn("font-medium", task.status === 'Done' && 'line-through text-muted-foreground')}>{task.description}</p>
                                    {task.constructionStageName && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                        {task.constructionStageName}
                                      </Badge>
                                    )}
                                    {task.areaName && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                                        {task.areaName}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              {task.assigneeName && task.isAssigneePublic && (
                                <div className="ml-8 flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
                                  <User className="h-3 w-3 mr-1" />
                                  <span>Assigned to: {task.assigneeName}</span>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                          <p className="text-muted-foreground text-center">No public milestones shared yet.</p>
                        </div>
                      )
                    }
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>Built with Aurelia, Your AI Co-Founder</p>
      </footer>
      <Toaster richColors />
      <PhotoViewer
        photos={sortedPhotos}
        initialIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
      <ChangeOrderDetailDialog
        changeOrder={viewingChangeOrder}
        open={!!viewingChangeOrder}
        onOpenChange={(open) => !open && setViewingChangeOrder(null)}
      />
    </div>
  );
}