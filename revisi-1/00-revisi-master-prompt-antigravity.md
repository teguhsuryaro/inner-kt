# Master Prompt Revisi Besar & Migrasi Supabase — `inner-kt` v2.0

Dokumen ini adalah panduan utama dan *system prompt* bagi **Gemini 3.8 Flash di Antigravity** untuk mengeksekusi **Revisi Besar v2.0** pada proyek **`inner-kt`**.

---

## Ringkasan Perubahan Besar (v1.0 -> v2.0)

1. **Migrasi Penuh ke Supabase Murni (`@supabase/supabase-js`) TANPA PRISMA & Deploy Vercel:**
   - Hapus seluruh ketergantungan pada Prisma (`schema.prisma`, `@prisma/client`, SQLite lokal).
   - Gunakan `@supabase/supabase-js` secara langsung (Direct Client/Server SDK) dengan skema SQL PostgreSQL murni yang dieksekusi di **Supabase SQL Editor**.
   - Semua akun admin (`admin1`, `admin2`, `admin3`) memiliki **Hak Akses Sama Rata (Equal Co-Owners)** tanpa hierarki admin utama vs admin biasa.
2. **Perubahan Modul Inventaris Aset (`/assets`):**
   - **Kategori Aset Manual:** Ubah input `Kategori` dari dropdown menjadi **input teks bebas (`<input type="text">`)** dengan saran opsional (`datalist`), karena Kanal Tiga bisa menyewakan barang apa saja di luar HT.
   - **Hapus Kondisi Barang:** Hapus kolom dan input `condition_status` / "Kondisi Barang" secara menyeluruh (baik di database, form tambah/edit, validasi stok, maupun tabel aset), karena seluruh aset yang tercatat diasumsikan selalu dalam kondisi baik dan siap pakai.
   - **Aksi Edit & Hapus Aset + Audit Log:** Tambahkan kolom **Aksi** pada tabel inventaris aset berisi tombol **Edit** dan **Hapus** (dengan modal konfirmasi). Setiap perubahan harga modal, jumlah unit, atau nama aset wajib langsung mencatat data *Before vs After* ke tabel `audit_logs` beserta nama admin yang mengedit.
3. **Perubahan Modul CRM & Calon Pelanggan (`/crm`):**
   - **Kontak WhatsApp & Instagram Opsional:** Ubah input kontak PIC sehingga **Nomor WhatsApp** dan **Username Instagram** keduanya bersifat **opsional** (minimal salah satu atau keduanya boleh diisi).
   - **Tambahkan Field Gender PIC:** Tambahkan pilihan **Gender PIC** (`Laki-laki`, `Perempuan`, `Belum Diketahui`) untuk analisis tingkat respons calon pelanggan.
   - **Format Baru Kolom "Kontak PIC" di Tabel:** Gabungkan informasi ke dalam satu kolom **"Kontak PIC"** yang rapi berisi: **Nama PIC + Badge Gender + Jabatan + Link WhatsApp (jika ada) + Link Instagram (jika ada)**.
   - **Perbaikan Filter CRM (Anti-Redundan & Lengkap):** Bersihkan filter yang tumpang tindih. Pastikan filter Pipeline mencakup seluruh status termasuk **`LOST` (Batal / Tidak Jadi)**, ditambah filter Gender PIC, Kategori Organisasi, Ketersediaan Channel Kontak (WA/IG), dan Bulan Event.
   - **Kolom Aksi Berbasis Ikon (3 Tombol Ikon Saja) & Aturan Konversi Ketat:**
     - Gunakan **hanya ikon (`lucide-react`) dengan tooltip** tanpa teks panjang agar tabel ringkas:
       1. **Ikon Konversi ke Order (`ArrowRightLeft` / `FileCheck2`)**: **HANYA MUNCUL / AKTIF JIKA status pipeline prospek sudah `WON` (Deal)**. Jika status belum `WON`, tombol ini disembunyikan atau di-disable dengan tooltip jelas.
       2. **Ikon Edit (`Pencil`)**: Membuka modal edit prospek (dan mencatat perubahan ke Audit Log).
       3. **Ikon Hapus (`Trash2`)**: Membuka dialog konfirmasi hapus prospek (dan mencatat penghapusan ke Audit Log).
