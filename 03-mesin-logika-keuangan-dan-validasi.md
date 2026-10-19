# 03 — Mesin Logika Keuangan, Rumus & Aturan Validasi (`src/lib/finance-engine.ts`)

Dokumen ini adalah panduan paling krusial untuk Gemini 3.8 Flash. Seluruh perhitungan keuangan di `inner-kt` **wajib dipusatkan di satu modul murni (`src/lib/finance-engine.ts`)** dan diuji terhadap kasus-kasus di bawah ini.

---

## 1. Penyelesaian Keputusan Teknis & Edge Cases (Dari Bagian 12 Spesifikasi)

Agar sistem tidak ambigu saat diimplementasikan, tetapkan aturan pasti berikut:

1. **Modal Awal vs Modal Tambahan:**
   - Setiap aset memiliki flag `isInitialCapital` (`Modal Awal` vs `Modal Tambahan`).
   - Target balik modal menggunakan **Total Modal Kumulatif** (`Modal Awal + Modal Tambahan`), namun di kartu rincian pemilik keduanya ditampilkan terpisah agar transparan.
2. **Diskon, Harga Paket, dan Pembulatan Pembagian Hasil:**
   - Jika `finalGrossRevenue` berbeda dari `calculatedGross` (misalnya karena diskon paket event), bagian pendapatan kotor setiap pemilik dihitung secara proporsional terhadap kontribusi subtotal unitnya:
     `grossShare[i] = Math.floor((subtotalOwner[i] / calculatedGross) * finalGrossRevenue)`
   - **Penanganan Sisa Pembulatan (Remainder Rupiah):** Jika pembagian menghasilkan selisih Rp1–Rp2 akibat pembulatan desimal (baik pada bagi hasil diskon maupun bagi 3 biaya transportasi/pengeluaran bersama), sisa rupiah dialokasikan secara deterministik ke pemilik dengan unit terbanyak pada transaksi tersebut agar **Total Alokasi Pemilik === Total Transaksi (100% Akurat Tanpa Selisih)**.
3. **Kasus Pemilik Tidak Menyertakan Unit di Suatu Order, Tapi Ada Biaya Transportasi:**
   - Sesuai Prinsip Dasar #3: *"Biaya transportasi dibagi rata kepada tiga pemilik, bukan dibebankan hanya kepada pemilik aset yang digunakan."*
   - Jika pada suatu order unit milik Pemilik C yang dipakai adalah `0 unit`, maka pada order tersebut:
     - Pendapatan Kotor Pemilik C = `Rp0`
     - Bagian Transportasi Pemilik C = `Rp(Transport / 3)`
     - Pendapatan Bersih Order Pemilik C = `-Rp(Transport / 3)` (mengurangi akumulasi pendapatan bersihnya secara akurat).
4. **Anti Penghitungan Ganda (No Double-Counting) Biaya Transportasi:**
   - Saat order berstatus `FINAL` dan memiliki `transportCost > 0`, sistem otomatis membuat 1 baris di tabel `Expense` dengan kategori `TRANSPORTASI`, `isOrderTransport = true`, dan `orderId = order.id`.
   - Di laporan **Total Pengeluaran**, biaya transportasi ditampilkan terpisah sebagai *"Biaya Transportasi Order (Sudah Dipotong dari Pendapatan Kotor)"* dan *"Pengeluaran Operasional Lainnya (Non-Transportasi Order)"*.
   - Saat menghitung **Profit**, hanya **Pengeluaran Operasional Lainnya (Non-Transportasi Order)** yang dikurangkan dari **Pendapatan Bersih**, karena biaya transportasi sudah dikurangkan saat menghitung Pendapatan Bersih dari Pendapatan Kotor!

---

## 2. Rumus Eksak Perhitungan Per Pemilik (`OwnerFinancialSummary`)

Untuk setiap pemilik $i$, sistem menghitung metrik berikut dari seluruh data aktif:

### A. Nilai Aset & Modal Pemilik
- `totalUnitsOwned` = $\sum 	ext{Asset.quantity}$ milik pemilik $i$
- `initialCapital` = $\sum 	ext{Asset.totalCapital}$ (di mana `isInitialCapital == true`)
- `additionalCapital` = $\sum 	ext{Asset.totalCapital}$ (di mana `isInitialCapital == false`)
- `totalCapital` = `initialCapital + additionalCapital`

