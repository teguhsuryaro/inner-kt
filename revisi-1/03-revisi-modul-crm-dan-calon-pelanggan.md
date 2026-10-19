# 03 — Spesifikasi Revisi Modul CRM & Calon Pelanggan (`/crm`)

Dokumen ini merinci perombakan pada halaman **CRM & Calon Customer (`/crm`)** agar sesuai dengan alur pendekatan pelanggan Kanal Tiga di dunia nyata (WhatsApp + Instagram, data Gender PIC, filter yang bersih termasuk status Batal, tombol aksi berbasis ikon, dan penguncian Konversi Order khusus status Deal).

---

## 1. Penambahan Kontak Instagram (Opsional), WhatsApp (Opsional) & Gender PIC

### A. Perubahan pada Form Tambah & Edit Prospek (`/crm`)
1. **Nama PIC (`pic_name`)**: Wajib diisi.
2. **Gender PIC (`pic_gender`)**: Wajib dipilih (Radio button / Select bersih):
   - `LAKI_LAKI` ("Laki-laki")
   - `PEREMPUAN` ("Perempuan")
   - `TIDAK_DIKETAHUI` ("Belum Diketahui")
   *(Digunakan untuk analitik di menu Grafik Pelanggan & Event: mengevaluasi profil PIC mana yang lebih responsif atau memiliki rasio Deal lebih tinggi).*
3. **Jabatan PIC (`pic_role`)**: Opsional (contoh: *Koor Perkap*, *Humas*, *Ketua Panitia*).
4. **Nomor WhatsApp (`pic_phone`)**: **OPSIONAL** (contoh: `081234567890`).
5. **Username Instagram (`pic_instagram`)**: **OPSIONAL** (contoh: `@rakapratama` atau `rakapratama`).
   - *Validasi Cerdas:* Pengguna boleh mengisi WhatsApp saja, Instagram saja, keduanya, atau mengosongkan sementara jika baru mencatat nama event.

---

## 2. Tampilan Baru Kolom "Kontak PIC" di Tabel CRM

Ubah judul kolom dari `"Kontak PIC (WhatsApp)"` menjadi **`"Kontak PIC"`**. Di dalam sel tabel tersebut, tampilkan secara terstruktur dan padat:

- **Baris 1:** **Nama PIC** (tebal) + **Badge Gender Ringkas** (`L` dengan warna biru lembut `bg-blue-50 text-blue-700` untuk Laki-laki, `P` dengan warna rose lembut `bg-rose-50 text-rose-700` untuk Perempuan)
- **Baris 2:** Jabatan PIC (`text-xs text-slate-500`, misal: *Koordinator Perkap*)
- **Baris 3 (Chip Kontak Interaktif):**
  - Jika `pic_phone` ada: tampilkan chip hijau kecil dengan ikon telepon/WA `0812-3456-7890` yang jika diklik langsung membuka `https://wa.me/6281234567890`.
  - Jika `pic_instagram` ada: tampilkan chip ungu/pink tipis atau slate dengan ikon Instagram `@username` yang jika diklik langsung membuka `https://instagram.com/username` di tab baru.
  - Jika keduanya ada: tampilkan kedua chip berdampingan dengan rapi.

---

## 3. Perbaikan Sistem Filter CRM (Bersih, Tidak Redundan & Mencakup Status "Batal")

Hapus filter-filter lama yang duplikat/membingungkan, dan ganti dengan **1 Baris Control & Filter Bar yang Terstruktur Rapi**:

1. **Pencarian Cepat (`Search Input`):** Mencari sekaligus berdasarkan Nama Organisasi, Nama Event, Nama PIC, Nomor WA, Username IG, atau Kode Voucher.
2. **Tab / Pill Filter Status Pipeline (Lengkap 7 Pilihan + Counter Jumlah):**
   - `Semua (N)`
   - `Target Baru / IDENTIFIED (N)`
   - `Dihubungi / CONTACTED (N)`
   - `Penawaran / PROPOSAL_SENT (N)`
   - `Negosiasi / NEGOTIATION (N)`
   - `Deal / WON (N)` *(Warna Emerald)*
   - **`Batal / LOST (N)` *(Warna Merah/Rose — Wajib ada!)***
3. **Dropdown Filter Kategori Organisasi:** `Semua Kategori`, `BEM / Hima / UKM`, `Sekolah / OSIS`, `EO Umum`, `Instansi`, `Komunitas`.
4. **Dropdown Filter Gender PIC:** `Semua Gender`, `Laki-laki`, `Perempuan`, `Belum Diketahui`.
5. **Dropdown Filter Channel Kontak:** `Semua Channel`, `Ada WhatsApp`, `Ada Instagram`, `Lengkap (WA & IG)`.
6. **Tombol `Reset Filter`** (muncul hanya jika ada filter aktif).

---

## 4. Kolom Aksi Berbasis Ikon (Tanpa Teks Panjang) & Aturan Konversi "Deal Only"

Agar kolom paling kanan (**Aksi**) pada tabel CRM tetap ramping dan tidak memakan ruang horizontal, gunakan **3 tombol ikon berukuran `32px x 32px` (`h-8 w-8`)** dengan `title` / tooltip yang jelas:

### 1. Tombol Ikon "Konversi ke Order Sewa" (`ArrowRightLeft` atau `ShoppingBag`)
- **ATURAN KERAS (STRICT RULE):**
  - Tombol ini **HANYA MUNCUL (atau hanya aktif)** apabila `lead.pipeline_status === 'WON'` (**Deal**) dan prospek tersebut belum memiliki `converted_order` aktif.
  - Jika status prospek masih `IDENTIFIED`, `CONTACTED`, `PROPOSAL_SENT`, `NEGOTIATION`, atau `LOST`, **jangan izinkan konversi ke order**! (Sembunyikan tombol konversi atau tampilkan dalam keadaan terkunci/disabled dengan tooltip: *"Ubah status pipeline menjadi Deal (WON) terlebih dahulu untuk membuat Order"*).
  - Jika prospek `WON` sudah dikonversi menjadi order, tampilkan ikon/badge link menuju nomor order (`ORD-...`).

### 2. Tombol Ikon "Edit Prospek" (`Pencil`)
- Berfungsi untuk mengedit seluruh data prospek (termasuk mengubah status pipeline menjadi `WON` atau `LOST`, menambahkan nomor WA/IG, mengubah gender, atau mengedit estimasi unit).
- Setiap perubahan pada prospek otomatis dicatat ke `audit_logs`.

### 3. Tombol Ikon "Hapus Prospek" (`Trash2`)
- Berwarna netral (`text-slate-400 hover:text-red-600 hover:bg-red-50`).
- Saat diklik, **wajib membuka Modal Konfirmasi Hapus**:
  - *"Apakah Anda yakin ingin menghapus data prospek **[Nama Event - Nama Organisasi]**? Tindakan ini akan dicatat di Riwayat Audit."*
- Jika dikonfirmasi, hapus data dari tabel `crm_leads` dan simpan catatan penghapusan ke `audit_logs`.
