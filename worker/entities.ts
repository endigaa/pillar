import { IndexedEntity, Entity } from "./core-utils";
import type { Env } from "./core-utils";
import type { Client, Project, Expense, Deposit, ProgressPhoto, Tool, SubContractor, Supplier, Material, Task, TaskStatus, ClientDocument, CompanyProfile, Invoice, SupplierCategory, ConstructionStage, ExpenseCategory, WorkshopMaterial, WorksiteMaterialIssue, Personnel, DayOff, GeneralExpense, NextOfKin, Quote, JournalEntry, ClientFeedback, ChangeOrder, PlanStage, Workshop } from "@shared/types";
import { MOCK_CLIENTS, MOCK_PROJECTS, MOCK_SUPPLIER_CATEGORIES, MOCK_CONSTRUCTION_STAGES, MOCK_EXPENSE_CATEGORIES, MOCK_WORKSHOP_MATERIALS, MOCK_PERSONNEL, MOCK_GENERAL_EXPENSES, MOCK_WORKSHOPS, MOCK_PROJECT_TEMPLATES } from "@shared/mock-data";
import type { ProjectTemplate } from "@shared/types";
// COMPANY PROFILE ENTITY (Singleton)
export class CompanyProfileEntity extends Entity<CompanyProfile> {
  static readonly entityName = "companyProfile";
  static readonly initialState: CompanyProfile = {
    companyName: "Pillar Construction",
    address: "123 Builder Lane, Constructville, USA",
    phone: "555-010-0000",
    email: "contact@pillar.com",
    logoUrl: "", // Default empty, user can set it
    financialYearStartMonth: 1,
    financialYearStartDay: 1,
    currency: "USD",
  };
  // Use a fixed ID for the singleton instance
  constructor(env: Env) {
    super(env, "singleton");
  }
  // Static getter to easily access the singleton instance
  static get(env: Env): CompanyProfileEntity {
    return new CompanyProfileEntity(env);
  }
  // Ensure seed data is present on first load
  static async ensureSeed(env: Env): Promise<void> {
    const profile = this.get(env);
    if (!(await profile.exists())) {
      await profile.save(this.initialState);
    }
  }
}
// CLIENT ENTITY
export class ClientEntity extends IndexedEntity<Client> {
  static readonly entityName = "client";
  static readonly indexName = "clients";
  static readonly initialState: Client = { id: "", name: "", email: "", phone: "", notes: "", lastWeeklyReportSent: undefined };
  static seedData = MOCK_CLIENTS;
}
// PROJECT ENTITY
export class ProjectEntity extends IndexedEntity<Project> {
  static readonly entityName = "project";
  static readonly indexName = "projects";
  static readonly initialState: Project = {
    id: "",
    name: "",
    clientId: "",
    clientName: "",
    budget: 0,
    contractorFeePercentage: 0,
    feeType: 'Percentage',
    feeValue: 0,
    startDate: "",
    endDate: "",
    location: "",
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
    status: 'Not Started',
  };
  static seedData = MOCK_PROJECTS.map(p => ({ ...p, planStages: [] })); // Ensure mock data has planStages
  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      expenses: [...s.expenses, newExpense],
    }));
    return newExpense;
  }
  async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense | null> {
    let updatedExpense: Expense | null = null;
    await this.mutate(s => {
      const idx = s.expenses.findIndex(e => e.id === expenseId);
      if (idx === -1) return s;
      const expenses = [...s.expenses];
      updatedExpense = { ...expenses[idx], ...updates };
      expenses[idx] = updatedExpense;
      return { ...s, expenses };
    });
    return updatedExpense;
  }
  async addDeposit(deposit: Omit<Deposit, 'id'>): Promise<Deposit> {
    const newDeposit: Deposit = { ...deposit, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      deposits: [...s.deposits, newDeposit],
    }));
    return newDeposit;
  }
  async addPhoto(photo: Omit<ProgressPhoto, 'id'>): Promise<ProgressPhoto> {
    const newPhoto: ProgressPhoto = { ...photo, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      photos: [...s.photos, newPhoto],
    }));
    return newPhoto;
  }
  async addTask(task: Omit<Task, 'id' | 'status'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'To Do',
      createdAt: new Date().toISOString()
    };
    await this.mutate(s => ({
      ...s,
      tasks: [...s.tasks, newTask],
    }));
    return newTask;
  }
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task | null> {
    let updatedTask: Task | null = null;
    await this.mutate(s => {
      const taskIndex = s.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return s;
      const newTasks = [...s.tasks];
      updatedTask = { ...newTasks[taskIndex], status };
      newTasks[taskIndex] = updatedTask;
      return { ...s, tasks: newTasks };
    });
    return updatedTask;
  }
  async updateTaskDetails(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    let updatedTask: Task | null = null;
    await this.mutate(s => {
      const taskIndex = s.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return s;
      const currentTask = s.tasks[taskIndex];
      updatedTask = { ...currentTask, ...updates };
      const newTasks = [...s.tasks];
      newTasks[taskIndex] = updatedTask;
      return { ...s, tasks: newTasks };
    });
    return updatedTask;
  }
  async addClientDocument(doc: Omit<ClientDocument, 'id' | 'uploadedAt'>): Promise<ClientDocument> {
    const newDocument: ClientDocument = {
      ...doc,
      id: crypto.randomUUID(),
      uploadedAt: new Date().toISOString(),
    };
    await this.mutate(s => ({
      ...s,
      clientDocuments: [...(s.clientDocuments || []), newDocument],
    }));
    return newDocument;
  }
  async addInvoiceId(invoiceId: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      invoiceIds: [...s.invoiceIds, invoiceId],
    }));
  }
  async markExpensesAsInvoiced(expenseIds: string[]): Promise<void> {
    if (expenseIds.length === 0) return;
    await this.mutate(s => {
      const updatedExpenses = s.expenses.map(exp =>
        expenseIds.includes(exp.id) ? { ...exp, invoiced: true } : exp
      );
      return { ...s, expenses: updatedExpenses };
    });
  }
  async markWorksiteMaterialsAsInvoiced(issueIds: string[]): Promise<void> {
    if (issueIds.length === 0) return;
    await this.mutate(s => {
      const updatedMaterials = (s.worksiteMaterials || []).map(item =>
        issueIds.includes(item.id) ? { ...item, invoiced: true } : item
      );
      return { ...s, worksiteMaterials: updatedMaterials };
    });
  }
  async addWorksiteMaterial(issue: Omit<WorksiteMaterialIssue, 'id'>): Promise<WorksiteMaterialIssue> {
    const newIssue: WorksiteMaterialIssue = { ...issue, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      worksiteMaterials: [...(s.worksiteMaterials || []), newIssue],
    }));
    return newIssue;
  }
  async updateWorksiteMaterial(issueId: string, updates: Partial<WorksiteMaterialIssue>): Promise<WorksiteMaterialIssue | null> {
    let updatedIssue: WorksiteMaterialIssue | null = null;
    await this.mutate(s => {
      const idx = (s.worksiteMaterials || []).findIndex(m => m.id === issueId);
      if (idx === -1) return s;
      const materials = [...s.worksiteMaterials];
      updatedIssue = { ...materials[idx], ...updates };
      materials[idx] = updatedIssue;
      return { ...s, worksiteMaterials: materials };
    });
    return updatedIssue;
  }
  async addQuoteId(quoteId: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      quoteIds: [...(s.quoteIds || []), quoteId],
    }));
  }
  async addJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> {
    const newEntry: JournalEntry = { ...entry, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      journalEntries: [...(s.journalEntries || []), newEntry],
    }));
    return newEntry;
  }
  async addClientFeedback(feedback: Omit<ClientFeedback, 'id'>): Promise<ClientFeedback> {
    const newFeedback: ClientFeedback = { ...feedback, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      clientFeedback: [...(s.clientFeedback || []), newFeedback],
    }));
    return newFeedback;
  }
  async respondToFeedback(feedbackId: string, response: string): Promise<ClientFeedback | null> {
    let updatedFeedback: ClientFeedback | null = null;
    await this.mutate(s => {
      const idx = (s.clientFeedback || []).findIndex(f => f.id === feedbackId);
      if (idx === -1) return s;
      const feedbackList = [...s.clientFeedback];
      updatedFeedback = {
        ...feedbackList[idx],
        response,
        respondedAt: new Date().toISOString(),
        isRead: true, // Auto-mark as read if responding
        acknowledged: true // Auto-acknowledge if responding
      };
      feedbackList[idx] = updatedFeedback;
      return { ...s, clientFeedback: feedbackList };
    });
    return updatedFeedback;
  }
  async acknowledgeFeedback(feedbackId: string): Promise<ClientFeedback | null> {
    let updatedFeedback: ClientFeedback | null = null;
    await this.mutate(s => {
      const idx = (s.clientFeedback || []).findIndex(f => f.id === feedbackId);
      if (idx === -1) return s;
      const feedbackList = [...s.clientFeedback];
      updatedFeedback = {
        ...feedbackList[idx],
        isRead: true,
        acknowledged: true
      };
      feedbackList[idx] = updatedFeedback;
      return { ...s, clientFeedback: feedbackList };
    });
    return updatedFeedback;
  }
  async addChangeOrderId(id: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      changeOrderIds: [...(s.changeOrderIds || []), id],
    }));
  }
  async addPlanStage(stage: Omit<PlanStage, 'id'>): Promise<PlanStage> {
    const newStage: PlanStage = { ...stage, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      planStages: [...(s.planStages || []), newStage],
    }));
    return newStage;
  }
  async addPlanStages(stages: Partial<PlanStage>[]): Promise<PlanStage[]> {
    const newStages: PlanStage[] = stages.map(s => ({
      ...s,
      id: s.id || crypto.randomUUID(),
      name: s.name || 'Untitled Stage',
      startDate: s.startDate || new Date().toISOString(),
      endDate: s.endDate || new Date().toISOString(),
      status: s.status || 'Not Started',
      assignedPersonnelIds: s.assignedPersonnelIds || [],
      assignedSubContractorIds: s.assignedSubContractorIds || [],
      dependencies: s.dependencies || []
    } as PlanStage));
    await this.mutate(s => ({
      ...s,
      planStages: [...(s.planStages || []), ...newStages],
    }));
    return newStages;
  }
  async updatePlanStage(stageId: string, updates: Partial<PlanStage>): Promise<PlanStage | null> {
    let updatedStage: PlanStage | null = null;
    await this.mutate(s => {
      const idx = (s.planStages || []).findIndex(st => st.id === stageId);
      if (idx === -1) return s;
      const stages = [...s.planStages];
      updatedStage = { ...stages[idx], ...updates };
      stages[idx] = updatedStage;
      return { ...s, planStages: stages };
    });
    return updatedStage;
  }
  async deletePlanStage(stageId: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      planStages: (s.planStages || []).filter(st => st.id !== stageId),
    }));
  }
  // Override ensureState to backfill new fields for existing projects
  protected override async ensureState(): Promise<Project> {
    const s = await super.ensureState();
    let modified = false;
    const updates: Partial<Project> = {};
    if (!s.changeOrderIds) {
      updates.changeOrderIds = [];
      modified = true;
    }
    if (!s.planStages) {
      updates.planStages = [];
      modified = true;
    }
    if (modified) {
      const newState = { ...s, ...updates };
      this._state = newState;
      return newState;
    }
    return s;
  }
}
// TOOL ENTITY
export class ToolEntity extends IndexedEntity<Tool> {
  static readonly entityName = "tool";
  static readonly indexName = "tools";
  static readonly initialState: Tool = {
    id: "",
    name: "",
    category: "Miscellaneous",
    purchaseDate: "",
    status: "Available",
    locationType: "Workshop",
    locationId: "",
    locationName: "",
    imageUrl: "",
    properties: [],
  };
}
// SUBCONTRACTOR ENTITY
export class SubContractorEntity extends IndexedEntity<SubContractor> {
  static readonly entityName = "subcontractor";
  static readonly indexName = "subcontractors";
  static readonly initialState: SubContractor = {
    id: "",
    name: "",
    specialization: "",
    phone: "",
    email: "",
    location: "",
  };
}
// SUPPLIER ENTITY
export class SupplierEntity extends IndexedEntity<Supplier> {
  static readonly entityName = "supplier";
  static readonly indexName = "suppliers";
  static readonly initialState: Supplier = {
    id: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    location: "",
    materials: [],
    category: "",
    constructionStages: [],
    supplyReach: "Local",
    supplyRadiusKm: undefined,
  };
}
// MATERIAL ENTITY
export class MaterialEntity extends IndexedEntity<Material> {
  static readonly entityName = "material";
  static readonly indexName = "materials";
  static readonly initialState: Material = {
    id: "",
    supplierId: "",
    name: "",
    unit: "",
    price: 0,
  };
}
// INVOICE ENTITY
export class InvoiceEntity extends IndexedEntity<Invoice> {
  static readonly entityName = "invoice";
  static readonly indexName = "invoices";
  static readonly initialState: Invoice = {
    id: "",
    invoiceNumber: "",
    projectId: "",
    projectName: "",
    clientId: "",
    clientName: "",
    issueDate: "",
    dueDate: "",
    lineItems: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: "Draft",
  };
}
// SUPPLIER CATEGORY ENTITY
export class SupplierCategoryEntity extends IndexedEntity<SupplierCategory> {
  static readonly entityName = "supplierCategory";
  static readonly indexName = "supplierCategories";
  static readonly initialState: SupplierCategory = { id: "", name: "" };
  static seedData = MOCK_SUPPLIER_CATEGORIES;
}
// CONSTRUCTION STAGE ENTITY
export class ConstructionStageEntity extends IndexedEntity<ConstructionStage> {
  static readonly entityName = "constructionStage";
  static readonly indexName = "constructionStages";
  static readonly initialState: ConstructionStage = { id: "", name: "" };
  static seedData = MOCK_CONSTRUCTION_STAGES;
}
// EXPENSE CATEGORY ENTITY
export class ExpenseCategoryEntity extends IndexedEntity<ExpenseCategory> {
  static readonly entityName = "expenseCategory";
  static readonly indexName = "expenseCategories";
  static readonly initialState: ExpenseCategory = { id: "", name: "" };
  static seedData = MOCK_EXPENSE_CATEGORIES;
}
// WORKSHOP ENTITY
export class WorkshopEntity extends IndexedEntity<Workshop> {
  static readonly entityName = "workshop";
  static readonly indexName = "workshops";
  static readonly initialState: Workshop = { id: "", name: "", location: "", description: "" };
  static seedData = MOCK_WORKSHOPS;
}
// WORKSHOP MATERIAL ENTITY
export class WorkshopMaterialEntity extends IndexedEntity<WorkshopMaterial> {
  static readonly entityName = "workshopMaterial";
  static readonly indexName = "workshopMaterials";
  static readonly initialState: WorkshopMaterial = {
    id: "",
    workshopId: "",
    workshopName: "",
    name: "",
    quantity: 0,
    unit: "",
    imageUrl: "",
    properties: [],
  };
  static seedData = MOCK_WORKSHOP_MATERIALS;
}
// PERSONNEL ENTITY
export class PersonnelEntity extends IndexedEntity<Personnel> {
  static readonly entityName = "personnel";
  static readonly indexName = "personnel";
  static readonly initialState: Personnel = {
    id: "",
    name: "",
    role: "",
    email: "",
    phone: "",
    hireDate: "",
    separationDate: undefined,
    employmentType: 'Permanent',
    rate: 0,
    rateType: 'Annually',
    nextOfKin: [],
    associatedExpenseIds: [],
    daysOff: [],
    specialization: "",
    currentLocation: "",
    locationType: "Other",
    locationId: "",
    locationName: "",
  };
  static seedData = MOCK_PERSONNEL;
  async addExpenseId(expenseId: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      associatedExpenseIds: [...s.associatedExpenseIds, expenseId],
    }));
  }
  async addDaysOff(dayOff: Omit<DayOff, 'id'>): Promise<DayOff> {
    const newDayOff: DayOff = { ...dayOff, id: crypto.randomUUID() };
    await this.mutate(s => ({
      ...s,
      daysOff: [...(s.daysOff || []), newDayOff],
    }));
    return newDayOff;
  }
}
// GENERAL EXPENSE ENTITY
export class GeneralExpenseEntity extends IndexedEntity<GeneralExpense> {
  static readonly entityName = "generalExpense";
  static readonly indexName = "generalExpenses";
  static readonly initialState: GeneralExpense = {
    id: "",
    description: "",
    amount: 0,
    date: "",
    category: "",
  };
  static seedData = MOCK_GENERAL_EXPENSES;
}
// QUOTE ENTITY
export class QuoteEntity extends IndexedEntity<Quote> {
  static readonly entityName = "quote";
  static readonly indexName = "quotes";
  static readonly initialState: Quote = {
    id: "",
    projectId: "",
    supplierId: "",
    supplierName: "",
    items: [],
    totalAmount: 0,
    status: 'Pending',
    date: "",
    notes: "",
  };
}
// CHANGE ORDER ENTITY
export class ChangeOrderEntity extends IndexedEntity<ChangeOrder> {
  static readonly entityName = "changeOrder";
  static readonly indexName = "changeOrders";
  static readonly initialState: ChangeOrder = {
    id: "",
    projectId: "",
    title: "",
    description: "",
    items: [],
    totalAmount: 0,
    status: 'Draft',
    date: "",
  };
}
// PROJECT TEMPLATE ENTITY
export class ProjectTemplateEntity extends IndexedEntity<ProjectTemplate> {
  static readonly entityName = "projectTemplate";
  static readonly indexName = "projectTemplates";
  static readonly initialState: ProjectTemplate = {
    id: "",
    name: "",
    description: "",
    stages: [],
  };
  static seedData = MOCK_PROJECT_TEMPLATES;
}