### B. Pendapatan dari Order (`status == 'FINAL'`)
- `grossOrderRevenue` = $\sum 	ext{OrderOwnerAllocation.grossShare}$ milik pemilik $i$
- `orderTransportShare` = $\sum 	ext{OrderOwnerAllocation.transportCostShare}$ milik pemilik $i$
- `netOrderRevenue` = `grossOrderRevenue - orderTransportShare`

### C. Pengeluaran Pemilik (`status == 'ACTIVE'` & `isOrderTransport == false`)
- `sharedExpenseShare` = $\sum 	ext{ExpenseOwnerAllocation.allocatedAmount}$ (di mana `allocationType == 'SHARED'` dan `isOrderTransport == false`)
- `individualExpense` = $\sum 	ext{ExpenseOwnerAllocation.allocatedAmount}$ (di mana `allocationType == 'INDIVIDUAL'`)
- `totalNonTransportExpense` = `sharedExpenseShare + individualExpense`
- `totalAllExpenseIncludingTransport` = `totalNonTransportExpense + orderTransportShare` *(untuk informasi rekap total beban pengeluaran)*

### D. Progres Balik Modal (Capital Recovery / ROI Progress)
- `recoveredCapital` (Modal yang Sudah Kembali):
  $$	ext{recoveredCapital} = \min(	ext{totalCapital}, \max(0, 	ext{netOrderRevenue}))$$
- `unrecoveredCapital` (Sisa Modal Belum Kembali):
  $$	ext{unrecoveredCapital} = \max(0, 	ext{totalCapital} - \max(0, 	ext{netOrderRevenue}))$$
- `capitalRecoveryPercentage` (Persentase Balik Modal):
  $$	ext{Jika } 	ext{totalCapital} > 0 \implies \min\left(100, \left(rac{	ext{recoveredCapital}}{	ext{totalCapital}}ight) 	imes 100ight)$$
- `isCapitalFullyRecovered` = `unrecoveredCapital === 0 && totalCapital > 0`

### E. Profit Setelah Modal dan Pengeluaran
Sesuai bagian 8.1 dan 8.2 spesifikasi `inner-kt`:
$$	ext{profitAfterCapitalAndExpense} = 	ext{netOrderRevenue} - 	ext{totalCapital} - 	ext{totalNonTransportExpense}$$

*(Catatan UI: Jika angka ini masih bernilai negatif karena belum balik modal, tampilkan dengan label jelas: **"Defisit / Menuju Profit: -Rp..."** disertai penjelasan bahwa modal awal sebesar `unrecoveredCapital` masih dalam proses pengembalian. Jika sudah positif, tampilkan dengan warna hijau emerald sebagai **"Profit Bersih Setelah Balik Modal: +Rp..."**).*

---

## 3. Rumus Eksak Ringkasan Tingkat Bisnis (`BusinessFinancialSummary`)

Seluruh angka tingkat bisnis merupakan penjumlahan konsisten dari seluruh pemilik aktif:
- `totalBusinessUnits` = $\sum 	ext{totalUnitsOwned}$
- `totalBusinessCapital` = $\sum 	ext{totalCapital}$
- `totalGrossRevenue` = $\sum 	ext{grossOrderRevenue}$
- `totalTransportCost` = $\sum 	ext{orderTransportShare}$
- `totalNetOrderRevenue` = `totalGrossRevenue - totalTransportCost`
- `totalOtherExpenses` = $\sum 	ext{totalNonTransportExpense}$
- `totalRecoveredCapital` = $\sum 	ext{recoveredCapital}$
- `totalUnrecoveredCapital` = $\sum 	ext{unrecoveredCapital}$
- `totalBusinessProfit` = `totalNetOrderRevenue - totalBusinessCapital - totalOtherExpenses`

> **Catatan Konsistensi Penting:**
> Pada tingkat bisnis, `totalRecoveredCapital` dan `totalUnrecoveredCapital` harus dihitung dari penjumlahan progres masing-masing pemilik ($\sum 	ext{unrecoveredCapital}_i$), karena modal dan aset dimiliki secara terpisah oleh masing-masing pemilik (kelebihan balik modal Surya tidak otomatis menutupi sisa modal Pemilik B).

---

## 4. Implementasi Kode Referensi (`src/lib/finance-engine.ts`)

Instruksikan Gemini 3.8 Flash untuk mengimplementasikan fungsi pembagian dengan *exact integer division* berikut:

