# Panduan Finishing & Production Readiness — `inner-kt` (Siap Pakai Operasional)

Dokumen ini adalah instruksi tahap akhir (*Finishing Phase*) bagi **Gemini 3.8 Flash di Antigravity** sebelum website **`inner-kt`** resmi digunakan untuk operasional nyata oleh Surya dan dua pemilik lainnya.

---

## Ringkasan 3 Tugas Utama Finishing

1. **Reset & Pembersihan Data Transaksi (Clean Slate untuk Input Manual):**
   - Kosongkan seluruh data sampel/dummy pada tabel transaksi: `assets`, `crm_leads`, `rental_orders`, `order_item_owner_usages`, `order_owner_allocations`, `expenses`, `expense_owner_allocations`, dan `audit_logs`.
   - **PERTAHANKAN** hanya data fondasi: **3 Pemilik (`owners`)** dan **3 Akun Login Admin (`admin_users`)** agar ketiga pemilik tetap bisa langsung login dan mulai mengisi data dari Rp0 secara manual.
   - Pastikan seluruh halaman (Dashboard, Grafik Keuangan, Grafik CRM, Tabel Aset, Order, Pengeluaran, dan CRM) memiliki penanganan **Empty State (Kondisi Data Kosong)** yang rapi, aman dari error pembagian nol (`NaN` / `Division by Zero`), dan tetap enak dilihat.
2. **Keamanan Halaman Login (`/login`):**
   - **HAPUS TOTAL** tampilan daftar akun, email, password, maupun tombol *Quick-Login / Quick-Fill* (`Admin 1`, `Admin 2`, `Admin 3`) dari halaman `/login`.
   - Halaman `/login` hanya boleh menampilkan form bersih berisi input **Email**, input **Password** (dengan tombol *show/hide password*), dan tombol **Masuk**. Tidak boleh ada bocoran kredensial di UI maupun di *source code* komponen klien.
3. **Audit & Perbaikan Responsivitas di Berbagai Device (Mobile, Tablet, Desktop):**
   - Pastikan seluruh halaman nyaman diakses lewat **HP (Android/iOS)** saat pemilik sedang di lapangan/lokasi event, maupun lewat **Tablet & Laptop**.
   - Sidebar otomatis berubah menjadi **Slide-Over Drawer (Hamburger Menu)** di layar HP/Tablet kecil.
   - Tabel dengan banyak kolom memiliki pembungkus `overflow-x-auto` yang mulus dengan kolom aksi yang mudah disentuh.
   - Form multi-kolom dan panel *live preview* order menumpuk (*stacking*) secara vertikal dengan rapi di layar kecil.

---

## Bagian 1: Script SQL Pembersihan Data untuk Supabase (`supabase/clean-production-reset.sql`)

Instruksikan AI untuk membuat file `supabase/clean-production-reset.sql` berisi script di bawah ini, lalu **tampilkan instruksi kepada Surya untuk menjalankannya di Supabase SQL Editor**:

```sql
-- ============================================================================
-- INNER-KT — PRODUCTION CLEAN RESET (KOSONGKAN DATA SAMPEL, SIMPAN 3 AKUN ADMIN)
-- Jalankan di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- 1. Kosongkan seluruh tabel transaksi, aset, CRM, dan riwayat audit
TRUNCATE TABLE
  audit_logs,
  expense_owner_allocations,
  expenses,
  order_owner_allocations,
  order_item_owner_usages,
  rental_orders,
  crm_leads,
  assets
RESTART IDENTITY CASCADE;

-- 2. Pastikan 3 Pemilik Utama tetap ada dan aktif
INSERT INTO owners (id, code, name, color_badge, is_active, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'OWNER_1', 'Surya', 'indigo', TRUE, 'Pemilik 1 Kanal Tiga'),
  ('22222222-2222-2222-2222-222222222222', 'OWNER_2', 'Pemilik B', 'teal', TRUE, 'Pemilik 2 Kanal Tiga'),
  ('33333333-3333-3333-3333-333333333333', 'OWNER_3', 'Pemilik C', 'amber', TRUE, 'Pemilik 3 Kanal Tiga')
ON CONFLICT (code) DO NOTHING;

-- 3. Pastikan 3 Akun Admin tetap terdaftar untuk login
INSERT INTO admin_users (username, email, password_plain, display_name, owner_id, role) VALUES
  ('admin1', 'admin1@kanaltiga.internal', 'Admin1KanalTiga!', 'Admin 1 — Surya', '11111111-1111-1111-1111-111111111111', 'CO_OWNER'),
  ('admin2', 'admin2@kanaltiga.internal', 'Admin2KanalTiga!', 'Admin 2 — Pemilik B', '22222222-2222-2222-2222-222222222222', 'CO_OWNER'),
  ('admin3', 'admin3@kanaltiga.internal', 'Admin3KanalTiga!', 'Admin 3 — Pemilik C', '33333333-3333-3333-3333-333333333333', 'CO_OWNER')
ON CONFLICT (email) DO NOTHING;

-- 4. Catat 1 log awal bahwa sistem telah di-reset untuk produksi
INSERT INTO audit_logs (admin_email, admin_display_name, entity_type, entity_id, action, summary) VALUES
  ('SYSTEM', 'System Production Reset', 'SYSTEM', 'PROD-INIT', 'RESET_DATA', 'Seluruh data sampel telah dibersihkan. Sistem siap digunakan untuk pencatatan manual.');
```

