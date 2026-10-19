# 06 — Roadmap Implementasi Bertahap dari 0 Sampai Jadi (Panduan Prompt Antigravity)

Gunakan tahapan di bawah ini untuk memandu **Gemini 3.8 Flash di Antigravity** langkah demi langkah. Jika AI berhenti karena batas panjang output, minta ia melanjutkan ke tahap berikutnya.

---

## Tahap 1: Inisialisasi Proyek, Struktur Data, Seeder & Autentikasi 3 Admin
**Prompt untuk diberikan ke Gemini 3.8 Flash:**
> "Mulai **Tahap 1**: Buat fondasi proyek `inner-kt` sesuai `01-arsitektur-dan-autentikasi.md` dan `02-skema-database-dan-seed.md`.
> 1. Buat tipe data TypeScript lengkap (`src/types/index.ts`), mesin kalkulasi keuangan murni (`src/lib/finance-engine.ts`) sesuai `03-mesin-logika-keuangan-dan-validasi.md`, dan fungsi validasi (`src/lib/validations.ts`).
> 2. Buat penyimpanan data beserta data awal (seed data) yang memuat:
>    - 3 Pemilik: Surya (10 HT @ Rp100.000), Pemilik B (15 HT @ Rp100.000), Pemilik C (5 HT @ Rp100.000).
>    - 3 Akun Admin: `admin1@kanaltiga.internal`, `admin2@kanaltiga.internal`, `admin3@kanaltiga.internal`.
>    - 1 Order Final contoh (20 unit HT, 1 hari, Rp200.000 kotor, Rp12.000 transportasi, dengan rincian Surya 10 unit, Pemilik B 6 unit, Pemilik C 4 unit).
>    - 2 Pengeluaran contoh (Stiker bersama Rp60.000 dibagi 3, dan perlengkapan pribadi Surya Rp30.000).
>    - 4 Prospek CRM contoh.
> 3. Buat halaman `/login` tanpa landing page (root `/` langsung arahkan ke `/login` atau `/dashboard`) lengkap dengan tombol Quick-Login untuk `admin1`, `admin2`, dan `admin3`, serta Layout Sidebar internal yang rapi."

---

## Tahap 2: Dashboard Keuangan Bisnis & Perbandingan 3 Pemilik (`/dashboard`)
**Prompt untuk diberikan ke Gemini 3.8 Flash:**
> "Lanjutkan ke **Tahap 2**: Implementasikan halaman `/dashboard` dan `/owners` sesuai `03-mesin-logika-keuangan-dan-validasi.md` dan `05-desain-ui-ux-anti-slop.md`.
> 1. Tampilkan Ringkasan Tingkat Bisnis (Total Aset & Modal, Pendapatan Kotor, Potongan Transportasi, Pendapatan Bersih, Pengeluaran Lain, Sisa Modal Belum Kembali, dan Profit Setelah Modal & Pengeluaran).
> 2. Tampilkan 3 Kartu Pemilik berdampingan (Surya, Pemilik B, Pemilik C) lengkap dengan Progress Bar Balik Modal, rincian pendapatan, rincian pengeluaran bersama vs pribadi, serta Profit masing-masing.
> 3. Tambahkan filter periode waktu (Semua Waktu, Tahun Ini, Bulan Ini) dan pastikan semua nominal Rupiah menggunakan `tabular-nums`.
> 4. Buat halaman `/owners` untuk melihat dan mengubah nama tampilan pemilik."

---

## Tahap 3: Manajemen Aset & Modal (`/assets`) serta Pengeluaran (`/expenses`)
**Prompt untuk diberikan ke Gemini 3.8 Flash:**
> "Lanjutkan ke **Tahap 3**: Implementasikan halaman `/assets` dan `/expenses`.
> 1. Pada `/assets`: Admin dapat melihat daftar aset per pemilik, memfilter berdasarkan pemilik/kategori, dan menambah aset baru (menentukan pemilik, jumlah unit, harga modal per unit, status Modal Awal vs Modal Tambahan, serta kondisi barang). Pastikan penambahan aset milik satu pemilik hanya menambah modal pemilik tersebut.
> 2. Pada `/expenses`: Admin dapat mencatat pengeluaran baru dengan memilih jenis pembagian **Bersama (otomatis dibagi rata 3 pemilik)** atau **Perorangan (ditanggung 1 pemilik)**, serta memilih siapa yang membayarkan terlebih dahulu. Tampilkan juga pengeluaran transportasi yang otomatis berasal dari Order dengan badge khusus agar transparan dan tidak terhitung ganda."

---