```typescript
export function splitEvenlyWithRemainder(
  totalAmount: number,
  ownerIds: string[]
): Record<string, number> {
  const count = ownerIds.length;
  if (count === 0) return {};
  const baseShare = Math.floor(totalAmount / count);
  let remainder = totalAmount - baseShare * count;

  const result: Record<string, number> = {};
  for (const id of ownerIds) {
    result[id] = baseShare + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return result;
}

export function calculateOrderAllocations(params: {
  activeOwnerIds: string[];
  usages: { ownerId: string; unitsUsed: number; ratePerDay: number; durationDays: number }[];
  finalGrossRevenue: number;
  transportCost: number;
}) {
  const { activeOwnerIds, usages, finalGrossRevenue, transportCost } = params;

  // 1. Hitung subtotal kotor per pemilik dari unit yang digunakan
  const rawGrossByOwner: Record<string, number> = {};
  const unitsByOwner: Record<string, number> = {};
  for (const id of activeOwnerIds) {
    rawGrossByOwner[id] = 0;
    unitsByOwner[id] = 0;
  }

  let calculatedTotalGross = 0;
  for (const u of usages) {
    const sub = u.unitsUsed * u.ratePerDay * u.durationDays;
    rawGrossByOwner[u.ownerId] = (rawGrossByOwner[u.ownerId] || 0) + sub;
    unitsByOwner[u.ownerId] = (unitsByOwner[u.ownerId] || 0) + u.unitsUsed;
    calculatedTotalGross += sub;
  }

  // 2. Alokasi pendapatan kotor aktual (mendukung harga normal maupun diskon/paket)
  const grossShareByOwner: Record<string, number> = {};
  if (calculatedTotalGross === finalGrossRevenue) {
    for (const id of activeOwnerIds) {
      grossShareByOwner[id] = rawGrossByOwner[id] || 0;
    }
  } else if (calculatedTotalGross > 0) {
    let allocatedSum = 0;
    for (const id of activeOwnerIds) {
      const share = Math.floor(((rawGrossByOwner[id] || 0) * finalGrossRevenue) / calculatedTotalGross);
      grossShareByOwner[id] = share;
      allocatedSum += share;
    }
    // Alokasikan sisa pembulatan ke pemilik dengan kontribusi terbesar
    let remainder = finalGrossRevenue - allocatedSum;
    const sortedOwners = [...activeOwnerIds].sort(
      (a, b) => (rawGrossByOwner[b] || 0) - (rawGrossByOwner[a] || 0)
    );
    let idx = 0;
    while (remainder > 0 && sortedOwners.length > 0) {
      const targetId = sortedOwners[idx % sortedOwners.length];
      grossShareByOwner[targetId] += 1;
      remainder--;
      idx++;
    }
  } else {
    for (const id of activeOwnerIds) grossShareByOwner[id] = 0;
  }

  // 3. Alokasi biaya transportasi dibagi rata ke seluruh pemilik aktif (3 pemilik)
  const transportShareByOwner = splitEvenlyWithRemainder(transportCost, activeOwnerIds);

  // 4. Hitung pendapatan bersih per pemilik
  return activeOwnerIds.map((ownerId) => {
    const grossShare = grossShareByOwner[ownerId] || 0;
    const transportCostShare = transportShareByOwner[ownerId] || 0;
    return {
      ownerId,
      totalUnitsUsed: unitsByOwner[ownerId] || 0,
      grossShare,
      transportCostShare,
      netShare: grossShare - transportCostShare,
    };
  });
}
```

---

## 5. Daftar Validasi Wajib (`src/lib/validations.ts`)

Sistem harus menolak input dan menampilkan pesan kesalahan bahasa Indonesia yang jelas jika:
1. `unitsUsed <= 0` atau `durationDays < 1`.
2. `capitalPerUnit < 0`, `ratePerDay < 0`, `transportCost < 0`, atau `expense.amount <= 0`.
3. Jumlah unit milik suatu pemilik yang dipilih pada order **melebihi jumlah stok unit kondisi `BAIK`** milik pemilik tersebut (`unitsUsed > availableOwnerUnits`).
4. `finalGrossRevenue !== calculatedGross` tetapi kolom `priceAdjustmentNote` (alasan penyesuaian harga/diskon) dibiarkan kosong.
5. Total alokasi pendapatan (`sum(grossShare)`) tidak sama dengan `finalGrossRevenue`.
6. Total alokasi biaya transportasi (`sum(transportCostShare)`) tidak sama dengan `transportCost`.
7. Admin mencoba mengedit order yang sudah berstatus `FINAL` tanpa melalui aksi **"Koreksi / Batalkan dengan Alasan Audit"**.