> **PENTING untuk Kode Aplikasi (`src/lib/`):**
> Jika di dalam kode aplikasi masih ada *fallback mock/seed data* otomatis di sisi aplikasi (misal di `localStorage` atau file `seed-data.ts` yang otomatis mengisi ulang aset/order ketika tabel kosong), **HAPUS logika auto-seed transaksi tersebut** agar ketika tabel Supabase kosong, aplikasi benar-benar menampilkan angka `Rp0` dan tabel kosong yang siap diisi manual.

---

## Bagian 2: Spesifikasi Pengamanan Halaman Login (`/login`)

Perbarui `src/app/(auth)/login/page.tsx` dengan ketentuan ketat berikut:

1. **Hapus Semua Informasi Kredensial dari UI:**
   - Hapus kotak *"Akses Cepat Akun Pemilik (Internal)"* atau tombol *Quick-Fill* (`Admin 1`, `Admin 2`, `Admin 3`).
   - Hapus teks *hint* atau *placeholder* yang membocorkan alamat email asli (gunakan placeholder generik seperti `nama@email.com` dan `••••••••`).
   - Jangan menyimpan password default di dalam kode komponen frontend `/login`. Verifikasi login dilakukan melalui query ke tabel `admin_users` di Supabase (atau Supabase Auth).
2. **Fitur UX Login yang Tetap Nyaman namun Aman:**
   - Tambahkan ikon mata (`Eye` / `EyeOff` dari `lucide-react`) pada kolom Password agar pengguna bisa memeriksa ketikan password-nya sendiri.
   - Tampilkan pesan error generik yang aman jika salah ketik: *"Email atau password yang Anda masukkan tidak sesuai."*
   - Pastikan kartu login responsif sempurna di layar HP (`w-full max-w-sm mx-auto px-4`).

---

## Bagian 3: Penanganan Empty State & Anti-NaN Saat Data Masih Kosong

Karena Surya akan mulai mengisi data secara manual dari nol, pastikan ketika database masih kosong:

1. **Anti `NaN%` atau `Infinity` pada Rumus Keuangan & Grafik:**
   - Pada `finance-engine.ts`: Jika `totalCapital === 0`, maka `capitalRecoveryPercentage` wajib bernilai `0` (bukan `0 / 0 = NaN`).
   - Pada halaman Grafik (`/analytics/finance` dan `/analytics/crm`): Jika belum ada transaksi atau prospek, tampilkan kartu *Empty State* yang bersih di area grafik (misalnya: *"Belum ada data transaksi untuk ditampilkan dalam grafik. Silakan tambahkan Aset, Order, atau Prospek CRM terlebih dahulu."*) atau tampilkan grafik bernilai `0` tanpa error `ResponsiveContainer`.
2. **Empty State pada Tabel (`/assets`, `/orders`, `/expenses`, `/crm`):**
   - Ketika tabel kosong, tampilkan ilustrasi ikon minimalis + teks jelas + tombol pintas (contoh di `/assets`: *"Inventaris aset masih kosong. Klik '+ Tambah Aset' di kanan atas untuk mulai mencatat barang milik masing-masing pemilik."*).

---

## Bagian 4: Standar Responsivitas Multi-Device (Mobile, Tablet & Desktop)

Pastikan seluruh komponen diperiksa dan diperbaiki menggunakan breakpoint Tailwind CSS (`sm:`, `md:`, `lg:`, `xl:`):

1. **Navigasi Sidebar & Header Mobile (`src/app/(internal)/layout.tsx`):**
   - **Desktop (`lg:flex`):** Sidebar kiri tetap tampil (`w-64 shrink-0`).
   - **Mobile & Tablet Kecil (`< lg`):**
     - Sembunyikan sidebar tetap, ganti dengan **Top Header Bar Mobile** (`h-14`) yang menampilkan logo `inner-kt`, badge nama admin aktif, dan tombol **Hamburger Menu (`Menu` icon)**.
     - Saat tombol Hamburger diklik, buka **Slide-Over Drawer Sidebar** dari kiri lengkap dengan backdrop gelap (`bg-slate-900/50`) dan otomatis menutup saat salah satu menu diklik.
