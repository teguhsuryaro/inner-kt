// Test finance calculation logic against 06-roadmap-implementasi-bertahap.md checklist
function splitEvenlyWithRemainder(totalAmount, ownerIds) {
  const count = ownerIds.length;
  if (count === 0) return {};
  const baseShare = Math.floor(totalAmount / count);
  let remainder = totalAmount - baseShare * count;
  const result = {};
  for (const id of ownerIds) {
    result[id] = baseShare + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

const owners = [
  { id: 'owner-1', code: 'OWNER_1', name: 'Surya', isActive: true },
  { id: 'owner-2', code: 'OWNER_2', name: 'Pemilik B', isActive: true },
  { id: 'owner-3', code: 'OWNER_3', name: 'Pemilik C', isActive: true },
];

const assets = [
  { id: 'a1', ownerId: 'owner-1', quantity: 10, totalCapital: 1000000, isInitialCapital: true },
  { id: 'a2', ownerId: 'owner-2', quantity: 15, totalCapital: 1500000, isInitialCapital: true },
  { id: 'a3', ownerId: 'owner-3', quantity: 5, totalCapital: 500000, isInitialCapital: true },
];

const orderAllocs = [
  { orderId: 'ord-1', ownerId: 'owner-1', grossShare: 100000, transportCostShare: 4000, netShare: 96000 },
  { orderId: 'ord-1', ownerId: 'owner-2', grossShare: 60000, transportCostShare: 4000, netShare: 56000 },
  { orderId: 'ord-1', ownerId: 'owner-3', grossShare: 40000, transportCostShare: 4000, netShare: 36000 },
];

const expenses = [
  { id: 'exp-1', isOrderTransport: true, status: 'ACTIVE', allocationType: 'SHARED', amount: 12000 },
  { id: 'exp-2', isOrderTransport: false, status: 'ACTIVE', allocationType: 'SHARED', amount: 60000 },
  { id: 'exp-3', isOrderTransport: false, status: 'ACTIVE', allocationType: 'INDIVIDUAL', amount: 30000 },
];

const expAllocs = [
  { expenseId: 'exp-1', ownerId: 'owner-1', allocatedAmount: 4000 },
  { expenseId: 'exp-1', ownerId: 'owner-2', allocatedAmount: 4000 },
  { expenseId: 'exp-1', ownerId: 'owner-3', allocatedAmount: 4000 },
  { expenseId: 'exp-2', ownerId: 'owner-1', allocatedAmount: 20000 },
  { expenseId: 'exp-2', ownerId: 'owner-2', allocatedAmount: 20000 },
  { expenseId: 'exp-2', ownerId: 'owner-3', allocatedAmount: 20000 },
  { expenseId: 'exp-3', ownerId: 'owner-1', allocatedAmount: 30000 },
];

function calcOwner(owner) {
  const oAssets = assets.filter(a => a.ownerId === owner.id);
  const totalUnitsOwned = oAssets.reduce((s, a) => s + a.quantity, 0);
  const totalCapital = oAssets.reduce((s, a) => s + a.totalCapital, 0);

  const oOrderAllocs = orderAllocs.filter(oa => oa.ownerId === owner.id);
  const grossOrderRevenue = oOrderAllocs.reduce((s, oa) => s + oa.grossShare, 0);
  const orderTransportShare = oOrderAllocs.reduce((s, oa) => s + oa.transportCostShare, 0);
  const netOrderRevenue = grossOrderRevenue - orderTransportShare;

  const activeExpMap = new Map(expenses.filter(e => e.status === 'ACTIVE').map(e => [e.id, e]));
  let sharedExpenseShare = 0;
  let individualExpense = 0;

  for (const ea of expAllocs.filter(ea => ea.ownerId === owner.id)) {
    const exp = activeExpMap.get(ea.expenseId);
    if (!exp || exp.isOrderTransport) continue;
    if (exp.allocationType === 'SHARED') sharedExpenseShare += ea.allocatedAmount;
    else individualExpense += ea.allocatedAmount;
  }

  const totalNonTransportExpense = sharedExpenseShare + individualExpense;
  const recoveredCapital = Math.min(totalCapital, Math.max(0, netOrderRevenue));
  const unrecoveredCapital = Math.max(0, totalCapital - Math.max(0, netOrderRevenue));
  const profitAfterCapitalAndExpense = netOrderRevenue - totalCapital - totalNonTransportExpense;

  return {
    name: owner.name,
    totalUnitsOwned,
    totalCapital,
    grossOrderRevenue,
    orderTransportShare,
    netOrderRevenue,
    recoveredCapital,
    unrecoveredCapital,
    sharedExpenseShare,
    individualExpense,
    totalNonTransportExpense,
    profitAfterCapitalAndExpense,
  };
}

const res = owners.map(calcOwner);
console.table(res);

const totalBusinessUnits = res.reduce((s, r) => s + r.totalUnitsOwned, 0);
const totalBusinessCapital = res.reduce((s, r) => s + r.totalCapital, 0);
const totalGrossRevenue = res.reduce((s, r) => s + r.grossOrderRevenue, 0);
const totalTransportCost = res.reduce((s, r) => s + r.orderTransportShare, 0);
const totalNetOrderRevenue = totalGrossRevenue - totalTransportCost;
const totalOtherExpenses = res.reduce((s, r) => s + r.totalNonTransportExpense, 0);
const totalRecoveredCapital = res.reduce((s, r) => s + r.recoveredCapital, 0);
const totalUnrecoveredCapital = res.reduce((s, r) => s + r.unrecoveredCapital, 0);
const totalBusinessProfit = totalNetOrderRevenue - totalBusinessCapital - totalOtherExpenses;

console.log('TOTAL BISNIS:', {
  totalBusinessUnits,
  totalBusinessCapital,
  totalGrossRevenue,
  totalTransportCost,
  totalNetOrderRevenue,
  totalRecoveredCapital,
  totalUnrecoveredCapital,
  totalOtherExpenses,
  totalBusinessProfit,
});

// Check expectations:
const expected = {
  surya: { net: 96000, recovered: 96000, unrecovered: 904000, nonTransportExp: 50000, profit: -954000 },
  b: { net: 56000, recovered: 56000, unrecovered: 1444000, nonTransportExp: 20000, profit: -1464000 },
  c: { net: 36000, recovered: 36000, unrecovered: 464000, nonTransportExp: 20000, profit: -484000 },
  biz: { totalUnits: 30, capital: 3000000, gross: 200000, transport: 12000, net: 188000, recovered: 188000, unrecovered: 2812000, otherExp: 90000, profit: -2902000 },
};

let pass = true;
if (res[0].netOrderRevenue !== expected.surya.net || res[0].profitAfterCapitalAndExpense !== expected.surya.profit) pass = false;
if (res[1].netOrderRevenue !== expected.b.net || res[1].profitAfterCapitalAndExpense !== expected.b.profit) pass = false;
if (res[2].netOrderRevenue !== expected.c.net || res[2].profitAfterCapitalAndExpense !== expected.c.profit) pass = false;
if (totalBusinessProfit !== expected.biz.profit) pass = false;

if (pass) {
  console.log('\n>>> VERIFIKASI 100% SUKSES! HASIL COCOK PERSIS DENGAN TABEL ACCEPTANCE CHECKLIST! <<<');
} else {
  console.error('\n>>> ERROR: Hasil tidak cocok! <<<');
  process.exit(1);
}
