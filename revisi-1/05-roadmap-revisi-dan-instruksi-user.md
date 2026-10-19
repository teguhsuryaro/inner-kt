# 05 — Roadmap Implementasi Revisi v2.0 & Panduan Langkah demi Langkah untuk Surya

Dokumen ini berisi urutan prompt untuk diberikan kepada **Gemini 3.8 Flash di Antigravity**, sekaligus daftar langkah praktis yang perlu dilakukan Surya untuk menghubungkan **Supabase** dan **Vercel**.

---

## Bagian A: Langkah yang Perlu Dilakukan Surya (Panduan Setup Supabase & Vercel)

> **Instruksi untuk AI (Gemini 3.8 Flash):** Ketika kamu selesai membuat file `supabase/schema-and-seed.sql` dan `.env.example`, tampilkan panduan di bawah ini kepada Surya dengan jelas.

### Langkah 1 — Membuat Project & Tabel di Supabase (Gratis)
1. Buka [https://supabase.com](https://supabase.com) dan login, lalu klik **New Project**.
2. Beri nama project misalnya `inner-kt-kanaltiga`, buat password database, dan pilih region terdekat (**Singapore / ap-southeast-1**).
3. Setelah project aktif, buka menu **SQL Editor** di sidebar kiri Supabase.
4. Klik **New Query**, lalu *copy-paste* seluruh isi file **`supabase/schema-and-seed.sql`** yang telah dibuat oleh AI ke dalam editor tersebut, kemudian klik **Run**.
   *(Ini akan langsung membuat 10 tabel lengkap beserta 3 akun admin dan data awal tanpa perlu Prisma sama sekali!).*
5. Buka menu **Project Settings (ikon gerigi) -> API** di Supabase:
   - Salin nilai **Project URL** -> masukkan ke variabel `NEXT_PUBLIC_SUPABASE_URL` di file `.env.local`.
   - Salin nilai **Project API Keys (`anon` `public`)** -> masukkan ke variabel `NEXT_PUBLIC_SUPABASE_ANON_KEY` di file `.env.local`.

### Langkah 2 — Deploy ke Vercel agar Bisa Diakses Teman Lewat Domain
1. Push kode proyek `inner-kt` ke repository GitHub milikmu (bisa diset *Private*).
2. Buka [https://vercel.com](https://vercel.com), klik **Add New... -> Project**, lalu pilih repository `inner-kt` tersebut.
3. Pada bagian **Environment Variables** di halaman deploy Vercel, tambahkan 2 variabel yang sama persis dengan `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = *(URL Supabase kamu)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(Anon Key Supabase kamu)*
4. Klik **Deploy**. Dalam 1–2 menit, website `inner-kt` sudah online di domain `.vercel.app` (atau custom domain milikmu) dan bisa langsung diakses oleh ketiga pemilik (`admin1`, `admin2`, `admin3`) dengan database yang tersinkronisasi secara *real-time*!

---

## Bagian B: Tahapan Prompt Implementasi di Antigravity (Gemini 3.8 Flash)

Jalankan revisi ini dalam **3 Tahap Prompt** agar Gemini 3.8 Flash menulis seluruh perubahan kode secara tuntas tanpa terpotong.

### Prompt Revisi Tahap 1: Migrasi ke Supabase Murni (Tanpa Prisma) & Revisi Modul Aset
```markdown
Mulai **Revisi Tahap 1** sesuai dokumen `01-migrasi-supabase-tanpa-prisma-dan-vercel.md` dan `02-revisi-modul-aset-dan-audit.md`:
1. Hapus seluruh penggunaan Prisma dan ganti dengan `@supabase/supabase-js` murni (`src/lib/supabase.ts`).
2. Buat file `supabase/schema-and-seed.sql` lengkap agar bisa langsung aku jalankan di Supabase SQL Editor.
3. Buat service layer data Supabase (`src/lib/db-service.ts`) di mana ketiga admin (`admin1`, `admin2`, `admin3`) memiliki hak akses yang 100% setara (Equal Co-Owners), dan setiap aksi tambah/edit/hapus otomatis mencatat riwayat detail (termasuk before & after data) ke tabel `audit_logs`.
4. Perbarui halaman Inventaris Aset (`/assets`):
   - Ubah field "Kategori" menjadi input teks manual (dengan datalist saran opsional), bukan dropdown kaku.
   - Hapus seluruh kolom dan input "Kondisi Barang" dari form, tabel, dan validasi.
   - Tambahkan kolom "Aksi" di tabel aset yang berisi tombol ikon **Edit** dan **Hapus** (dengan konfirmasi) yang terhubung langsung ke Supabase dan mencatat perubahan ke Riwayat Audit.
```

### Prompt Revisi Tahap 2: Perombakan Modul CRM & Calon Pelanggan (`/crm`)
```markdown
Lanjutkan ke **Revisi Tahap 2** sesuai dokumen `03-revisi-modul-crm-dan-calon-pelanggan.md`:
1. Perbarui form Tambah & Edit Prospek di `/crm`:
   - Jadikan Nomor WhatsApp dan Username Instagram sama-sama opsional.
   - Tambahkan pilihan **Gender PIC** (`Laki-laki`, `Perempuan`, `Belum Diketahui`).
2. Ubah kolom tabel menjadi **"Kontak PIC"** yang menampilkan Nama PIC, Badge Gender, Jabatan, link WhatsApp (jika ada), dan link Instagram (jika ada).
3. Perbaiki sistem Filter di `/crm` agar bersih, tidak redundan, mencakup status **`LOST` (Batal)**, filter Kategori Organisasi, filter Gender PIC, dan filter Ketersediaan Kontak (WA/IG).
4. Ubah kolom **Aksi** di tabel `/crm` agar hanya menggunakan tombol ikon ringkas (`lucide-react` dengan tooltip):
   - Tombol ikon **Konversi ke Order**: HANYA muncul/bisa diklik jika status prospek sudah **`WON` (Deal)**.
   - Tombol ikon **Edit Prospek** (mencatat perubahan ke Audit Log).
   - Tombol ikon **Hapus Prospek** dengan modal konfirmasi (mencatat penghapusan ke Audit Log).
```

### Prompt Revisi Tahap 3: Pembuatan 2 Menu Grafik Real-Time & Ekspor CSV (AI) + Excel (.xlsx)
```markdown
Lanjutkan ke **Revisi Tahap 3** sesuai dokumen `04-fitur-grafik-realtime-dan-ekspor-data.md`:
1. Tambahkan 2 menu baru di Sidebar:
   - **Grafik Keuangan & Aset (`/analytics/finance`)** di bawah grup Keuangan & Aset.
   - **Grafik Pelanggan & Event (`/analytics/crm`)** di bawah grup Pelanggan & Event.
2. Pada `/analytics/finance`: Buat grafik interaktif real-time (`recharts`) untuk Tren Arus Kas Bulanan, Perbandingan Modal vs Balik Modal vs Pengeluaran 3 Pemilik, Proporsi & Utilisasi Unit Aset, serta Komposisi Pengeluaran.
3. Pada `/analytics/crm`: Buat grafik interaktif real-time untuk Corong Pipeline Penawaran (termasuk Deal & Batal), Analisis Gender PIC & Rasio Konversi Deal, Efektivitas Channel Kontak (WA vs IG), serta Kategori Organisasi & Kebutuhan Unit per Bulan.
4. Di masing-masing halaman grafik tersebut, implementasikan 2 tombol download yang benar-benar berfungsi:
   - **`Download CSV (Untuk Analisis AI)`**: Menghasilkan file `.csv` yang sudah di-join/denormalisasi secara lengkap sehingga siap dibaca AI untuk pengambilan keputusan.
   - **`Download Excel / Spreadsheet (.xlsx)`**: Menggunakan library `xlsx` untuk menghasilkan file spreadsheet multi-sheet yang rapi, terstruktur, dan memiliki lebar kolom otomatis untuk dibaca manusia.
5. Setelah selesai, tampilkan panduan ringkas langkah-langkah apa saja yang harus aku lakukan di Supabase Dashboard dan Vercel.
```
