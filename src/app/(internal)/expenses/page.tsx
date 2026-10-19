'use client';

import { useState, useSyncExternalStore } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { getCurrentSession } from '@/lib/auth';
import { formatRupiah, formatDate, getOwnerTheme } from '@/lib/formatters';
import { Plus, Receipt, Truck, Users, User, AlertCircle, FileText } from 'lucide-react';
import { ExpenseCategory, ExpenseAllocationType } from '@/types';

export default function ExpensesPage() {
  const session = getCurrentSession();
  const [filterType, setFilterType] = useState<'ALL' | 'SHARED' | 'INDIVIDUAL' | 'ORDER_TRANSPORT'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('STIKER_BRANDING');
  const [amount, setAmount] = useState<number>(50000);
  const [allocationType, setAllocationType] = useState<ExpenseAllocationType>('SHARED');
  const [paidByOwnerId, setPaidByOwnerId] = useState('owner-1');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const owners = innerKtStore.getOwners();
  const expenses = innerKtStore.getExpenses();
  const expenseAllocs = innerKtStore.getExpenseAllocations();

  const filteredExpenses = expenses.filter((e) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'ORDER_TRANSPORT') return e.isOrderTransport;
    if (filterType === 'SHARED') return !e.isOrderTransport && e.allocationType === 'SHARED';
    if (filterType === 'INDIVIDUAL') return !e.isOrderTransport && e.allocationType === 'INDIVIDUAL';
    return true;
  });

  const totalSharedNonTransport = expenses
    .filter((e) => e.status === 'ACTIVE' && !e.isOrderTransport && e.allocationType === 'SHARED')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIndividual = expenses
    .filter((e) => e.status === 'ACTIVE' && !e.isOrderTransport && e.allocationType === 'INDIVIDUAL')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalOrderTransport = expenses
    .filter((e) => e.status === 'ACTIVE' && e.isOrderTransport)
    .reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const res = innerKtStore.addExpense(
      {
        title,
        category,
        amount: Number(amount),
        allocationType,
        paidByOwnerId: paidByOwnerId || null,
        expenseDate: new Date(expenseDate).toISOString(),
        description: description || null,
        receiptRef: receiptRef || null,
      },
      {
        id: session?.admin.id || 'admin-1',
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      }
    );

    if (res.success) {
      setShowAddModal(false);
      setTitle('');
      setAmount(50000);
      setDescription('');
      setReceiptRef('');
    } else if (res.errors) {
      setFormErrors(res.errors);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Biaya Operasional &bull; Ledger Beban
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Pencatatan Pengeluaran Bisnis
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengeluaran bersama dibagi rata ke 3 pemilik. Pengeluaran transportasi dari order tercatat transparan tanpa double count.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Catat Pengeluaran Baru</span>
        </button>
      </div>

      {/* Summary Strip 3 Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pengeluaran Bersama (&divide;3)</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatRupiah(totalSharedNonTransport)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Beban otomatis dibagi rata ke 3 pemilik ({formatRupiah(totalSharedNonTransport / 3)}/org)
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pengeluaran Perorangan</span>
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
            {formatRupiah(totalIndividual)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Ditanggung khusus pemilik bersangkutan
          </p>
        </div>

        <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Transport Order (Terpotong)</span>
            <Truck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold font-mono text-amber-900 tabular-nums">
            {formatRupiah(totalOrderTransport)}
          </div>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Sudah memotong pendapatan kotor order (tidak dikurangkan ganda)
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono bg-white p-2 rounded-lg border border-slate-200">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterType === 'ALL'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Pengeluaran ({expenses.length})
        </button>
        <button
          onClick={() => setFilterType('SHARED')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterType === 'SHARED'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Beban Bersama (&divide;3)
        </button>
        <button
          onClick={() => setFilterType('INDIVIDUAL')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterType === 'INDIVIDUAL'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Beban Perorangan
        </button>
        <button
          onClick={() => setFilterType('ORDER_TRANSPORT')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterType === 'ORDER_TRANSPORT'
              ? 'bg-amber-600 text-white font-semibold'
              : 'text-amber-700 hover:text-amber-900'
          }`}
        >
          Otomatis dari Order
        </button>
      </div>

      {/* High Density Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="finance-table">
            <thead>
              <tr>
                <th>Judul Pengeluaran</th>
                <th>Kategori</th>
                <th>Tipe Beban</th>
                <th>Total Nominal</th>
                <th>Dibayarkan Oleh</th>
                <th>Rincian Beban Pemilik</th>
                <th>Tanggal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada pengeluaran pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const allocs = expenseAllocs.filter((ea) => ea.expenseId === expense.id);
                  const payer = owners.find((o) => o.id === expense.paidByOwnerId);
                  const payerTheme = getOwnerTheme(payer?.code || '');

                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/70">
                      <td className="font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {expense.isOrderTransport && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold shrink-0">
                              <Truck className="w-3 h-3" />
                              ORDER TRANSPORT
                            </span>
                          )}
                          <span>{expense.title}</span>
                        </div>
                        {expense.description && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            {expense.description}
                          </div>
                        )}
                        {expense.receiptRef && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Ref: {expense.receiptRef}
                          </div>
                        )}
                      </td>
                      <td className="text-xs text-slate-600 font-mono">
                        {expense.category}
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                          expense.allocationType === 'SHARED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {expense.allocationType === 'SHARED' ? 'Bersama (Bagi 3)' : 'Perorangan'}
                        </span>
                      </td>
                      <td className="font-mono font-bold text-slate-900 tabular-nums">
                        {formatRupiah(expense.amount)}
                      </td>
                      <td>
                        {payer ? (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${payerTheme.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${payerTheme.dot}`} />
                            {payer.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 text-[11px] font-mono">
                          {allocs.map((al) => {
                            const o = owners.find((ow) => ow.id === al.ownerId);
                            const t = getOwnerTheme(o?.code || '');
                            return (
                              <span
                                key={al.id}
                                className={`px-1.5 py-0.5 rounded border text-[10px] tabular-nums ${t.bg} ${t.text} ${t.border}`}
                              >
                                {o?.name}: {formatRupiah(al.allocatedAmount)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="text-xs text-slate-500 font-mono">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                          expense.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Pengeluaran Baru */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                Catat Pengeluaran Operasional Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                &times;
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul / Deskripsi Singkat Pengeluaran
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pembelian Baterai Cadangan / Cetak Brosur"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  >
                    <option value="STIKER_BRANDING">Stiker &amp; Branding</option>
                    <option value="PERLENGKAPAN">Perlengkapan Alat</option>
                    <option value="PERAWATAN">Perawatan / Servis</option>
                    <option value="TRANSPORTASI">Transportasi / Bensin</option>
                    <option value="PARKIR">Parkir &amp; Tol</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nominal Pengeluaran (Rp)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jenis Pembagian Beban
                  </label>
                  <select
                    value={allocationType}
                    onChange={(e) => setAllocationType(e.target.value as ExpenseAllocationType)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  >
                    <option value="SHARED">Bersama (Otomatis Dibagi Rata 3 Pemilik)</option>
                    <option value="INDIVIDUAL">Perorangan (Ditanggung 1 Pemilik)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {allocationType === 'SHARED' ? 'Dibayarkan/Ditalangi Oleh' : 'Pemilik yang Menanggung'}
                  </label>
                  <select
                    value={paidByOwnerId}
                    onChange={(e) => setPaidByOwnerId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-medium"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Pembagian */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <div className="text-[11px] font-semibold text-slate-600 font-mono uppercase">
                  Preview Pembebanan:
                </div>
                {allocationType === 'SHARED' ? (
                  <div className="text-slate-700 font-mono text-[11px]">
                    Dibagi rata 3 pemilik: <strong>{formatRupiah(Math.floor(amount / 3))}</strong> / orang
                    {amount % 3 !== 0 && ' (sisa pembulatan dialokasikan presisi)'}
                  </div>
                ) : (
                  <div className="text-slate-700 font-mono text-[11px]">
                    Ditanggung 100% oleh:{' '}
                    <strong>{owners.find((o) => o.id === paidByOwnerId)?.name || 'Pemilik Terpilih'}</strong> ({formatRupiah(amount)})
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    No. Nota / Bukti (Opsional)
                  </label>
                  <input
                    type="text"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    placeholder="Contoh: NOTA-887 / Struk Indomaret"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Rincian (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan keperluan pembelian..."
                  rows={2}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 rounded font-medium shadow-xs"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
