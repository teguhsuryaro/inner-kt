# 02 — Spesifikasi Revisi Modul Inventaris Aset & Modal Pemilik (`/assets`)

Dokumen ini merinci seluruh perubahan yang diminta pada halaman **Inventaris Aset & Modal Pemilik (`/assets`)** beserta integrasinya dengan **Riwayat Audit (`/audit-log`)**.

---

## 1. Kategori Aset Diisi Manual oleh User (Bukan Dropdown Kaku)

### Alasan Bisnis:
Kanal Tiga kemungkinan besar akan berekspansi menyewakan peralatan event lain di luar HT (seperti *Megaphone Toa*, *Sound Portable*, *Tenda*, *Kabel Roll*, *Lampu Sorot*, *Clip-on Wireless*, dll).

### Implementasi UI & Kode:
- Pada Modal **Tambah Aset Baru** dan **Edit Aset**:
  - Ganti komponen `<select>` (dropdown) pada field **Kategori Barang** menjadi `<input type="text">` manual.
  - Sertakan `<datalist id="asset-category-suggestions">` yang otomatis mengambil daftar kategori unik yang sudah pernah diketik sebelumnya di database (ditambah saran awal seperti `Handy Talky (HT)`, `Aksesoris Audio`, `Perangkat Daya`, `Perlengkapan Event`) agar admin tetap cepat mengetik namun bebas menentukan kategori baru apa pun.
  - Contoh placeholder: `"Ketik kategori bebas (contoh: Handy Talky, Audio, Penerangan...)"`.

---

## 2. Penghapusan Total Kolom & Input "Kondisi Barang"

### Alasan Bisnis:
Seluruh barang yang masuk dan tercatat di inventaris aktif Kanal Tiga wajib selalu dipastikan dalam keadaan baik dan siap disewakan. Kolom "Kondisi Barang" (`BAIK`, `PERLU_SERVIS`, `RUSAK`) membuat tabel dan form penuh tanpa nilai tambah.

### Implementasi UI & Kode:
1. **Form Tambah & Edit Aset:** Hapus field pilihan "Kondisi Barang".
2. **Tabel Inventaris Aset:** Hapus kolom "Kondisi" dari header (`<th>`) dan baris tabel (`<td>`).
3. **Validasi Order (`/orders/new`):** Saat menghitung stok tersedia milik seorang pemilik pada pembuatan order, gunakan langsung `asset.quantity` milik pemilik tersebut tanpa memfilter `condition_status`.

---

## 3. Penambahan Kolom "Aksi" (Edit & Hapus) dengan Audit Log Otomatis

### Alasan Bisnis:
Jika admin salah memasukkan harga modal per unit, jumlah unit, kategori, atau pemilik saat menginput aset, data tersebut harus bisa diperbaiki tanpa harus merombak database. Karena ketiga admin memiliki hak akses setara, keamanan dijaga melalui **pencatatan otomatis di Riwayat Audit (`audit_logs`)** setiap kali ada aset yang diedit atau dihapus.

### Struktur Tabel Inventaris Aset Baru (`/assets`):

| Nama Barang / Aset | Kategori (Manual) | Pemilik | Jumlah Unit | Modal / Unit | Total Nilai Modal | Jenis Modal | Tanggal Catat | Aksi |
|---|---|---|---:|---:|---:|---|---|---|
| HT Baofeng BF-888S | Handy Talky (HT) | Badge: **Surya** | `10 unit` | `Rp100.000` | `Rp1.000.000` | Modal Awal | 10 Jan 2026 | `[Ikon Edit]` `[Ikon Hapus]` |

### Spesifikasi Fitur Edit Aset:
1. Saat tombol ikon **Edit (`Pencil`)** diklik, buka Modal **Edit Data Aset** yang sudah terisi nilai saat ini:
   - Nama Barang (`name`)
   - Kategori Manual (`category`)
   - Pemilik Aset (`owner_id`)
   - Jumlah Unit (`quantity`)
   - Nilai Modal per Unit (`capital_per_unit`) -> otomatis menghitung ulang `total_capital = quantity * capital_per_unit`
   - Jenis Modal (`Modal Awal` vs `Modal Tambahan`)
   - Tanggal Pembelian/Pencatatan (`purchase_date`)
   - Catatan Tambahan (`notes`)
   - **Input Opsional/Wajib Alasan Edit:** `"Catatan Perubahan (Tercatat di Audit Log)"`
2. Saat disimpan:
   - Update baris di tabel `assets` Supabase.
   - Hitung selisih perubahan (misal: harga modal berubah dari `Rp100.000` ke `Rp110.000`, atau unit dari `10` ke `12`).
   - **Wajib tulis ke tabel `audit_logs`**:
     - `entity_type`: `'ASSET'`
     - `action`: `'UPDATE'`
     - `summary`: Contoh: `"Surya (admin1) mengedit aset 'HT Baofeng BF-888S' (Milik: Surya): Jumlah 10 -> 12 unit, Total Modal Rp1.000.000 -> Rp1.200.000"`
     - `before_json`: objek data aset sebelum diedit.
     - `after_json`: objek data aset setelah diedit.
   - Seluruh angka di Dashboard (Total Modal Pemilik, Sisa Balik Modal, dan Profit) langsung terhitung ulang secara *real-time* mengikuti data aset terbaru.

### Spesifikasi Fitur Hapus Aset:
1. Saat tombol ikon **Hapus (`Trash2`)** diklik, tampilkan modal konfirmasi:
   - Jika aset tersebut **sudah pernah digunakan dalam Order Penyewaan**, tampilkan peringatan bahwa aset tidak bisa dihapus sembarangan karena terhubung dengan riwayat bagi hasil order (atau arahkan untuk mengedit jumlah unitnya).
   - Jika aset belum pernah dipakai di order mana pun (misalnya salah input baru), admin dapat mengonfirmasi penghapusan, dan sistem langsung mencatat aksi `'DELETE'` beserta detail aset yang dihapus ke `audit_logs`.
