import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolInventory } from '@/components/ToolInventory';
import { SubContractors } from '@/components/SubContractors';
import { WorkshopInventory } from '@/components/WorkshopInventory';
import { PersonnelManagement } from '@/components/PersonnelManagement';
import { DocumentTemplates } from '@/components/DocumentTemplates';
import { ProjectTemplateManager } from '@/components/ProjectTemplateManager';
import { ResourceAvailability } from '@/components/ResourceAvailability';
export function ResourceManagementPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Resource Management</h1>
          <p className="text-muted-foreground">Manage your tools, sub-contractors, workshop inventory, personnel, and documents.</p>
        </div>
        <Tabs defaultValue="availability" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="tools">Tool Inventory</TabsTrigger>
            <TabsTrigger value="subcontractors">Sub-contractors</TabsTrigger>
            <TabsTrigger value="workshop">Workshop Inventory</TabsTrigger>
            <TabsTrigger value="personnel">Personnel</TabsTrigger>
            <TabsTrigger value="plan-templates">Plan Templates</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="availability">
            <ResourceAvailability />
          </TabsContent>
          <TabsContent value="tools">
            <ToolInventory />
          </TabsContent>
          <TabsContent value="subcontractors">
            <SubContractors />
          </TabsContent>
          <TabsContent value="workshop">
            <WorkshopInventory />
          </TabsContent>
          <TabsContent value="personnel">
            <PersonnelManagement />
          </TabsContent>
          <TabsContent value="plan-templates">
            <ProjectTemplateManager />
          </TabsContent>
          <TabsContent value="templates">
            <DocumentTemplates />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}