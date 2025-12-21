import type { Client, Project, Expense, SupplierCategory, ConstructionStage, ExpenseCategory, WorkshopMaterial, Personnel, GeneralExpense, Workshop, ProjectTemplate } from './types';
export const MOCK_CLIENTS: Client[] = [
  { id: 'client-1', name: 'John Doe', email: 'john.doe@example.com', phone: '555-1234', notes: 'Long-time client, prefers morning updates.' },
  { id: 'client-2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '555-5678', notes: 'New client, referred by Apex Electricians.' },
];
const project1Expenses: Expense[] = [
  { id: 'exp-1-1', description: 'Lumber for framing', amount: 150000, date: '2025-07-20T10:00:00Z', category: 'Materials' },
  { id: 'exp-1-2', description: 'Electrician services', amount: 250000, date: '2025-07-22T14:00:00Z', category: 'Subcontractor' },
  { id: 'exp-1-3', description: 'Building Permit', amount: 50000, date: '2025-07-15T09:00:00Z', category: 'Permits' },
];
const project2Expenses: Expense[] = [
  { id: 'exp-2-1', description: 'Drywall supplies', amount: 80000, date: '2025-08-01T11:00:00Z', category: 'Materials' },
  { id: 'exp-2-2', description: 'Plumbing contractor', amount: 400000, date: '2025-08-05T13:30:00Z', category: 'Subcontractor' },
];
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Downtown Office Renovation',
    clientId: 'client-1',
    clientName: 'John Doe',
    budget: 5000000, // $50,000
    contractorFeePercentage: 15,
    feeType: 'Percentage',
    feeValue: 15,
    startDate: '2025-07-15T00:00:00Z',
    endDate: '2025-09-30T00:00:00Z',
    location: '123 Main St, Anytown, USA',
    gpsCoordinates: { lat: 34.0522, lon: -118.2437 },
    expenses: project1Expenses,
    deposits: [
      { id: 'dep-1-1', amount: 2500000, date: '2025-07-10T00:00:00Z', reference: 'QT-1234' },
    ],
    photos: [
      { id: 'pho-1-1', url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?q=80&w=2070', description: 'Framing complete', date: '2025-07-21T00:00:00Z' },
      { id: 'pho-1-2', url: 'https://images.unsplash.com/photo-1581092916378-2ED6e356d3b6?q=80&w=2070', description: 'Electrical rough-in', date: '2025-07-23T00:00:00Z' },
    ],
    tasks: [],
    clientDocuments: [],
    invoiceIds: [],
    worksiteMaterials: [],
    quoteIds: [],
    journalEntries: [],
    clientFeedback: [],
    changeOrderIds: [],
    planStages: [],
    status: 'In Progress',
  },
  {
    id: 'proj-2',
    name: 'Suburban Kitchen Remodel',
    clientId: 'client-2',
    clientName: 'Jane Smith',
    budget: 2500000, // $25,000
    contractorFeePercentage: 20,
    feeType: 'Percentage',
    feeValue: 20,
    startDate: '2025-08-01T00:00:00Z',
    endDate: '2025-08-31T00:00:00Z',
    location: '456 Oak Ave, Suburbia, USA',
    expenses: project2Expenses,
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
    status: 'In Progress',
  },
  {
    id: 'proj-3',
    name: 'New Deck Construction',
    clientId: 'client-1',
    clientName: 'John Doe',
    budget: 1000000, // $10,000
    contractorFeePercentage: 18,
    feeType: 'Percentage',
    feeValue: 18,
    startDate: '2025-09-01T00:00:00Z',
    endDate: '2025-09-15T00:00:00Z',
    location: '789 Pine Ln, Countryside, USA',
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
  },
];
export const MOCK_SUPPLIER_CATEGORIES: SupplierCategory[] = [
  { id: 'cat-1', name: 'Lumber & Framing' },
  { id: 'cat-2', name: 'Electrical' },
  { id: 'cat-3', name: 'Plumbing' },
  { id: 'cat-4', name: 'HVAC' },
  { id: 'cat-5', name: 'Drywall & Insulation' },
  { id: 'cat-6', name: 'Flooring' },
  { id: 'cat-7', name: 'Painting' },
  { id: 'cat-8', name: 'Roofing' },
  { id: 'cat-9', name: 'Windows & Doors' },
  { id: 'cat-10', name: 'General Hardware' },
];
export const MOCK_CONSTRUCTION_STAGES: ConstructionStage[] = [
  { id: 'stage-1', name: 'Site Work & Foundation' },
  { id: 'stage-2', name: 'Framing' },
  { id: 'stage-3', name: 'Rough-in (Plumbing, Electrical, HVAC)' },
  { id: 'stage-4', name: 'Insulation & Drywall' },
  { id: 'stage-5', name: 'Interior Finishes' },
  { id: 'stage-6', name: 'Exterior Finishes' },
  { id: 'stage-7', name: 'Landscaping' },
];
export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
    { id: 'exp-cat-1', name: 'Materials' },
    { id: 'exp-cat-2', name: 'Labor' },
    { id: 'exp-cat-3', name: 'Permits' },
    { id: 'exp-cat-4', name: 'Subcontractor' },
    { id: 'exp-cat-5', name: 'Miscellaneous' },
    { id: 'exp-cat-6', name: 'Office Supplies' },
    { id: 'exp-cat-7', name: 'Accounting' },
];
export const MOCK_WORKSHOPS: Workshop[] = [
  { id: 'ws-1', name: 'Main Warehouse', location: '123 Industrial Blvd', description: 'Primary storage for tools and materials.' },
];
export const MOCK_WORKSHOP_MATERIALS: WorkshopMaterial[] = [
  { id: 'wm-1', workshopId: 'ws-1', workshopName: 'Main Warehouse', name: '3-inch Drywall Screws', quantity: 5, unit: 'box' },
  { id: 'wm-2', workshopId: 'ws-1', workshopName: 'Main Warehouse', name: 'All-Purpose Joint Compound', quantity: 10, unit: 'gallon' },
  { id: 'wm-3', workshopId: 'ws-1', workshopName: 'Main Warehouse', name: 'Safety Glasses', quantity: 25, unit: 'piece' },
];
export const MOCK_PERSONNEL: Personnel[] = [
  { id: 'per-1', name: 'Mike Foreman', role: 'Site Foreman', email: 'mike.f@pillar.com', phone: '555-010-1111', hireDate: '2022-01-15T00:00:00Z', employmentType: 'Permanent', rate: 7500000, rateType: 'Annually', nextOfKin: [{ id: 'nok-1', name: 'Sarah Foreman', phone: '555-010-1112', relationship: 'Spouse' }], associatedExpenseIds: [], daysOff: [{ id: 'do-1', startDate: '2025-08-19T00:00:00Z', endDate: '2025-08-23T00:00:00Z', reason: 'Vacation' }], specialization: 'Framing & Structural', currentLocation: 'Downtown Office Renovation' },
  { id: 'per-2', name: 'Elena Rodriguez', role: 'Project Manager', email: 'elena.r@pillar.com', phone: '555-010-2222', hireDate: '2021-05-20T00:00:00Z', employmentType: 'Permanent', rate: 9000000, rateType: 'Annually', nextOfKin: [{ id: 'nok-2', name: 'Carlos Rodriguez', phone: '555-010-2223', relationship: 'Husband' }], associatedExpenseIds: [], daysOff: [], specialization: 'Client Relations & Budgeting', currentLocation: 'Main Office' },
  { id: 'per-3', name: 'David Chen', role: 'Lead Carpenter', email: 'david.c@pillar.com', phone: '555-010-3333', hireDate: '2023-03-10T00:00:00Z', employmentType: 'Casual', rate: 45000, rateType: 'Daily', nextOfKin: [{ id: 'nok-3', name: 'Mei Chen', phone: '555-010-3334', relationship: 'Mother' }], associatedExpenseIds: [], daysOff: [{ id: 'do-2', startDate: '2025-07-29T00:00:00Z', endDate: '2025-07-29T00:00:00Z', reason: 'Sick Leave' }], specialization: 'Finish Carpentry', currentLocation: 'Suburban Kitchen Remodel' },
];
export const MOCK_GENERAL_EXPENSES: GeneralExpense[] = [
    { id: 'gen-exp-1', description: 'QuickBooks Subscription', amount: 5000, date: '2025-07-01T00:00:00Z', category: 'Accounting' },
    { id: 'gen-exp-2', description: 'Office Printer Paper', amount: 2500, date: '2025-07-15T00:00:00Z', category: 'Office Supplies' },
];
export const MOCK_PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'template-1',
    name: 'Kitchen Remodel',
    description: 'Standard kitchen renovation timeline including demolition, rough-ins, and finishing.',
    stages: [
      { id: 't-stage-1', name: 'Demolition & Prep', description: 'Remove old cabinets, flooring, and appliances.', constructionStageId: 'stage-1', durationDays: 3, startDayOffset: 0 },
      { id: 't-stage-2', name: 'Rough-in (Plumbing & Electrical)', description: 'Run new lines for sink, dishwasher, and outlets.', constructionStageId: 'stage-3', durationDays: 4, startDayOffset: 3, dependencies: ['t-stage-1'] },
      { id: 't-stage-3', name: 'Drywall & Painting', description: 'Patch walls and apply primer/paint.', constructionStageId: 'stage-4', durationDays: 5, startDayOffset: 7, dependencies: ['t-stage-2'] },
      { id: 't-stage-4', name: 'Cabinet & Countertop Installation', description: 'Install new cabinets and countertops.', constructionStageId: 'stage-5', durationDays: 4, startDayOffset: 12, dependencies: ['t-stage-3'] },
      { id: 't-stage-5', name: 'Flooring & Backsplash', description: 'Install tile flooring and backsplash.', constructionStageId: 'stage-5', durationDays: 4, startDayOffset: 16, dependencies: ['t-stage-4'] },
      { id: 't-stage-6', name: 'Appliances & Fixtures', description: 'Install sink, faucet, and appliances.', constructionStageId: 'stage-3', durationDays: 2, startDayOffset: 20, dependencies: ['t-stage-5'] },
    ]
  },
  {
    id: 'template-2',
    name: 'Bathroom Renovation',
    description: 'Complete bathroom overhaul.',
    stages: [
      { id: 't-stage-b1', name: 'Demolition', description: 'Remove fixtures, tile, and vanity.', constructionStageId: 'stage-1', durationDays: 2, startDayOffset: 0 },
      { id: 't-stage-b2', name: 'Plumbing Rough-in', description: 'Move drains and supply lines.', constructionStageId: 'stage-3', durationDays: 2, startDayOffset: 2, dependencies: ['t-stage-b1'] },
      { id: 't-stage-b3', name: 'Waterproofing & Tub/Shower Pan', description: 'Install waterproofing membrane.', constructionStageId: 'stage-2', durationDays: 2, startDayOffset: 4, dependencies: ['t-stage-b2'] },
      { id: 't-stage-b4', name: 'Tiling', description: 'Tile shower walls and floor.', constructionStageId: 'stage-5', durationDays: 5, startDayOffset: 6, dependencies: ['t-stage-b3'] },
      { id: 't-stage-b5', name: 'Vanity & Fixtures', description: 'Install vanity, toilet, and trim.', constructionStageId: 'stage-3', durationDays: 2, startDayOffset: 11, dependencies: ['t-stage-b4'] },
      { id: 't-stage-b6', name: 'Painting & Accessories', description: 'Paint walls and install towel bars.', constructionStageId: 'stage-5', durationDays: 2, startDayOffset: 13, dependencies: ['t-stage-b5'] },
    ]
  },
  {
    id: 'template-3',
    name: 'Urban Apartment Renovation (EU Style)',
    description: 'Comprehensive apartment renovation focusing on soundproofing, thermal efficiency, and high-end finishes.',
    stages: [
      { id: 't-stage-eu1', name: 'Demolition & Waste Removal', description: 'Clear out old fittings, non-load bearing walls, and flooring.', constructionStageId: 'stage-1', durationDays: 3, startDayOffset: 0 },
      { id: 't-stage-eu2', name: 'First Fix (Plumbing & Electrical)', description: 'Install new wiring runs and piping positions.', constructionStageId: 'stage-3', durationDays: 5, startDayOffset: 3, dependencies: ['t-stage-eu1'] },
      { id: 't-stage-eu3', name: 'Screeding & Drying', description: 'Level floors with self-leveling compound. Critical drying time.', constructionStageId: 'stage-5', durationDays: 7, startDayOffset: 8, dependencies: ['t-stage-eu2'] },
      { id: 't-stage-eu4', name: 'Plastering & Drying', description: 'Skim coat walls and ceilings.', constructionStageId: 'stage-4', durationDays: 5, startDayOffset: 15, dependencies: ['t-stage-eu3'] },
      { id: 't-stage-eu5', name: 'Second Fix (Joinery & Tiling)', description: 'Install doors, skirting, architraves, and bathroom tiling.', constructionStageId: 'stage-5', durationDays: 6, startDayOffset: 20, dependencies: ['t-stage-eu4'] },
      { id: 't-stage-eu6', name: 'Painting & Decorating', description: 'Apply paint and wallpaper.', constructionStageId: 'stage-5', durationDays: 4, startDayOffset: 26, dependencies: ['t-stage-eu5'] },
      { id: 't-stage-eu7', name: 'Final Fixtures & Cleaning', description: 'Install light fittings, switches, and deep clean.', constructionStageId: 'stage-5', durationDays: 2, startDayOffset: 30, dependencies: ['t-stage-eu6'] },
    ]
  },
  {
    id: 'template-4',
    name: 'Residential Solar Installation',
    description: 'Roof-mounted solar PV system installation including permitting and grid connection.',
    stages: [
      { id: 't-stage-sol1', name: 'Site Survey & Design', description: 'Assess roof structure and shading. Finalize system design.', constructionStageId: 'stage-1', durationDays: 1, startDayOffset: 0 },
      { id: 't-stage-sol2', name: 'Permitting & Grid Application', description: 'Submit documents to local authority and utility company.', constructionStageId: 'stage-1', durationDays: 14, startDayOffset: 1, dependencies: ['t-stage-sol1'] },
      { id: 't-stage-sol3', name: 'Roof Mounting System', description: 'Install rails and brackets on the roof.', constructionStageId: 'stage-6', durationDays: 1, startDayOffset: 15, dependencies: ['t-stage-sol2'] },
      { id: 't-stage-sol4', name: 'Panel Installation & DC Wiring', description: 'Mount panels and run DC cables to inverter location.', constructionStageId: 'stage-6', durationDays: 1, startDayOffset: 16, dependencies: ['t-stage-sol3'] },
      { id: 't-stage-sol5', name: 'Inverter & AC Wiring', description: 'Install inverter and connect to main distribution board.', constructionStageId: 'stage-3', durationDays: 1, startDayOffset: 16, dependencies: ['t-stage-sol3'] },
      { id: 't-stage-sol6', name: 'Commissioning & Testing', description: 'System startup, voltage checks, and monitoring setup.', constructionStageId: 'stage-3', durationDays: 1, startDayOffset: 17, dependencies: ['t-stage-sol4', 't-stage-sol5'] },
      { id: 't-stage-sol7', name: 'Grid Connection & Handover', description: 'Final utility inspection and client handover.', constructionStageId: 'stage-3', durationDays: 1, startDayOffset: 18, dependencies: ['t-stage-sol6'] },
    ]
  },
  {
    id: 'template-5',
    name: 'Retail Store Fit-out',
    description: 'Fast-paced commercial fit-out for a small retail unit.',
    stages: [
      { id: 't-stage-ret1', name: 'Site Possession & Hoarding', description: 'Secure site and install window graphics/hoarding.', constructionStageId: 'stage-1', durationDays: 1, startDayOffset: 0 },
      { id: 't-stage-ret2', name: 'Strip-out & White Boxing', description: 'Remove existing fixtures and prepare shell.', constructionStageId: 'stage-1', durationDays: 3, startDayOffset: 1, dependencies: ['t-stage-ret1'] },
      { id: 't-stage-ret3', name: 'Overhead MEP', description: 'Modify HVAC, sprinklers, and lighting grid.', constructionStageId: 'stage-3', durationDays: 4, startDayOffset: 4, dependencies: ['t-stage-ret2'] },
      { id: 't-stage-ret4', name: 'Partitioning & Drylining', description: 'Build changing rooms and stockroom walls.', constructionStageId: 'stage-2', durationDays: 3, startDayOffset: 6, dependencies: ['t-stage-ret3'] },
      { id: 't-stage-ret5', name: 'Flooring Installation', description: 'Lay commercial grade flooring.', constructionStageId: 'stage-5', durationDays: 3, startDayOffset: 9, dependencies: ['t-stage-ret4'] },
      { id: 't-stage-ret6', name: 'Joinery & Shopfitting', description: 'Install perimeter systems, cash desk, and gondolas.', constructionStageId: 'stage-5', durationDays: 4, startDayOffset: 12, dependencies: ['t-stage-ret5'] },
      { id: 't-stage-ret7', name: 'Signage & Branding', description: 'Install internal and external signage.', constructionStageId: 'stage-5', durationDays: 2, startDayOffset: 14, dependencies: ['t-stage-ret6'] },
      { id: 't-stage-ret8', name: 'Merchandising & Handover', description: 'Stock shelves and final clean.', constructionStageId: 'stage-5', durationDays: 2, startDayOffset: 16, dependencies: ['t-stage-ret7'] },
    ]
  }
];