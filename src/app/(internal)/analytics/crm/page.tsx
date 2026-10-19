'use client';

import { useState, useEffect, useSyncExternalStore, useMemo } from 'react';
import { innerKtStore, subscribeToStore, getStoreSnapshot } from '@/lib/store';
import { formatRupiah } from '@/lib/formatters';
import { exportCrmCsvForAi, exportCrmExcel } from '@/lib/export-utils';
import {
  TrendingUp,
  Bot,
  Download,
  Users2,
  Phone,
  Instagram,
  Sparkles,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

export default function AnalyticsCrmPage() {
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

  const leads = innerKtStore.getCrmLeads();
  const orders = innerKtStore.getOrders();

  // 1. Data Grafik 1: Pipeline Funnel Stages & Potensi Budget
  const pipelineFunnelData = useMemo(() => {
    const stages = [
      { key: 'IDENTIFIED', label: 'Target Baru', color: '#64748b' },
      { key: 'CONTACTED', label: 'Dihubungi', color: '#3b82f6' },
      { key: 'PROPOSAL_SENT', label: 'Penawaran', color: '#a855f7' },
      { key: 'NEGOTIATION', label: 'Negosiasi', color: '#f59e0b' },
      { key: 'WON', label: 'Deal / Sewa', color: '#10b981' },
      { key: 'LOST', label: 'Batal', color: '#f43f5e' },
    ];

    return stages.map((st) => {
      const match = leads.filter((l) => l.pipelineStatus === st.key);
      const totalBudget = match.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);
      return {
        stage: st.label,
        count: match.length,
        budget: totalBudget,
        color: st.color,
      };
    });
  }, [leads]);

  // 2. Data Grafik 2: Gender PIC vs Won / Lost / Sedang Berjalan
  const picGenderData = useMemo(() => {
    const genders = [
      { key: 'LAKI_LAKI', label: 'Laki-laki (L)' },
      { key: 'PEREMPUAN', label: 'Perempuan (P)' },
      { key: 'TIDAK_DIKETAHUI', label: 'Belum Tahu (?)' },
    ];

    return genders.map((g) => {
      const match = leads.filter((l) => (l.picGender || 'TIDAK_DIKETAHUI') === g.key);
      const won = match.filter((l) => l.pipelineStatus === 'WON').length;
      const lost = match.filter((l) => l.pipelineStatus === 'LOST').length;
      const inProgress = match.filter((l) => l.pipelineStatus !== 'WON' && l.pipelineStatus !== 'LOST').length;

      return {
        gender: g.label,
        'Deal (WON)': won,
        'Sedang Berjalan': inProgress,
        'Batal (LOST)': lost,
        total: match.length,
      };
    });
  }, [leads]);

  // 3. Data Grafik 3: Distribusi Channel Kontak (WA vs IG vs Lengkap)
  const channelData = useMemo(() => {
    let waOnly = 0;
    let igOnly = 0;
    let both = 0;
    let none = 0;

    let waWon = 0;
    let igWon = 0;
    let bothWon = 0;
    let noneWon = 0;

    leads.forEach((l) => {
      const hasWa = Boolean(l.picPhone && l.picPhone.trim().length > 0);
      const hasIg = Boolean(l.picInstagram && l.picInstagram.trim().length > 0);
      const isWon = l.pipelineStatus === 'WON';

      if (hasWa && hasIg) {
        both++;
        if (isWon) bothWon++;
      } else if (hasWa) {
        waOnly++;
        if (isWon) waWon++;
      } else if (hasIg) {
        igOnly++;
        if (isWon) igWon++;
      } else {
        none++;
        if (isWon) noneWon++;
      }
    });

    return [
      { channel: 'WhatsApp Saja', Prospek: waOnly, Deal: waWon },
      { channel: 'Instagram Saja', Prospek: igOnly, Deal: igWon },
      { channel: 'Lengkap (WA & IG)', Prospek: both, Deal: bothWon },
      { channel: 'Belum Ada Kontak', Prospek: none, Deal: noneWon },
    ];
  }, [leads]);

  // 4. Data Grafik 4: Kategori Organisasi & Estimasi Kebutuhan Unit per Bulan Event
  const orgCategoryData = useMemo(() => {
    const catLabels: Record<string, string> = {
      BEM_HIMA_UKM: 'BEM / HIMA',
      SEKOLAH: 'Sekolah / OSIS',
      EO_UMUM: 'EO / Umum',
      INSTANSI: 'Instansi',
      KOMUNITAS: 'Komunitas',
    };

    const countMap: Record<string, { category: string; Prospek: number; TotalUnit: number }> = {
      BEM_HIMA_UKM: { category: 'BEM / HIMA', Prospek: 0, TotalUnit: 0 },
      SEKOLAH: { category: 'Sekolah / OSIS', Prospek: 0, TotalUnit: 0 },
      EO_UMUM: { category: 'EO / Umum', Prospek: 0, TotalUnit: 0 },
      INSTANSI: { category: 'Instansi', Prospek: 0, TotalUnit: 0 },
      KOMUNITAS: { category: 'Komunitas', Prospek: 0, TotalUnit: 0 },
    };

    leads.forEach((l) => {
      const target = countMap[l.organizationType] || countMap.BEM_HIMA_UKM;
      target.Prospek++;
      target.TotalUnit += l.estimatedUnits || 0;
    });

    return Object.values(countMap);
  }, [leads]);

  // 5. Total counts for metric strip
  const wonCount = leads.filter((l) => l.pipelineStatus === 'WON').length;
  const lostCount = leads.filter((l) => l.pipelineStatus === 'LOST').length;
  const winRate = leads.length > 0 ? (wonCount / leads.length) * 100 : 0;
  const totalPipelineBudget = leads.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);

  const handleExportCsv = () => {
    setExportingType('CSV');
    try {
      exportCrmCsvForAi(leads, orders);
    } finally {
      setTimeout(() => setExportingType(null), 1000);
    }
  };

  const handleExportExcel = () => {
    setExportingType('EXCEL');
    try {
      exportCrmExcel(leads, orders);
    } finally {
      setTimeout(() => setExportingType(null), 1000);
    }
  };

  if (!isMounted) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-400">
        Memuat visualisasi analitik CRM...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
            Pelanggan &amp; Event &bull; Analitik Penjualan CRM
          </span>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans mt-1">
            Grafik Pelanggan &amp; Konversi Event
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi efektivitas pendekatan panitia (WA &amp; IG), analisis gender PIC, corong konversi, dan kategori organisasi penyewa.
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
            title="Download Spreadsheet Excel (.xlsx) multi-sheet: rekap pipeline, database prospek, dan evaluasi Deal vs Batal"
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
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Prospek Tercatat</div>
          <div className="text-base font-bold font-mono text-slate-900 mt-1">
            {leads.length} Event
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            Seluruh data di pipeline CRM
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Total Potensi Nilai Sewa</div>
          <div className="text-base font-bold font-mono text-emerald-600 mt-1">
            {formatRupiah(totalPipelineBudget)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            Estimasi anggaran panitia
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Rasio Deal (Win Rate)</div>
          <div className="text-base font-bold font-mono text-blue-600 mt-1">
            {winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            {wonCount} Deal / {lostCount} Batal
          </div>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-[10px] font-mono uppercase text-slate-400">Channel Terbanyak</div>
          <div className="text-base font-bold font-mono text-purple-600 mt-1">
            WhatsApp &amp; IG
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
            Multi-saluran komunikasi
          </div>
        </div>
      </div>

      {/* Grid 2 Columns of Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================================================
            GRAFIK 1: Corong Pipeline Penawaran (Horizontal Stage Funnel)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Corong Pipeline Penawaran (Funnel)
              </h2>
              <p className="text-[11px] text-slate-500">
                Jumlah event &amp; akumulasi nilai potensi sewa pada setiap tahap pipeline.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Pipeline Stage
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineFunnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'count' ? `${val} Prospek` : formatRupiah(Number(val) || 0),
                    name === 'count' ? 'Jumlah Event' : 'Potensi Sewa'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" name="Jumlah Event" fill="#3b82f6" radius={[0, 3, 3, 0]}>
                  {pipelineFunnelData.map((entry, index) => (
                    <Cell key={`cell-stage-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 2: Analisis Gender PIC & Tingkat Konversi (Stacked Bar)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Demografi Gender PIC &amp; Rasio Konversi
              </h2>
              <p className="text-[11px] text-slate-500">
                Membandingkan jumlah Deal (WON), Sedang Berjalan, dan Batal (LOST) per gender panitia.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Stacked Demographics
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={picGenderData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="gender" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Event`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Deal (WON)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Sedang Berjalan" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Batal (LOST)" stackId="a" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 3: Efektivitas Saluran Kontak PIC (WA vs IG vs Keduanya)
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Efektivitas Saluran Komunikasi PIC
              </h2>
              <p className="text-[11px] text-slate-500">
                Perbandingan jumlah prospek dan tingkat Deal berdasarkan kelengkapan kontak (WhatsApp vs Instagram).
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Channel Analysis
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} Event`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Prospek" name="Total Prospek" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Deal" name="Berhasil Deal (WON)" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* =========================================================================
            GRAFIK 4: Kategori Organisasi & Kebutuhan Unit
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-sans">
                Kategori Organisasi &amp; Kebutuhan Unit HT
              </h2>
              <p className="text-[11px] text-slate-500">
                Segmentasi penyewa (BEM, Sekolah, EO, Instansi) dan akumulasi unit HT yang dibutuhkan.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Org Segmentation
            </span>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orgCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Prospek' ? `${val} Event` : `${val} Unit`,
                    name === 'Prospek' ? 'Total Prospek' : 'Total Estimasi Unit'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Prospek" name="Total Prospek" fill="#0284c7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="TotalUnit" name="Total Unit HT" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
