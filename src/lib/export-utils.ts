// ============================================================================
// inner-kt v2.0 — Dual Export Engine (CSV for AI & Multi-Sheet Excel for Humans)
// ============================================================================

import * as XLSX from 'xlsx';
import {
  BusinessFinancialSummary,
  Asset,
  RentalOrder,
  OrderItemOwnerUsage,
  OrderOwnerAllocation,
  Expense,
  ExpenseOwnerAllocation,
  Owner,
  CrmLead,
} from '@/types';

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvString(csvContent: string, filename: string) {
  // Include UTF-8 BOM so Excel and spreadsheet apps render Indonesian characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ----------------------------------------------------------------------------
// 1. FINANCE: CSV for AI (Fully Denormalized with Full Context)
// ----------------------------------------------------------------------------
export function exportFinanceCsvForAi(
  summary: BusinessFinancialSummary,
  assets: Asset[],
  orders: RentalOrder[],
  usages: OrderItemOwnerUsage[],
  allocs: OrderOwnerAllocation[],
  expenses: Expense[],
  expenseAllocs: ExpenseOwnerAllocation[],
  owners: Owner[]
) {
  const dateStr = getTodayString();
  const filename = `inner-kt-keuangan-ai-ready-${dateStr}.csv`;

  const lines: string[] = [];

  // Metadata & Executive Summary Header for LLMs
  lines.push('# ============================================================================');
  lines.push('# INNER-KT FINANCIAL DATASET (AI-READY CONTEXT FOR GEMINI / CHATGPT / CLAUDE)');
  lines.push(`# Generated At: ${new Date().toISOString()}`);
  lines.push('# Business Model: Rental Alat Event & HT Kanal Tiga (Equal Co-Owners Partnership)');
  lines.push('# Logic: 3 Pemilik (Surya, Pemilik B, Pemilik C). Bagi hasil order berbasis kepemilikan unit HT disewa.');
  lines.push('# Modal kembali dihitung dari akumulasi pendapatan bersih order masing-masing pemilik.');
  lines.push('# ============================================================================');
  lines.push('');

  // Business Totals
  lines.push('### RINGKASAN METRIK BISNIS UTAMA');
  lines.push('Metrik,Nilai_Rp,Keterangan');
  lines.push(`Total_Modal_Aset_Seluruh_Pemilik,${summary.totalBusinessCapital},Modal gabungan yang ditanamkan 3 pemilik`);
  lines.push(`Total_Omset_Kotor_Order,${summary.totalGrossRevenue},Total nilai invoice order penyewaan`);
  lines.push(`Total_Potongan_Transport,${summary.totalTransportCost},Biaya operasional antar/jemput yang dipotong dari omset`);
  lines.push(`Total_Pendapatan_Bersih_Order,${summary.totalNetOrderRevenue},Pendapatan bersih yang dibagi ke para pemilik`);
  lines.push(`Total_Modal_Kembali,${summary.totalRecoveredCapital},Akumulasi pendapatan bersih yang menutup modal aset`);
  lines.push(`Total_Sisa_Modal_Belum_Kembali,${summary.totalUnrecoveredCapital},Modal aset yang belum tertutup omset`);
  lines.push(`Rasio_Balik_Modal_Persen,${summary.capitalRecoveryPercentage.toFixed(1)}%,Persentase balik modal gabungan`);
  lines.push(`Total_Pengeluaran_Bisnis,${summary.totalOtherExpenses},Biaya operasional & perlengkapan bersama/perorangan`);
  lines.push(`Profit_Bersih_Setelah_Beban,${summary.totalBusinessProfit},Pendapatan bersih order dikurangi seluruh pengeluaran`);
  lines.push('');

  // Per-Owner Breakdown
  lines.push('### RINGKASAN KEUANGAN PER PEMILIK (SURYA, PEMILIK B, PEMILIK C)');
  lines.push('Nama_Pemilik,Status_Aktif,Total_Modal_Aset_Rp,Total_Pendapatan_Kotor_Rp,Potongan_Transport_Rp,Pendapatan_Bersih_Order_Rp,Modal_Kembali_Rp,Sisa_Belum_Kembali_Rp,ROI_Persen,Beban_Pengeluaran_Rp,Profit_Bersih_Rp');
  summary.owners.forEach((o) => {
    lines.push([
      escapeCsvField(o.ownerName),
      'Aktif',
      o.totalCapital,
      o.grossOrderRevenue,
      o.orderTransportShare,
      o.netOrderRevenue,
      o.recoveredCapital,
      o.unrecoveredCapital,
      `${o.capitalRecoveryPercentage.toFixed(1)}%`,
      o.totalAllExpenseIncludingTransport,
      o.profitAfterCapitalAndExpense,
    ].join(','));
  });
  lines.push('');

  // SECTION A: ASSETS
  lines.push('### DATASET 1: INVENTARIS ASET & KEPEMILIKAN MODAL');
  lines.push('ID_Aset,Nama_Aset,Kategori_Aset,Nama_Pemilik,Jumlah_Unit,Modal_Per_Unit_Rp,Total_Modal_Rp,Tanggal_Beli,Tipe_Modal,Catatan');
  assets.forEach((a) => {
    const owner = owners.find((o) => o.id === a.ownerId);
    lines.push([
      escapeCsvField(a.id),
      escapeCsvField(a.name),
      escapeCsvField(a.category),
      escapeCsvField(owner?.name || a.ownerId),
      a.quantity,
      a.capitalPerUnit,
      a.quantity * a.capitalPerUnit,
      a.purchaseDate,
      a.isInitialCapital ? 'Modal_Awal' : 'Modal_Tambahan',
      escapeCsvField(a.notes || ''),
    ].join(','));
  });
  lines.push('');

  // SECTION B: ORDERS & PROFIT SHARING ALLOCATIONS
  lines.push('### DATASET 2: ORDER PENYEWAAN & PEMBAGIAN HASIL 3 PEMILIK');
  lines.push('ID_Order,Nomor_Order,Status_Order,Tanggal_Mulai,Tanggal_Selesai,Nama_Organisasi,Nama_Acara,Total_Unit_Disewa,Durasi_Hari,Biaya_Transport_Rp,Total_Nilai_Order_Rp,Pendapatan_Bersih_Order_Rp,Bagian_Kotor_Surya,Potongan_Transport_Surya,Bagian_Bersih_Surya,Bagian_Kotor_PemilikB,Potongan_Transport_PemilikB,Bagian_Bersih_PemilikB,Bagian_Kotor_PemilikC,Potongan_Transport_PemilikC,Bagian_Bersih_PemilikC,Catatan');
  
  orders.forEach((ord) => {
    const oAllocs = allocs.filter((a) => a.orderId === ord.id);
    const surya = oAllocs.find((a) => a.ownerId === 'owner-1');
    const b = oAllocs.find((a) => a.ownerId === 'owner-2');
    const c = oAllocs.find((a) => a.ownerId === 'owner-3');

    const totalUnits = usages
      .filter((u) => u.orderId === ord.id)
      .reduce((sum, u) => sum + u.unitsUsed, 0);

    lines.push([
      escapeCsvField(ord.id),
      escapeCsvField(ord.orderNumber),
      ord.status,
      ord.startDate,
      ord.endDate,
      escapeCsvField(ord.customerOrgName),
      escapeCsvField(ord.eventName),
      totalUnits,
      ord.durationDays,
      ord.transportCost,
      ord.finalGrossRevenue,
      ord.netOrderRevenue,
      surya?.grossShare || 0,
      surya?.transportCostShare || 0,
      surya?.netShare || 0,
      b?.grossShare || 0,
      b?.transportCostShare || 0,
      b?.netShare || 0,
      c?.grossShare || 0,
      c?.transportCostShare || 0,
      c?.netShare || 0,
      escapeCsvField(ord.notes || ''),
    ].join(','));
  });
  lines.push('');

  // SECTION C: EXPENSES
  lines.push('### DATASET 3: PENGELUARAN BISNIS & ALOKASI BEBAN PEMILIK');
  lines.push('ID_Pengeluaran,Tanggal_Pengeluaran,Judul_Pengeluaran,Kategori,Nominal_Rp,Tipe_Alokasi,Dibayar_Oleh_Pemilik,Alokasi_Beban_Surya,Alokasi_Beban_PemilikB,Alokasi_Beban_PemilikC,Status,Terkait_Transport_Order,Deskripsi');

  expenses.forEach((exp) => {
    const payer = owners.find((o) => o.id === exp.paidByOwnerId);
    const eAllocs = expenseAllocs.filter((ea) => ea.expenseId === exp.id);
    const suryaAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-1');
    const bAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-2');
    const cAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-3');

    lines.push([
      escapeCsvField(exp.id),
      exp.expenseDate || exp.createdAt.split('T')[0],
      escapeCsvField(exp.title),
      exp.category,
      exp.amount,
      exp.allocationType === 'SHARED' ? 'DIBAGI_RATA_3_PEMILIK' : 'BEBAN_PERORANGAN',
      escapeCsvField(payer?.name || exp.paidByOwnerId),
      suryaAlloc?.allocatedAmount || 0,
      bAlloc?.allocatedAmount || 0,
      cAlloc?.allocatedAmount || 0,
      exp.status,
      exp.isOrderTransport ? 'YA' : 'TIDAK',
      escapeCsvField(exp.description || ''),
    ].join(','));
  });

  downloadCsvString(lines.join('\n'), filename);
}

// ----------------------------------------------------------------------------
// 2. FINANCE: Multi-Sheet Excel for Humans (.xlsx)
// ----------------------------------------------------------------------------
export function exportFinanceExcel(
  summary: BusinessFinancialSummary,
  assets: Asset[],
  orders: RentalOrder[],
  usages: OrderItemOwnerUsage[],
  allocs: OrderOwnerAllocation[],
  expenses: Expense[],
  expenseAllocs: ExpenseOwnerAllocation[],
  owners: Owner[]
) {
  const dateStr = getTodayString();
  const filename = `Laporan-Keuangan-KanalTiga-${dateStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Eksekutif & Pemilik
  const summaryRows = [
    {
      'Nama Pemilik': 'Surya (Pemilik 1)',
      'Status': 'Aktif',
      'Total Modal Aset (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.totalCapital || 0,
      'Pendapatan Kotor (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.grossOrderRevenue || 0,
      'Potongan Transport (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.orderTransportShare || 0,
      'Pendapatan Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.netOrderRevenue || 0,
      'Modal Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.recoveredCapital || 0,
      'Sisa Belum Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.unrecoveredCapital || 0,
      'Progres Balik Modal': `${(summary.owners.find((o) => o.ownerId === 'owner-1')?.capitalRecoveryPercentage || 0).toFixed(1)}%`,
      'Beban Pengeluaran (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.totalAllExpenseIncludingTransport || 0,
      'Profit Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-1')?.profitAfterCapitalAndExpense || 0,
    },
    {
      'Nama Pemilik': 'Pemilik B (Pemilik 2)',
      'Status': 'Aktif',
      'Total Modal Aset (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.totalCapital || 0,
      'Pendapatan Kotor (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.grossOrderRevenue || 0,
      'Potongan Transport (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.orderTransportShare || 0,
      'Pendapatan Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.netOrderRevenue || 0,
      'Modal Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.recoveredCapital || 0,
      'Sisa Belum Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.unrecoveredCapital || 0,
      'Progres Balik Modal': `${(summary.owners.find((o) => o.ownerId === 'owner-2')?.capitalRecoveryPercentage || 0).toFixed(1)}%`,
      'Beban Pengeluaran (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.totalAllExpenseIncludingTransport || 0,
      'Profit Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-2')?.profitAfterCapitalAndExpense || 0,
    },
    {
      'Nama Pemilik': 'Pemilik C (Pemilik 3)',
      'Status': 'Aktif',
      'Total Modal Aset (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.totalCapital || 0,
      'Pendapatan Kotor (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.grossOrderRevenue || 0,
      'Potongan Transport (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.orderTransportShare || 0,
      'Pendapatan Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.netOrderRevenue || 0,
      'Modal Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.recoveredCapital || 0,
      'Sisa Belum Kembali (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.unrecoveredCapital || 0,
      'Progres Balik Modal': `${(summary.owners.find((o) => o.ownerId === 'owner-3')?.capitalRecoveryPercentage || 0).toFixed(1)}%`,
      'Beban Pengeluaran (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.totalAllExpenseIncludingTransport || 0,
      'Profit Bersih (Rp)': summary.owners.find((o) => o.ownerId === 'owner-3')?.profitAfterCapitalAndExpense || 0,
    },
    {
      'Nama Pemilik': 'TOTAL GABUNGAN BISNIS',
      'Status': 'Semua Pemilik',
      'Total Modal Aset (Rp)': summary.totalBusinessCapital,
      'Pendapatan Kotor (Rp)': summary.totalGrossRevenue,
      'Potongan Transport (Rp)': summary.totalTransportCost,
      'Pendapatan Bersih (Rp)': summary.totalNetOrderRevenue,
      'Modal Kembali (Rp)': summary.totalRecoveredCapital,
      'Sisa Belum Kembali (Rp)': summary.totalUnrecoveredCapital,
      'Progres Balik Modal': `${summary.capitalRecoveryPercentage.toFixed(1)}%`,
      'Beban Pengeluaran (Rp)': summary.totalOtherExpenses,
      'Profit Bersih (Rp)': summary.totalBusinessProfit,
    },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
    { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  // Sheet 2: Inventaris Aset
  const assetRows = assets.map((a) => {
    const owner = owners.find((o) => o.id === a.ownerId);
    return {
      'Nama Aset': a.name,
      'Kategori': a.category,
      'Pemilik': owner?.name || a.ownerId,
      'Jumlah Unit': a.quantity,
      'Modal Satuan (Rp)': a.capitalPerUnit,
      'Total Modal (Rp)': a.quantity * a.capitalPerUnit,
      'Tanggal Beli': a.purchaseDate,
      'Tipe Modal': a.isInitialCapital ? 'Modal Awal' : 'Tambahan',
      'Catatan': a.notes || '-',
    };
  });
  const wsAssets = XLSX.utils.json_to_sheet(assetRows);
  wsAssets['!cols'] = [
    { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsAssets, 'Inventaris Aset');

  // Sheet 3: Riwayat Order & Bagi Hasil
  const orderRows = orders.map((o) => {
    const oAllocs = allocs.filter((a) => a.orderId === o.id);
    const surya = oAllocs.find((a) => a.ownerId === 'owner-1');
    const b = oAllocs.find((a) => a.ownerId === 'owner-2');
    const c = oAllocs.find((a) => a.ownerId === 'owner-3');

    const totalUnits = usages
      .filter((u) => u.orderId === o.id)
      .reduce((sum, u) => sum + u.unitsUsed, 0);

    return {
      'No. Order': o.orderNumber,
      'Organisasi': o.customerOrgName,
      'Nama Acara': o.eventName,
      'Mulai': o.startDate,
      'Selesai': o.endDate,
      'Unit': totalUnits,
      'Durasi': `${o.durationDays} Hari`,
      'Nilai Order (Rp)': o.finalGrossRevenue,
      'Potongan Transport (Rp)': o.transportCost,
      'Net Bagi Hasil (Rp)': o.netOrderRevenue,
      'Surya (Net)': surya?.netShare || 0,
      'Pemilik B (Net)': b?.netShare || 0,
      'Pemilik C (Net)': c?.netShare || 0,
      'Status': o.status,
    };
  });
  const wsOrders = XLSX.utils.json_to_sheet(orderRows);
  wsOrders['!cols'] = [
    { wch: 16 }, { wch: 24 }, { wch: 26 }, { wch: 12 }, { wch: 12 },
    { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Riwayat Order');

  // Sheet 4: Rincian Pengeluaran
  const expenseRows = expenses.map((e) => {
    const payer = owners.find((o) => o.id === e.paidByOwnerId);
    const eAllocs = expenseAllocs.filter((ea) => ea.expenseId === e.id);
    const suryaAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-1');
    const bAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-2');
    const cAlloc = eAllocs.find((ea) => ea.ownerId === 'owner-3');

    return {
      'Tanggal': e.expenseDate || e.createdAt.split('T')[0],
      'Judul Pengeluaran': e.title,
      'Kategori': e.category,
      'Nominal (Rp)': e.amount,
      'Tipe Alokasi': e.allocationType === 'SHARED' ? 'Dibagi Rata 3 Pemilik' : 'Perorangan',
      'Talangan Oleh': payer?.name || e.paidByOwnerId,
      'Beban Surya (Rp)': suryaAlloc?.allocatedAmount || 0,
      'Beban Pemilik B (Rp)': bAlloc?.allocatedAmount || 0,
      'Beban Pemilik C (Rp)': cAlloc?.allocatedAmount || 0,
      'Status': e.status,
    };
  });
  const wsExpenses = XLSX.utils.json_to_sheet(expenseRows);
  wsExpenses['!cols'] = [
    { wch: 14 }, { wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 24 },
    { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'Rincian Pengeluaran');

  XLSX.writeFile(wb, filename);
}

// ----------------------------------------------------------------------------
// 3. CRM: CSV for AI (Denormalized with Relations & Context)
// ----------------------------------------------------------------------------
export function exportCrmCsvForAi(leads: CrmLead[], orders: RentalOrder[]) {
  const dateStr = getTodayString();
  const filename = `inner-kt-crm-pelanggan-ai-ready-${dateStr}.csv`;

  const lines: string[] = [];

  lines.push('# ============================================================================');
  lines.push('# INNER-KT CRM & PROSPEK PELANGGAN DATASET (AI-READY FOR GEMINI / CHATGPT / CLAUDE)');
  lines.push(`# Generated At: ${new Date().toISOString()}`);
  lines.push('# Target: Analisis Pola Permintaan Event Kampus, Efektivitas Channel (WA vs IG), dan Rasio Konversi');
  lines.push('# Pipeline Stages: IDENTIFIED (Target Baru), CONTACTED (Dihubungi), PROPOSAL_SENT (Penawaran), NEGOTIATION (Negosiasi), WON (Deal), LOST (Batal)');
  lines.push('# Gender PIC: LAKI_LAKI, PEREMPUAN, TIDAK_DIKETAHUI');
  lines.push('# ============================================================================');
  lines.push('');

  const headers = [
    'ID_Prospek',
    'Tanggal_Input',
    'Nama_Organisasi',
    'Kategori_Organisasi',
    'Nama_Event',
    'Tanggal_Event',
    'Estimasi_Hari',
    'Estimasi_Unit',
    'Estimasi_Budget_Rp',
    'Nama_PIC',
    'Gender_PIC',
    'Jabatan_PIC',
    'Kontak_WhatsApp',
    'Kontak_Instagram',
    'Channel_Kontak_Tersedia',
    'Status_Pipeline',
    'Alasan_Batal',
    'Kode_Voucher',
    'Sudah_Konversi_Order',
    'Nomor_Order_Terkait',
    'Pendapatan_Aktual_Order_Rp',
    'Catatan',
  ];
  lines.push(headers.join(','));

  leads.forEach((l) => {
    const linkedOrder = orders.find(
      (o) => o.crmLeadId === l.id || o.id === l.convertedOrderId
    );

    let channelType = 'TIDAK_ADA';
    if (l.picPhone && l.picInstagram) channelType = 'LENGKAP_WA_DAN_IG';
    else if (l.picPhone) channelType = 'WHATSAPP_ONLY';
    else if (l.picInstagram) channelType = 'INSTAGRAM_ONLY';

    lines.push([
      escapeCsvField(l.id),
      l.createdAt ? l.createdAt.split('T')[0] : '',
      escapeCsvField(l.organizationName),
      l.organizationType,
      escapeCsvField(l.eventName),
      l.eventDate ? l.eventDate.split('T')[0] : '',
      l.estimatedDuration,
      l.estimatedUnits,
      l.estimatedBudget || 0,
      escapeCsvField(l.picName),
      l.picGender || 'TIDAK_DIKETAHUI',
      escapeCsvField(l.picRole || ''),
      escapeCsvField(l.picPhone || ''),
      escapeCsvField(l.picInstagram ? `@${l.picInstagram.replace(/^@/, '')}` : ''),
      channelType,
      l.pipelineStatus,
      escapeCsvField(l.lossReason || ''),
      escapeCsvField(l.voucherCodeOffered || ''),
      linkedOrder ? 'YA' : 'BELUM',
      escapeCsvField(linkedOrder?.orderNumber || ''),
      linkedOrder?.finalGrossRevenue || 0,
      escapeCsvField(l.notes || ''),
    ].join(','));
  });

  downloadCsvString(lines.join('\n'), filename);
}

// ----------------------------------------------------------------------------
// 4. CRM: Multi-Sheet Excel for Humans (.xlsx)
// ----------------------------------------------------------------------------
export function exportCrmExcel(leads: CrmLead[], orders: RentalOrder[]) {
  const dateStr = getTodayString();
  const filename = `Laporan-CRM-Pelanggan-KanalTiga-${dateStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Pipeline & Demografi
  const stages = ['IDENTIFIED', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST'];
  const stageLabels: Record<string, string> = {
    IDENTIFIED: 'Target Baru',
    CONTACTED: 'Sudah Dihubungi',
    PROPOSAL_SENT: 'Penawaran Dikirim',
    NEGOTIATION: 'Negosiasi',
    WON: 'Deal / Sewa',
    LOST: 'Batal',
  };

  const rekapPipeline = stages.map((st) => {
    const list = leads.filter((l) => l.pipelineStatus === st);
    const totalBudget = list.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);
    return {
      'Tahap Pipeline': stageLabels[st],
      'Jumlah Prospek': list.length,
      'Persentase': `${((list.length / (leads.length || 1)) * 100).toFixed(1)}%`,
      'Total Potensi Nilai Sewa (Rp)': totalBudget,
    };
  });

  const wsPipeline = XLSX.utils.json_to_sheet(rekapPipeline);
  wsPipeline['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 14 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsPipeline, 'Ringkasan Pipeline');

  // Sheet 2: Database Lengkap Prospek
  const leadRows = leads.map((l) => {
    const linkedOrder = orders.find(
      (o) => o.crmLeadId === l.id || o.id === l.convertedOrderId
    );

    return {
      'Nama Organisasi': l.organizationName,
      'Kategori': l.organizationType,
      'Nama Acara': l.eventName,
      'Tanggal Acara': l.eventDate ? l.eventDate.split('T')[0] : '-',
      'Durasi (Hari)': l.estimatedDuration,
      'Kebutuhan HT (Unit)': l.estimatedUnits,
      'Estimasi Sewa (Rp)': l.estimatedBudget || 0,
      'PIC Nama': l.picName,
      'PIC Gender': l.picGender === 'LAKI_LAKI' ? 'Laki-laki' : l.picGender === 'PEREMPUAN' ? 'Perempuan' : 'Belum Tahu',
      'PIC Jabatan': l.picRole || '-',
      'WhatsApp': l.picPhone || '-',
      'Instagram': l.picInstagram ? `@${l.picInstagram.replace(/^@/, '')}` : '-',
      'Status Pipeline': stageLabels[l.pipelineStatus] || l.pipelineStatus,
      'Alasan Batal': l.lossReason || '-',
      'Kode Voucher': l.voucherCodeOffered || '-',
      'Status Order': linkedOrder ? `Deal (${linkedOrder.orderNumber})` : l.pipelineStatus === 'WON' ? 'Siap Dikonversi' : 'Belum Deal',
      'Catatan': l.notes || '-',
    };
  });

  const wsLeads = XLSX.utils.json_to_sheet(leadRows);
  wsLeads['!cols'] = [
    { wch: 24 }, { wch: 16 }, { wch: 26 }, { wch: 14 }, { wch: 12 },
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
    { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 16 },
    { wch: 20 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsLeads, 'Database Calon Customer');

  // Sheet 3: Prospek Deal (WON) vs Batal (LOST)
  const wonAndLost = leads.filter((l) => l.pipelineStatus === 'WON' || l.pipelineStatus === 'LOST');
  const wonLostRows = wonAndLost.map((l) => {
    const linkedOrder = orders.find(
      (o) => o.crmLeadId === l.id || o.id === l.convertedOrderId
    );

    return {
      'Status': l.pipelineStatus === 'WON' ? 'DEAL (WON)' : 'BATAL (LOST)',
      'Organisasi': l.organizationName,
      'Acara': l.eventName,
      'PIC Panitia': l.picName,
      'Kontak PIC': l.picPhone || l.picInstagram || '-',
      'Estimasi Sewa (Rp)': l.estimatedBudget || 0,
      'Pendapatan Real Order (Rp)': linkedOrder?.finalGrossRevenue || (l.pipelineStatus === 'WON' ? l.estimatedBudget || 0 : 0),
      'Alasan Batal / Catatan Deal': l.pipelineStatus === 'LOST' ? (l.lossReason || 'Tidak ada alasan dicatat') : (linkedOrder ? `Telah menjadi ${linkedOrder.orderNumber}` : 'Deal menunggu konversi'),
    };
  });

  const wsWonLost = XLSX.utils.json_to_sheet(wonLostRows);
  wsWonLost['!cols'] = [
    { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 24 }, { wch: 32 }
  ];
  XLSX.utils.book_append_sheet(wb, wsWonLost, 'Deal vs Batal');

  XLSX.writeFile(wb, filename);
}
