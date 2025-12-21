import { Hono } from "hono";
import type { Env } from './core-utils';
import { ProjectEntity, ClientEntity, ToolEntity, SubContractorEntity, SupplierEntity, MaterialEntity, CompanyProfileEntity, InvoiceEntity, SupplierCategoryEntity, ConstructionStageEntity, ExpenseCategoryEntity, WorkshopMaterialEntity, PersonnelEntity, GeneralExpenseEntity, QuoteEntity, ChangeOrderEntity, WorkshopEntity, ProjectTemplateEntity, GeneralIncomeEntity } from "./entities";
import { createModel, createSingletonModel } from "./orm";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Project, Expense, Client, Deposit, ProgressPhoto, Tool, SubContractor, Supplier, Material, Task, TaskStatus, ClientDocument, CompanyProfile, ImportedTransaction, Invoice, InvoiceStatus, ClientStatement, ClientStatementTransaction, ExpenseCategory, SupplierCategory, ConstructionStage, WorkshopMaterial, Personnel, DayOff, GeneralExpense, Quote, QuoteStatus, JournalEntry, ClientFeedback, ChangeOrder, ChangeOrderStatus, PlanStage, Workshop, PortalResources, WorksiteMaterialIssue, ProjectTemplate, GeneralIncome } from "@shared/types";
import { MOCK_PROJECT_TEMPLATES } from "@shared/mock-data";
// Create models from entities
const CompanyProfileModel = createSingletonModel(CompanyProfileEntity);
const ProjectModel = createModel<Project, ProjectEntity>(ProjectEntity);
const ClientModel = createModel<Client, ClientEntity>(ClientEntity);
const ToolModel = createModel<Tool, ToolEntity>(ToolEntity);
const SubContractorModel = createModel<SubContractor, SubContractorEntity>(SubContractorEntity);
const SupplierModel = createModel<Supplier, SupplierEntity>(SupplierEntity);
const MaterialModel = createModel<Material, MaterialEntity>(MaterialEntity);
const InvoiceModel = createModel<Invoice, InvoiceEntity>(InvoiceEntity);
const SupplierCategoryModel = createModel<SupplierCategory, SupplierCategoryEntity>(SupplierCategoryEntity);
const ConstructionStageModel = createModel<ConstructionStage, ConstructionStageEntity>(ConstructionStageEntity);
const ExpenseCategoryModel = createModel<ExpenseCategory, ExpenseCategoryEntity>(ExpenseCategoryEntity);
const WorkshopMaterialModel = createModel<WorkshopMaterial, WorkshopMaterialEntity>(WorkshopMaterialEntity);
const PersonnelModel = createModel<Personnel, PersonnelEntity>(PersonnelEntity);
const GeneralExpenseModel = createModel<GeneralExpense, GeneralExpenseEntity>(GeneralExpenseEntity);
const GeneralIncomeModel = createModel<GeneralIncome, GeneralIncomeEntity>(GeneralIncomeEntity);
const QuoteModel = createModel<Quote, QuoteEntity>(QuoteEntity);
const ChangeOrderModel = createModel<ChangeOrder, ChangeOrderEntity>(ChangeOrderEntity);
const WorkshopModel = createModel<Workshop, WorkshopEntity>(WorkshopEntity);
const ProjectTemplateModel = createModel<ProjectTemplate, ProjectTemplateEntity>(ProjectTemplateEntity);
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // Dedicated seeding endpoint - triggered once by frontend on load
  app.post('/api/seed', async (c) => {
    await CompanyProfileModel.ensureSeed(c.env);
    await ProjectModel.ensureSeed(c.env);
    await ClientModel.ensureSeed(c.env);
    await ToolModel.ensureSeed(c.env);
    await SubContractorModel.ensureSeed(c.env);
    await SupplierModel.ensureSeed(c.env);
    await MaterialModel.ensureSeed(c.env);
    await SupplierCategoryModel.ensureSeed(c.env);
    await ConstructionStageModel.ensureSeed(c.env);
    await ExpenseCategoryModel.ensureSeed(c.env);
    await WorkshopModel.ensureSeed(c.env);
    await WorkshopMaterialModel.ensureSeed(c.env);
    await PersonnelModel.ensureSeed(c.env);
    await GeneralExpenseModel.ensureSeed(c.env);
    await GeneralIncomeModel.ensureSeed(c.env);
    await QuoteModel.ensureSeed(c.env);
    await ChangeOrderModel.ensureSeed(c.env);
    await InvoiceModel.ensureSeed(c.env);
    // Standard seed for templates (handles initial empty state)
    await ProjectTemplateModel.ensureSeed(c.env);
    // Enhanced seeding: Check for and add new templates if they are missing
    // This allows us to push new templates to existing users without overwriting their data
    const existingTemplates = await ProjectTemplateModel.all(c.env);
    const existingNames = new Set(existingTemplates.map(t => t.name));
    for (const template of MOCK_PROJECT_TEMPLATES) {
        if (!existingNames.has(template.name)) {
            await ProjectTemplateModel.create(c.env, template);
        }
    }
    return ok(c, { seeded: true });
  });
  // COMPANY PROFILE
  app.get('/api/company-profile', async (c) => {
    const profile = await CompanyProfileModel.get(c.env);
    return ok(c, profile);
  });
  app.put('/api/company-profile', async (c) => {
    const profileData = await c.req.json<CompanyProfile>();
    if (!profileData.companyName || !profileData.email) {
      return bad(c, 'Company name and email are required');
    }
    const updatedProfile = await CompanyProfileModel.update(c.env, profileData);
    return ok(c, updatedProfile);
  });
  app.post('/api/upload-logo', async (c) => {
    // Mock upload endpoint
    return ok(c, { url: 'https://images.unsplash.com/photo-1581092916378-2ED6e356d3b6?q=80&w=2070' });
  });
  // FILE UPLOAD (MOCK)
  app.post('/api/upload-file', async (c) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app, we would process c.req.parseBody() or c.req.formData()
    // For this mock, we just return a random image URL suitable for tools/materials
    const mockImages = [
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=1000', // Tools
      'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=1000', // Drill
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1000', // Lumber
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1000', // Wires
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000', // Paint
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&q=80&w=1000', // Workshop
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    return ok(c, { url: randomImage });
  });
  // PROJECTS
  app.get('/api/projects', async (c) => {
    const projects = await ProjectModel.all(c.env);
    return ok(c, projects);
  });
  app.get('/api/projects/:id', async (c) => {
    const { id } = c.req.param();
    const project = await ProjectModel.find(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    // Calculate personnel counts
    const allPersonnel = await PersonnelModel.all(c.env);
    const projectPersonnel = allPersonnel.filter(p => p.locationId === id && p.locationType === 'Project');
    const activePersonnelCount = projectPersonnel.length;
    const casualPersonnelCount = projectPersonnel.filter(p => p.employmentType === 'Casual').length;
    return ok(c, { ...project, activePersonnelCount, casualPersonnelCount });
  });
  app.post('/api/projects', async (c) => {
    const projectData = (await c.req.json()) as Omit<Project, 'id' | 'expenses' | 'clientName' | 'status' | 'tasks' | 'photos' | 'deposits' | 'clientDocuments' | 'invoiceIds' | 'worksiteMaterials' | 'quoteIds' | 'journalEntries' | 'clientFeedback' | 'changeOrderIds' | 'planStages'>;
    if (!projectData.name || !projectData.clientId || !projectData.location) {
      return bad(c, 'name, clientId, and location are required');
    }
    const client = await ClientModel.find(c.env, projectData.clientId);
    if (!client) {
        return bad(c, 'Client does not exist');
    }
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      expenses: [],
      deposits: [],
      photos: [],
      tasks: [],
      clientDocuments: [],
      invoiceIds: [],
      worksiteMaterials: [],
      quoteIds: [],
      journalEntries: [],
      clientFeedback: [],
      changeOrderIds: [],
      planStages: [],
      clientName: client.name,
      status: 'Not Started',
      feeType: projectData.feeType || 'Percentage',
      feeValue: projectData.feeValue || 0,
    };
    const created = await ProjectModel.create(c.env, newProject);
    return ok(c, created);
  });
  app.put('/api/projects/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Project>>();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    // Sanitize updates to allow only specific fields
    const allowedUpdates: Partial<Project> = {
      name: updates.name,
      status: updates.status,
      budget: updates.budget,
      feeType: updates.feeType,
      feeValue: updates.feeValue,
      startDate: updates.startDate,
      endDate: updates.endDate,
      location: updates.location,
      gpsCoordinates: updates.gpsCoordinates,
      clientId: updates.clientId,
    };
    // Remove undefined keys
    Object.keys(allowedUpdates).forEach(key => allowedUpdates[key as keyof Project] === undefined && delete allowedUpdates[key as keyof Project]);
    await project.patch(allowedUpdates);
    return ok(c, await project.getState());
  });
  // PLAN STAGES
  app.post('/api/projects/:id/plan-stages', async (c) => {
    const { id } = c.req.param();
    const stageData = await c.req.json<Omit<PlanStage, 'id'>>();
    if (!isStr(stageData.name) || !isStr(stageData.startDate) || !isStr(stageData.endDate)) {
      return bad(c, 'name, startDate, and endDate are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const newStage = await project.addPlanStage(stageData);
    return ok(c, newStage);
  });
  app.put('/api/projects/:id/plan-stages/:stageId', async (c) => {
    const { id, stageId } = c.req.param();
    const updates = await c.req.json<Partial<PlanStage>>();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const updatedStage = await project.updatePlanStage(stageId, updates);
    if (!updatedStage) return notFound(c, 'Stage not found');
    return ok(c, updatedStage);
  });
  app.delete('/api/projects/:id/plan-stages/:stageId', async (c) => {
    const { id, stageId } = c.req.param();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    await project.deletePlanStage(stageId);
    return ok(c, { success: true });
  });
  app.post('/api/projects/:id/plan-stages/batch', async (c) => {
    const { id } = c.req.param();
    const stagesData = await c.req.json<Partial<PlanStage>[]>();
    if (!Array.isArray(stagesData)) return bad(c, 'Array of stages required');
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const newStages = await project.addPlanStages(stagesData);
    return ok(c, newStages);
  });
  // EXPENSES
  app.post('/api/projects/:id/expenses', async (c) => {
    const { id } = c.req.param();
    const expenseData = (await c.req.json()) as Omit<Expense, 'id'>;
    if (!expenseData.description || !expenseData.amount || !expenseData.category) {
      return bad(c, 'description, amount, and category are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const newExpense = await project.addExpense(expenseData);
    if (expenseData.personnelId) {
      const personnel = await PersonnelModel.findInstance(c.env, expenseData.personnelId);
      if (personnel) {
        await personnel.addExpenseId(newExpense.id);
      }
    }
    return ok(c, newExpense);
  });
  app.put('/api/projects/:id/expenses/:expenseId', async (c) => {
    const { id, expenseId } = c.req.param();
    const updates = await c.req.json<Partial<Expense>>();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const updatedExpense = await project.updateExpense(expenseId, updates);
    if (!updatedExpense) return notFound(c, 'Expense not found');
    return ok(c, updatedExpense);
  });
  // WORKSITE MATERIALS
  app.put('/api/projects/:id/worksite-materials/:materialId', async (c) => {
    const { id, materialId } = c.req.param();
    const updates = await c.req.json<Partial<WorksiteMaterialIssue>>();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const updatedMaterial = await project.updateWorksiteMaterial(materialId, updates);
    if (!updatedMaterial) return notFound(c, 'Material issue not found');
    return ok(c, updatedMaterial);
  });
  // DEPOSITS
  app.post('/api/projects/:id/deposits', async (c) => {
    const { id } = c.req.param();
    const depositData = (await c.req.json()) as Omit<Deposit, 'id'>;
    if (!depositData.amount || !depositData.date) {
      return bad(c, 'amount and date are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const newDeposit = await project.addDeposit(depositData);
    return ok(c, newDeposit);
  });
  // PHOTOS
  app.post('/api/projects/:id/photos', async (c) => {
    const { id } = c.req.param();
    const photoData = (await c.req.json()) as Omit<ProgressPhoto, 'id'>;
    if (!photoData.url || !photoData.description) {
      return bad(c, 'url and description are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const newPhoto = await project.addPhoto(photoData);
    return ok(c, newPhoto);
  });
  // TASKS
  app.post('/api/projects/:id/tasks', async (c) => {
    const { id } = c.req.param();
    const taskData = (await c.req.json()) as Omit<Task, 'id' | 'status'>;
    if (!isStr(taskData.description) || !isStr(taskData.dueDate)) {
      return bad(c, 'description and dueDate are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    // Resolve assignee name if provided
    let assigneeName: string | undefined;
    if (taskData.assigneeId && taskData.assigneeType) {
      if (taskData.assigneeType === 'SubContractor') {
        const entity = await SubContractorModel.find(c.env, taskData.assigneeId);
        assigneeName = entity?.name;
      } else if (taskData.assigneeType === 'Supplier') {
        const entity = await SupplierModel.find(c.env, taskData.assigneeId);
        assigneeName = entity?.name;
      } else if (taskData.assigneeType === 'Personnel') {
        const entity = await PersonnelModel.find(c.env, taskData.assigneeId);
        assigneeName = entity?.name;
      } else if (taskData.assigneeType === 'Tool') {
        const entity = await ToolModel.find(c.env, taskData.assigneeId);
        assigneeName = entity?.name;
      }
    }
    // Resolve construction stage name if provided
    let constructionStageName: string | undefined;
    if (taskData.constructionStageId) {
        const stage = await ConstructionStageModel.find(c.env, taskData.constructionStageId);
        if (stage) {
            constructionStageName = stage.name;
        }
    }
    const newTask = await project.addTask({
      ...taskData,
      assigneeName,
      constructionStageName,
    });
    return ok(c, newTask);
  });
  app.put('/api/projects/:id/tasks/:taskId', async (c) => {
    const { id, taskId } = c.req.param();
    const { status } = (await c.req.json()) as { status: TaskStatus };
    if (!status || !['To Do', 'In Progress', 'Done'].includes(status)) {
      return bad(c, 'A valid status is required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const updatedTask = await project.updateTaskStatus(taskId, status);
    if (!updatedTask) {
      return notFound(c, 'Task not found');
    }
    return ok(c, updatedTask);
  });
  app.put('/api/projects/:id/tasks/:taskId/details', async (c) => {
    const { id, taskId } = c.req.param();
    const updates = await c.req.json<Partial<Task>>();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    // Resolve assignee name if ID changed
    if (updates.assigneeId && updates.assigneeType) {
      let assigneeName: string | undefined;
      if (updates.assigneeType === 'SubContractor') {
        const entity = await SubContractorModel.find(c.env, updates.assigneeId);
        assigneeName = entity?.name;
      } else if (updates.assigneeType === 'Supplier') {
        const entity = await SupplierModel.find(c.env, updates.assigneeId);
        assigneeName = entity?.name;
      } else if (updates.assigneeType === 'Personnel') {
        const entity = await PersonnelModel.find(c.env, updates.assigneeId);
        assigneeName = entity?.name;
      } else if (updates.assigneeType === 'Tool') {
        const entity = await ToolModel.find(c.env, updates.assigneeId);
        assigneeName = entity?.name;
      }
      updates.assigneeName = assigneeName;
    }
    // Resolve construction stage name if ID changed
    if (updates.constructionStageId) {
      const stage = await ConstructionStageModel.find(c.env, updates.constructionStageId);
      if (stage) {
        updates.constructionStageName = stage.name;
      }
    }
    const updatedTask = await project.updateTaskDetails(taskId, updates);
    if (!updatedTask) return notFound(c, 'Task not found');
    return ok(c, updatedTask);
  });
  // CLIENT DOCUMENTS (PORTAL)
  app.post('/api/portal/:id/documents', async (c) => {
    const { id } = c.req.param();
    const docData = (await c.req.json()) as Omit<ClientDocument, 'id' | 'uploadedAt'>;
    if (!isStr(docData.url) || !isStr(docData.description)) {
      return bad(c, 'url and description are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const newDocument = await project.addClientDocument(docData);
    return ok(c, newDocument);
  });
  // CLIENT FEEDBACK (PORTAL)
  app.post('/api/portal/:id/feedback', async (c) => {
    const { id } = c.req.param();
    const { message } = await c.req.json<{ message: string }>();
    if (!isStr(message)) {
      return bad(c, 'Message is required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const feedback = await project.addClientFeedback({
      message,
      date: new Date().toISOString(),
      isRead: false,
    });
    return ok(c, feedback);
  });
  // CONTRACTOR FEEDBACK RESPONSE
  app.post('/api/projects/:id/feedback/:feedbackId/respond', async (c) => {
    const { id, feedbackId } = c.req.param();
    const { response } = await c.req.json<{ response: string }>();
    if (!isStr(response)) return bad(c, 'Response is required');
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const updatedFeedback = await project.respondToFeedback(feedbackId, response);
    if (!updatedFeedback) return notFound(c, 'Feedback not found');
    return ok(c, updatedFeedback);
  });
  app.put('/api/projects/:id/feedback/:feedbackId/acknowledge', async (c) => {
    const { id, feedbackId } = c.req.param();
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const updatedFeedback = await project.acknowledgeFeedback(feedbackId);
    if (!updatedFeedback) return notFound(c, 'Feedback not found');
    return ok(c, updatedFeedback);
  });
  // PORTAL RESOURCES
  app.get('/api/portal/:id/resources', async (c) => {
    const { id } = c.req.param();
    const allTools = await ToolModel.all(c.env);
    const allPersonnel = await PersonnelModel.all(c.env);
    const projectTools = allTools
      .filter(t => t.locationType === 'Project' && t.locationId === id)
      .map(t => ({ name: t.name, category: t.category, imageUrl: t.imageUrl }));
    const projectPersonnel = allPersonnel
      .filter(p => p.locationType === 'Project' && p.locationId === id)
      .map(p => ({ name: p.name, role: p.role }));
    const resources: PortalResources = {
      tools: projectTools,
      personnel: projectPersonnel
    };
    return ok(c, resources);
  });
  // PROJECT JOURNAL
  app.post('/api/projects/:id/journal', async (c) => {
    const { id } = c.req.param();
    const entryData = await c.req.json<Omit<JournalEntry, 'id'>>();
    if (!isStr(entryData.content) || !isStr(entryData.date) || !isStr(entryData.author)) {
      return bad(c, 'content, date, and author are required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) {
      return notFound(c, 'Project not found');
    }
    const newEntry = await project.addJournalEntry(entryData);
    return ok(c, newEntry);
  });
  // CLIENTS
  app.get('/api/clients', async (c) => {
    const clients = await ClientModel.all(c.env);
    return ok(c, clients);
  });
  app.post('/api/clients', async (c) => {
    const clientData = (await c.req.json()) as Omit<Client, 'id'>;
    if (!isStr(clientData.name) || !isStr(clientData.email) || !isStr(clientData.phone)) {
      return bad(c, 'name, email, and phone are required');
    }
    const newClient: Client = {
      ...clientData,
      id: crypto.randomUUID(),
    };
    const created = await ClientModel.create(c.env, newClient);
    return ok(c, created);
  });
  app.put('/api/clients/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Client>>();
    const client = await ClientModel.findInstance(c.env, id);
    if (!client) return notFound(c, 'Client not found');
    await client.patch(updates);
    return ok(c, await client.getState());
  });
  // CLIENT STATEMENT
  app.get('/api/clients/:id/statement', async (c) => {
    const { id } = c.req.param();
    const { startDate, endDate } = c.req.query();
    const client = await ClientModel.find(c.env, id);
    if (!client) {
      return notFound(c, 'Client not found');
    }
    const allProjects = await ProjectModel.all(c.env);
    const clientProjects = allProjects.filter(p => p.clientId === id);
    const transactions: ClientStatementTransaction[] = [];
    let totalExpenses = 0;
    let totalDeposits = 0;
    // Helper to check date range inclusively
    const isWithinRange = (dateStr: string) => {
      const d = new Date(dateStr).getTime();
      let start = 0;
      let end = Number.MAX_SAFE_INTEGER;
      if (startDate) {
        start = new Date(startDate).getTime();
      }
      if (endDate) {
        // Set end date to the very end of that day (23:59:59.999)
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        end = e.getTime();
      }
      return d >= start && d <= end;
    };
    for (const project of clientProjects) {
      project.expenses.forEach(expense => {
        if (isWithinRange(expense.date)) {
          transactions.push({
            date: expense.date,
            project: project.name,
            description: expense.description,
            type: 'Expense',
            amount: expense.amount,
          });
          totalExpenses += expense.amount;
        }
      });
      project.deposits.forEach(deposit => {
        if (isWithinRange(deposit.date)) {
          transactions.push({
            date: deposit.date,
            project: project.name,
            description: deposit.description || 'Client Deposit',
            type: 'Deposit',
            amount: deposit.amount,
          });
          totalDeposits += deposit.amount;
        }
      });
    }
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const statement: ClientStatement = {
      client,
      summary: {
        totalExpenses,
        totalDeposits,
        balance: totalDeposits - totalExpenses,
      },
      transactions,
    };
    return ok(c, statement);
  });
  // WORKSHOPS
  app.get('/api/workshops', async (c) => {
    const workshops = await WorkshopModel.all(c.env);
    return ok(c, workshops);
  });
  app.post('/api/workshops', async (c) => {
    const workshopData = await c.req.json<Omit<Workshop, 'id'>>();
    if (!isStr(workshopData.name) || !isStr(workshopData.location)) {
      return bad(c, 'name and location are required');
    }
    const newWorkshop: Workshop = { ...workshopData, id: crypto.randomUUID() };
    const created = await WorkshopModel.create(c.env, newWorkshop);
    return ok(c, created);
  });
  // TOOLS
  app.get('/api/tools', async (c) => {
    const tools = await ToolModel.all(c.env);
    return ok(c, tools);
  });
  app.post('/api/tools', async (c) => {
    const toolData = (await c.req.json()) as Omit<Tool, 'id'>;
    if (!isStr(toolData.name) || !isStr(toolData.category) || !isStr(toolData.status)) {
      return bad(c, 'name, category, and status are required');
    }
    // Resolve location name if ID provided
    let locationName = toolData.locationName;
    if (toolData.locationType === 'Workshop' && toolData.locationId) {
        const ws = await WorkshopModel.find(c.env, toolData.locationId);
        if (ws) locationName = ws.name;
    } else if (toolData.locationType === 'Project' && toolData.locationId) {
        const proj = await ProjectModel.find(c.env, toolData.locationId);
        if (proj) locationName = proj.name;
    }
    const newTool: Tool = {
        ...toolData,
        id: crypto.randomUUID(),
        locationName,
        imageUrl: toolData.imageUrl || "",
        properties: toolData.properties || []
    };
    const created = await ToolModel.create(c.env, newTool);
    return ok(c, created);
  });
  app.put('/api/tools/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Tool>>();
    const tool = await ToolModel.findInstance(c.env, id);
    if (!tool) return notFound(c, 'Tool not found');
    // Resolve location name if changing
    if (updates.locationType && updates.locationId) {
        if (updates.locationType === 'Project') {
            const p = await ProjectModel.find(c.env, updates.locationId);
            if (p) updates.locationName = p.name;
        } else if (updates.locationType === 'Workshop') {
            const w = await WorkshopModel.find(c.env, updates.locationId);
            if (w) updates.locationName = w.name;
        } else {
            updates.locationName = 'Other';
        }
    }
    await tool.patch(updates);
    return ok(c, await tool.getState());
  });
  // SUBCONTRACTORS
  app.get('/api/subcontractors', async (c) => {
    const subcontractors = await SubContractorModel.all(c.env);
    return ok(c, subcontractors);
  });
  app.post('/api/subcontractors', async (c) => {
    const scData = (await c.req.json()) as Omit<SubContractor, 'id'>;
    if (!isStr(scData.name) || !isStr(scData.specialization) || !isStr(scData.email) || !isStr(scData.phone)) {
      return bad(c, 'name, specialization, email, and phone are required');
    }
    const newSc: SubContractor = { ...scData, id: crypto.randomUUID() };
    const created = await SubContractorModel.create(c.env, newSc);
    return ok(c, created);
  });
  // SUPPLIERS
  app.get('/api/suppliers', async (c) => {
    const suppliers = await SupplierModel.all(c.env);
    return ok(c, suppliers);
  });
  app.get('/api/suppliers/:id', async (c) => {
    const { id } = c.req.param();
    const supplier = await SupplierModel.find(c.env, id);
    if (!supplier) return notFound(c, 'Supplier not found');
    return ok(c, supplier);
  });
  app.get('/api/suppliers/:id/quotes', async (c) => {
    const { id } = c.req.param();
    const allQuotes = await QuoteModel.all(c.env);
    const supplierQuotes = allQuotes.filter(q => q.supplierId === id);
    return ok(c, supplierQuotes);
  });
  app.post('/api/suppliers', async (c) => {
    const supplierData = (await c.req.json()) as Omit<Supplier, 'id' | 'materials'>;
    if (!isStr(supplierData.name) || !isStr(supplierData.contactPerson) || !isStr(supplierData.email) || !isStr(supplierData.phone)) {
      return bad(c, 'name, contactPerson, email, and phone are required');
    }
    const newSupplier: Supplier = {
      ...supplierData,
      id: crypto.randomUUID(),
      materials: [],
      category: supplierData.category || '',
      constructionStages: supplierData.constructionStages || [],
      supplyReach: supplierData.supplyReach || 'Local',
      supplyRadiusKm: supplierData.supplyRadiusKm,
    };
    const created = await SupplierModel.create(c.env, newSupplier);
    return ok(c, created);
  });
  app.put('/api/suppliers/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Supplier>>();
    const supplier = await SupplierModel.findInstance(c.env, id);
    if (!supplier) return notFound(c, 'Supplier not found');
    await supplier.patch(updates);
    return ok(c, await supplier.getState());
  });
  // DYNAMIC CATEGORIES
  app.get('/api/supplier-categories', async (c) => {
    const categories = await SupplierCategoryModel.all(c.env);
    return ok(c, categories);
  });
  app.post('/api/supplier-categories', async (c) => {
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const newCategory: SupplierCategory = { id: crypto.randomUUID(), name };
    const created = await SupplierCategoryModel.create(c.env, newCategory);
    return ok(c, created);
  });
  app.put('/api/supplier-categories/:id', async (c) => {
    const { id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const category = await SupplierCategoryModel.findInstance(c.env, id);
    if (!category) return notFound(c);
    await category.patch({ name });
    return ok(c, await category.getState());
  });
  app.delete('/api/supplier-categories/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await SupplierCategoryModel.delete(c.env, id);
    if (!deleted) return notFound(c);
    return ok(c, { success: true });
  });
  app.get('/api/construction-stages', async (c) => {
    const stages = await ConstructionStageModel.all(c.env);
    return ok(c, stages);
  });
  app.post('/api/construction-stages', async (c) => {
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const newStage: ConstructionStage = { id: crypto.randomUUID(), name };
    const created = await ConstructionStageModel.create(c.env, newStage);
    return ok(c, created);
  });
  app.put('/api/construction-stages/:id', async (c) => {
    const { id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const stage = await ConstructionStageModel.findInstance(c.env, id);
    if (!stage) return notFound(c);
    await stage.patch({ name });
    return ok(c, await stage.getState());
  });
  app.delete('/api/construction-stages/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await ConstructionStageModel.delete(c.env, id);
    if (!deleted) return notFound(c);
    return ok(c, { success: true });
  });
  app.get('/api/expense-categories', async (c) => {
    const categories = await ExpenseCategoryModel.all(c.env);
    return ok(c, categories);
  });
  app.post('/api/expense-categories', async (c) => {
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const newCategory: ExpenseCategory = { id: crypto.randomUUID(), name };
    const created = await ExpenseCategoryModel.create(c.env, newCategory);
    return ok(c, created);
  });
  app.put('/api/expense-categories/:id', async (c) => {
    const { id } = c.req.param();
    const { name } = await c.req.json<{ name: string }>();
    if (!isStr(name)) return bad(c, 'Name is required');
    const category = await ExpenseCategoryModel.findInstance(c.env, id);
    if (!category) return notFound(c);
    await category.patch({ name });
    return ok(c, await category.getState());
  });
  app.delete('/api/expense-categories/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await ExpenseCategoryModel.delete(c.env, id);
    if (!deleted) return notFound(c);
    return ok(c, { success: true });
  });
  // MATERIALS
  app.get('/api/materials', async (c) => {
    const materials = await MaterialModel.all(c.env);
    return ok(c, materials);
  });
  app.post('/api/materials', async (c) => {
    const materialData = (await c.req.json()) as Omit<Material, 'id'>;
    if (!isStr(materialData.name) || !isStr(materialData.unit) || typeof materialData.price !== 'number' || !isStr(materialData.supplierId)) {
      return bad(c, 'name, unit, price, and supplierId are required');
    }
    const supplier = await SupplierModel.findInstance(c.env, materialData.supplierId);
    if (!supplier) {
      return notFound(c, 'Supplier not found');
    }
    const newMaterial: Material = { ...materialData, id: crypto.randomUUID() };
    const created = await MaterialModel.create(c.env, newMaterial);
    await supplier.mutate(s => ({
      ...s,
      materials: [...s.materials, newMaterial],
    }));
    return ok(c, created);
  });
  // INVOICES
  app.get('/api/invoices', async (c) => {
    const invoices = await InvoiceModel.all(c.env);
    return ok(c, invoices);
  });
  app.get('/api/invoices/:id', async (c) => {
    const { id } = c.req.param();
    const invoice = await InvoiceModel.find(c.env, id);
    if (!invoice) {
      return notFound(c, 'Invoice not found');
    }
    return ok(c, invoice);
  });
  app.post('/api/invoices', async (c) => {
    const invoiceData = (await c.req.json()) as Omit<Invoice, 'id' | 'invoiceNumber' | 'clientName' | 'projectName'>;
    const project = await ProjectModel.findInstance(c.env, invoiceData.projectId);
    if (!project) {
      return bad(c, 'Project not found');
    }
    const projectState = await project.getState();
    const allInvoices = await InvoiceModel.all(c.env);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: crypto.randomUUID(),
      invoiceNumber: `INV-${String(allInvoices.length + 1).padStart(4, '0')}`,
      projectName: projectState.name,
      clientName: projectState.clientName,
    };
    const created = await InvoiceModel.create(c.env, newInvoice);
    await project.addInvoiceId(created.id);
    const expenseIdsToMark = invoiceData.lineItems
      .filter(item => item.sourceType === 'expense' && item.sourceId)
      .map(item => item.sourceId as string);
    if (expenseIdsToMark.length > 0) {
      await project.markExpensesAsInvoiced(expenseIdsToMark);
    }
    const inventoryIdsToMark = invoiceData.lineItems
      .filter(item => item.sourceType === 'inventory_issue' && item.sourceId)
      .map(item => item.sourceId as string);
    if (inventoryIdsToMark.length > 0) {
      await project.markWorksiteMaterialsAsInvoiced(inventoryIdsToMark);
    }
    return ok(c, created);
  });
  app.put('/api/invoices/:id', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: InvoiceStatus }>();
    if (!status) return bad(c, 'Status is required');
    const invoice = await InvoiceModel.findInstance(c.env, id);
    if (!invoice) {
      return notFound(c, 'Invoice not found');
    }
    const currentInvoiceState = await invoice.getState();
    if (currentInvoiceState.status === 'Paid' && status === 'Paid') {
      return ok(c, currentInvoiceState);
    }
    const paymentDetails = status === 'Paid' ? { paymentDate: new Date().toISOString(), paymentMethod: 'Client Payment' } : undefined;
    await invoice.patch({ status, paymentDetails });
    if (status === 'Paid') {
      const project = await ProjectModel.findInstance(c.env, currentInvoiceState.projectId);
      if (project) {
        await project.addDeposit({
          amount: currentInvoiceState.total,
          date: new Date().toISOString(),
          description: `Payment for Invoice ${currentInvoiceState.invoiceNumber}`,
        });
      }
    }
    return ok(c, await invoice.getState());
  });
  // TRANSACTION IMPORT
  app.post('/api/transactions/import', async (c) => {
    const transactions = await c.req.json<ImportedTransaction[]>();
    if (!Array.isArray(transactions)) {
      return bad(c, 'Request body must be an array of transactions.');
    }
    const allProjects = await ProjectModel.all(c.env);
    const projectMap = new Map(allProjects.map(p => [p.name.toLowerCase(), p]));
    let imported = 0;
    const errors: string[] = [];
    for (const t of transactions) {
      const project = projectMap.get(t.projectName.toLowerCase());
      if (!project) {
        errors.push(`Project "${t.projectName}" not found for transaction: ${t.description}`);
        continue;
      }
      const projectEntity = await ProjectModel.findInstance(c.env, project.id);
      if (!projectEntity) continue;
      const date = new Date(t.date).toISOString();
      const amountInCents = Math.round(t.amount * 100);
      if (t.type === 'Deposit') {
        await projectEntity.addDeposit({ amount: amountInCents, date });
      } else { // Expense
        await projectEntity.addExpense({
          description: t.description,
          amount: amountInCents,
          date,
          category: 'Miscellaneous', // Default category for imports
        });
      }
      imported++;
    }
    return ok(c, { imported, failed: errors.length, errors });
  });
  // FINANCIALS EXPORT
  app.get('/api/financials/export/ledger', async (c) => {
    const projects = await ProjectModel.all(c.env);
    const ledgerItems: { date: string; project: string; description: string; type: 'Income' | 'Expense'; amount: number }[] = [];
    projects.forEach(project => {
      project.deposits.forEach(deposit => {
        ledgerItems.push({ date: deposit.date, project: project.name, description: 'Client Deposit', type: 'Income', amount: deposit.amount });
      });
      project.expenses.forEach(expense => {
        ledgerItems.push({ date: expense.date, project: project.name, description: expense.description, type: 'Expense', amount: expense.amount });
      });
    });
    const sortedLedger = ledgerItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return ok(c, sortedLedger);
  });
  app.get('/api/financials/export/pnl', async (c) => {
    const projects = await ProjectModel.all(c.env);
    const generalExpenses = await GeneralExpenseModel.all(c.env);
    const totalRevenue = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalProjectExpenses = projects.flatMap(p => p.expenses).reduce((sum, e) => sum + e.amount, 0);
    const totalGeneralExpenses = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = totalProjectExpenses + totalGeneralExpenses;
    const netProfit = totalRevenue - totalExpenses;
    // Calculate breakdown
    const expenseByCategory: Record<string, number> = {};
    // Project expenses
    projects.flatMap(p => p.expenses).forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    // General expenses
    generalExpenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    return ok(c, { totalRevenue, totalExpenses, netProfit, breakdown: expenseByCategory });
  });
  app.get('/api/financials/export/balance-sheet', async (c) => {
    const projects = await ProjectModel.all(c.env);
    const generalExpenses = await GeneralExpenseModel.all(c.env);
    const workshopMaterials = await WorkshopMaterialModel.all(c.env);
    const totalRevenue = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenses = projects.flatMap(p => p.expenses).reduce((sum, e) => sum + e.amount, 0) + generalExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalDeposits = projects.flatMap(p => p.deposits).reduce((sum, d) => sum + d.amount, 0);
    const cash = totalDeposits - totalExpenses;
    const accountsReceivable = totalRevenue - totalDeposits;
    // Calculate inventory value
    const inventoryValue = workshopMaterials.reduce((sum, m) => sum + (m.quantity * (m.costPerUnit || 0)), 0);
    const totalAssets = cash + accountsReceivable + inventoryValue;
    const totalLiabilities = 0;
    const equity = totalAssets - totalLiabilities;
    return ok(c, { cash, accountsReceivable, inventoryAssets: inventoryValue, totalAssets, totalLiabilities, equity });
  });
  // CRON JOB FOR WEEKLY REPORTS
  app.post('/api/cron/send-weekly-reports', async (c) => {
    console.log('[CRON] Starting weekly report job...');
    const allProjects = await ProjectModel.all(c.env);
    const activeProjects = allProjects.filter(p => p.status === 'In Progress');
    let reportsSent = 0;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    for (const project of activeProjects) {
      const client = await ClientModel.findInstance(c.env, project.clientId);
      if (!client) {
        console.warn(`[CRON] Client ${project.clientId} for project ${project.name} not found. Skipping.`);
        continue;
      }
      const clientState = await client.getState();
      const lastSent = clientState.lastWeeklyReportSent ? new Date(clientState.lastWeeklyReportSent) : null;
      if (lastSent && lastSent > sevenDaysAgo) {
        console.log(`[CRON] Report for ${project.name} (Client: ${clientState.name}) already sent recently. Skipping.`);
        continue;
      }
      // Simulate sending email
      console.log(`[CRON] SIMULATING EMAIL to ${clientState.email}`);
      console.log(`  Subject: Weekly Progress Report for ${project.name}`);
      console.log(`  Body: Hi ${clientState.name}, here is your weekly update...`);
      // Update client's last sent timestamp
      await client.patch({ lastWeeklyReportSent: now.toISOString() });
      console.log(`[CRON] Successfully sent report for project ${project.name} and updated client timestamp.`);
      reportsSent++;
    }
    console.log(`[CRON] Weekly report job finished. Sent ${reportsSent} reports.`);
    return ok(c, { message: `Weekly report job finished. Sent ${reportsSent} reports.` });
  });
  // WORKSHOP INVENTORY
  app.get('/api/workshop-materials', async (c) => {
    const { workshopId } = c.req.query();
    const materials = await WorkshopMaterialModel.all(c.env);
    if (workshopId) {
        return ok(c, materials.filter(m => m.workshopId === workshopId));
    }
    return ok(c, materials);
  });
  app.post('/api/workshop-materials', async (c) => {
    const materialData = await c.req.json<Omit<WorkshopMaterial, 'id'>>();
    if (!isStr(materialData.name) || !isStr(materialData.unit) || typeof materialData.quantity !== 'number' || !isStr(materialData.workshopId)) {
      return bad(c, 'name, unit, quantity, and workshopId are required');
    }
    // Resolve workshop name
    const workshop = await WorkshopModel.find(c.env, materialData.workshopId);
    if (!workshop) return bad(c, 'Workshop not found');
    const newMaterial: WorkshopMaterial = {
        ...materialData,
        id: crypto.randomUUID(),
        workshopName: workshop.name,
        costPerUnit: materialData.costPerUnit || 0,
        lowStockThreshold: materialData.lowStockThreshold,
        status: materialData.status || 'Available',
        imageUrl: materialData.imageUrl || "",
        properties: materialData.properties || []
    };
    const created = await WorkshopMaterialModel.create(c.env, newMaterial);
    return ok(c, created);
  });
  app.put('/api/workshop-materials/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<WorkshopMaterial>>();
    const material = await WorkshopMaterialModel.findInstance(c.env, id);
    if (!material) return notFound(c, 'Material not found');
    await material.patch(updates);
    return ok(c, await material.getState());
  });
  app.post('/api/workshop-materials/move', async (c) => {
    const { sourceMaterialId, targetWorkshopId, quantity } = await c.req.json<{ sourceMaterialId: string, targetWorkshopId: string, quantity: number }>();
    if (!isStr(sourceMaterialId) || !isStr(targetWorkshopId) || quantity <= 0) {
        return bad(c, 'Invalid parameters');
    }
    const sourceMaterial = await WorkshopMaterialModel.findInstance(c.env, sourceMaterialId);
    if (!sourceMaterial) return notFound(c, 'Source material not found');
    const sourceState = await sourceMaterial.getState();
    if (sourceState.quantity < quantity) {
        return bad(c, 'Insufficient quantity');
    }
    const targetWorkshop = await WorkshopModel.find(c.env, targetWorkshopId);
    if (!targetWorkshop) return notFound(c, 'Target workshop not found');
    // Deduct from source with hardening
    await sourceMaterial.mutate(s => {
        const currentQty = typeof s.quantity === 'number' ? s.quantity : 0;
        const newQty = Math.max(0, currentQty - quantity);
        return { ...s, quantity: newQty };
    });
    // Find or create target material
    const allMaterials = await WorkshopMaterialModel.all(c.env);
    const targetMaterial = allMaterials.find(m => m.workshopId === targetWorkshopId && m.name === sourceState.name && m.unit === sourceState.unit);
    if (targetMaterial) {
        const targetInstance = await WorkshopMaterialModel.findInstance(c.env, targetMaterial.id);
        if (targetInstance) {
            // Add to target with hardening
            await targetInstance.mutate(s => {
                const currentQty = typeof s.quantity === 'number' ? s.quantity : 0;
                const newQty = currentQty + quantity;
                return { ...s, quantity: newQty };
            });
        }
    } else {
        await WorkshopMaterialModel.create(c.env, {
            id: crypto.randomUUID(),
            workshopId: targetWorkshopId,
            workshopName: targetWorkshop.name,
            name: sourceState.name,
            unit: sourceState.unit,
            quantity: quantity,
            costPerUnit: sourceState.costPerUnit,
            lowStockThreshold: sourceState.lowStockThreshold,
            status: 'Available',
            imageUrl: sourceState.imageUrl,
            properties: sourceState.properties
        });
    }
    return ok(c, { success: true });
  });
  app.post('/api/projects/:id/issue-material', async (c) => {
    const { id } = c.req.param();
    const { workshopMaterialId, quantity, isBillable } = await c.req.json<{ workshopMaterialId: string; quantity: number; isBillable?: boolean }>();
    if (!isStr(workshopMaterialId) || typeof quantity !== 'number' || quantity <= 0) {
      return bad(c, 'Valid workshopMaterialId and a positive quantity are required.');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const workshopMaterial = await WorkshopMaterialModel.findInstance(c.env, workshopMaterialId);
    if (!workshopMaterial) return notFound(c, 'Workshop material not found');
    const materialState = await workshopMaterial.getState();
    if (materialState.quantity < quantity) {
      return bad(c, `Not enough stock. Available: ${materialState.quantity}`);
    }
    // Update workshop inventory with hardening
    await workshopMaterial.mutate(s => {
        const currentQty = typeof s.quantity === 'number' ? s.quantity : 0;
        const newQty = Math.max(0, currentQty - quantity);
        return { ...s, quantity: newQty };
    });
    // Add to project's issued materials
    const issue = await project.addWorksiteMaterial({
      workshopMaterialId,
      materialName: materialState.name,
      quantity,
      unit: materialState.unit,
      issueDate: new Date().toISOString(),
      unitCost: materialState.costPerUnit || 0,
      isBillable: !!isBillable,
      invoiced: false,
      unusedQuantity: 0,
      imageUrl: materialState.imageUrl // Add this
    });
    return ok(c, issue);
  });
  // PERSONNEL
  app.get('/api/personnel', async (c) => {
    const personnel = await PersonnelModel.all(c.env);
    return ok(c, personnel);
  });
  app.post('/api/personnel', async (c) => {
    const personnelData = await c.req.json<Omit<Personnel, 'id' | 'associatedExpenseIds'>>();
    if (!isStr(personnelData.name) || !isStr(personnelData.role) || !isStr(personnelData.email) || !isStr(personnelData.phone)) {
      return bad(c, 'name, role, email, and phone are required');
    }
    // Resolve location name
    let locationName = personnelData.locationName || '';
    if (personnelData.locationType === 'Project' && personnelData.locationId) {
        const p = await ProjectModel.find(c.env, personnelData.locationId);
        if (p) locationName = p.name;
    } else if (personnelData.locationType === 'Workshop' && personnelData.locationId) {
        const w = await WorkshopModel.find(c.env, personnelData.locationId);
        if (w) locationName = w.name;
    }
    const newPersonnel: Personnel = {
      ...personnelData,
      id: crypto.randomUUID(),
      associatedExpenseIds: [],
      daysOff: [],
      nextOfKin: (personnelData.nextOfKin || []).map(nok => ({ ...nok, id: crypto.randomUUID() })),
      specialization: personnelData.specialization || '',
      currentLocation: personnelData.currentLocation || '',
      locationType: personnelData.locationType || 'Other',
      locationId: personnelData.locationId || '',
      locationName: locationName,
    };
    const created = await PersonnelModel.create(c.env, newPersonnel);
    return ok(c, created);
  });
  app.put('/api/personnel/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<Personnel>>();
    const personnel = await PersonnelModel.findInstance(c.env, id);
    if (!personnel) return notFound(c, 'Personnel not found');
    // Resolve location name if changing
    if (updates.locationType && updates.locationId) {
        if (updates.locationType === 'Project') {
            const p = await ProjectModel.find(c.env, updates.locationId);
            if (p) updates.locationName = p.name;
        } else if (updates.locationType === 'Workshop') {
            const w = await WorkshopModel.find(c.env, updates.locationId);
            if (w) updates.locationName = w.name;
        } else {
            updates.locationName = 'Other';
        }
    }
    await personnel.patch(updates);
    return ok(c, await personnel.getState());
  });
  app.post('/api/personnel/:id/days-off', async (c) => {
    const { id } = c.req.param();
    const dayOffData = await c.req.json<Omit<DayOff, 'id'>>();
    if (!isStr(dayOffData.startDate) || !isStr(dayOffData.endDate) || !isStr(dayOffData.reason)) {
      return bad(c, 'startDate, endDate, and reason are required');
    }
    const personnel = await PersonnelModel.findInstance(c.env, id);
    if (!personnel) {
      return notFound(c, 'Personnel not found');
    }
    const newDayOff = await personnel.addDaysOff(dayOffData);
    return ok(c, newDayOff);
  });
  // GENERAL EXPENSES
  app.get('/api/general-expenses', async (c) => {
    const expenses = await GeneralExpenseModel.all(c.env);
    return ok(c, expenses);
  });
  app.post('/api/general-expenses', async (c) => {
    const expenseData = await c.req.json<Omit<GeneralExpense, 'id'>>();
    if (!isStr(expenseData.description) || typeof expenseData.amount !== 'number' || !isStr(expenseData.date) || !isStr(expenseData.category)) {
      return bad(c, 'description, amount, date, and category are required');
    }
    const newExpense: GeneralExpense = { ...expenseData, id: crypto.randomUUID() };
    const created = await GeneralExpenseModel.create(c.env, newExpense);
    return ok(c, created);
  });
  // GENERAL INCOME
  app.get('/api/general-income', async (c) => {
    const income = await GeneralIncomeModel.all(c.env);
    return ok(c, income);
  });
  app.post('/api/general-income', async (c) => {
    const incomeData = await c.req.json<Omit<GeneralIncome, 'id'>>();
    if (!isStr(incomeData.description) || typeof incomeData.amount !== 'number' || !isStr(incomeData.date) || !isStr(incomeData.category)) {
      return bad(c, 'description, amount, date, and category are required');
    }
    const newIncome: GeneralIncome = { ...incomeData, id: crypto.randomUUID() };
    const created = await GeneralIncomeModel.create(c.env, newIncome);
    return ok(c, created);
  });
  // RETURN MATERIAL
  app.post('/api/projects/:id/return-material', async (c) => {
    const { id } = c.req.param();
    const { worksiteMaterialId, quantity } = await c.req.json<{ worksiteMaterialId: string; quantity: number }>();
    if (!isStr(worksiteMaterialId) || typeof quantity !== 'number' || quantity <= 0) {
      return bad(c, 'Valid worksiteMaterialId and positive quantity required');
    }
    const project = await ProjectModel.findInstance(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const projectState = await project.getState();
    const issue = projectState.worksiteMaterials?.find(m => m.id === worksiteMaterialId);
    if (!issue) return notFound(c, 'Material issue record not found in project');
    if (issue.quantity < quantity) return bad(c, 'Cannot return more than issued quantity');
    const workshopMaterial = await WorkshopMaterialModel.findInstance(c.env, issue.workshopMaterialId);
    if (!workshopMaterial) return notFound(c, 'Original workshop material not found');
    // 1. Update Workshop Material (Increment)
    await workshopMaterial.mutate(s => ({
        ...s,
        quantity: s.quantity + quantity
    }));
    // 2. Update Project Issue (Decrement)
    await project.mutate(s => ({
        ...s,
        worksiteMaterials: s.worksiteMaterials.map(m =>
            m.id === worksiteMaterialId
                ? { ...m, quantity: m.quantity - quantity }
                : m
        )
    }));
    return ok(c, { success: true });
  });
  // QUOTES
  app.get('/api/projects/:id/quotes', async (c) => {
    const { id } = c.req.param();
    const project = await ProjectModel.find(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const quoteIds = project.quoteIds || [];
    const quotes: Quote[] = [];
    for (const qId of quoteIds) {
      const quote = await QuoteModel.find(c.env, qId);
      if (quote) quotes.push(quote);
    }
    return ok(c, quotes);
  });
  app.post('/api/quotes', async (c) => {
    const quoteData = await c.req.json<Omit<Quote, 'id' | 'status' | 'date' | 'supplierName'>>();
    if (!isStr(quoteData.projectId) || !isStr(quoteData.supplierId)) {
      return bad(c, 'projectId and supplierId are required');
    }
    const project = await ProjectModel.findInstance(c.env, quoteData.projectId);
    if (!project) return notFound(c, 'Project not found');
    const supplier = await SupplierModel.find(c.env, quoteData.supplierId);
    if (!supplier) return notFound(c, 'Supplier not found');
    const newQuote: Quote = {
      ...quoteData,
      id: crypto.randomUUID(),
      supplierName: supplier.name,
      status: 'Pending',
      date: new Date().toISOString(),
      items: quoteData.items.map(item => ({ ...item, id: crypto.randomUUID() })),
    };
    const created = await QuoteModel.create(c.env, newQuote);
    await project.addQuoteId(created.id);
    return ok(c, created);
  });
  app.put('/api/quotes/:id', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: QuoteStatus }>();
    if (!status) return bad(c, 'Status is required');
    const quote = await QuoteModel.findInstance(c.env, id);
    if (!quote) return notFound(c, 'Quote not found');
    await quote.patch({ status });
    return ok(c, await quote.getState());
  });
  // CHANGE ORDERS
  app.get('/api/projects/:id/change-orders', async (c) => {
    const { id } = c.req.param();
    const project = await ProjectModel.find(c.env, id);
    if (!project) return notFound(c, 'Project not found');
    const changeOrderIds = project.changeOrderIds || [];
    const changeOrders: ChangeOrder[] = [];
    for (const coId of changeOrderIds) {
      const co = await ChangeOrderModel.find(c.env, coId);
      if (co) changeOrders.push(co);
    }
    return ok(c, changeOrders);
  });
  app.post('/api/change-orders', async (c) => {
    const coData = await c.req.json<Omit<ChangeOrder, 'id' | 'status' | 'date'>>();
    if (!isStr(coData.projectId) || !isStr(coData.title)) {
      return bad(c, 'projectId and title are required');
    }
    const project = await ProjectModel.findInstance(c.env, coData.projectId);
    if (!project) return notFound(c, 'Project not found');
    const newChangeOrder: ChangeOrder = {
      ...coData,
      id: crypto.randomUUID(),
      status: 'Draft',
      date: new Date().toISOString(),
      items: coData.items.map(item => ({ ...item, id: crypto.randomUUID() })),
    };
    const created = await ChangeOrderModel.create(c.env, newChangeOrder);
    await project.addChangeOrderId(created.id);
    return ok(c, created);
  });
  app.put('/api/change-orders/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json<{ status: ChangeOrderStatus }>();
    if (!status) return bad(c, 'Status is required');
    const co = await ChangeOrderModel.findInstance(c.env, id);
    if (!co) return notFound(c, 'Change Order not found');
    await co.patch({ status });
    return ok(c, await co.getState());
  });
  // PROJECT TEMPLATES
  app.get('/api/project-templates', async (c) => {
    const templates = await ProjectTemplateModel.all(c.env);
    return ok(c, templates);
  });
  app.post('/api/project-templates', async (c) => {
    const data = await c.req.json<Omit<ProjectTemplate, 'id'>>();
    if (!isStr(data.name)) return bad(c, 'Name is required');
    const newTemplate: ProjectTemplate = {
        ...data,
        id: crypto.randomUUID(),
        stages: (data.stages || []).map(s => ({
            ...s,
            id: s.id || crypto.randomUUID(),
            dependencies: s.dependencies || []
        }))
    };
    const created = await ProjectTemplateModel.create(c.env, newTemplate);
    return ok(c, created);
  });
  app.put('/api/project-templates/:id', async (c) => {
    const { id } = c.req.param();
    const updates = await c.req.json<Partial<ProjectTemplate>>();
    const template = await ProjectTemplateModel.findInstance(c.env, id);
    if (!template) return notFound(c, 'Template not found');
    await template.patch(updates);
    return ok(c, await template.getState());
  });
  app.delete('/api/project-templates/:id', async (c) => {
    const { id } = c.req.param();
    const deleted = await ProjectTemplateModel.delete(c.env, id);
    if (!deleted) return notFound(c, 'Template not found');
    return ok(c, { success: true });
  });
}