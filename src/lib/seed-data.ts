// ============================================================================
// inner-kt v2.0 — Production Seed Data
// Foundation data for 3 equal co-owners & 3 admin accounts
// All transaction, asset, and CRM tables start clean (Rp0) for manual entry
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
} from '@/types';

export const INITIAL_OWNERS: Owner[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'OWNER_1',
    name: 'Surya',
    colorBadge: 'indigo',
    isActive: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
    notes: 'Pemilik 1 Kanal Tiga',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    code: 'OWNER_2',
    name: 'Pemilik B',
    colorBadge: 'teal',
    isActive: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
    notes: 'Pemilik 2 Kanal Tiga',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    code: 'OWNER_3',
    name: 'Pemilik C',
    colorBadge: 'amber',
    isActive: true,
    joinedAt: '2026-01-01T00:00:00.000Z',
    notes: 'Pemilik 3 Kanal Tiga',
  },
];

export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-1',
    username: 'admin1',
    email: 'admin1@kanaltiga.internal',
    passwordPlain: 'Admin1KanalTiga!',
    displayName: 'Admin 1 — Surya',
    ownerId: '11111111-1111-1111-1111-111111111111',
    role: 'CO_OWNER',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-2',
    username: 'admin2',
    email: 'admin2@kanaltiga.internal',
    passwordPlain: 'Admin2KanalTiga!',
    displayName: 'Admin 2 — Pemilik B',
    ownerId: '22222222-2222-2222-2222-222222222222',
    role: 'CO_OWNER',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'admin-3',
    username: 'admin3',
    email: 'admin3@kanaltiga.internal',
    passwordPlain: 'Admin3KanalTiga!',
    displayName: 'Admin 3 — Pemilik C',
    ownerId: '33333333-3333-3333-3333-333333333333',
    role: 'CO_OWNER',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

// Clean slate for production: all transactions start at 0
export const INITIAL_ASSETS: Asset[] = [];
export const INITIAL_ORDERS: RentalOrder[] = [];
export const INITIAL_ORDER_USAGES: OrderItemOwnerUsage[] = [];
export const INITIAL_ORDER_ALLOCATIONS: OrderOwnerAllocation[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_EXPENSE_ALLOCATIONS: ExpenseOwnerAllocation[] = [];
export const INITIAL_CRM_LEADS: CrmLead[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-prod-init',
    adminEmail: 'SYSTEM',
    adminDisplayName: 'System Production Reset',
    entityType: 'SYSTEM',
    entityId: 'PROD-INIT',
    action: 'RESET',
    summary: 'Seluruh data sampel telah dibersihkan. Sistem siap digunakan untuk pencatatan manual.',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
