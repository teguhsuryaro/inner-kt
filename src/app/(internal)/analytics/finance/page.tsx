'use client';

import { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { formatRupiah } from '@/lib/formatters';
import {
  exportFinanceCsvForAi,
  exportFinanceExcel,
} from '@/lib/export-utils';
import {
  BarChart3,
  Bot,
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  Boxes,
  PieChart as PieIcon,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsFinancePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useSyncExternalStore(
    subscribeToStore,
    getStoreSnapshot,
    () => 1
  );

  const owners = innerKtStore.getOwners();
  const assets = innerKtStore.getAssets();
  const orders = innerKtStore.getOrders();
  const usages = innerKtStore.getOrderUsages();
  const allocs = innerKtStore.getOrderAllocations();
  const expenses = innerKtStore.getExpenses();
  const expenseAllocs = innerKtStore.getExpenseAllocations();
  const summary = innerKtStore.getFinancialSummary();

  // 1. Data Grafik 1: Tren Arus Kas Bulanan (Composed Bar & Line)
  const monthlyCashflowData = useMemo(() => {
    const monthMap: Record<string, { month: string; netRevenue: number; expenses: number; netCashflow: number }> = {};

    // Populate active orders
    orders.forEach((o) => {
      if (o.status === 'CANCELLED') return;
      const monthKey = o.startDate ? o.startDate.substring(0, 7) : '2026-02';
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, netRevenue: 0, expenses: 0, netCashflow: 0 };
      }
      monthMap[monthKey].netRevenue += o.netOrderRevenue;
    });

    // Populate active expenses
    expenses.forEach((e) => {
      if (e.status === 'VOID') return;
      const monthKey = e.expenseDate ? e.expenseDate.substring(0, 7) : (e.createdAt ? e.createdAt.substring(0, 7) : '2026-02');
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, netRevenue: 0, expenses: 0, netCashflow: 0 };
      }
      monthMap[monthKey].expenses += e.amount;
    });

    // Sort chronologically and format
    const sorted = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    if (sorted.length === 0) {
      return [
        { month: 'Feb 2026', netRevenue: 280000, expenses: 85000, netCashflow: 195000 },
        { month: 'Mar 2026', netRevenue: 450000, expenses: 120000, netCashflow: 330000 },
      ];
    }

    return sorted.map((item) => {
      const [year, month] = item.month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthLabel = `${monthNames[parseInt(month, 10) - 1] || month} ${year}`;
      return {
        month: monthLabel,
        netRevenue: item.netRevenue,
        expenses: item.expenses,
        netCashflow: item.netRevenue - item.expenses,
      };
    });
  }, [orders, expenses]);

  // 2. Data Grafik 2: Perbandingan 3 Pemilik (Modal, Modal Kembali, Sisa Belum Kembali, Beban)
  const ownerComparisonData = useMemo(() => {
    return summary.owners.map((o) => ({
      name: o.ownerName,
      'Total Modal': o.totalCapital,
      'Modal Kembali': o.recoveredCapital,
      'Sisa Modal': o.unrecoveredCapital,
      'Beban Pengeluaran': o.totalAllExpenseIncludingTransport,
    }));
  }, [summary]);

  // 3. Data Grafik 3: Proporsi Kepemilikan Unit & Utilisasi Sewa
  const { ownershipData, utilizationData } = useMemo(() => {
    const OWNER_COLORS: Record<string, string> = {
      'owner-1': '#3b82f6', // Biru Surya
      'owner-2': '#10b981', // Hijau Pemilik B
      'owner-3': '#8b5cf6', // Ungu Pemilik C
    };

    // Ownership count per owner
    const ownershipCounts: Record<string, number> = {
      'owner-1': 0,
      'owner-2': 0,
      'owner-3': 0,
    };
    assets.forEach((a) => {
      if (ownershipCounts[a.ownerId] !== undefined) {
        ownershipCounts[a.ownerId] += a.quantity;
      }
    });

    const oData = [
      { name: 'Surya (Pemilik 1)', value: ownershipCounts['owner-1'] || 1, color: OWNER_COLORS['owner-1'] },
      { name: 'Pemilik B (Pemilik 2)', value: ownershipCounts['owner-2'] || 1, color: OWNER_COLORS['owner-2'] },
      { name: 'Pemilik C (Pemilik 3)', value: ownershipCounts['owner-3'] || 1, color: OWNER_COLORS['owner-3'] },
    ];

    // Utilization units count per owner from order usages
    const usageCounts: Record<string, number> = {
      'owner-1': 0,
      'owner-2': 0,
      'owner-3': 0,
    };
    usages.forEach((u: any) => {
      if (usageCounts[u.ownerId] !== undefined) {
        usageCounts[u.ownerId] += u.unitsUsed;
      }
    });

    const uData = [
      { name: 'Surya (Disewa)', value: usageCounts['owner-1'] || 1, color: OWNER_COLORS['owner-1'] },
      { name: 'Pemilik B (Disewa)', value: usageCounts['owner-2'] || 1, color: OWNER_COLORS['owner-2'] },
      { name: 'Pemilik C (Disewa)', value: usageCounts['owner-3'] || 1, color: OWNER_COLORS['owner-3'] },
    ];

    return { ownershipData: oData, utilizationData: uData };
  }, [assets, usages]);

  // 4. Data Grafik 4: Komposisi Pengeluaran per Kategori & Tipe
  const expenseCompositionData = useMemo(() => {
    const catMap: Record<string, { category: string; Bersama: number; Perorangan: number }> = {
      TRANSPORTASI: { category: 'Transportasi', Bersama: 0, Perorangan: 0 },
      STIKER_BRANDING: { category: 'Stiker & Branding', Bersama: 0, Perorangan: 0 },
      PERLENGKAPAN: { category: 'Perlengkapan', Bersama: 0, Perorangan: 0 },
      PERAWATAN: { category: 'Perawatan Alat', Bersama: 0, Perorangan: 0 },
      LAINNYA: { category: 'Lainnya', Bersama: 0, Perorangan: 0 },
    };

    expenses.forEach((e) => {
      if (e.status === 'VOID') return;
      const target = catMap[e.category] || catMap.LAINNYA;
      if (e.allocationType === 'SHARED') {
        target.Bersama += e.amount;
      } else {
        target.Perorangan += e.amount;
      }
    });

    return Object.values(catMap);
  }, [expenses]);

  const handleExportCsv = () => {
    setExportingType('CSV');
    try {
      exportFinanceCsvForAi(
        summary,
        assets,
        orders,
        usages,
        allocs,
        expenses,
        expenseAllocs,
        owners
      );
    } finally {
      setTimeout(() => setExportingType(null), 1000);
    }
  };

  const handleExportExcel = () => {
    setExportingType('EXCEL');
    try {
      exportFinanceExcel(
        summary,
        assets,
        orders,
        usages,
        allocs,
        expenses,
        expenseAllocs,
        owners
      );
    } finally {
      setTimeout(() => setExportingType(null), 1000);
    }
  };

  if (!isMounted) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-400">
        Memuat visualisasi grafik keuangan...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Keuangan &amp; Aset &bull; Analitik Real-Time
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Grafik Keuangan &amp; Analisis Aset
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi interaktif arus kas bulanan, progres balik modal 3 pemilik, utilisasi unit, dan beban operasional.
          </p>
        </div>

        {/* Dual Export Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 1. CSV for AI */}
          <button
            onClick={handleExportCsv}
            disabled={exportingType !== null}
            title="Download CSV terdenormalisasi yang ramah dipahami oleh AI/LLM (ChatGPT, Gemini, Claude)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-medium transition shadow-2xs"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>Download CSV (Untuk AI)</span>
          </button>

          {/* 2. Excel for Humans */}
          <button
            onClick={handleExportExcel}
            disabled={exportingType !== null}
            title="Download Spreadsheet Excel (.xlsx) rapi dengan multi-sheet dan lebar kolom otomatis"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Top Quick Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Modal Aset</div>
          <div className="text-base font-bold font-mono text-slate-900 mt-1">
            {formatRupiah(summary.totalBusinessCapital)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            3 Pemilik (Surya, B, C)
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Net Order Revenue</div>
          <div className="text-base font-bold font-mono text-emerald-600 mt-1">
            {formatRupiah(summary.totalNetOrderRevenue)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            Bagi hasil bersih 3 pemilik
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Rata-Rata Balik Modal</div>
          <div className="text-base font-bold font-mono text-blue-600 mt-1">
            {summary.capitalRecoveryPercentage.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            {formatRupiah(summary.totalRecoveredCapital)} kembali
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Beban Pengeluaran</div>
          <div className="text-base font-bold font-mono text-amber-600 mt-1">
            {formatRupiah(summary.totalOtherExpenses)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            Operasional &amp; perlengkapan
          </div>
        </div>
      </div>

      {/* Grid 2 Columns of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================================
            GRAFIK 1: Tren Arus Kas Bulanan (Composed Bar & Line)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Tren Arus Kas Bulanan
              </h2>
              <p className="text-[11px] text-slate-500">
                Pendapatan bersih order vs pengeluaran operasional &amp; net cashflow.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Composed Chart
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyCashflowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="netRevenue" name="Pendapatan Bersih" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Pengeluaran Bisnis" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="netCashflow" name="Net Cashflow" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 2: Perbandingan Modal & Balik Modal 3 Pemilik (Grouped Bar)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Posisi Finansial 3 Pemilik (Equal Co-Owners)
              </h2>
              <p className="text-[11px] text-slate-500">
                Modal aset, modal kembali, sisa modal belum kembali, dan beban pengeluaran.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Grouped Bar
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ownerComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Total Modal" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Modal Kembali" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Sisa Modal" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Beban Pengeluaran" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 3: Proporsi Kepemilikan Unit vs Utilisasi Sewa (Donut Ganda)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Stok Aset vs Utilisasi Penyewaan
              </h2>
              <p className="text-[11px] text-slate-500">
                Kiri: Kepemilikan unit terdaftar &bull; Kanan: Frekuensi unit tersewa dalam order.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Dual Donut
            </span>
          </div>

          <div className="grid grid-cols-2 h-[280px]">
            {/* Donut 1: Kepemilikan Stok */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-semibold text-slate-700 mb-1">
                Total Stok Aset
              </span>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Tooltip
                      formatter={(val: any) => [`${val} Unit`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    />
                    <Pie
                      data={ownershipData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {ownershipData.map((entry, index) => (
                        <Cell key={`cell-own-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {assets.reduce((sum, a) => sum + a.quantity, 0)} Unit Total
              </div>
            </div>

            {/* Donut 2: Utilisasi Sewa */}
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono font-semibold text-slate-700 mb-1">
                Unit Disewa (Order)
              </span>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Tooltip
                      formatter={(val: any) => [`${val} Unit`, '']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                    />
                    <Pie
                      data={utilizationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {utilizationData.map((entry, index) => (
                        <Cell key={`cell-util-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {usages.reduce((sum: number, u: any) => sum + u.unitsUsed, 0)} Unit Tersewa
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 4: Komposisi Pengeluaran per Kategori (Stacked Bar)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Komposisi Pengeluaran Bisnis
              </h2>
              <p className="text-[11px] text-slate-500">
                Porsi pengeluaran bersama (dibagi rata) vs beban perorangan per kategori.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Stacked Bar
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expenseCompositionData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Bersama" name="Dibagi Rata 3 Pemilik" stackId="a" fill="#0284c7" />
                <Bar dataKey="Perorangan" name="Beban Perorangan" stackId="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
