# 05 — Panduan Desain UI/UX: Sederhana, Tegas & Anti-Slop (`inner-kt`)

Dokumen ini mengatur standar visual untuk Gemini 3.8 Flash agar tampilan `inner-kt` **sederhana, cepat digunakan, namun terlihat sangat rapi dan profesional (bukan tampilan template AI "slop")**.

---

## 1. Apa yang Dimaksud "Anti-Slop" pada Aplikasi Internal?

Aplikasi internal yang buruk (*AI slop*) biasanya memiliki ciri:
- Gradien ungu-biru neon di latar belakang atau tombol.
- Kartu dengan bayangan tebal (*heavy drop shadow*) dan sudut terlalu bulat (`rounded-3xl`).
- Banyak ruang kosong (*padding* raksasa) sehingga admin harus terus-menerus melakukan *scroll* hanya untuk melihat 5 baris transaksi.
- Ikon dekoratif besar dan kalimat basa-basi marketing.

Sebaliknya, **`inner-kt` harus mengikuti estetika "High-Density Financial Ledger" (seperti Stripe Dashboard / Linear / Mercury Bank)**:
- **Padat informasi, bersih, dan terstruktur dalam grid yang jelas.**
- **Garis batas tipis dan tegas:** Gunakan border `1px solid #E2E8F0` (`border-slate-200`) dengan sudut `rounded-md` (`6px`) atau `rounded-lg` (`8px`), serta bayangan sangat halus (`shadow-none` atau `shadow-xs`).
- **Angka Rupiah Sejajar Sempurna:** Semua nominal uang, persentase, dan jumlah unit wajib menggunakan font monospace atau `font-variant-numeric: tabular-nums` agar digit satuan, ribuan, dan jutaan lurus vertikal di dalam tabel.

---

## 2. Sistem Warna & Tipografi

### Palet Warna (Light Mode Fokus Operasional yang Tajam)
- **Background Utama App:** `#F8FAFC` (`bg-slate-50`)
- **Surface Kartu & Tabel:** `#FFFFFF` (`bg-white`)
- **Sidebar Navigasi:** `#0F172A` (`bg-slate-900` dengan teks `#F8FAFC` untuk kontras kerja yang jelas)
- **Teks Utama:** `#0F172A` (`text-slate-900`)
- **Teks Sekunder / Label:** `#475569` (`text-slate-600`)
- **Aksen Utama (Kanal Tiga Internal Accent):** `#0F172A` (Slate 900) untuk tombol aksi utama, dan `#2563EB` (Blue 600) untuk tautan & fokus aktif.
- **Indikator Semantik Keuangan:**
  - **Pendapatan Bersih / Sudah Balik Modal / Profit Positif:** `#059669` (`text-emerald-600`, background badge `bg-emerald-50 border-emerald-200`)
  - **Potongan Transportasi / Pengeluaran / Sisa Modal Belum Kembali:** `#D97706` (`text-amber-600`, background badge `bg-amber-50 border-amber-200`)
  - **Defisit / Batal / Error Validasi:** `#DC2626` (`text-red-600`, background badge `bg-red-50 border-red-200`)
- **Identitas Warna 3 Pemilik (Badge Konsisten di Seluruh Halaman):**
  - **Surya (Pemilik 1):** Badge Indigo (`bg-indigo-50 text-indigo-700 border-indigo-200`)
  - **Pemilik B (Pemilik 2):** Badge Teal (`bg-teal-50 text-teal-700 border-teal-200`)
  - **Pemilik C (Pemilik 3):** Badge Amber (`bg-amber-50 text-amber-700 border-amber-200`)

### Tipografi
- **UI & Teks:** `Inter` atau `Plus Jakarta Sans`.
- **Angka Keuangan, ID Order, & Kuantitas Unit:** `JetBrains Mono` atau class utilitas `font-mono tabular-nums`.

---

## 3. Tata Letak Halaman demi Halaman

### A. Halaman Login (`/login`) — Langsung Tanpa Landing Page
- Tampilan tengah (*centered card*) berukuran `max-w-sm` di atas latar `#F1F5F9` dengan pola grid tipis opsional.
- Header tegas:
  - Badge kecil: `INTERNAL SYSTEM`
  - Judul: **`inner-kt — Kanal Tiga`**
  - Subjudul: `Sistem Pencatatan Keuangan, Aset & CRM Pemilik`
