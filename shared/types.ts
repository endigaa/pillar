export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface Tax {
  id: string;
  name: string;
  rate: number; // percentage, e.g., 7.5 for 7.5%
}
export interface Expense {
  id: string;
  description: string;
  amount: number; // in cents
  date: string; // ISO 8601
  category: string;
  taxes?: Tax[];
  workStage?: string;
  invoiced?: boolean;
  personnelId?: string;
  quantity?: number;
  unit?: string;
  unusedQuantity?: number;
}
export interface GeneralExpense {
  id: string;
  description: string;
  amount: number; // in cents
  date: string; // ISO 8601
  category: string;
}
export interface GeneralIncome {
  id: string;
  description: string;
  amount: number; // in cents
  date: string; // ISO 8601
  category: string;
}
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  lastWeeklyReportSent?: string; // ISO 8601
}
export interface ProgressPhoto {
  id: string;
  url: string;
  description: string;
  date: string; // ISO 8601
}
export interface Deposit {
  id: string;
  amount: number; // in cents
  date: string; // ISO 8601
  description?: string;
  reference?: string;
}
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type ResourceType = 'SubContractor' | 'Supplier' | 'Personnel' | 'Tool';
export interface Task {
  id: string;
  description: string;
  dueDate: string; // ISO 8601
  status: TaskStatus;
  isPublic: boolean;
  assigneeId?: string;
  assigneeType?: ResourceType;
  assigneeName?: string;
  isAssigneePublic?: boolean;
  constructionStageId?: string;
  constructionStageName?: string;
  createdAt?: string; // ISO 8601
}
export interface ClientDocument {
  id: string;
  url: string;
  description: string;
  uploadedAt: string; // ISO 8601
  tags?: string[];
}
export interface WorksiteMaterialIssue {
  id: string;
  workshopMaterialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  issueDate: string; // ISO 8601
  unitCost?: number; // in cents
  isBillable?: boolean;
  invoiced?: boolean;
  unusedQuantity?: number;
  imageUrl?: string;
}
export type QuoteStatus = 'Pending' | 'Approved' | 'Rejected';
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // in cents
}
export interface Quote {
  id: string;
  projectId: string;
  supplierId: string;
  supplierName: string;
  items: QuoteItem[];
  totalAmount: number; // in cents
  status: QuoteStatus;
  date: string; // ISO 8601
  notes?: string;
}
export interface JournalEntry {
  id: string;
  content: string;
  date: string; // ISO 8601
  author: string;
}
export interface ClientFeedback {
  id: string;
  message: string;
  date: string; // ISO 8601
  isRead: boolean;
  response?: string;
  respondedAt?: string; // ISO 8601
  acknowledged?: boolean;
}
export type ChangeOrderStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected';
export interface ChangeOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // in cents
  materialId?: string;
}
export interface ChangeOrder {
  id: string;
  projectId: string;
  title: string;
  description: string;
  items: ChangeOrderItem[];
  totalAmount: number; // in cents
  status: ChangeOrderStatus;
  date: string; // ISO 8601
}
export interface PlanStage {
  id: string;
  name: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  constructionStageId?: string;
  assignedPersonnelIds?: string[];
  assignedSubContractorIds?: string[];
  dependencies?: string[]; // Array of stage IDs that this stage depends on
}
export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string; // denormalized for easier display
  budget: number; // in cents
  contractorFeePercentage?: number; // Deprecated in favor of feeType/feeValue
  feeType: 'Percentage' | 'Fixed';
  feeValue: number; // Percentage (e.g. 15) or Fixed Amount in Cents
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  location: string;
  gpsCoordinates?: { lat: number; lon: number; };
  expenses: Expense[];
  photos: ProgressPhoto[];
  deposits: Deposit[];
  tasks: Task[];
  clientDocuments: ClientDocument[];
  invoiceIds: string[];
  worksiteMaterials: WorksiteMaterialIssue[];
  quoteIds: string[];
  journalEntries: JournalEntry[];
  clientFeedback: ClientFeedback[];
  changeOrderIds?: string[];
  planStages: PlanStage[];
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  activePersonnelCount?: number;
  casualPersonnelCount?: number;
}
export interface CustomProperty {
  name: string;
  value: string;
  type: 'text' | 'date' | 'number';
}
export type ToolCategory = 'Power Tool' | 'Hand Tool' | 'Vehicle' | 'Safety Equipment' | 'Miscellaneous';
export type ToolStatus = 'Available' | 'In Use' | 'Under Maintenance' | 'Retired';
export type LocationType = 'Workshop' | 'Project' | 'Other';
export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  purchaseDate: string; // ISO 8601
  status: ToolStatus;
  locationType?: LocationType;
  locationId?: string;
  locationName?: string;
  assignmentStartDate?: string; // ISO 8601
  assignmentEndDate?: string; // ISO 8601
  imageUrl?: string;
  properties?: CustomProperty[];
}
export interface SubContractor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  location?: string;
}
export interface Material {
  id: string;
  supplierId: string;
  name: string;
  unit: string; // e.g., 'sq ft', 'piece', 'bag'
  price: number; // in cents
}
export type SupplyReach = 'Local' | 'National' | 'Radius';
export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  location?: string;
  materials: Material[];
  category: string; // e.g., 'Lumber', 'Electrical', 'Plumbing'
  constructionStages: string[]; // e.g., ['Foundation', 'Framing', 'Finishing']
  supplyReach: SupplyReach;
  supplyRadiusKm?: number; // Only if supplyReach is 'Radius'
}
export interface CompanyProfile {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  financialYearStartMonth?: number; // 1-12
  financialYearStartDay?: number; // 1-31
  currency?: string; // ISO 4217 code e.g. 'USD', 'EUR'
}
export interface ImportedTransaction {
  date: string; // Expects MM/DD/YYYY
  projectName: string;
  description: string;
  amount: number; // in dollars
  type: 'Expense' | 'Deposit';
}
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Void';
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // in cents
  sourceId?: string;
  sourceType?: 'expense' | 'material' | 'change_order' | 'custom' | 'inventory_issue';
}
export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  issueDate: string; // ISO 8601
  dueDate: string; // ISO 8601
  lineItems: InvoiceLineItem[];
  subtotal: number; // in cents
  tax: number; // in cents
  total: number; // in cents
  status: InvoiceStatus;
  paymentDetails?: {
    paymentDate: string; // ISO 8601
    paymentMethod: string;
  };
}
export interface ClientStatementTransaction {
  date: string;
  project: string;
  description: string;
  type: 'Expense' | 'Deposit';
  amount: number; // in cents
}
export interface ClientStatement {
  client: Client;
  summary: {
    totalExpenses: number; // in cents
    totalDeposits: number; // in cents
    balance: number; // in cents
  };
  transactions: ClientStatementTransaction[];
}
export interface SupplierCategory {
  id: string;
  name: string;
}
export interface ConstructionStage {
  id: string;
  name: string;
}
export interface ExpenseCategory {
  id: string;
  name: string;
}
export interface Workshop {
  id: string;
  name: string;
  location: string;
  description?: string;
}
export type WorkshopMaterialStatus = 'Available' | 'Reserved' | 'Maintenance' | 'Expired' | 'Damaged';
export interface WorkshopMaterial {
  id: string;
  workshopId: string;
  workshopName: string;
  name: string;
  quantity: number;
  unit: string; // e.g., 'piece', 'box', 'gallon'
  costPerUnit?: number; // in cents
  lowStockThreshold?: number;
  status?: WorkshopMaterialStatus;
  imageUrl?: string;
  properties?: CustomProperty[];
}
export interface DayOff {
  id: string;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  reason: 'Vacation' | 'Sick Leave' | 'Personal';
}
export interface NextOfKin {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}
export interface Personnel {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  hireDate: string; // ISO 8601
  separationDate?: string; // ISO 8601, optional
  employmentType: 'Permanent' | 'Casual';
  rate: number; // in cents
  rateType: 'Annually' | 'Monthly' | 'Weekly' | 'Daily';
  nextOfKin: NextOfKin[];
  associatedExpenseIds: string[];
  daysOff?: DayOff[];
  specialization?: string;
  currentLocation?: string; // Deprecated in favor of structured location
  locationType?: LocationType;
  locationId?: string;
  locationName?: string;
  assignmentStartDate?: string; // ISO 8601
  assignmentEndDate?: string; // ISO 8601
}
export interface PortalResources {
  tools: { name: string; category: string; imageUrl?: string }[];
  personnel: { name: string; role: string }[];
}
export interface TemplateStage {
  id: string;
  name: string;
  description?: string;
  constructionStageId?: string;
  durationDays: number;
  startDayOffset: number;
  dependencies?: string[]; // Array of stage IDs within the template
}
export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  stages: TemplateStage[];
}