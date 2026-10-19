// ============================================================================
// inner-kt v2.0 — Business & Financial Validation Rules
// Clear Indonesian Validation Messages & Strict Financial Integrity Checks
// ============================================================================

import { Asset, OrderFormInput, OrderOwnerAllocation } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates Order creation or update input against stock limits, pricing, and adjustments.
 */
export function validateOrderInput(
  input: OrderFormInput,
  assets: Asset[],
  isEditingFinalOrder: boolean = false
): ValidationResult {
  const errors: string[] = [];

  if (isEditingFinalOrder) {
    errors.push(
      'Order yang sudah berstatus FINAL tidak boleh diedit langsung. Silakan gunakan aksi "Koreksi / Batalkan dengan Alasan Audit".'
    );
    return { isValid: false, errors };
  }

  // 1. Durasi hari
  if (!input.durationDays || input.durationDays < 1) {
    errors.push('Durasi sewa minimal harus 1 hari.');
  }

  // 2. Tarif dan Biaya
  if (input.ratePerDay < 0) {
    errors.push('Tarif sewa per hari tidak boleh negatif.');
  }

  if (input.transportCost < 0) {
    errors.push('Biaya transportasi tidak boleh bernilai negatif.');
  }

  if (input.finalGrossRevenue < 0) {
    errors.push('Total pembayaran sewa kotor tidak boleh bernilai negatif.');
  }

  // 3. Nama penyewa & nama event
  if (!input.customerOrgName || input.customerOrgName.trim().length === 0) {
    errors.push('Nama organisasi / penyewa wajib diisi.');
  }

  if (!input.eventName || input.eventName.trim().length === 0) {
    errors.push('Nama event / acara wajib diisi.');
  }

  // 4. Pengecekan unit digunakan & stok total per pemilik (Revisi v2.0: tanpa filter kondisi)
  let totalUnitsUsedAcrossOwners = 0;

  for (const [ownerId, units] of Object.entries(input.ownerUnits)) {
    if (units < 0) {
      errors.push(`Jumlah unit tidak boleh bernilai negatif untuk pemilik terkait.`);
      continue;
    }

    totalUnitsUsedAcrossOwners += units;

    // Hitung total unit aset milik pemilik ini
    const ownerTotalStock = assets
      .filter((a) => a.ownerId === ownerId)
      .reduce((sum, a) => sum + (a.quantity || 0), 0);

    if (units > ownerTotalStock) {
      errors.push(
        `Unit yang dipilih (${units} unit) melebihi stok yang tersedia (${ownerTotalStock} unit).`
      );
    }
  }

  if (totalUnitsUsedAcrossOwners <= 0) {
    errors.push('Minimal harus memilih 1 unit alat untuk disewakan dalam order ini.');
  }

  // 5. Validasi Diskon / Penyesuaian Harga
  const calculatedGross = totalUnitsUsedAcrossOwners * (input.ratePerDay || 0) * (input.durationDays || 1);
  if (
    calculatedGross !== input.finalGrossRevenue &&
    (!input.priceAdjustmentNote || input.priceAdjustmentNote.trim().length === 0)
  ) {
    errors.push(
      `Total sewa aktual (Rp${input.finalGrossRevenue.toLocaleString('id-ID')}) berbeda dari hitungan sistem (Rp${calculatedGross.toLocaleString('id-ID')}). Alasan penyesuaian harga / diskon wajib diisi!`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that order owner allocations sum up exactly to finalGrossRevenue and transportCost
 */
export function validateOrderAllocationsIntegrity(
  allocations: OrderOwnerAllocation[],
  finalGrossRevenue: number,
  transportCost: number
): ValidationResult {
  const errors: string[] = [];

  const sumGross = allocations.reduce((sum, a) => sum + a.grossShare, 0);
  const sumTransport = allocations.reduce((sum, a) => sum + a.transportCostShare, 0);

  if (sumGross !== finalGrossRevenue) {
    errors.push(
      `Integritas Gagal: Total alokasi pendapatan kotor (Rp${sumGross}) tidak sama dengan Total Pendapatan Kotor Order (Rp${finalGrossRevenue}). Selisih: Rp${finalGrossRevenue - sumGross}.`
    );
  }

  if (sumTransport !== transportCost) {
    errors.push(
      `Integritas Gagal: Total potongan transportasi (Rp${sumTransport}) tidak sama dengan Biaya Transportasi Order (Rp${transportCost}). Selisih: Rp${transportCost - sumTransport}.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates new Asset creation input
 */
export function validateAssetInput(params: {
  name: string;
  category: string;
  ownerId: string;
  quantity: number;
  capitalPerUnit: number;
}): ValidationResult {
  const errors: string[] = [];

  if (!params.name || params.name.trim().length === 0) {
    errors.push('Nama aset / alat wajib diisi.');
  }

  if (!params.category || params.category.trim().length === 0) {
    errors.push('Kategori aset wajib diisi (ketik manual, misal: Handy Talky, Audio, Tenda).');
  }

  if (!params.ownerId) {
    errors.push('Pemilik aset wajib dipilih.');
  }

  if (params.quantity <= 0) {
    errors.push('Jumlah unit aset harus lebih dari 0.');
  }

  if (params.capitalPerUnit < 0) {
    errors.push('Nilai modal per unit tidak boleh bernilai negatif.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates operational Expense input
 */
export function validateExpenseInput(params: {
  title: string;
  amount: number;
  allocationType: 'SHARED' | 'INDIVIDUAL';
  paidByOwnerId?: string | null;
}): ValidationResult {
  const errors: string[] = [];

  if (!params.title || params.title.trim().length === 0) {
    errors.push('Nama / judul pengeluaran operasional wajib diisi.');
  }

  if (params.amount <= 0) {
    errors.push('Nominal pengeluaran harus lebih besar dari Rp0.');
  }

  if (params.allocationType === 'INDIVIDUAL' && !params.paidByOwnerId) {
    errors.push('Untuk pengeluaran perorangan, pemilik yang menanggung wajib dipilih.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
