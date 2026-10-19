# 04 — Spesifikasi Menu Grafik Real-Time Interaktif & Ekspor Data (CSV AI + Excel Manusia)

Dokumen ini merancang dua menu analitik visual baru beserta sistem ekspor ganda (**CSV untuk AI** dan **Excel `.xlsx` rapi untuk manusia**) sesuai permintaan Surya.

---

## 1. Struktur Navigasi Sidebar Baru

Perbarui Sidebar kiri (`src/app/(internal)/layout.tsx`) menjadi seperti berikut:

- **Grup KEUANGAN & ASET**
  1. `Dashboard & Ringkasan` (`/dashboard`)
  2. `Order Penyewaan` (`/orders`)
  3. `Inventaris Aset & Modal` (`/assets`)
  4. `Pengeluaran Bisnis` (`/expenses`)
  5. **`Grafik Keuangan & Aset` (`/analytics/finance`)** *(MENU BARU)*
- **Grup PELANGGAN & EVENT**
  6. `CRM & Calon Customer` (`/crm`)
  7. **`Grafik Pelanggan & Event` (`/analytics/crm`)** *(MENU BARU)*
- **Grup SISTEM**
  8. `Data Pemilik` (`/owners`)
  9. `Riwayat Audit` (`/audit-log`)

---

## 2. Spesifikasi Menu 1: Grafik Keuangan & Aset (`/analytics/finance`)

Halaman ini mengambil data langsung secara *real-time* dari Supabase dan memperbarui grafik seketika saat filter periode waktu atau filter pemilik diubah. Gunakan library `recharts` dengan palet warna bersih sesuai identitas `inner-kt`.

### Daftar Grafik Interaktif yang Wajib Ditampilkan:
1. **Grafik 1 — Tren Arus Kas Bulanan (Bar & Line Composed Chart):**
   - Sumbu X: Bulan/Periode.
   - Bar Hijau Emerald: Pendapatan Bersih Order (`net_order_revenue`).
   - Bar Amber: Pengeluaran Operasional (`expenses`).
   - Garis Biru/Indigo: Net Cashflow Bulanan.
2. **Grafik 2 — Perbandingan Modal, Pendapatan Bersih & Progres Balik Modal 3 Pemilik (Grouped Bar Chart):**
   - Membandingkan **Surya**, **Pemilik B**, dan **Pemilik C** secara berdampingan pada 4 metrik:
     - `Total Modal Aset`
     - `Akumulasi Pendapatan Bersih (Modal Kembali)`
     - `Sisa Modal Belum Kembali`
     - `Total Beban Pengeluaran`
3. **Grafik 3 — Proporsi Kepemilikan Unit & Utilisasi Unit di Order (Donut / Pie Chart Ganda):**
   - Donut Kiri: Persentase kepemilikan stok aset per pemilik (dan per kategori aset manual).
   - Donut Kanan: Persentase unit yang paling sering disewa dalam order (`total_units_used` per pemilik).
4. **Grafik 4 — Komposisi Pengeluaran Bisnis per Kategori (Horizontal Bar Chart):**
   - Menampilkan perbandingan pengeluaran `TRANSPORTASI`, `STIKER_BRANDING`, `PERLENGKAPAN`, `PERAWATAN`, dll., serta porsi **Pengeluaran Bersama vs Perorangan**.

---

## 3. Spesifikasi Menu 2: Grafik Pelanggan & Event (`/analytics/crm`)

Halaman ini membantu pemilik membaca pola calon pelanggan, efektivitas kontak WA vs IG, serta performa konversi event.

### Daftar Grafik Interaktif yang Wajib Ditampilkan:
1. **Grafik 1 — Corong Pipeline Penawaran Jasa (Funnel / Horizontal Stage Chart):**
   - Menampilkan jumlah prospek dan total potensi nilai sewa (`Rp`) di setiap tahap:
     `Target Baru (IDENTIFIED)` -> `Dihubungi (CONTACTED)` -> `Penawaran (PROPOSAL_SENT)` -> `Negosiasi (NEGOTIATION)` -> `Deal (WON)` vs `Batal (LOST)`.
2. **Grafik 2 — Analisis Gender PIC & Tingkat Konversi Deal (Stacked Bar & Donut Chart):**
   - Menampilkan jumlah PIC berdasarkan Gender (`Laki-laki`, `Perempuan`, `Belum Diketahui`) beserta perbandingan rasio **Deal (`WON`) vs Batal (`LOST`) vs Sedang Berjalan** per gender.
   - *(Sangat berguna untuk menjawab pertanyaan: apakah PIC laki-laki atau perempuan lebih banyak dan mana yang lebih cepat deal).*
3. **Grafik 3 — Distribusi Channel Komunikasi PIC (WhatsApp vs Instagram vs Keduanya):**
   - Menampilkan berapa prospek yang dihubungi lewat WhatsApp saja, Instagram saja, atau memiliki kedua kontak tersebut, beserta tingkat konversinya.
