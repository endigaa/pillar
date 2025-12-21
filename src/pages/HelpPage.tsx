import { AppLayout } from '@/components/layout/AppLayout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  BarChart2,
  Wrench,
  Truck,
  Settings,
  BookOpen,
  Info,
  HardHat,
  Warehouse,
  CalendarIcon
} from 'lucide-react';
export function HelpPage() {
  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">User Guide</h1>
          <p className="text-muted-foreground">Comprehensive manual for the Pillar construction management platform.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Application Manual
            </CardTitle>
            <CardDescription>
              Navigate through the sections below to understand the functionality of each module in the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {/* 1. Dashboard */}
              <AccordionItem value="dashboard">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    Dashboard
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    The <strong>Dashboard</strong> serves as the central command center, offering a high-level overview of your business's health and daily operations.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-2">Key Metrics</h4>
                      <p className="text-sm">
                        Instant visibility into Total Revenue, Active Project count, and Total Expenses. These figures provide a quick pulse check on your business performance.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-2">Financial Trends</h4>
                      <p className="text-sm">
                        A visual bar chart comparing Income vs. Expenses for the current financial year, helping you identify seasonal trends and cash flow patterns.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-2">Recent Activity</h4>
                      <p className="text-sm">
                        A chronological log of recent actions across the platform, such as new projects created, tasks completed, or journal entries added.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-2">Inventory Alerts</h4>
                      <p className="text-sm">
                        Critical notifications regarding low stock levels in your workshop or upcoming maintenance dates for tools, ensuring you never run out of essential supplies.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 2. Projects */}
              <AccordionItem value="projects">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    Projects
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    The <strong>Projects</strong> module is the core of Pillar, allowing you to manage every aspect of a construction job from start to finish.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground">Creating a Project</h4>
                      <p className="text-sm mt-1">
                        Click "New Project" to start. You'll define the project Name, Client, Location, Budget, and Fee Structure (Percentage or Fixed). This sets the baseline for all financial calculations.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Project Dashboard Tabs</h4>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                        <li><strong>Details:</strong> Manage the Bill of Materials (BOM) by adding expenses. Track client deposits and view progress photos.</li>
                        <li><strong>Plan & Timeline:</strong> Use the Gantt chart to schedule stages (e.g., Foundation, Framing). Define dependencies to visualize the critical path.</li>
                        <li><strong>Resources:</strong> Assign tools and personnel to the project site for accurate tracking.</li>
                        <li><strong>Materials:</strong> Issue consumable items from your Workshop Inventory directly to the project.</li>
                        <li><strong>Change Orders:</strong> Create formal requests for changes in scope. Once approved, these update the project budget.</li>
                        <li><strong>Quotes:</strong> Manage supplier quotes and convert approved ones directly into project expenses.</li>
                        <li><strong>Invoices:</strong> Generate invoices specific to this project based on expenses and milestones.</li>
                        <li><strong>Feedback:</strong> Communicate directly with clients via the portal.</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 3. Clients */}
              <AccordionItem value="clients">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Clients
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Manage your customer relationships and provide transparency through the Client Portal.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Client Directory</h4>
                    <p className="text-sm">
                      Store contact details and notes for all your clients. This database feeds into project creation and document generation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Client Portal</h4>
                    <p className="text-sm">
                      Each project has a unique, secure link you can share with the client. Through this portal, clients can:
                    </p>
                    <ul className="list-disc pl-5 text-sm">
                      <li>View real-time financial status (Budget vs. Utilized).</li>
                      <li>See progress photos and the project timeline.</li>
                      <li>Approve Change Orders.</li>
                      <li>Upload documents and send feedback messages.</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 4. Invoices */}
              <AccordionItem value="invoices">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    Invoices
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Streamline your billing process by generating professional invoices directly from project data.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Creating Invoices</h4>
                    <p className="text-sm">
                      When creating an invoice, you can manually add line items or use the "Add from Project" feature to pull in:
                    </p>
                    <ul className="list-disc pl-5 text-sm">
                      <li>Unbilled Expenses (reimbursements).</li>
                      <li>Billable Materials issued from inventory.</li>
                      <li>Approved Change Orders.</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Status Tracking</h4>
                    <p className="text-sm">
                      Track invoices through their lifecycle: <strong>Draft</strong>, <strong>Sent</strong>, <strong>Paid</strong>, or <strong>Void</strong>. Marking an invoice as "Paid" can automatically record a deposit in the project if configured.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 5. Financials */}
              <AccordionItem value="financials">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    Financials
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Gain deep insights into your company's financial performance with standard accounting reports.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-1">Profit & Loss</h4>
                      <p className="text-sm">
                        A detailed breakdown of Income (Deposits) vs. Expenses (Project & General) to calculate Net Profit over a selected period.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-1">Balance Sheet</h4>
                      <p className="text-sm">
                        A snapshot of your business's financial position, including Assets (Cash, Accounts Receivable, Inventory Value) and Equity.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-1">General Ledger</h4>
                      <p className="text-sm">
                        A chronological list of all financial transactions across the system, useful for auditing and detailed tracking.
                      </p>
                    </div>
                    <div className="border p-4 rounded-lg bg-muted/10">
                      <h4 className="font-semibold text-foreground mb-1">General Expenses</h4>
                      <p className="text-sm">
                        Track overhead costs not tied to specific projects, such as rent, insurance, or office supplies, to ensure accurate profit calculations.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 6. Resources */}
              <AccordionItem value="resources">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-muted-foreground" />
                    Resources
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Manage your physical and human assets to optimize utilization and planning.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Wrench className="h-4 w-4 text-primary" /> Tool Inventory
                      </div>
                      <p className="text-sm">Track equipment status, location, and maintenance schedules.</p>
                    </div>
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <HardHat className="h-4 w-4 text-primary" /> Sub-contractors
                      </div>
                      <p className="text-sm">Directory of specialized partners for quick assignment.</p>
                    </div>
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Warehouse className="h-4 w-4 text-primary" /> Workshop Inventory
                      </div>
                      <p className="text-sm">Manage stock levels of consumable materials and issue them to projects.</p>
                    </div>
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <Users className="h-4 w-4 text-primary" /> Personnel
                      </div>
                      <p className="text-sm">Manage employee profiles, pay rates, and time-off records.</p>
                    </div>
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <CalendarIcon className="h-4 w-4 text-primary" /> Plan Templates
                      </div>
                      <p className="text-sm">Create reusable project schedules to speed up planning.</p>
                    </div>
                    <div className="space-y-1 border p-4 rounded-lg bg-muted/10">
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-primary" /> Document Templates
                      </div>
                      <p className="text-sm">Standardize contracts and notices with auto-filling templates.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 7. Suppliers */}
              <AccordionItem value="suppliers">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    Suppliers
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Centralize your procurement process by managing vendor relationships and costs.
                  </p>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Supplier Directory & Price Lists</h4>
                    <p className="text-sm">
                      Maintain a list of suppliers with their contact info and categories. You can also store material price lists for quick reference during estimation.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Quote Management</h4>
                    <p className="text-sm">
                      Record quotes received from suppliers for specific projects. Compare them, and once approved, use the <strong>Convert to Expense</strong> feature to automatically add the cost to your project's BOM.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* 8. Settings */}
              <AccordionItem value="settings">
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-4 p-4">
                  <p>
                    Configure the application to match your business identity and workflows.
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><strong>Company Profile:</strong> Update your company name, address, logo, and preferred currency. This information appears on all generated documents and the client portal.</li>
                    <li><strong>Categories:</strong> Customize the dropdown options for Expense Categories, Supplier Categories, and Construction Stages to fit your specific terminology.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Documentation Maintenance</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                This user guide is a living document. As new features are added to Pillar (e.g., advanced reporting, integrations), this page will be updated to reflect the latest capabilities and workflows. Please check back regularly for updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}