// ============================================================================
// inner-kt v2.0 — TypeScript Entity & Finance Contracts
// Pure Supabase PostgreSQL Schema (Tanpa Prisma) & Equal Co-Owners Architecture
// ============================================================================

export type OwnerCode = 'OWNER_1' | 'OWNER_2' | 'OWNER_3' | string;

export interface Owner {
  id: string; // UUID
  code: OwnerCode;
  name: string; // e.g. "Surya", "Pemilik B", "Pemilik C"
  colorBadge?: string; // 'indigo', 'teal', 'amber'
  isActive: boolean;
  joinedAt: string; // ISO string
  notes?: string | null;
}

export type AdminRole = 'CO_OWNER';

export interface AdminUser {
  id: string;
  username: string; // "admin1", "admin2", "admin3"
  email: string; // "admin1@kanaltiga.internal", etc.
  passwordPlain?: string; // used for internal quick auth
  displayName: string;
  ownerId?: string | null;
  role: AdminRole; // All 3 admins are 100% equal co-owners
  createdAt: string;
}

export interface Asset {
  id: string; // UUID
  name: string; // e.g. "HT Baofeng BF-888S", "Megaphone Toa"
  category: string; // Free text manual input (e.g. "Handy Talky (HT)", "Audio", "Tenda")
  ownerId: string;
  quantity: number;
  capitalPerUnit: number; // Rupiah, integer
  totalCapital: number; // quantity * capitalPerUnit
  purchaseDate: string; // YYYY-MM-DD
  isInitialCapital: boolean; // true = Modal Awal, false = Modal Tambahan
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'DRAFT' | 'FINAL' | 'CANCELLED';

export interface RentalOrder {
  id: string; // UUID
  orderNumber: string; // e.g. "ORD-202610-001"
  customerOrgName: string;
  eventName: string;
  orderDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationDays: number; // >= 1
  calculatedGross: number; // sum(unitsUsed * ratePerDay * durationDays)
  finalGrossRevenue: number; // actual revenue after potential discount/custom deal
  priceAdjustmentNote?: string | null; // mandatory if finalGrossRevenue !== calculatedGross
  transportCost: number; // default 0, deducted before profit split
  netOrderRevenue: number; // finalGrossRevenue - transportCost
  status: OrderStatus;
  notes?: string | null;
  crmLeadId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemOwnerUsage {
  id: string;
  orderId: string;
  assetId: string;
  ownerId: string;
  unitsUsed: number;
  ratePerDay: number;
  durationDays: number;
  subtotalGross: number; // unitsUsed * ratePerDay * durationDays
}

export interface OrderOwnerAllocation {
  id: string;
  orderId: string;
  ownerId: string;
  totalUnitsUsed: number;
  grossShare: number;
  transportCostShare: number; // transportCost / activeOwnersCount with exact remainder distribution
  netShare: number; // grossShare - transportCostShare
}

export type ExpenseCategory =
  | 'TRANSPORTASI'
  | 'PARKIR'
  | 'STIKER_BRANDING'
  | 'PERLENGKAPAN'
  | 'PERAWATAN'
  | 'LAINNYA'
  | string;

export type ExpenseAllocationType = 'SHARED' | 'INDIVIDUAL';
export type ExpenseStatus = 'ACTIVE' | 'VOID';

export interface Expense {
  id: string; // UUID
  title: string;
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  amount: number; // Rupiah
  allocationType: ExpenseAllocationType; // SHARED (split among all active owners) or INDIVIDUAL
  paidByOwnerId?: string | null;
  orderId?: string | null;
  isOrderTransport: boolean; // true if auto-generated from RentalOrder.transportCost
  description?: string | null;
  receiptRef?: string | null;
  status: ExpenseStatus; // ACTIVE or VOID (when linked order is cancelled)
  createdAt: string;
}

export interface ExpenseOwnerAllocation {
  id: string;
  expenseId: string;
  ownerId: string;
  allocatedAmount: number;
}

export type OrganizationType =
  | 'BEM_HIMA_UKM'
  | 'SEKOLAH'
  | 'EO_UMUM'
  | 'INSTANSI'
  | 'KOMUNITAS'
  | 'LAINNYA'
  | string;

export type PipelineStatus =
  | 'IDENTIFIED'
  | 'CONTACTED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export type PicGender = 'LAKI_LAKI' | 'PEREMPUAN' | 'TIDAK_DIKETAHUI';

export interface CrmLead {
  id: string; // UUID
  organizationName: string;
  organizationType: OrganizationType;
  eventName: string;
  eventDate?: string | null;
  estimatedDuration: number;
  estimatedUnits: number;
  estimatedBudget?: number | null;
  picName: string;
  picGender: PicGender; // LAKI_LAKI, PEREMPUAN, TIDAK_DIKETAHUI
  picRole?: string | null;
  picPhone?: string | null; // Optional WhatsApp
  picInstagram?: string | null; // Optional Instagram handle (@username)
  pipelineStatus: PipelineStatus;
  lossReason?: string | null; // Reason if LOST
  voucherCodeOffered?: string | null;
  nextFollowUpDate?: string | null;
  notes?: string | null;
  convertedOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuditEntityType = 'ASSET' | 'ORDER' | 'EXPENSE' | 'CRM_LEAD' | 'OWNER' | 'SYSTEM';
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'FINALIZE_ORDER'
  | 'CANCEL_ORDER'
  | 'CONVERT_TO_ORDER'
  | 'RESET';

export interface AuditLog {
  id: string;
  adminEmail: string;
  adminDisplayName: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  beforeJson?: any;
  afterJson?: any;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// Financial Summaries & Calculation Contracts
// ----------------------------------------------------------------------------

export interface OwnerFinancialSummary {
  ownerId: string;
  ownerCode: string;
  ownerName: string;
  totalUnitsOwned: number;
  initialCapital: number;
  additionalCapital: number;
  totalCapital: number;
  grossOrderRevenue: number;
  orderTransportShare: number;
  netOrderRevenue: number;
  sharedExpenseShare: number;
  individualExpense: number;
  totalNonTransportExpense: number;
  totalAllExpenseIncludingTransport: number;
  recoveredCapital: number;
  unrecoveredCapital: number;
  capitalRecoveryPercentage: number;
  isCapitalFullyRecovered: boolean;
  profitAfterCapitalAndExpense: number;
}

export interface BusinessFinancialSummary {
  totalBusinessUnits: number;
  totalBusinessCapital: number;
  totalGrossRevenue: number;
  totalTransportCost: number;
  totalNetOrderRevenue: number;
  totalOtherExpenses: number;
  totalRecoveredCapital: number;
  totalUnrecoveredCapital: number;
  capitalRecoveryPercentage: number;
  totalBusinessProfit: number;
  owners: OwnerFinancialSummary[];
}

export interface DateFilterRange {
  startDate?: string;
  endDate?: string;
  periodLabel: 'ALL' | 'THIS_YEAR' | 'THIS_MONTH' | 'CUSTOM';
}

// ----------------------------------------------------------------------------
// Form & Input Contracts
// ----------------------------------------------------------------------------

export interface OrderFormInput {
  customerOrgName: string;
  eventName: string;
  orderDate: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  ratePerDay: number;
  ownerUnits: Record<string, number>; // ownerId -> units used
  finalGrossRevenue: number;
  priceAdjustmentNote?: string;
  transportCost: number;
  notes?: string;
  crmLeadId?: string;
}
