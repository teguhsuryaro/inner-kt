'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { getCurrentSession } from '@/lib/auth';
import {
  formatRupiah,
  formatDate,
  getOrderStatusBadge,
  getOwnerTheme,
} from '@/lib/formatters';
import {
  Plus,
  ShoppingCart,
  Eye,
  Ban,
  CheckCircle2,
  Calendar,
  Truck,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { RentalOrder } from '@/types';

export default function OrdersListPage() {
  const session = getCurrentSession();
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'FINAL' | 'DRAFT' | 'CANCELLED'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const orders = innerKtStore.getOrders();
  const usages = innerKtStore.getOrderUsages();
  const allocations = innerKtStore.getOrderAllocations();
  const owners = innerKtStore.getOwners();

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const handleCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionError(null);

    const res = innerKtStore.cancelOrder(selectedOrder.id, cancelReason, {
      id: session?.admin.id || 'admin-1',
      email: session?.admin.email || 'admin1@kanaltiga.internal',
      name: session?.admin.displayName || 'Admin',
    });

    if (res.success) {
      setShowCancelModal(false);
      setSelectedOrder(null);
      setCancelReason('');
    } else {
      setActionError(res.error || 'Gagal membatalkan order.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Transaksi Sewa &bull; Order Management
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Daftar Order Penyewaan Alat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan order sewa alat event. Pendapatan dibagi proporsional unit, potongan transportasi dibagi rata ke 3 pemilik.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Order Baru</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono bg-white p-2 rounded-lg border border-slate-200">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Order ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('FINAL')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterStatus === 'FINAL'
              ? 'bg-emerald-700 text-white font-semibold'
              : 'text-emerald-800 hover:text-emerald-950'
          }`}
        >
          Final / Sah ({orders.filter((o) => o.status === 'FINAL').length})
        </button>
        <button
          onClick={() => setFilterStatus('DRAFT')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterStatus === 'DRAFT'
              ? 'bg-slate-700 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Draft ({orders.filter((o) => o.status === 'DRAFT').length})
        </button>
        <button
          onClick={() => setFilterStatus('CANCELLED')}
          className={`px-3 py-1 rounded transition whitespace-nowrap ${
            filterStatus === 'CANCELLED'
              ? 'bg-rose-700 text-white font-semibold'
              : 'text-rose-700 hover:text-rose-950'
          }`}
        >
          Dibatalkan ({orders.filter((o) => o.status === 'CANCELLED').length})
        </button>
      </div>

      {/* High Density Order Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="finance-table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Penyewa &amp; Nama Event</th>
                <th>Tgl Sewa / Durasi</th>
                <th>Pendapatan Kotor</th>
                <th>Pot. Transport</th>
                <th>Pendapatan Bersih</th>
                <th>Alokasi Bersih Pemilik</th>
                <th>Status</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada order pada filter ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const statusBadge = getOrderStatusBadge(order.status);
                  const orderAllocs = allocations.filter((a) => a.orderId === order.id);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70">
                      <td className="font-mono font-semibold text-xs text-blue-700">
                        {order.orderNumber}
                      </td>
                      <td className="font-medium text-slate-900">
                        <div>{order.customerOrgName}</div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          {order.eventName}
                        </div>
                      </td>
                      <td className="text-xs text-slate-600 font-mono">
                        <div>{formatDate(order.startDate)}</div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {order.durationDays} Hari
                        </div>
                      </td>
                      <td className="font-mono text-slate-900 tabular-nums">
                        {formatRupiah(order.finalGrossRevenue)}
                      </td>
                      <td className="font-mono text-amber-700 tabular-nums">
                        {order.transportCost > 0 ? `-${formatRupiah(order.transportCost)}` : 'Rp0'}
                      </td>
                      <td className="font-mono font-bold text-emerald-700 tabular-nums">
                        {formatRupiah(order.netOrderRevenue)}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                          {orderAllocs.map((al) => {
                            const o = owners.find((ow) => ow.id === al.ownerId);
                            const t = getOwnerTheme(o?.code || '');
                            return (
                              <span
                                key={al.id}
                                className={`px-1.5 py-0.5 rounded border tabular-nums ${t.bg} ${t.text} ${t.border}`}
                                title={`${al.totalUnitsUsed} unit | Kotor: ${formatRupiah(al.grossShare)} | Transport: -${formatRupiah(al.transportCostShare)}`}
                              >
                                {o?.name}: {formatRupiah(al.netShare)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${statusBadge.badge}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded text-xs"
                            title="Lihat Rincian Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {order.status === 'FINAL' && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                              title="Batalkan / Koreksi Order"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Order */}
      {selectedOrder && !showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                  Rincian Transaksi
                </span>
                <h3 className="font-bold text-base text-slate-900 font-sans">
                  {selectedOrder.orderNumber} &bull; {selectedOrder.customerOrgName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Nama Acara:</span>
                  <span className="font-bold text-slate-900 font-sans">{selectedOrder.eventName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Durasi &amp; Tanggal:</span>
                  <span className="text-slate-800">
                    {selectedOrder.durationDays} Hari ({formatDate(selectedOrder.startDate)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Status Order:</span>
                  <span className="font-semibold text-emerald-700">{selectedOrder.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Biaya Transportasi:</span>
                  <span className="font-semibold text-amber-700">{formatRupiah(selectedOrder.transportCost)}</span>
                </div>
              </div>

              {/* Tabel Pemakaian Unit & Bagi Hasil */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 font-mono uppercase text-[11px]">
                  Rincian Unit Digunakan &amp; Bagi Hasil 3 Pemilik
                </h4>
                <table className="finance-table border border-slate-200 rounded">
                  <thead>
                    <tr>
                      <th>Pemilik</th>
                      <th>Unit Terpakai</th>
                      <th>Bagian Kotor</th>
                      <th>Pot. Transport (&divide;3)</th>
                      <th>Pendapatan Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations
                      .filter((a) => a.orderId === selectedOrder.id)
                      .map((al) => {
                        const o = owners.find((ow) => ow.id === al.ownerId);
                        const t = getOwnerTheme(o?.code || '');
                        return (
                          <tr key={al.id}>
                            <td className="font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[11px] border ${t.badge}`}>
                                {o?.name}
                              </span>
                            </td>
                            <td className="font-mono tabular-nums">{al.totalUnitsUsed} Unit</td>
                            <td className="font-mono tabular-nums">{formatRupiah(al.grossShare)}</td>
                            <td className="font-mono tabular-nums text-red-600">
                              -{formatRupiah(al.transportCostShare)}
                            </td>
                            <td className="font-mono tabular-nums font-bold text-emerald-700">
                              {formatRupiah(al.netShare)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {selectedOrder.notes && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-600 text-[11px]">
                  <strong>Catatan:</strong> {selectedOrder.notes}
                </div>
              )}

              {selectedOrder.priceAdjustmentNote && (
                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-800 text-[11px]">
                  <strong>Alasan Penyesuaian Harga / Diskon:</strong> {selectedOrder.priceAdjustmentNote}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pembatalan / Koreksi Order */}
      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-slate-900 font-sans">
                Batalkan Order {selectedOrder.orderNumber}?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Order berstatus FINAL akan diubah menjadi CANCELLED. Alokasi pendapatan dan beban transportasi terkait akan dinonaktifkan secara otomatis dan tercatat di Audit Log.
            </p>

            {actionError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 text-xs text-red-700 rounded">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan / Koreksi (Wajib Diisi untuk Audit)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Misal: Panitia membatalkan acara karena cuaca buruk..."
                  required
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded font-medium shadow-xs"
                >
                  Konfirmasi Batalkan Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
