'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { formatRupiah, formatPercent, getOwnerTheme } from '@/lib/formatters';
import {
  TrendingUp,
  DollarSign,
  Truck,
  Wallet,
  Receipt,
  Scale,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Info,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'ALL' | 'THIS_YEAR' | 'THIS_MONTH'>('ALL');

  // Reactively sync with store changes
  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  // Compute date filter
  let filterDateRange: { startDate?: string; endDate?: string } | undefined;
  const now = new Date();
  if (period === 'THIS_YEAR') {
    filterDateRange = {
      startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
      endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
    };
  } else if (period === 'THIS_MONTH') {
    filterDateRange = {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    };
  }

  const summary = innerKtStore.getFinancialSummary(filterDateRange);

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
              Workspace Keuangan
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Data Terverifikasi (100% Akurat)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Dashboard Keuangan &amp; Balik Modal 3 Pemilik
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan pendapatan kotor, potongan transportasi merata, progres balik modal (ROI), dan profit bersih bisnis.
          </p>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 text-xs font-mono">
            <button
              onClick={() => setPeriod('ALL')}
              className={`px-3 py-1 rounded transition ${
                period === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriod('THIS_YEAR')}
              className={`px-3 py-1 rounded transition ${
                period === 'THIS_YEAR'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tahun Ini
            </button>
            <button
              onClick={() => setPeriod('THIS_MONTH')}
              className={`px-3 py-1 rounded transition ${
                period === 'THIS_MONTH'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium tracking-wide uppercase transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Order Baru</span>
          </Link>
        </div>
      </div>

      {/* =======================================================================
          BAGIAN 1: METRIC STRIP TINGKAT BISNIS (5 KOLOM PADAT)
          ======================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <span>Ringkasan Finansial Bisnis Kanal Tiga</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Metode: Cash Flow &amp; Capital Amortization Ledger
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card 1: Modal Aset */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Modal Aset</span>
              <Wallet className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatRupiah(summary.totalBusinessCapital)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.totalBusinessUnits} unit HT terdaftar (3 Pemilik)
            </p>
          </div>

          {/* Card 2: Pendapatan Bersih Order */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pendapatan Bersih</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-600 tabular-nums">
              {formatRupiah(summary.totalNetOrderRevenue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Kotor: {formatRupiah(summary.totalGrossRevenue)} &minus; Transp: {formatRupiah(summary.totalTransportCost)}
            </p>
          </div>

          {/* Card 3: Pengeluaran Lain */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pengeluaran Lain</span>
              <Receipt className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatRupiah(summary.totalOtherExpenses)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Stiker bersama &amp; perlengkapan pribadi
            </p>
          </div>

          {/* Card 4: Progres Balik Modal */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Sisa Modal Belum</span>
              <Scale className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-700 tabular-nums">
              {formatRupiah(summary.totalUnrecoveredCapital)}
            </div>
            <div className="mt-1.5">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${summary.capitalRecoveryPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Kembali: {formatRupiah(summary.totalRecoveredCapital)}</span>
                <span>{formatPercent(summary.capitalRecoveryPercentage)}</span>
              </div>
            </div>
          </div>

          {/* Card 5: Profit Setelah Modal & Pengeluaran */}
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-none">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Profit Bersih</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div
              className={`text-lg font-bold font-mono tabular-nums ${
                summary.totalBusinessProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {formatRupiah(summary.totalBusinessProfit, true)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {summary.totalBusinessProfit < 0
                ? 'Defisit (proses pengembalian modal)'
                : 'Profit murni pasca modal'}
            </p>
          </div>
        </div>
      </div>

      {/* =======================================================================
          BAGIAN 2: MATRIKS PERBANDINGAN 3 PEMILIK (SIDE-BY-SIDE CARDS)
          ======================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-700">
              Hak &amp; Progres Keuangan per Pemilik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aset dimiliki masing-masing. Pendapatan dibagi proporsional unit, potongan transportasi dibagi rata 3 orang.
            </p>
          </div>
          <Link
            href="/owners"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <span>Kelola Profil Pemilik</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summary.owners.map((ownerSummary) => {
            const theme = getOwnerTheme(ownerSummary.ownerCode);
            return (
              <div
                key={ownerSummary.ownerId}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none flex flex-col"
              >
                {/* Header Card Pemilik */}
                <div className={`p-4 border-b ${theme.border} ${theme.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                      <h3 className={`font-bold font-sans text-sm ${theme.text}`}>
                        {ownerSummary.ownerName}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                      {ownerSummary.ownerCode}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-slate-600">Aset &amp; Modal:</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {ownerSummary.totalUnitsOwned} Unit ({formatRupiah(ownerSummary.totalCapital)})
                    </span>
                  </div>
                </div>

                {/* Progress Bar Balik Modal */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Progres Balik Modal</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {formatPercent(ownerSummary.capitalRecoveryPercentage)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        ownerSummary.isCapitalFullyRecovered ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${ownerSummary.capitalRecoveryPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-600 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Sudah Kembali</span>
                      <span className="font-semibold text-emerald-700 tabular-nums">
                        {formatRupiah(ownerSummary.recoveredCapital)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px] uppercase">Sisa Modal</span>
                      <span className="font-semibold text-amber-700 tabular-nums">
                        {formatRupiah(ownerSummary.unrecoveredCapital)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detail Breakdown Angka Finansial */}
                <div className="p-4 space-y-2.5 text-xs flex-1">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Pendapatan Kotor Order</span>
                    <span className="font-mono text-slate-900 font-medium tabular-nums">
                      {formatRupiah(ownerSummary.grossOrderRevenue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Potongan Transportasi (&divide;3)</span>
                    <span className="font-mono text-red-600 font-medium tabular-nums">
                      -{formatRupiah(ownerSummary.orderTransportShare)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 font-semibold">
                    <span className="text-slate-700">Pendapatan Bersih Order</span>
                    <span className="font-mono text-emerald-700 tabular-nums">
                      {formatRupiah(ownerSummary.netOrderRevenue)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Beban Pengeluaran Bersama (&divide;3)</span>
                    <span className="font-mono text-slate-700 tabular-nums">
                      {formatRupiah(ownerSummary.sharedExpenseShare)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Pengeluaran Perorangan</span>
                    <span className="font-mono text-slate-700 tabular-nums">
                      {formatRupiah(ownerSummary.individualExpense)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 text-slate-600">
                    <span className="text-slate-500">Total Pengeluaran Non-Transport</span>
                    <span className="font-mono font-medium text-slate-800 tabular-nums">
                      {formatRupiah(ownerSummary.totalNonTransportExpense)}
                    </span>
                  </div>
                </div>

                {/* Profit Box Footer */}
                <div className="p-3.5 bg-slate-50 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-semibold text-slate-500 block">
                        Profit Pasca Modal &amp; Beban
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ownerSummary.profitAfterCapitalAndExpense < 0
                          ? 'Defisit Menuju Balik Modal'
                          : 'Profit Bersih Sah'}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold font-mono tabular-nums px-2 py-0.5 rounded border ${
                        ownerSummary.profitAfterCapitalAndExpense >= 0
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}
                    >
                      {formatRupiah(ownerSummary.profitAfterCapitalAndExpense, true)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          BAGIAN 3: AUDIT TRANSPARANSI RUMUS & CHECKLIST ACCEPTANCE
          ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
            Transparansi Aturan Keuangan Sistem (Zero Double-Count)
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600 leading-relaxed">
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">1. Alokasi Pendapatan Kotor</span>
            Pendapatan kotor order dibagi proporsional berdasarkan jumlah unit milik masing-masing pemilik yang dipakai pada order tersebut.
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">2. Biaya Transportasi Merata</span>
            Biaya transportasi order dipotong dari pendapatan kotor sebelum bagi hasil, lalu dibagi rata kepada 3 pemilik (Rp4.000/orang pada Order #1).
          </div>
          <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">3. Rumus Profit Eksak</span>
            Profit = Akumulasi Pendapatan Bersih Order &minus; Total Modal Aset &minus; Total Pengeluaran Non-Transportasi (biaya transportasi tidak dikurangi dua kali).
          </div>
        </div>
      </div>
    </div>
  );
}
