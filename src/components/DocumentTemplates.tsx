import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api-client';
import type { Client, Project } from '@shared/types';
import { Copy, Loader2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
const TEMPLATES = [
  {
    id: 'service-agreement',
    name: 'Service Agreement',
    content: `SERVICE AGREEMENT
Date: {date}
Between:
{company_name}
(Contractor)
And:
{client_name}
(Client)
Project: {project_name}
Location: {project_location}
1. Services
Contractor agrees to perform the construction services described in the project scope.
Scope of Work:
{scope_of_work}
2. Payment
Client agrees to pay the total estimated budget of {project_budget}.
Signatures:
_____________________
Contractor
_____________________
Client`
  },
  {
    id: 'change-order-request',
    name: 'Change Order Request',
    content: `CHANGE ORDER REQUEST
Date: {date}
Project: {project_name}
Client: {client_name}
Description of Change:
[Describe the change here]
Reason for Change:
[Reason]
Impact on Cost:
[Cost Impact]
Impact on Schedule:
[Schedule Impact]
Approved By:
_____________________
Client`
  },
  {
    id: 'completion-certificate',
    name: 'Certificate of Completion',
    content: `CERTIFICATE OF COMPLETION
Date: {date}
Project: {project_name}
This certifies that the work for the above project has been completed in accordance with the contract documents.
Client: {client_name}
Location: {project_location}
Verified By:
{company_name}`
  },
  {
    id: 'notice-to-proceed',
    name: 'Notice to Proceed',
    content: `NOTICE TO PROCEED
Date: {date}
To: {client_name}
Project: {project_name}
Location: {project_location}
You are hereby notified to commence work on the above referenced project in accordance with the Agreement dated {date}.
The Scope of Work includes:
{scope_of_work}
Please acknowledge receipt of this notice.
Sincerely,
{company_name}`
  },
  {
    id: 'subcontractor-agreement',
    name: 'Subcontractor Agreement',
    content: `SUBCONTRACTOR AGREEMENT
Date: {date}
Project: {project_name}
Contractor: {company_name}
Subcontractor: [Subcontractor Name]
1. Scope of Work
The Subcontractor shall perform the following work:
{scope_of_work}
2. Schedule
Work shall commence on [Start Date] and be completed by [End Date].
3. Compensation
Contractor agrees to pay Subcontractor the sum of [Amount] for satisfactory completion of the work.
Signatures:
_____________________
Contractor
_____________________
Subcontractor`
  }
];
export function DocumentTemplates() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [clientsData, projectsData] = await Promise.all([
          api<Client[]>('/api/clients'),
          api<Project[]>('/api/projects')
        ]);
        setClients(clientsData);
        setProjects(projectsData);
      } catch (err) {
        toast.error('Failed to load data for templates.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  const generateScopeOfWork = (project: Project) => {
    if (!project.planStages || project.planStages.length === 0) return '[No plan stages defined]';
    return project.planStages
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map(stage => `- ${stage.name} (${new Date(stage.startDate).toLocaleDateString()} - ${new Date(stage.endDate).toLocaleDateString()})`)
      .join('\n');
  };
  useEffect(() => {
    if (!selectedTemplateId) {
      setGeneratedContent('');
      return;
    }
    const template = TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) return;
    let content = template.content;
    const client = clients.find(c => c.id === selectedClientId);
    const project = projects.find(p => p.id === selectedProjectId);
    const today = new Date().toLocaleDateString();
    // Replace placeholders
    content = content.replace(/{date}/g, today);
    content = content.replace(/{company_name}/g, 'Pillar Construction'); // Could fetch from profile
    content = content.replace(/{client_name}/g, client?.name || '[Client Name]');
    content = content.replace(/{project_name}/g, project?.name || '[Project Name]');
    content = content.replace(/{project_location}/g, project?.location || '[Location]');
    content = content.replace(/{project_budget}/g, project ? `${(project.budget / 100).toFixed(2)}` : '[Budget]');
    const scopeOfWork = project ? generateScopeOfWork(project) : '[Scope of Work]';
    content = content.replace(/{scope_of_work}/g, scopeOfWork);
    setGeneratedContent(content);
  }, [selectedTemplateId, selectedClientId, selectedProjectId, clients, projects]);
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Template copied to clipboard!');
  };
  const handlePrint = () => {
    window.print();
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Template Settings</CardTitle>
          <CardDescription>Select a template and context to generate a document.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Client</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter(p => !selectedClientId || p.clientId === selectedClientId)
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Generated document content.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewOpen(true)} disabled={!generatedContent}>
                <Printer className="mr-2 h-4 w-4" />
                Preview & Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!generatedContent}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <Textarea
            className="h-full min-h-[300px] font-mono text-sm"
            value={generatedContent}
            readOnly
          />
        </CardContent>
      </Card>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="no-print">
                <DialogTitle>Document Preview</DialogTitle>
                <DialogDescription>Review the document before printing.</DialogDescription>
            </DialogHeader>
            <style>
              {`
                @media print {
                  body {
                    visibility: hidden;
                  }
                  #printable-document, #printable-document * {
                    visibility: visible;
                  }
                  #printable-document {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 40px; /* Standard margin */
                    background: white;
                    color: black;
                    font-size: 12pt;
                    line-height: 1.5;
                  }
                  [role="dialog"] > button {
                    display: none;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>
            <div id="printable-document" className="whitespace-pre-wrap font-serif text-base leading-relaxed p-8 border rounded-md bg-white text-black shadow-sm">
                {generatedContent}
            </div>
            <DialogFooter className="no-print">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}