4. **Menu Baru: Grafik Real-Time Interaktif & Ekspor Data (CSV untuk AI + Excel Profesional untuk Manusia):**
   - Tambahkan sub-menu **Grafik Keuangan & Aset (`/analytics/finance`)** di bawah grup menu **KEUANGAN & ASET**.
   - Tambahkan sub-menu **Grafik Pelanggan & Event (`/analytics/crm`)** di bawah grup menu **PELANGGAN & EVENT**.
   - Di masing-masing halaman grafik tersebut, sediakan **2 Tombol Download Utama**:
     1. **`Download CSV (Siap Analisis AI)`**: Menghasilkan file `.csv` terstruktur yang bersih, kaya konteks, dan siap di-upload ke AI untuk analisis pengambilan keputusan.
     2. **`Download Excel (.xlsx) Rapi`**: Menghasilkan file spreadsheet `.xlsx` multi-sheet yang diformat rapi dan profesional untuk dibaca manusia/pemilik.

---

## MASTER PROMPT REVISI (Copy-Paste ke Antigravity)

```markdown
Kamu adalah Senior Full-Stack Engineer. Kita akan melakukan **Revisi Besar v2.0** pada aplikasi **`inner-kt`** agar siap di-deploy ke **Vercel** dengan database **Supabase Murni (TANPA PRISMA)**.

### ATURAN WAJIB REVISI v2.0:
1. **HAPUS PRISMA SEPENUHNYA**: Jangan gunakan Prisma ORM atau SQLite lagi. Gunakan `@supabase/supabase-js` secara langsung seperti pola standar Supabase. Sediakan file SQL lengkap (`supabase/schema-and-seed.sql`) yang bisa langsung aku copy-paste ke Supabase SQL Editor.
2. **PANDU AKU (USER) DENGAN JELAS**: Setiap kali ada langkah konfigurasi yang harus aku lakukan sendiri di browser (seperti membuat project Supabase, menjalankan SQL di SQL Editor, mengambil `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`, atau menghubungkan ke Vercel), tampilkan kotak instruksi langkah demi langkah yang jelas untukku.
3. **HAK AKSES SAMA RATA (EQUAL CO-OWNERS)**: Ketiga akun (`admin1@kanaltiga.internal`, `admin2@kanaltiga.internal`, `admin3@kanaltiga.internal`) memiliki hak akses yang 100% setara. Tidak ada super-admin atau pembatasan fitur antar pemilik, namun **setiap aksi tambah, edit, dan hapus WAJIB tercatat otomatis di `audit_logs`** beserta identitas admin yang melakukannya.
4. **PERUBAHAN MODUL ASET (`/assets`)**:
   - Input "Kategori" harus berupa input teks manual (bukan dropdown kaku), karena kita bisa menyewakan barang selain HT.
   - HAPUS kolom dan input "Kondisi Barang" dari form, tabel, dan database.
   - Tambahkan kolom "Aksi" di tabel aset berisi tombol ikon **Edit** dan **Hapus** (dengan konfirmasi) yang otomatis mencatat perubahan ke Riwayat Audit.
5. **PERUBAHAN MODUL CRM (`/crm`)**:
   - Kontak WhatsApp dan Username Instagram sama-sama opsional.
   - Tambahkan input dan data **Gender PIC** (`Laki-laki` / `Perempuan` / `Belum Diketahui`).
   - Ubah kolom tabel menjadi **"Kontak PIC"** yang menampilkan Nama, Gender, Jabatan, tombol/link WhatsApp (jika ada), dan link Instagram (jika ada).
   - Perbaiki barisan Filter agar bersih, tidak redundan, dan WAJIB menyertakan filter status **`LOST` (Batal)**, filter Gender, serta filter Kategori Organisasi.
   - Kolom Aksi di tabel CRM HANYA menggunakan tombol ikon (`lucide-react` + tooltip):
     1. Ikon **Konversi ke Order**: HANYA muncul/bisa diklik jika status prospek sudah **`WON` (Deal)**.
     2. Ikon **Edit Prospek**.
     3. Ikon **Hapus Prospek** (dengan modal konfirmasi).
6. **2 MENU GRAFIK BARU + EKSPOR CSV (AI) & EXCEL (.XLSX)**:
   - Buat halaman **Grafik Keuangan & Aset (`/analytics/finance`)** di grup menu Keuangan & Aset.
   - Buat halaman **Grafik Pelanggan & Event (`/analytics/crm`)** di grup menu Pelanggan & Event.
   - Gunakan grafik interaktif real-time (`recharts`) dengan desain bersih anti-slop.
   - Di masing-masing halaman grafik, buat 2 tombol ekspor yang benar-benar berfungsi:
     - **Download CSV (Untuk AI)**
     - **Download Excel / Spreadsheet (.xlsx) Rapi (Untuk Manusia)**

Ikuti dokumen `01` hingga `05` secara berurutan. Mari mulai dari **Tahap 1** pada `05-roadmap-revisi-dan-instruksi-user.md`.
```
