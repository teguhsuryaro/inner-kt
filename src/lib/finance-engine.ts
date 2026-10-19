// ============================================================================
// inner-kt — Pure Financial Calculation Engine
// High-Density Precision Integer Arithmetic for Event Equipment Rentals
// ============================================================================

import {
  Asset,
  RentalOrder,
  OrderOwnerAllocation,
  Expense,
  ExpenseOwnerAllocation,
  Owner,
  OwnerFinancialSummary,
  BusinessFinancialSummary,
} from '@/types';

/**
 * Splits an integer totalAmount evenly among active owners.
 * Any remainder (due to non-divisible integer rupiah) is distributed 1-by-1
 * to the first owners deterministically so sum(results) === totalAmount.
 */
export function splitEvenlyWithRemainder(
  totalAmount: number,
  ownerIds: string[]
): Record<string, number> {
  const count = ownerIds.length;
  if (count === 0) return {};
  const baseShare = Math.floor(totalAmount / count);
  let remainder = totalAmount - baseShare * count;

  const result: Record<string, number> = {};
  for (const id of ownerIds) {
    result[id] = baseShare + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

export interface CalculateOrderAllocationsParams {
  activeOwnerIds: string[];
  usages: {
    ownerId: string;
    unitsUsed: number;
    ratePerDay: number;
    durationDays: number;
  }[];
  finalGrossRevenue: number;
  transportCost: number;
}

export interface OrderAllocationOutput {
  ownerId: string;
  totalUnitsUsed: number;
  grossShare: number;
  transportCostShare: number;
  netShare: number;
}

/**
 * Calculates rental order allocation per owner.
 * - Gross revenue is distributed proportionally based on unit subtotal.
 * - Transport cost is split evenly among ALL active owners (Principle #3).
 * - Net share is grossShare - transportCostShare (can be negative if 0 units used).
 */
export function calculateOrderAllocations(
  params: CalculateOrderAllocationsParams
): OrderAllocationOutput[] {
  const { activeOwnerIds, usages, finalGrossRevenue, transportCost } = params;

  // 1. Calculate raw gross revenue and units used per owner
  const rawGrossByOwner: Record<string, number> = {};
  const unitsByOwner: Record<string, number> = {};
  for (const id of activeOwnerIds) {
    rawGrossByOwner[id] = 0;
    unitsByOwner[id] = 0;
  }

  let calculatedTotalGross = 0;
  for (const u of usages) {
    const sub = u.unitsUsed * u.ratePerDay * u.durationDays;
    rawGrossByOwner[u.ownerId] = (rawGrossByOwner[u.ownerId] || 0) + sub;
    unitsByOwner[u.ownerId] = (unitsByOwner[u.ownerId] || 0) + u.unitsUsed;
    calculatedTotalGross += sub;
  }

  // 2. Allocate actual final gross revenue (normal price or discount/package price)
  const grossShareByOwner: Record<string, number> = {};
  if (calculatedTotalGross === finalGrossRevenue) {
    for (const id of activeOwnerIds) {
      grossShareByOwner[id] = rawGrossByOwner[id] || 0;
    }
  } else if (calculatedTotalGross > 0) {
    let allocatedSum = 0;
    for (const id of activeOwnerIds) {
      const share = Math.floor(
        ((rawGrossByOwner[id] || 0) * finalGrossRevenue) / calculatedTotalGross
      );
      grossShareByOwner[id] = share;
      allocatedSum += share;
    }
    // Allocate integer rounding remainder to the owner with largest contribution
    let remainder = finalGrossRevenue - allocatedSum;
    const sortedOwners = [...activeOwnerIds].sort(
      (a, b) => (rawGrossByOwner[b] || 0) - (rawGrossByOwner[a] || 0)
    );
    let idx = 0;
    while (remainder > 0 && sortedOwners.length > 0) {
      const targetId = sortedOwners[idx % sortedOwners.length];
      grossShareByOwner[targetId] += 1;
      remainder--;
      idx++;
    }
  } else {
    for (const id of activeOwnerIds) grossShareByOwner[id] = 0;
  }

  // 3. Transport cost is divided equally among ALL active owners (regardless of who supplied units)
  const transportShareByOwner = splitEvenlyWithRemainder(transportCost, activeOwnerIds);

  // 4. Return complete allocation per owner
  return activeOwnerIds.map((ownerId) => {
    const grossShare = grossShareByOwner[ownerId] || 0;
    const transportCostShare = transportShareByOwner[ownerId] || 0;
    return {
      ownerId,
      totalUnitsUsed: unitsByOwner[ownerId] || 0,
      grossShare,
      transportCostShare,
      netShare: grossShare - transportCostShare,
    };
  });
}

/**
 * Calculates allocation for an operational expense.
 * - SHARED: Split evenly among active owner IDs.
 * - INDIVIDUAL: Allocated 100% to paidByOwnerId (or designated owner).
 */
export function calculateExpenseAllocations(params: {
  amount: number;
  allocationType: 'SHARED' | 'INDIVIDUAL';
  activeOwnerIds: string[];
  targetOwnerId?: string | null;
}): Record<string, number> {
  const { amount, allocationType, activeOwnerIds, targetOwnerId } = params;
  const result: Record<string, number> = {};

  for (const id of activeOwnerIds) {
    result[id] = 0;
  }

  if (allocationType === 'SHARED') {
    return splitEvenlyWithRemainder(amount, activeOwnerIds);
  }

  // INDIVIDUAL
  if (targetOwnerId && activeOwnerIds.includes(targetOwnerId)) {
    result[targetOwnerId] = amount;
  } else if (activeOwnerIds.length > 0) {
    result[activeOwnerIds[0]] = amount;
  }

  return result;
}

/**
 * Calculates complete financial metrics for an individual owner across:
 * - Assets / Capital (initial vs additional)
 * - Final Orders (gross, transport deduction, net revenue)
 * - Operational Expenses (shared vs individual, excluding transport to prevent double count)
 * - Capital Recovery Progress (recovered vs unrecovered capital)
 * - Net Profit After Capital & Expenses
 */
export function calculateOwnerFinancialSummary(params: {
  owner: Owner;
  assets: Asset[];
  orderAllocations: OrderOwnerAllocation[];
  orders: RentalOrder[];
  expenseAllocations: ExpenseOwnerAllocation[];
  expenses: Expense[];
}): OwnerFinancialSummary {
  const { owner, assets, orderAllocations, orders, expenseAllocations, expenses } = params;

  // 1. Assets and Capital owned by this owner
  const ownerAssets = assets.filter((a) => a.ownerId === owner.id);
  const totalUnitsOwned = ownerAssets.reduce((sum, a) => sum + (a.quantity || 0), 0);
  const initialCapital = ownerAssets
    .filter((a) => a.isInitialCapital)
    .reduce((sum, a) => sum + (a.totalCapital || 0), 0);
  const additionalCapital = ownerAssets
    .filter((a) => !a.isInitialCapital)
    .reduce((sum, a) => sum + (a.totalCapital || 0), 0);
  const totalCapital = initialCapital + additionalCapital;

  // 2. Orders (only orders with status == 'FINAL')
  const finalOrderMap = new Map<string, RentalOrder>();
  for (const ord of orders) {
    if (ord.status === 'FINAL') {
      finalOrderMap.set(ord.id, ord);
    }
  }

  const ownerOrderAllocs = orderAllocations.filter(
    (oa) => oa.ownerId === owner.id && finalOrderMap.has(oa.orderId)
  );

  const grossOrderRevenue = ownerOrderAllocs.reduce((sum, oa) => sum + (oa.grossShare || 0), 0);
  const orderTransportShare = ownerOrderAllocs.reduce(
    (sum, oa) => sum + (oa.transportCostShare || 0),
    0
  );
  const netOrderRevenue = grossOrderRevenue - orderTransportShare;

  // 3. Operational Expenses (only ACTIVE status and NOT order transport to prevent double-count)
  const activeExpenseMap = new Map<string, Expense>();
  for (const exp of expenses) {
    if (exp.status === 'ACTIVE') {
      activeExpenseMap.set(exp.id, exp);
    }
  }

  const ownerExpAllocs = expenseAllocations.filter(
    (ea) => ea.ownerId === owner.id && activeExpenseMap.has(ea.expenseId)
  );

  let sharedExpenseShare = 0;
  let individualExpense = 0;

  for (const ea of ownerExpAllocs) {
    const exp = activeExpenseMap.get(ea.expenseId);
    if (!exp) continue;
    // CRITICAL: Do NOT double-count order transport expenses here
    if (exp.isOrderTransport) continue;

    if (exp.allocationType === 'SHARED') {
      sharedExpenseShare += ea.allocatedAmount || 0;
    } else {
      individualExpense += ea.allocatedAmount || 0;
    }
  }

  const totalNonTransportExpense = sharedExpenseShare + individualExpense;
  const totalAllExpenseIncludingTransport = totalNonTransportExpense + orderTransportShare;

  // 4. Capital Recovery Progress (ROI)
  // Modal Sudah Kembali = MIN(totalCapital, MAX(0, netOrderRevenue))
  // Sisa Modal Belum Kembali = MAX(0, totalCapital - MAX(0, netOrderRevenue))
  const positiveNetRevenue = Math.max(0, netOrderRevenue);
  const recoveredCapital = Math.min(totalCapital, positiveNetRevenue);
  const unrecoveredCapital = Math.max(0, totalCapital - positiveNetRevenue);
  const capitalRecoveryPercentage =
    totalCapital > 0 ? Math.min(100, (recoveredCapital / totalCapital) * 100) : 0;
  const isCapitalFullyRecovered = unrecoveredCapital === 0 && totalCapital > 0;

  // 5. Profit After Capital and Non-Transport Expenses
  // Profit = netOrderRevenue - totalCapital - totalNonTransportExpense
  const profitAfterCapitalAndExpense =
    netOrderRevenue - totalCapital - totalNonTransportExpense;

  return {
    ownerId: owner.id,
    ownerCode: owner.code,
    ownerName: owner.name,
    totalUnitsOwned,
    initialCapital,
    additionalCapital,
    totalCapital,
    grossOrderRevenue,
    orderTransportShare,
    netOrderRevenue,
    sharedExpenseShare,
    individualExpense,
    totalNonTransportExpense,
    totalAllExpenseIncludingTransport,
    recoveredCapital,
    unrecoveredCapital,
    capitalRecoveryPercentage,
    isCapitalFullyRecovered,
    profitAfterCapitalAndExpense,
  };
}

/**
 * Calculates complete business-wide financial summary across all active owners.
 * Maintains individual owner integrity:
 * totalRecoveredCapital and totalUnrecoveredCapital are summed from each owner's progress.
 */
export function calculateBusinessFinancialSummary(params: {
  owners: Owner[];
  assets: Asset[];
  orders: RentalOrder[];
  orderAllocations: OrderOwnerAllocation[];
  expenses: Expense[];
  expenseAllocations: ExpenseOwnerAllocation[];
  filterDateRange?: { startDate?: string; endDate?: string };
}): BusinessFinancialSummary {
  const {
    owners,
    assets,
    orders,
    orderAllocations,
    expenses,
    expenseAllocations,
    filterDateRange,
  } = params;

  const activeOwners = owners.filter((o) => o.isActive);

  // Optional date filtering
  let filteredOrders = orders;
  let filteredExpenses = expenses;

  if (filterDateRange?.startDate) {
    const start = new Date(filterDateRange.startDate).getTime();
    filteredOrders = filteredOrders.filter(
      (o) => new Date(o.orderDate).getTime() >= start
    );
    filteredExpenses = filteredExpenses.filter(
      (e) => new Date(e.expenseDate).getTime() >= start
    );
  }

  if (filterDateRange?.endDate) {
    const end = new Date(filterDateRange.endDate).getTime();
    filteredOrders = filteredOrders.filter(
      (o) => new Date(o.orderDate).getTime() <= end
    );
    filteredExpenses = filteredExpenses.filter(
      (e) => new Date(e.expenseDate).getTime() <= end
    );
  }

  const ownerSummaries: OwnerFinancialSummary[] = activeOwners.map((owner) => {
    return calculateOwnerFinancialSummary({
      owner,
      assets,
      orderAllocations,
      orders: filteredOrders,
      expenseAllocations,
      expenses: filteredExpenses,
    });
  });

  const totalBusinessUnits = ownerSummaries.reduce(
    (sum, s) => sum + s.totalUnitsOwned,
    0
  );
  const totalBusinessCapital = ownerSummaries.reduce(
    (sum, s) => sum + s.totalCapital,
    0
  );
  const totalGrossRevenue = ownerSummaries.reduce(
    (sum, s) => sum + s.grossOrderRevenue,
    0
  );
  const totalTransportCost = ownerSummaries.reduce(
    (sum, s) => sum + s.orderTransportShare,
    0
  );
  const totalNetOrderRevenue = totalGrossRevenue - totalTransportCost;
  const totalOtherExpenses = ownerSummaries.reduce(
    (sum, s) => sum + s.totalNonTransportExpense,
    0
  );
  const totalRecoveredCapital = ownerSummaries.reduce(
    (sum, s) => sum + s.recoveredCapital,
    0
  );
  const totalUnrecoveredCapital = ownerSummaries.reduce(
    (sum, s) => sum + s.unrecoveredCapital,
    0
  );
  const capitalRecoveryPercentage =
    totalBusinessCapital > 0
      ? Math.min(100, (totalRecoveredCapital / totalBusinessCapital) * 100)
      : 0;

  // Business Profit = Net Order Revenue - Total Business Capital - Total Other Expenses
  const totalBusinessProfit =
    totalNetOrderRevenue - totalBusinessCapital - totalOtherExpenses;

  return {
    totalBusinessUnits,
    totalBusinessCapital,
    totalGrossRevenue,
    totalTransportCost,
    totalNetOrderRevenue,
    totalOtherExpenses,
    totalRecoveredCapital,
    totalUnrecoveredCapital,
    capitalRecoveryPercentage,
    totalBusinessProfit,
    owners: ownerSummaries,
  };
}