## Tahap 4: Pengelolaan Order Penyewaan & Kalkulator Bagi Hasil (`/orders`)
**Prompt untuk diberikan ke Gemini 3.8 Flash:**
> "Lanjutkan ke **Tahap 4**: Implementasikan halaman daftar order (`/orders`) dan form pembuatan/pengelolaan order (`/orders/new`).
> 1. Buat form Order yang memungkinkan admin memilih berapa unit aset dari Surya, Pemilik B, dan Pemilik C yang digunakan dalam order tersebut, dengan validasi stok maksimum per pemilik.
> 2. Hitung otomatis tarif sewa (`unit × tarif × durasi hari`), dukung penyesuaian harga/diskon dengan alasan wajib, dan sediakan input biaya transportasi.
> 3. Tampilkan **Panel Live Preview Pembagian Hasil** di sebelah kanan form yang merinci Pendapatan Kotor per pemilik, Potongan Biaya Transportasi (`÷ 3`), dan Pendapatan Bersih per pemilik sebelum order disimpan sebagai `DRAFT` atau `FINAL`.
> 4. Sediakan fitur pembatalan/koreksi order (`CANCELLED`) yang otomatis membatalkan beban transportasi terkait dan mencatat alasan ke Audit Log."

---

## Tahap 5: Modul CRM Calon Pelanggan (`/crm`) & Audit Log (`/audit-log`)
**Prompt untuk diberikan ke Gemini 3.8 Flash:**
> "Lanjutkan ke **Tahap 5**: Implementasikan modul `/crm` sesuai `04-modul-crm-dan-calon-pelanggan.md` serta halaman `/audit-log`.
> 1. Pada `/crm`: Buat pencatatan lengkap organisasi/instansi, nama event, tanggal acara, estimasi kebutuhan unit, kode voucher dari web utama Kanal Tiga, kontak WhatsApp PIC (dengan tombol klik langsung ke WA), dan tahapan status penawaran (`IDENTIFIED`, `CONTACTED`, `PROPOSAL_SENT`, `NEGOTIATION`, `WON`, `LOST`).
> 2. Buat fitur **'Konversi ke Order Sewa'**: tombol pada prospek CRM yang langsung membuka form Order Baru dengan data organisasi, nama event, tanggal, dan durasi yang sudah terisi otomatis, lalu menandai prospek sebagai `WON` setelah order dibuat.
> 3. Pada `/audit-log`: Tampilkan tabel kronologis seluruh aktivitas penambahan aset, finalisasi/pembatalan order, pengeluaran, dan perubahan status CRM beserta akun admin (`admin1`, `admin2`, atau `admin3`) yang melakukannya."

---

## Daftar Periksa Verifikasi Akhir (Acceptance Checklist)

Setelah kelima tahap selesai, pastikan angka pada data awal (seed) di Dashboard menampilkan hasil perhitungan yang **100% persis** dengan tabel di bawah ini:

| Komponen Keuangan (Seed Awal) | Surya (Admin 1) | Pemilik B (Admin 2) | Pemilik C (Admin 3) | Total Bisnis |
|---|---:|---:|---:|---:|
| **Jumlah Unit HT** | 10 unit | 15 unit | 5 unit | **30 unit** |
| **Nilai Modal Awal** | Rp1.000.000 | Rp1.500.000 | Rp500.000 | **Rp3.000.000** |
| **Pendapatan Kotor Order #1** | Rp100.000 | Rp60.000 | Rp40.000 | **Rp200.000** |
| **Potongan Transportasi (÷3)** | -Rp4.000 | -Rp4.000 | -Rp4.000 | **-Rp12.000** |
| **Pendapatan Bersih Order #1** | **Rp96.000** | **Rp56.000** | **Rp36.000** | **Rp188.000** |
| **Modal Sudah Kembali** | Rp96.000 (9,6%) | Rp56.000 (3,73%) | Rp36.000 (7,2%) | **Rp188.000 (6,27%)** |
| **Sisa Modal Belum Kembali** | **Rp904.000** | **Rp1.444.000** | **Rp464.000** | **Rp2.812.000** |
| **Pengeluaran Bersama (Stiker)** | Rp20.000 | Rp20.000 | Rp20.000 | **Rp60.000** |
| **Pengeluaran Perorangan** | Rp30.000 | Rp0 | Rp0 | **Rp30.000** |
| **Total Pengeluaran Non-Transport** | **Rp50.000** | **Rp20.000** | **Rp20.000** | **Rp90.000** |
| **Profit Setelah Modal & Pengeluaran** | **-Rp954.000** | **-Rp1.464.000** | **-Rp484.000** | **-Rp2.902.000** |
