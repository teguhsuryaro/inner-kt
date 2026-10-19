// ============================================================================
// inner-kt v2.0 — Central Reactive Data Store & Repository Layer
// Equal Co-Owners Architecture with Detailed Audit Logging (before & after JSON)
// ============================================================================

import {
  Owner,
  AdminUser,
  Asset,
  RentalOrder,
  OrderItemOwnerUsage,
  OrderOwnerAllocation,
  Expense,
  ExpenseOwnerAllocation,
  CrmLead,
  AuditLog,
  BusinessFinancialSummary,
  OrderFormInput,
  OrderStatus,
} from '@/types';

import {
  INITIAL_OWNERS,
  INITIAL_ADMINS,
  INITIAL_ASSETS,
  INITIAL_ORDERS,
  INITIAL_ORDER_USAGES,
  INITIAL_ORDER_ALLOCATIONS,
  INITIAL_EXPENSES,
  INITIAL_EXPENSE_ALLOCATIONS,
  INITIAL_CRM_LEADS,
  INITIAL_AUDIT_LOGS,
} from './seed-data';

import {
  calculateOrderAllocations,
  calculateExpenseAllocations,
  calculateBusinessFinancialSummary,
} from './finance-engine';

import { validateOrderInput, validateAssetInput, validateExpenseInput } from './validations';

const STORAGE_KEYS = {
  OWNERS: 'inner_kt_v2_owners',
  ADMINS: 'inner_kt_v2_admins',
  ASSETS: 'inner_kt_v2_assets',
  ORDERS: 'inner_kt_v2_orders',
  ORDER_USAGES: 'inner_kt_v2_order_usages',
  ORDER_ALLOCS: 'inner_kt_v2_order_allocs',
  EXPENSES: 'inner_kt_v2_expenses',
  EXPENSE_ALLOCS: 'inner_kt_v2_expense_allocs',
  CRM_LEADS: 'inner_kt_v2_crm_leads',
  AUDIT_LOGS: 'inner_kt_v2_audit_logs',
};

// Simple event bus for notifying components of data mutations across the app
type StoreChangeListener = () => void;
const listeners = new Set<StoreChangeListener>();
let storeVersionCounter = 1;

export function subscribeToStore(listener: StoreChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStoreSnapshot(): number {
  return storeVersionCounter;
}

function notifyStoreChange() {
  storeVersionCounter++;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in store listener:', e);
    }
  });
}

function loadFromStorage<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    notifyStoreChange();
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

// ----------------------------------------------------------------------------
// Core Repository Implementation (Equal Co-Owners)
// ----------------------------------------------------------------------------