- Input Email & Password + Tombol `Masuk ke Workspace`.
- Di bagian bawah kartu login, tampilkan kotak **"Akses Cepat Akun Pemilik (Internal)"** berisi 3 tombol ringkas:
  - `[Admin 1 — Surya]`
  - `[Admin 2 — Pemilik B]`
  - `[Admin 3 — Pemilik C]`
  Saat diklik, langsung mengisi email & password akun terkait (atau langsung masuk) agar pemilik dapat berganti akun dengan cepat saat pengujian.

### B. Layout Utama Internal (`Sidebar + Main Content`)
- **Sidebar Kiri Tetap (`w-60`):**
  - Logo & Nama Sistem: `inner-kt` + indikator status database.
  - Grup Menu **KEUANGAN & ASET**:
    1. `Dashboard & Laporan` (`/dashboard`)
    2. `Order Penyewaan` (`/orders`)
    3. `Inventaris Aset & Modal` (`/assets`)
    4. `Pengeluaran Bisnis` (`/expenses`)
  - Grup Menu **PELANGGAN & EVENT**:
    5. `CRM & Calon Customer` (`/crm`)
  - Grup Menu **SISTEM**:
    6. `Data Pemilik` (`/owners`)
    7. `Riwayat Audit` (`/audit-log`)
  - **Footer Sidebar:** Menampilkan profil admin yang sedang login (misal: `admin1@kanaltiga.internal` • **Surya**) dan tombol `Keluar`.

### C. Halaman Dashboard (`/dashboard`)
1. **Baris Filter Atas:** Filter Rentang Waktu (`Semua Waktu`, `Tahun Ini`, `Bulan Ini`, `Rentang Kustom`), Filter Pemilik, dan tombol `+ Buat Order Baru`.
2. **Bagian 1: Ringkasan Bisnis Kanal Tiga (Metric Strip 5 Kolom Padat):**
   - **Total Aset & Modal Tercatat:** `Rp3.000.000` (30 Unit terdaftar)
   - **Pendapatan Bersih Order:** `Rp188.000` *(Kotor: Rp200.000 − Transport: Rp12.000)*
   - **Total Pengeluaran Lain:** `Rp90.000` *(Bersama: Rp60.000 + Pribadi: Rp30.000)*
   - **Progres Balik Modal Bisnis:** Progress bar + `Rp188.000 kembali / Sisa Rp2.812.000`
   - **Profit Setelah Modal & Pengeluaran:** Nilai aktual dengan tooltip rumus transparan.
3. **Bagian 2: Matriks Perbandingan 3 Pemilik (3 Kartu Sejajar Side-by-Side):**
   Menampilkan kartu **Surya**, **Pemilik B**, dan **Pemilik C** berdampingan dengan baris metrik yang sejajar persis:
   - Jumlah Unit & Total Nilai Modal Aset
   - Pendapatan Kotor Order
   - Potongan Biaya Transportasi (1/3)
   - **Pendapatan Bersih Order**
   - Progress Bar **Progres Balik Modal (%)** (`Modal Kembali` vs `Sisa Modal Belum Kembali`)
   - Beban Pengeluaran Bersama (1/3) & Pengeluaran Perorangan
   - **Profit Setelah Modal dan Pengeluaran**

### D. Form & Kalkulator Order Penyewaan (`/orders/new`)
- Dirancang bersebelahan (2 kolom di layar desktop):
  - **Kolom Kiri (Input Data Order & Pemakaian Unit):**
    - Pilih dari Calon Pelanggan CRM (opsional) atau ketik nama organisasi & event.
    - Tanggal sewa & durasi hari.
    - Tabel pemilihan aset per pemilik: menampilkan stok tersedia milik **Surya (10 unit)**, **Pemilik B (15 unit)**, **Pemilik C (5 unit)** beserta input jumlah unit yang dipakai di order ini.
    - Input Tarif per unit/hari, Konfirmasi Total Pembayaran Sewa, dan Input **Biaya Transportasi**.
  - **Kolom Kanan (Live Preview Bagi Hasil & Potongan Transportasi):**
    - Sebelum tombol `Simpan & Finalisasi Order` ditekan, admin sudah bisa melihat tabel kalkulasi *real-time*: berapa bagian kotor Surya, Pemilik B, dan Pemilik C, berapa potongan transportasi masing-masing (`÷ 3`), dan berapa **Pendapatan Bersih** yang akan diterima tiap pemilik.
