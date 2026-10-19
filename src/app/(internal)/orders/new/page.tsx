'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { getCurrentSession } from '@/lib/auth';
import { calculateOrderAllocations } from '@/lib/finance-engine';
import { validateOrderInput } from '@/lib/validations';
import { formatRupiah, getOwnerTheme } from '@/lib/formatters';
import {
  ArrowLeft,
  ShoppingCart,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Truck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLeadId = searchParams.get('fromLeadId');
  const session = getCurrentSession();

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const owners = innerKtStore.getOwners();
  const assets = innerKtStore.getAssets();
  const crmLeads = innerKtStore.getCrmLeads();

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState<string>(fromLeadId || '');
  const [customerOrgName, setCustomerOrgName] = useState('');
  const [eventName, setEventName] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [ratePerDay, setRatePerDay] = useState<number>(10000);
  const [transportCost, setTransportCost] = useState<number>(12000);
  const [notes, setNotes] = useState('');

  // Units chosen per owner (Starts at 0 for clean production input)
  const [ownerUnits, setOwnerUnits] = useState<Record<string, number>>({});

  // Gross revenue override
  const [customGross, setCustomGross] = useState<number | null>(null);
  const [priceAdjustmentNote, setPriceAdjustmentNote] = useState('');
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available stock per owner (Revisi v2.0: condition_status dihapus, seluruh unit siap sewa)
  const availableStock = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of owners) {
      map[o.id] = assets
        .filter((a) => a.ownerId === o.id)
        .reduce((sum, a) => sum + a.quantity, 0);
    }
    return map;
  }, [owners, assets]);

  // Load from CRM lead if parameter provided or selected
  useEffect(() => {
    if (selectedLeadId) {
      const lead = crmLeads.find((l) => l.id === selectedLeadId);
      if (lead) {
        setCustomerOrgName(lead.organizationName);
        setEventName(lead.eventName);
        if (lead.eventDate) {
          const d = lead.eventDate.split('T')[0];
          setStartDate(d);
          setEndDate(d);
        }
        if (lead.estimatedDuration) {
          setDurationDays(lead.estimatedDuration);
        }
        setNotes(
          `Dikonversi dari prospek CRM. PIC: ${lead.picName} (${lead.picPhone})` +
            (lead.voucherCodeOffered ? ` | Voucher: ${lead.voucherCodeOffered}` : '')
        );
      }
    }
  }, [selectedLeadId, crmLeads]);

  // Total units selected
  const totalUnits = useMemo(() => {
    return Object.values(ownerUnits).reduce((sum, u) => sum + (Number(u) || 0), 0);
  }, [ownerUnits]);

  // Calculated gross
  const calculatedGross = totalUnits * (ratePerDay || 0) * (durationDays || 1);
  const finalGrossRevenue = customGross !== null ? customGross : calculatedGross;

  // Real-time calculation preview
  const previewAllocations = useMemo(() => {
    const activeOwnerIds = owners.filter((o) => o.isActive).map((o) => o.id);
    const usages = Object.entries(ownerUnits).map(([ownerId, units]) => ({
      ownerId,
      unitsUsed: Number(units) || 0,
      ratePerDay,
      durationDays,
    }));

    return calculateOrderAllocations({
      activeOwnerIds,
      usages,
      finalGrossRevenue,
      transportCost: Number(transportCost) || 0,
    });
  }, [owners, ownerUnits, ratePerDay, durationDays, finalGrossRevenue, transportCost]);

  // Validation
  const validation = useMemo(() => {
    return validateOrderInput(
      {
        customerOrgName,
        eventName,
        orderDate,
        startDate,
        endDate,
        durationDays,
        ratePerDay,
        ownerUnits,
        finalGrossRevenue,
        priceAdjustmentNote,
        transportCost,
      },
      assets,
      false
    );
  }, [
    customerOrgName,
    eventName,
    orderDate,
    startDate,
    endDate,
    durationDays,
    ratePerDay,
    ownerUnits,
    finalGrossRevenue,
    priceAdjustmentNote,
    transportCost,
    assets,
  ]);

  const handleUnitChange = (ownerId: string, val: number) => {
    setOwnerUnits((prev) => ({
      ...prev,
      [ownerId]: Math.max(0, val),
    }));
  };

  const handleSubmit = (status: 'FINAL' | 'DRAFT') => {
    setSubmitErrors([]);
    setIsSubmitting(true);

    const res = innerKtStore.createOrder(
      {
        customerOrgName,
        eventName,
        orderDate: new Date(orderDate).toISOString(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        durationDays: Number(durationDays),
        ratePerDay: Number(ratePerDay),
        ownerUnits,
        finalGrossRevenue: Number(finalGrossRevenue),
        priceAdjustmentNote: priceAdjustmentNote || undefined,
        transportCost: Number(transportCost) || 0,
        notes: notes || undefined,
        crmLeadId: selectedLeadId || undefined,
      },
      {
        id: session?.admin.id || 'admin-1',
        email: session?.admin.email || 'admin1@kanaltiga.internal',
        name: session?.admin.displayName || 'Admin',
      },
      status
    );

    if (res.success) {
      router.push('/orders');
    } else if (res.errors) {
      setSubmitErrors(res.errors);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="text-xs font-mono text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Order</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Buat Order Penyewaan Baru &amp; Kalkulator Bagi Hasil
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilih pemakaian unit per pemilik, hitung tarif sewa, dan pantau live preview bagi hasil sebelum disimpan.
          </p>
        </div>
      </div>

      {submitErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Terdapat kesalahan pada input order:</span>
          </div>
          {submitErrors.map((err, i) => (
            <div key={i} className="pl-5 text-[11px]">&bull; {err}</div>
          ))}
        </div>
      )}

      {/* 2-COLUMN LAYOUT: INPUT vs LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =====================================================================
            LEFT COLUMN (7 COLS): FORM INPUTS
            ===================================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Customer & Event Info */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs font-mono uppercase text-slate-800 tracking-wider">
                1. Data Penyewa &amp; Acara
              </h3>
              {crmLeads.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Pilih dari CRM:</span>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="text-[11px] font-mono px-2 py-0.5 border border-slate-300 rounded bg-slate-50 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Ketik Manual --</option>
                    {crmLeads
                      .filter((l) => l.pipelineStatus !== 'WON')
                      .map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.organizationName} - {lead.eventName}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Organisasi / Penyewa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerOrgName}
                  onChange={(e) => setCustomerOrgName(e.target.value)}
                  placeholder="Contoh: BEM KM Universitas..."
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Acara / Event <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Contoh: Malam Puncak Dies Natalis..."
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Mulai Sewa
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Durasi Sewa (Hari) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Asset Allocation per Owner */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-none space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs font-mono uppercase text-slate-800 tracking-wider">
                2. Pemilihan Unit Aset per Pemilik
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                Total Dipilih: <strong className="text-slate-900">{totalUnits} Unit</strong>
              </span>
            </div>

            {assets.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center justify-between gap-2">
                <span>Inventaris aset masih kosong. Tambahkan aset terlebih dahulu di menu Inventaris Aset agar dapat memilih unit yang disewakan.</span>
                <Link
                  href="/assets"
                  className="px-2.5 py-1 bg-amber-700 text-white rounded text-[11px] font-medium hover:bg-amber-800 shrink-0"
                >
                  + Tambah Aset
                </Link>
              </div>
            )}

            <div className="space-y-2.5">
              {owners.map((owner) => {
                const theme = getOwnerTheme(owner.code);
                const maxStock = availableStock[owner.id] || 0;
                const units = ownerUnits[owner.id] || 0;
                const isOverStock = units > maxStock;

                return (
                  <div
                    key={owner.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      isOverStock ? 'bg-red-50 border-red-300' : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${theme.dot}`} />
                        <span className="font-bold text-xs text-slate-900 font-sans">
                          {owner.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">({owner.code})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Stok Kondisi Baik:{' '}
                        <strong className="text-slate-800">{maxStock} Unit</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-mono text-slate-500">Unit Digunakan:</label>
                      <input
                        type="number"
                        min={0}
                        max={maxStock}
                        value={units}
                        onChange={(e) => handleUnitChange(owner.id, Number(e.target.value))}
                        className={`w-20 text-xs px-2.5 py-1.5 border rounded font-mono font-bold text-center focus:outline-none ${
                          isOverStock
                            ? 'border-red-500 text-red-700 bg-white ring-1 ring-red-500'
                            : 'border-slate-300 text-slate-900 bg-white focus:ring-1 focus:ring-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Pricing & Transport Cost */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-none space-y-4">
            <h3 className="font-bold text-xs font-mono uppercase text-slate-800 tracking-wider border-b border-slate-100 pb-2.5">
              3. Tarif Sewa &amp; Biaya Transportasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tarif Sewa per Unit / Hari (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={ratePerDay}
                  onChange={(e) => setRatePerDay(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Biaya Transportasi Order (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Dipagi rata ke 3 pemilik (Rp{Math.floor(transportCost / 3).toLocaleString('id-ID')}/orang)
                </span>
              </div>
            </div>

            {/* Custom Deal / Discount Section */}
            <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">Total Pembayaran Sewa Aktual (Kotor)</span>
                  <p className="text-[11px] text-slate-400">
                    Standar sistem: {formatRupiah(calculatedGross)} ({totalUnits} unit &times; {formatRupiah(ratePerDay)} &times; {durationDays} hari)
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={finalGrossRevenue}
                  onChange={(e) => setCustomGross(Number(e.target.value))}
                  className="w-36 text-xs px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-right text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {calculatedGross !== finalGrossRevenue && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs space-y-1">
                  <label className="block font-semibold text-amber-900">
                    Alasan Penyesuaian Harga / Diskon Paket Event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={priceAdjustmentNote}
                    onChange={(e) => setPriceAdjustmentNote(e.target.value)}
                    placeholder="Wajib diisi: contoh Diskon paket Dies Natalis 2 hari..."
                    required
                    className="w-full text-xs px-2.5 py-1.5 border border-amber-300 rounded bg-white text-slate-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-amber-700">
                    Proporsi bagi hasil kotor akan disesuaikan otomatis dengan persentase kontribusi unit masing-masing pemilik.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                Catatan Order (Opsional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan penyerahan alat, PIC lapangan, atau kondisi..."
                rows={2}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (5 COLS): LIVE PREVIEW BAGI HASIL & ACTIONS
            ===================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-none sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-xs font-mono uppercase text-slate-900 tracking-wider">
                  Live Preview Bagi Hasil Order
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Real-Time
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase text-slate-400 block">Pendapatan Kotor:</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {formatRupiah(finalGrossRevenue)}
                </span>
              </div>
              <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200">
                <span className="text-[10px] uppercase text-amber-700 block">Pot. Transportasi (&divide;3):</span>
                <span className="font-bold text-amber-800 text-sm tabular-nums">
                  -{formatRupiah(transportCost)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded text-xs font-mono flex items-center justify-between">
              <span className="text-emerald-800 font-semibold">Total Pendapatan Bersih Order:</span>
              <span className="text-base font-bold text-emerald-800 tabular-nums">
                {formatRupiah(finalGrossRevenue - transportCost)}
              </span>
            </div>

            {/* Breakdown per Owner Table */}
            <div>
              <div className="text-[11px] font-mono font-semibold uppercase text-slate-600 mb-2">
                Rincian per Pemilik (Prinsip Kanal Tiga):
              </div>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="finance-table text-xs">
                  <thead>
                    <tr>
                      <th>Pemilik</th>
                      <th>Unit</th>
                      <th>Kotor</th>
                      <th>Transp</th>
                      <th>Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewAllocations.map((alloc) => {
                      const owner = owners.find((o) => o.id === alloc.ownerId);
                      const theme = getOwnerTheme(owner?.code || '');
                      return (
                        <tr key={alloc.ownerId}>
                          <td className="font-semibold text-slate-900">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] border ${theme.badge}`}>
                              {owner?.name}
                            </span>
                          </td>
                          <td className="font-mono tabular-nums">{alloc.totalUnitsUsed}</td>
                          <td className="font-mono tabular-nums">{formatRupiah(alloc.grossShare)}</td>
                          <td className="font-mono text-red-600 tabular-nums">
                            -{formatRupiah(alloc.transportCostShare)}
                          </td>
                          <td className="font-mono font-bold text-emerald-700 tabular-nums">
                            {formatRupiah(alloc.netShare)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                {totalUnits > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <span>Minimal 1 unit alat dipilih ({totalUnits} unit)</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                {customerOrgName.trim() && eventName.trim() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                )}
                <span>Nama penyewa &amp; nama acara terisi</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                {calculatedGross === finalGrossRevenue || priceAdjustmentNote.trim() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span>Validasi penyesuaian diskon (lengkap)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                type="button"
                disabled={!validation.isValid || isSubmitting}
                onClick={() => handleSubmit('FINAL')}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Simpan &amp; Finalisasi Order (Sah)</span>
              </button>

              <button
                type="button"
                disabled={!customerOrgName.trim() || !eventName.trim() || isSubmitting}
                onClick={() => handleSubmit('DRAFT')}
                className="w-full py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded border border-slate-300 transition"
              >
                Simpan Sebagai Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