export const innerKtStore = {
  // RESET TO DEFAULT SEED
  resetToInitialSeed(adminName: string = 'Sistem', adminEmail: string = 'admin1@kanaltiga.internal'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(INITIAL_OWNERS));
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(INITIAL_ASSETS));
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    localStorage.setItem(STORAGE_KEYS.ORDER_USAGES, JSON.stringify(INITIAL_ORDER_USAGES));
    localStorage.setItem(STORAGE_KEYS.ORDER_ALLOCS, JSON.stringify(INITIAL_ORDER_ALLOCATIONS));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
    localStorage.setItem(STORAGE_KEYS.EXPENSE_ALLOCS, JSON.stringify(INITIAL_EXPENSE_ALLOCATIONS));
    localStorage.setItem(STORAGE_KEYS.CRM_LEADS, JSON.stringify(INITIAL_CRM_LEADS));

    const resetAudit: AuditLog = {
      id: `audit-reset-${Date.now()}`,
      adminEmail,
      adminDisplayName: adminName,
      entityType: 'SYSTEM',
      entityId: 'database-reset',
      action: 'RESET',
      summary: `${adminName} (${adminEmail}) mengatur ulang database ke Data Awal (Pristine Seed).`,
      beforeJson: null,
      afterJson: { resetAt: new Date().toISOString() },
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([resetAudit, ...INITIAL_AUDIT_LOGS]));
    notifyStoreChange();
  },

  // OWNERS
  getOwners(): Owner[] {
    return loadFromStorage<Owner[]>(STORAGE_KEYS.OWNERS, INITIAL_OWNERS);
  },

  updateOwnerName(id: string, newName: string, admin: { email: string; name: string; id?: string }): boolean {
    const owners = this.getOwners();
    const target = owners.find((o) => o.id === id);
    if (!target) return false;

    const beforeData = { ...target };
    target.name = newName.trim();
    saveToStorage(STORAGE_KEYS.OWNERS, owners);

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'OWNER',
      entityId: id,
      action: 'UPDATE',
      summary: `${admin.name} mengubah nama tampilan pemilik "${beforeData.name}" menjadi "${target.name}".`,
      beforeJson: beforeData,
      afterJson: target,
    });

    return true;
  },

  // ADMINS
  getAdmins(): AdminUser[] {
    return loadFromStorage<AdminUser[]>(STORAGE_KEYS.ADMINS, INITIAL_ADMINS);
  },

  // ASSETS
  getAssets(): Asset[] {
    return loadFromStorage<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
  },

  addAsset(
    assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt' | 'totalCapital'>,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; asset?: Asset; errors?: string[] } {
    const validation = validateAssetInput({
      name: assetData.name,
      category: assetData.category,
      ownerId: assetData.ownerId,
      quantity: assetData.quantity,
      capitalPerUnit: assetData.capitalPerUnit,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const assets = this.getAssets();
    const newAsset: Asset = {
      ...assetData,
      id: `asset-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      totalCapital: assetData.quantity * assetData.capitalPerUnit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assets.push(newAsset);
    saveToStorage(STORAGE_KEYS.ASSETS, assets);

    const owners = this.getOwners();
    const ownerName = owners.find((o) => o.id === newAsset.ownerId)?.name || newAsset.ownerId;

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'ASSET',
      entityId: newAsset.id,
      action: 'CREATE',
      summary: `${admin.name} menambahkan aset "${newAsset.name}" (${newAsset.category}) sebanyak ${newAsset.quantity} unit @ Rp${newAsset.capitalPerUnit.toLocaleString('id-ID')} (Total: Rp${newAsset.totalCapital.toLocaleString('id-ID')}) milik ${ownerName}.`,
      beforeJson: null,
      afterJson: newAsset,
    });

    return { success: true, asset: newAsset };
  },

  updateAsset(
    id: string,
    assetData: Partial<Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>>,
    admin: { email: string; name: string; id?: string },
    userReason?: string
  ): { success: boolean; asset?: Asset; errors?: string[] } {
    const assets = this.getAssets();
    const target = assets.find((a) => a.id === id);
    if (!target) {
      return { success: false, errors: ['Aset tidak ditemukan.'] };
    }

    const beforeData = { ...target };

    // Apply updates
    if (assetData.name !== undefined) target.name = assetData.name.trim();
    if (assetData.category !== undefined) target.category = assetData.category.trim();
    if (assetData.ownerId !== undefined) target.ownerId = assetData.ownerId;
    if (assetData.quantity !== undefined) target.quantity = Number(assetData.quantity);
    if (assetData.capitalPerUnit !== undefined) target.capitalPerUnit = Number(assetData.capitalPerUnit);
    if (assetData.purchaseDate !== undefined) target.purchaseDate = assetData.purchaseDate;
    if (assetData.isInitialCapital !== undefined) target.isInitialCapital = Boolean(assetData.isInitialCapital);
    if (assetData.notes !== undefined) target.notes = assetData.notes;

    target.totalCapital = target.quantity * target.capitalPerUnit;
    target.updatedAt = new Date().toISOString();

    const validation = validateAssetInput({
      name: target.name,
      category: target.category,
      ownerId: target.ownerId,
      quantity: target.quantity,
      capitalPerUnit: target.capitalPerUnit,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    saveToStorage(STORAGE_KEYS.ASSETS, assets);

    const owners = this.getOwners();
    const ownerName = owners.find((o) => o.id === target.ownerId)?.name || target.ownerId;

    const reasonText = userReason?.trim() ? ` [Alasan: ${userReason.trim()}]` : '';

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'ASSET',
      entityId: target.id,
      action: 'UPDATE',
      summary: `${admin.name} mengedit aset "${target.name}" (Milik: ${ownerName}): ${beforeData.quantity} unit -> ${target.quantity} unit, Modal Rp${beforeData.totalCapital.toLocaleString('id-ID')} -> Rp${target.totalCapital.toLocaleString('id-ID')}.${reasonText}`,
      beforeJson: beforeData,
      afterJson: target,
    });

    return { success: true, asset: target };
  },

  deleteAsset(
    id: string,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; error?: string } {
    const assets = this.getAssets();
    const target = assets.find((a) => a.id === id);
    if (!target) {
      return { success: false, error: 'Aset tidak ditemukan.' };
    }

    // Check if asset was used in an order
    const usages = this.getOrderUsages();
    const isUsed = usages.some((u) => u.assetId === id);
    if (isUsed) {
      return {
        success: false,
        error:
          'Aset ini tidak dapat dihapus karena sudah tercatat dalam riwayat Order Penyewaan. Untuk menyesuaikan nilai modal, silakan gunakan fitur Edit Aset.',
      };
    }

    const filtered = assets.filter((a) => a.id !== id);
    saveToStorage(STORAGE_KEYS.ASSETS, filtered);

    const owners = this.getOwners();
    const ownerName = owners.find((o) => o.id === target.ownerId)?.name || target.ownerId;

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'ASSET',
      entityId: id,
      action: 'DELETE',
      summary: `${admin.name} menghapus aset "${target.name}" (${target.quantity} unit, Total Modal Rp${target.totalCapital.toLocaleString('id-ID')}) milik ${ownerName}.`,
      beforeJson: target,
      afterJson: null,
    });

    return { success: true };
  },

  // ORDERS
  getOrders(): RentalOrder[] {
    return loadFromStorage<RentalOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  },

  getOrderUsages(): OrderItemOwnerUsage[] {
    return loadFromStorage<OrderItemOwnerUsage[]>(STORAGE_KEYS.ORDER_USAGES, INITIAL_ORDER_USAGES);
  },

  getOrderAllocations(): OrderOwnerAllocation[] {
    return loadFromStorage<OrderOwnerAllocation[]>(STORAGE_KEYS.ORDER_ALLOCS, INITIAL_ORDER_ALLOCATIONS);
  },

  createOrder(
    input: OrderFormInput,
    admin: { email: string; name: string; id?: string },
    status: OrderStatus = 'FINAL'
  ): { success: boolean; order?: RentalOrder; errors?: string[] } {
    const assets = this.getAssets();
    const validation = validateOrderInput(input, assets, false);

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const owners = this.getOwners();
    const activeOwnerIds = owners.filter((o) => o.isActive).map((o) => o.id);

    // Prepare usages
    const usages: { ownerId: string; unitsUsed: number; ratePerDay: number; durationDays: number }[] = [];
    const newUsages: OrderItemOwnerUsage[] = [];
    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;

    for (const [ownerId, units] of Object.entries(input.ownerUnits)) {
      if (units > 0) {
        const ownerAsset = assets.find((a) => a.ownerId === ownerId) || assets[0];
        usages.push({
          ownerId,
          unitsUsed: units,
          ratePerDay: input.ratePerDay,
          durationDays: input.durationDays,
        });

        newUsages.push({
          id: `usage-${Date.now()}-${ownerId}`,
          orderId,
          assetId: ownerAsset ? ownerAsset.id : `mock-asset-${ownerId}`,
          ownerId,
          unitsUsed: units,
          ratePerDay: input.ratePerDay,
          durationDays: input.durationDays,
          subtotalGross: units * input.ratePerDay * input.durationDays,
        });
      }
    }

    // Calculate allocation using the finance engine
    const allocationOutputs = calculateOrderAllocations({
      activeOwnerIds,
      usages,
      finalGrossRevenue: input.finalGrossRevenue,
      transportCost: input.transportCost,
    });

    const newAllocations: OrderOwnerAllocation[] = allocationOutputs.map((out) => ({
      id: `alloc-${Date.now()}-${out.ownerId}`,
      orderId,
      ownerId: out.ownerId,
      totalUnitsUsed: out.totalUnitsUsed,
      grossShare: out.grossShare,
      transportCostShare: out.transportCostShare,
      netShare: out.netShare,
    }));

    const calculatedGross = usages.reduce((sum, u) => sum + u.unitsUsed * u.ratePerDay * u.durationDays, 0);

    const newOrder: RentalOrder = {
      id: orderId,
      orderNumber,
      customerOrgName: input.customerOrgName.trim(),
      eventName: input.eventName.trim(),
      orderDate: input.orderDate,
      startDate: input.startDate,
      endDate: input.endDate,
      durationDays: input.durationDays,
      calculatedGross,
      finalGrossRevenue: input.finalGrossRevenue,
      priceAdjustmentNote: input.priceAdjustmentNote || null,
      transportCost: input.transportCost,
      netOrderRevenue: input.finalGrossRevenue - input.transportCost,
      status,
      notes: input.notes || null,
      crmLeadId: input.crmLeadId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save order, usages, and allocations
    const orders = this.getOrders();
    orders.unshift(newOrder);
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    const existingUsages = this.getOrderUsages();
    saveToStorage(STORAGE_KEYS.ORDER_USAGES, [...newUsages, ...existingUsages]);

    const existingAllocs = this.getOrderAllocations();
    saveToStorage(STORAGE_KEYS.ORDER_ALLOCS, [...newAllocations, ...existingAllocs]);

    // If order has transportCost > 0 and status is FINAL, automatically create linked Expense record
    if (status === 'FINAL' && input.transportCost > 0) {
      const linkedExpenseId = `exp-transport-${orderId}`;
      const newTransportExpense: Expense = {
        id: linkedExpenseId,
        title: `Biaya Transportasi Order ${orderNumber} (${newOrder.eventName})`,
        category: 'TRANSPORTASI',
        expenseDate: input.orderDate,
        amount: input.transportCost,
        allocationType: 'SHARED',
        paidByOwnerId: owners[0]?.id || null,
        orderId,
        isOrderTransport: true,
        description: `Pencatatan otomatis biaya transportasi order ${orderNumber} (dibagi rata ke ${activeOwnerIds.length} pemilik).`,
        receiptRef: `AUTO-${orderNumber}`,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const expAllocations: ExpenseOwnerAllocation[] = allocationOutputs.map((out) => ({
        id: `exp-alloc-${Date.now()}-${out.ownerId}`,
        expenseId: linkedExpenseId,
        ownerId: out.ownerId,
        allocatedAmount: out.transportCostShare,
      }));

      const expenses = this.getExpenses();
      expenses.unshift(newTransportExpense);
      saveToStorage(STORAGE_KEYS.EXPENSES, expenses);

      const existingExpAllocs = this.getExpenseAllocations();
      saveToStorage(STORAGE_KEYS.EXPENSE_ALLOCS, [...expAllocations, ...existingExpAllocs]);
    }

    // If linked from CRM lead, update lead status to WON
    if (input.crmLeadId) {
      this.updateCrmLead(
        input.crmLeadId,
        {
          pipelineStatus: 'WON',
          convertedOrderId: orderId,
        },
        admin
      );
    }

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'ORDER',
      entityId: orderId,
      action: status === 'FINAL' ? 'FINALIZE_ORDER' : 'CREATE',
      summary: `${admin.name} membuat Order ${orderNumber} (${newOrder.customerOrgName} - ${newOrder.eventName}) senilai Rp${newOrder.finalGrossRevenue.toLocaleString('id-ID')} (Transport: Rp${newOrder.transportCost.toLocaleString('id-ID')}).`,
      beforeJson: null,
      afterJson: newOrder,
    });

    return { success: true, order: newOrder };
  },

  cancelOrder(
    orderId: string,
    reason: string,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; error?: string } {
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Alasan pembatalan order wajib diisi.' };
    }

    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      return { success: false, error: 'Order tidak ditemukan.' };
    }

    if (order.status === 'CANCELLED') {
      return { success: false, error: 'Order ini sudah berstatus dibatalkan.' };
    }

    const beforeData = { ...order };
    order.status = 'CANCELLED';
    order.notes = (order.notes ? `${order.notes} | ` : '') + `[DIBATALKAN oleh ${admin.name}]: ${reason}`;
    order.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.ORDERS, orders);

    // If there is an associated transport expense, mark it VOID
    const expenses = this.getExpenses();
    const linkedExpense = expenses.find((e) => e.orderId === orderId && e.isOrderTransport);
    if (linkedExpense) {
      linkedExpense.status = 'VOID';
      saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
    }

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'ORDER',
      entityId: orderId,
      action: 'CANCEL_ORDER',
      summary: `${admin.name} membatalkan Order ${order.orderNumber} (${order.customerOrgName}). Alasan: ${reason}`,
      beforeJson: beforeData,
      afterJson: order,
    });

    return { success: true };
  },

  // EXPENSES
  getExpenses(): Expense[] {
    return loadFromStorage<Expense[]>(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  },

  getExpenseAllocations(): ExpenseOwnerAllocation[] {
    return loadFromStorage<ExpenseOwnerAllocation[]>(STORAGE_KEYS.EXPENSE_ALLOCS, INITIAL_EXPENSE_ALLOCATIONS);
  },

  addExpense(
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'status' | 'isOrderTransport'>,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; expense?: Expense; errors?: string[] } {
    const validation = validateExpenseInput({
      title: expenseData.title,
      amount: expenseData.amount,
      allocationType: expenseData.allocationType,
      paidByOwnerId: expenseData.paidByOwnerId,
    });

    if (!validation.isValid) {
      return { success: false, errors: validation.errors };
    }

    const owners = this.getOwners();
    const activeOwnerIds = owners.filter((o) => o.isActive).map((o) => o.id);

    const expenseId = `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newExpense: Expense = {
      ...expenseData,
      id: expenseId,
      isOrderTransport: false,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    // Calculate allocation
    const allocMap = calculateExpenseAllocations({
      amount: newExpense.amount,
      allocationType: newExpense.allocationType,
      activeOwnerIds,
      targetOwnerId: newExpense.paidByOwnerId,
    });

    const newAllocs: ExpenseOwnerAllocation[] = Object.entries(allocMap).map(([ownerId, amount]) => ({
      id: `exp-alloc-${Date.now()}-${ownerId}`,
      expenseId,
      ownerId,
      allocatedAmount: amount,
    }));

    const expenses = this.getExpenses();
    expenses.unshift(newExpense);
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);

    const existingAllocs = this.getExpenseAllocations();
    saveToStorage(STORAGE_KEYS.EXPENSE_ALLOCS, [...newAllocs, ...existingAllocs]);

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'EXPENSE',
      entityId: expenseId,
      action: 'CREATE',
      summary: `${admin.name} mencatat pengeluaran "${newExpense.title}" sebesar Rp${newExpense.amount.toLocaleString('id-ID')} (${newExpense.allocationType === 'SHARED' ? 'Dibagi Rata 3 Pemilik' : 'Perorangan'}).`,
      beforeJson: null,
      afterJson: newExpense,
    });

    return { success: true, expense: newExpense };
  },

  // CRM LEADS
  getCrmLeads(): CrmLead[] {
    return loadFromStorage<CrmLead[]>(STORAGE_KEYS.CRM_LEADS, INITIAL_CRM_LEADS);
  },

  addCrmLead(
    leadData: Omit<CrmLead, 'id' | 'createdAt' | 'updatedAt' | 'convertedOrderId'>,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; lead?: CrmLead; errors?: string[] } {
    if (!leadData.organizationName || leadData.organizationName.trim().length === 0) {
      return { success: false, errors: ['Nama organisasi / instansi wajib diisi.'] };
    }
    if (!leadData.eventName || leadData.eventName.trim().length === 0) {
      return { success: false, errors: ['Nama event / acara wajib diisi.'] };
    }
    if (!leadData.picName || leadData.picName.trim().length === 0) {
      return { success: false, errors: ['Nama PIC panitia wajib diisi.'] };
    }

    const leads = this.getCrmLeads();
    const newLead: CrmLead = {
      ...leadData,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      picGender: leadData.picGender || 'TIDAK_DIKETAHUI',
      convertedOrderId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    leads.unshift(newLead);
    saveToStorage(STORAGE_KEYS.CRM_LEADS, leads);

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'CRM_LEAD',
      entityId: newLead.id,
      action: 'CREATE',
      summary: `${admin.name} menambahkan prospek CRM "${newLead.organizationName} - ${newLead.eventName}" (PIC: ${newLead.picName}, Status: ${newLead.pipelineStatus}).`,
      beforeJson: null,
      afterJson: newLead,
    });

    return { success: true, lead: newLead };
  },

  updateCrmLead(
    id: string,
    updates: Partial<CrmLead>,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; lead?: CrmLead } {
    const leads = this.getCrmLeads();
    const lead = leads.find((l) => l.id === id);
    if (!lead) return { success: false };

    const beforeData = { ...lead };
    Object.assign(lead, updates, { updatedAt: new Date().toISOString() });
    saveToStorage(STORAGE_KEYS.CRM_LEADS, leads);

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'CRM_LEAD',
      entityId: id,
      action: updates.pipelineStatus === 'WON' && beforeData.pipelineStatus !== 'WON' ? 'CONVERT_TO_ORDER' : 'UPDATE',
      summary: `${admin.name} memperbarui prospek "${lead.organizationName} - ${lead.eventName}" (Status: ${beforeData.pipelineStatus} -> ${lead.pipelineStatus}).`,
      beforeJson: beforeData,
      afterJson: lead,
    });

    return { success: true, lead };
  },

  deleteCrmLead(
    id: string,
    admin: { email: string; name: string; id?: string }
  ): { success: boolean; error?: string } {
    const leads = this.getCrmLeads();
    const target = leads.find((l) => l.id === id);
    if (!target) {
      return { success: false, error: 'Prospek CRM tidak ditemukan.' };
    }

    const filtered = leads.filter((l) => l.id !== id);
    saveToStorage(STORAGE_KEYS.CRM_LEADS, filtered);

    this.addAuditLog({
      adminEmail: admin.email,
      adminDisplayName: admin.name,
      entityType: 'CRM_LEAD',
      entityId: id,
      action: 'DELETE',
      summary: `${admin.name} menghapus prospek CRM "${target.organizationName} - ${target.eventName}" (PIC: ${target.picName}).`,
      beforeJson: target,
      afterJson: null,
    });

    return { success: true };
  },

  // AUDIT LOGS
  getAuditLogs(): AuditLog[] {
    return loadFromStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 1000));
  },

  // FINANCIAL SUMMARY
  getFinancialSummary(filterDateRange?: { startDate?: string; endDate?: string }): BusinessFinancialSummary {
    const owners = this.getOwners();
    const assets = this.getAssets();
    const orders = this.getOrders();
    const orderAllocations = this.getOrderAllocations();
    const expenses = this.getExpenses();
    const expenseAllocations = this.getExpenseAllocations();

    return calculateBusinessFinancialSummary({
      owners,
      assets,
      orders,
      orderAllocations,
      expenses,
      expenseAllocations,
      filterDateRange,
    });
  },
};
