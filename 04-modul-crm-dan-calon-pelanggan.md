# 04 — Spesifikasi Modul CRM: Organisasi, Event & Calon Pelanggan (`inner-kt`)

Sesuai tujuan proyek `inner-kt` (kebutuhan ke-2: *Pencatatan organisasi, event, calon pelanggan, serta status penawaran jasa*) dan keterkaitannya dengan website utama Kanal Tiga (distribusi voucher & wajah publik), dokumen ini merancang modul CRM yang langsung terhubung dengan Modul Order Keuangan.

---

## 1. Tujuan Modul CRM di `inner-kt`

Bisnis penyewaan HT dan peralatan event seperti **Kanal Tiga** sangat bergantung pada siklus acara kampus (UKM, BEM, Himpunan, Kepanitiaan Dies Natalis, Konser, Seminar) dan EO/Instansi. Modul ini memastikan ketiga pemilik/admin dapat:

1. Mencatat daftar organisasi, kepanitiaan event, dan kontak PIC (WhatsApp) yang sedang didekati atau pernah menyewa.
2. Melacak progres penawaran jasa dan penggunaan voucher dari website utama Kanal Tiga.
3. Mengetahui jadwal event yang akan datang agar tidak kehabisan stok HT.
4. **Mengonversi prospek yang "Deal (WON)" menjadi Order Penyewaan hanya dengan 1 klik** tanpa perlu mengetik ulang nama organisasi, nama event, tanggal, dan durasi sewa.

---

## 2. Struktur Data & Field Calon Pelanggan (`CrmLead`)

Setiap entri calon pelanggan/event mencatat:

- **Identitas Organisasi & Event:**
  - `organizationName`: Nama Organisasi/Instansi (contoh: *BEM KM Unsoed*, *Hima Teknik Informatika*, *SMAN 1 Purwokerto*).
  - `organizationType`: Kategori (`BEM_HIMA_UKM`, `SEKOLAH`, `EO_UMUM`, `INSTANSI`, `KOMUNITAS`).
  - `eventName`: Nama Acara (contoh: *Soedirman Student Summit 2026*, *Malam Keakraban Teknik*).
  - `eventDate`: Tanggal Pelaksanaan Event.
  - `estimatedDuration`: Estimasi durasi sewa (hari).
- **Estimasi Kebutuhan & Voucher:**
  - `estimatedUnits`: Perkiraan jumlah unit HT/alat yang dibutuhkan.
  - `estimatedBudget`: Estimasi nilai sewa (Rupiah).
  - `voucherCodeOffered`: Kode voucher dari website utama Kanal Tiga (jika calon customer mengklaim voucher).
- **Kontak Panitia (PIC):**
  - `picName`: Nama penanggung jawab (contoh: *Raka - Koor Perkap*).
  - `picPhone`: Nomor WhatsApp aktif (dilengkapi tombol klik langsung `wa.me/62...`).
  - `picRole`: Jabatan di kepanitiaan.
- **Status Pipeline Penawaran (`pipelineStatus`):**
  1. `IDENTIFIED` — **Target Event Baru** (Baru didata dari info kampus/sosmed, belum dihubungi).
  2. `CONTACTED` — **Sudah Dihubungi** (Sudah chat WA / kirim perkenalan Kanal Tiga).
  3. `PROPOSAL_SENT` — **Penawaran / Voucher Dikirim** (Pricelist atau voucher sudah diberikan ke panitia).
  4. `NEGOTIATION` — **Negosiasi Jumlah & Harga** (Sedang fiksasi jumlah unit atau tanggal).
  5. `WON` — **Deal / Masuk Order** (Sepakat menyewa; terhubung ke nomor Order di sistem keuangan).
  6. `LOST` — **Batal / Tidak Jadi** (Pakai vendor lain atau acara batal, disertai catatan alasan).
- **Tindak Lanjut:**
  - `nextFollowUpDate`: Tanggal pengingat untuk menghubungi panitia kembali.
  - `notes`: Catatan riwayat komunikasi.

---

## 3. Fitur Utama Antarmuka CRM (`/crm`)

### A. Tampilan Ganda: Tabel Operasional & Papan Pipeline (Kanban Ringkas)
Admin dapat beralih antara:
1. **Tabel Daftar Prospek & Customer** (dilengkapi filter Status Pipeline, Kategori Organisasi, Bulan Event, dan pencarian nama event/PIC).
2. **Ringkasan Pipeline** di bagian atas halaman yang menampilkan jumlah prospek dan total potensi pendapatan (`sum(estimatedBudget)`) di setiap tahap (`Target Baru` -> `Dihubungi` -> `Penawaran` -> `Negosiasi` -> `Deal`).

### B. Alur Integrasi "Konversi ke Order Sewa" (CRM -> Keuangan)
Ketika sebuah prospek mencapai tahap sepakat menyewa (`NEGOTIATION` atau `WON`):
1. Admin mengklik tombol **"Buat Order Sewa dari Prospek Ini"** pada baris prospek tersebut.
2. Sistem membuka halaman/modal **Buat Order Baru (`/orders/new?fromLeadId=...`)** dengan data yang sudah terisi otomatis:
   - Nama Organisasi/Penyewa = `lead.organizationName`
   - Nama Event = `lead.eventName`
   - Tanggal Mulai Sewa = `lead.eventDate`
   - Durasi Sewa = `lead.estimatedDuration`
   - Catatan Order = Menyertakan kode voucher `lead.voucherCodeOffered` (jika ada) dan nama PIC.
3. Admin tinggal memilih **jumlah unit aset milik Surya, Pemilik B, dan Pemilik C** yang digunakan serta memasukkan **biaya transportasi**.
4. Saat order disimpan, status prospek di CRM otomatis berubah menjadi **`WON` (Deal)** dan menampilkan badge link menuju nomor order (`ORD-202610-...`).

### C. Riwayat Langganan Organisasi (Repeat Order Indicator)
Jika nama organisasi yang sama pernah menyewa sebelumnya, tampilkan indikator berapa kali organisasi tersebut sudah pernah menyewa di Kanal Tiga beserta total historis transaksinya.