2. **Grid Dashboard & Kartu Pemilik (`/dashboard`):**
   - Baris Ringkasan Bisnis (5 metrik): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3`.
   - Kartu Perbandingan 3 Pemilik (Surya, Pemilik B, Pemilik C): `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.
   - Filter bar di bagian atas: `flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`.
3. **Tabel Data (`/assets`, `/orders`, `/expenses`, `/crm`, `/audit-log`):**
   - Bungkus setiap `<table>` di dalam container `<div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white">`.
   - Gunakan `whitespace-nowrap` pada kolom angka Rupiah, tanggal, dan kolom Aksi agar tombol ikon tidak terhimpit di layar HP.
   - Pada halaman `/crm`: Barisan filter (Search, Pill Status Pipeline, Dropdown Kategori & Gender) wajib bisa di-*scroll* horizontal (`overflow-x-auto pb-1`) atau melipat dengan rapi (`flex-wrap gap-2`) di layar HP.
4. **Form Order & Kalkulator Live Preview (`/orders/new`) serta Modal Form:**
   - Ubah layout 2 kolom pada `/orders/new` menjadi `grid-cols-1 lg:grid-cols-12 gap-6` (di layar HP form berada di atas dan panel *Live Preview Bagi Hasil* berada tepat di bawahnya secara utuh).
   - Semua Modal (Tambah/Edit Aset, Pengeluaran, Prospek CRM) wajib memiliki `max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] sm:max-w-lg` agar tombol **Simpan** dan **Batal** tidak pernah terpotong di layar HP yang pendek.
5. **Halaman Grafik (`/analytics/finance` & `/analytics/crm`):**
   - Grid grafik: `grid-cols-1 lg:grid-cols-2 gap-4`.
   - Tombol `Download CSV` dan `Download Excel (.xlsx)` di header halaman grafik menggunakan `flex-wrap gap-2 w-full sm:w-auto` agar di layar HP kedua tombol tersusun rapi dan mudah ditekan.

---

## Bagian 5: Prompt Eksekusi Finishing (Copy-Paste ke Antigravity)

Salin dan kirimkan prompt di bawah ini ke **Gemini 3.8 Flash di Antigravity**:

```markdown
Sekarang kita masuk ke tahap **Finishing & Production Readiness** sesuai dokumen `00-finishing-production-ready.md` sebelum website `inner-kt` ini aku gunakan secara nyata. Tolong eksekusi 4 hal berikut secara menyeluruh:

1. **BERSIHKAN DATA SAMPEL / AUTO-SEED**:
   - Buat file `supabase/clean-production-reset.sql` untuk mengosongkan seluruh tabel transaksi (`assets`, `crm_leads`, `rental_orders`, `order_item_owner_usages`, `order_owner_allocations`, `expenses`, `expense_owner_allocations`, `audit_logs`) namun tetap mempertahankan 3 data `owners` dan 3 akun `admin_users`.
   - Hapus semua data dummy/mock atau logika auto-seeding transaksi di kode frontend/service agar saat database kosong, aplikasi benar-benar mulai dari 0 (Rp0) dan siap aku isi manual.
   - Pastikan tidak ada angka `NaN` atau error saat data masih kosong (baik di Dashboard maupun di halaman Grafik).

2. **AMANKAN HALAMAN LOGIN (`/login`)**:
   - HAPUS TOTAL tombol Quick-Login / Quick-Fill (`Admin 1`, `Admin 2`, `Admin 3`) dan hapus semua teks yang menampilkan daftar email atau password di halaman `/login`.
   - Tampilkan hanya form login bersih (Email & Password dengan fitur show/hide password) tanpa bocoran akun apa pun di layar.

3. **RESPONSIVE RAPI DI SEMUA DEVICE (MOBILE, TABLET, DESKTOP)**:
   - Tambahkan Mobile Header & Slide-Over Drawer Sidebar untuk layar HP/Tablet (`< lg`), sementara di Desktop tetap menggunakan Sidebar kiri.
   - Pastikan semua tabel memiliki `overflow-x-auto` yang rapi, semua modal memiliki `max-h-[90vh] overflow-y-auto` agar tidak terpotong di layar HP, dan semua grid kartu/grafik menyesuaikan kolomnya (`grid-cols-1` di mobile, multi-kolom di tablet/desktop).

4. Beritahu aku langkah terakhir untuk menjalankan script `clean-production-reset.sql` di Supabase SQL Editor.
```