4. **Grafik 4 — Kategori Organisasi Penyewa Terbanyak & Tren Kebutuhan Unit per Bulan Event:**
   - Bar Chart jumlah prospek & nilai sewa berdasarkan jenis organisasi (`BEM/Hima/UKM`, `Sekolah`, `EO`, `Instansi`, `Komunitas`).
   - Line/Bar Chart perkiraan total unit yang dibutuhkan per bulan event (untuk mengantisipasi bulan ramai event kampus).

---

## 4. Spesifikasi 2 Tombol Download di Masing-Masing Halaman Grafik

Di bagian kanan atas halaman **`/analytics/finance`** maupun **`/analytics/crm`**, tampilkan 2 tombol ekspor yang jelas:

1. **Tombol 1: `Download CSV (Untuk Analisis AI)`** (Ikon: `Bot` / `FileSpreadsheet`)
2. **Tombol 2: `Download Excel / Spreadsheet (.xlsx)`** (Ikon: `Download` / `Table`)

### A. Aturan Desain File CSV (Dioptimalkan agar Mudah Dibaca AI / LLM)
Ketika pengguna mengklik **`Download CSV (Untuk Analisis AI)`**:
- Jangan hanya mengekspor ID mentah (seperti UUID `11111111-...`). **Semua relasi harus sudah di-denormalisasi (di-join) menjadi teks yang jelas** sehingga ketika file CSV tersebut diunggah ke ChatGPT / Gemini / Claude, AI langsung memahami seluruh konteks bisnis tanpa bingung!
- **Pada `/analytics/finance` (`inner-kt-keuangan-ai-ready-YYYY-MM-DD.csv`):**
  - Sertakan blok header ringkasan metrik bisnis & per pemilik (Surya, Pemilik B, Pemilik C), diikuti baris-baris gabungan seluruh transaksi (Aset, Order Final beserta pembagian kotor/transport/bersih ke 3 pemilik, dan Pengeluaran beserta alokasinya).
- **Pada `/analytics/crm` (`inner-kt-crm-pelanggan-ai-ready-YYYY-MM-DD.csv`):**
  - Kolom CSV: `ID_Prospek, Tanggal_Input, Nama_Organisasi, Kategori_Organisasi, Nama_Event, Tanggal_Event, Estimasi_Hari, Estimasi_Unit, Estimasi_Budget_Rp, Nama_PIC, Gender_PIC, Jabatan_PIC, Kontak_WhatsApp, Kontak_Instagram, Channel_Kontak_Tersedia, Status_Pipeline, Alasan_Batal, Kode_Voucher, Sudah_Konversi_Order, Nomor_Order_Terkait, Pendapatan_Aktual_Order_Rp, Catatan`.

### B. Aturan Desain File Excel `.xlsx` (Dioptimalkan untuk Manusia / Pemilik)
Gunakan library `xlsx` (SheetJS) dengan pengaturan lebar kolom otomatis (`!cols` auto-width), header yang jelas, format angka rapi, dan **struktur Multi-Sheet** agar sangat nyaman dibaca di Microsoft Excel atau Google Sheets:

- **Jika diunduh dari `/analytics/finance` (`Laporan-Keuangan-KanalTiga-YYYY-MM-DD.xlsx`):**
  - **Sheet 1: `Ringkasan Eksekutif & Pemilik`** — Tabel perbandingan lengkap Surya, Pemilik B, Pemilik C, dan Total Bisnis (Modal Awal, Modal Tambahan, Pendapatan Kotor, Potongan Transportasi, Pendapatan Bersih, Modal Kembali, Sisa Balik Modal, % Balik Modal, Pengeluaran Bersama, Pengeluaran Pribadi, dan Profit).
  - **Sheet 2: `Daftar Inventaris Aset`** — Tabel seluruh aset beserta kategori manual, pemilik, jumlah unit, harga modal/unit, dan total modal.
  - **Sheet 3: `Riwayat Order & Bagi Hasil`** — Tabel seluruh order lengkap dengan kolom bagian kotor, potongan transport, dan hasil bersih untuk Surya, Pemilik B, dan Pemilik C.
  - **Sheet 4: `Rincian Pengeluaran`** — Tabel pengeluaran bersama dan perorangan beserta siapa yang menanggung.

- **Jika diunduh dari `/analytics/crm` (`Laporan-CRM-Pelanggan-KanalTiga-YYYY-MM-DD.xlsx`):**
  - **Sheet 1: `Ringkasan Pipeline & Demografi`** — Rekap jumlah prospek per tahap pipeline, rasio konversi berdasarkan Gender PIC (`Laki-laki` vs `Perempuan`), rekap efektivitas channel (`WhatsApp` vs `Instagram`), dan rekap kategori organisasi.
  - **Sheet 2: `Database Lengkap Calon Customer`** — Tabel seluruh prospek dengan kolom rapi dan lebar kolom yang sudah disesuaikan otomatis agar tidak ada teks yang terpotong.
  - **Sheet 3: `Prospek Deal (WON) vs Batal (LOST)`** — Evaluasi khusus prospek yang berhasil menjadi order dan alasan prospek yang batal.
