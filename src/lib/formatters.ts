// ============================================================================
// inner-kt — Formatters & Visual Helpers
// High-Density Monospace Tabular-Nums Rupiah & Indonesian Date Formatting
// ============================================================================

import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Formats a number as Indonesian Rupiah with exact thousands separator.
 * Optional showSign will prepend '+' for positive numbers.
 */
export function formatRupiah(amount: number, showSign: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(absAmount);

  if (isNegative) {
    return `-Rp${formatted}`;
  }

  if (showSign && amount > 0) {
    return `+Rp${formatted}`;
  }

  return `Rp${formatted}`;
}

/**
 * Formats a percentage number with 1 or 2 decimals if needed.
 */
export function formatPercent(percent: number): string {
  if (isNaN(percent) || percent === null || percent === undefined) {
    return '0%';
  }
  const rounded = Math.round(percent * 100) / 100;
  return `${rounded.toLocaleString('id-ID')}%`;
}

/**
 * Formats standard integer numbers with thousands separators.
 */
export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID').format(value);
}

/**
 * Formats an ISO date string to Indonesian human readable date (e.g. "19 Okt 2026").
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'd MMM yyyy', { locale: id });
  } catch {
    return dateStr;
  }
}

/**
 * Formats an ISO date string to full Indonesian date with time (e.g. "19 Okt 2026, 09:30 WIB").
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(d, 'd MMM yyyy, HH:mm', { locale: id }) + ' WIB';
  } catch {
    return dateStr;
  }
}

/**
 * Returns consistent Tailwind badge style for each of the 3 owners
 */
export function getOwnerTheme(ownerCodeOrName: string) {
  const norm = (ownerCodeOrName || '').toLowerCase();

  if (norm.includes('surya') || norm.includes('owner_1') || norm.includes('admin1')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-600',
      label: 'Surya',
      code: 'OWNER_1',
    };
  }

  if (norm.includes('pemilik b') || norm.includes('owner_2') || norm.includes('admin2')) {
    return {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      border: 'border-teal-200',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      dot: 'bg-teal-600',
      label: 'Pemilik B',
      code: 'OWNER_2',
    };
  }

  // Owner 3 / Pemilik C
  return {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-600',
    label: 'Pemilik C',
    code: 'OWNER_3',
  };
}

/**
 * Returns status badge classes for CRM Pipeline
 */
export function getPipelineBadge(status: string) {
  switch (status) {
    case 'IDENTIFIED':
      return {
        label: 'Target Baru',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    case 'CONTACTED':
      return {
        label: 'Sudah Dihubungi',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'PROPOSAL_SENT':
      return {
        label: 'Penawaran Dikirim',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    case 'NEGOTIATION':
      return {
        label: 'Negosiasi',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'WON':
      return {
        label: 'Deal / Sewa',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'LOST':
      return {
        label: 'Batal',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    default:
      return {
        label: status,
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

/**
 * Returns status badge classes for Rental Order
 */
export function getOrderStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draft',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    case 'FINAL':
      return {
        label: 'Final (Sah)',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'CANCELLED':
      return {
        label: 'Dibatalkan',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    default:
      return {
        label: status,
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}
