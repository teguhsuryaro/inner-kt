# 01 — Arsitektur Sistem, Struktur Direktori & Autentikasi (`inner-kt`)

**Nama Proyek:** `inner-kt`  
**Jenis Aplikasi:** Internal Financial, Asset, Order & CRM Management Web App  
**Target AI:** Gemini 3.8 Flash (Antigravity)

---

## 1. Tech Stack yang Direkomendasikan

Agar pengembangan di Antigravity cepat, *type-safe*, mudah di-*preview*, dan memiliki *persistence* data yang solid tanpa konfigurasi infrastruktur luar yang rumit, gunakan stack berikut:

- **Framework:** Next.js 14+ (App Router) dengan TypeScript — *atau Vite + React + TypeScript jika lingkungan Antigravity berjalan pada mode SPA/Node ringan*.
- **Database & ORM:** SQLite lokal (`better-sqlite3` + **Prisma ORM** atau **Drizzle ORM**) sehingga berjalan langsung dari 0 tanpa setup cloud eksternal, **ATAU** fallback State Store terpusat dengan LocalStorage/IndexedDB + JSON Export/Import jika dijalankan di *sandbox browser-only*. *(Instruksi kepada AI: Gunakan Prisma + SQLite jika terminal server tersedia; gunakan Zustand Persist + Initial Seed Data lengkap jika berjalan di mode client-first, dengan abstraksi repository layer yang sama).*
- **Styling:** Tailwind CSS + komponen primitif bersih (Radix UI / shadcn-style minimalis).
- **Icons:** `lucide-react` (ukuran konsisten `16px` / `18px`, `stroke-width: 1.75`).
- **Format Angka & Tanggal:** `Intl.NumberFormat('id-ID')` untuk Rupiah (`Rp`) dan `date-fns` (locale `id`) untuk tanggal.

---

## 2. Aturan Routing & Zero Landing Page

Karena `inner-kt` adalah sistem internal pemilik Kanal Tiga:
1. **Tidak ada halaman Landing Page publik.**
2. Mengakses `/` akan langsung memeriksa sesi autentikasi:
   - Belum login -> `redirect('/login')`
   - Sudah login -> `redirect('/dashboard')`
3. Semua route di bawah grup `(internal)` dilindungi oleh Auth Guard / Middleware.

### Daftar Route Aplikasi:
- `/login` — Halaman masuk khusus internal (Email & Password).
- `/dashboard` — Ringkasan Keuangan Bisnis & Perbandingan 3 Pemilik (Modal, Balik Modal, Pendapatan, Pengeluaran, Profit).
- `/assets` — Inventaris Aset/Barang (HT & alat lain), kepemilikan unit per pemilik, dan nilai modal.
- `/orders` — Pencatatan Order Penyewaan, kalkulator alokasi unit per pemilik, potongan transportasi, dan status order (`DRAFT`, `FINAL`, `CANCELLED`).
- `/expenses` — Pencatatan Pengeluaran Operasional (Bersama / Bagi Rata 3 Pemilik vs Perorangan).
- `/crm` — Pencatatan Organisasi, Event, Calon Pelanggan (Leads), Status Penawaran Jasa, & Konversi 1-Klik ke Order.
- `/audit-log` — Riwayat perubahan transaksi (jejak audit setiap kali order dibuat, difinalisasi, atau dibatalkan).
- `/owners` — Pengelolaan data Pemilik (Default: 3 Pemilik Aktif, disimpan secara dinamis di database).

---

## 3. Spesifikasi Autentikasi & 3 Akun Admin Bawaan

Sistem menggunakan login berbasis **Email dan Password**. Saat inisialisasi awal (*database seeding*), sistem wajib membuat 3 akun admin yang langsung terhubung dengan 3 entitas Pemilik Bisnis:

| Akun Admin | Email Login | Password Default | Nama Pemilik Terhubung | Role |
|---|---|---|---|---|
| **Admin 1** | `admin1@kanaltiga.internal` | `Admin1KanalTiga!` | **Surya** (Pemilik 1) | `OWNER_ADMIN` |
| **Admin 2** | `admin2@kanaltiga.internal` | `Admin2KanalTiga!` | **Pemilik B** (Pemilik 2) | `OWNER_ADMIN` |
| **Admin 3** | `admin3@kanaltiga.internal` | `Admin3KanalTiga!` | **Pemilik C** (Pemilik 3) | `OWNER_ADMIN` |

> **Fitur Kemudahan Internal:**
>- Nama tampilan pemilik (`Surya`, `Pemilik B`, `Pemilik C`) dapat diubah kapan saja melalui menu **Pengaturan Pemilik (`/owners`)** tanpa merusak relasi ID pemilik di transaksi lama.
> - Di halaman `/login`, selain form input Email dan Password standar, sediakan **3 tombol Quick-Fill Dev/Internal** (`Masuk sebagai Admin 1 (Surya)`, `Masuk sebagai Admin 2`, `Masuk sebagai Admin 3`) untuk mempercepat pengujian dan operasional harian.
> - Setiap aksi input/edit order, aset, pengeluaran, dan CRM otomatis mencatat `created_by_admin_id` dari akun admin yang sedang login ke dalam **Audit Log**.

---

## 4. Struktur Direktori Proyek

```text
inner-kt/
├── prisma/
│   ├── schema.prisma          # Skema database relasional lengkap
│   └── seed.ts                # Seeder untuk 3 Admin, 3 Pemilik, sampel Aset, Order, Pengeluaran, & CRM
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx   # Halaman Login sederhana & tegas (tanpa landing page)
│   │   ├── (internal)/
│   │   │   ├── layout.tsx     # Sidebar navigasi kiri + Topbar info admin aktif
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx   # Dashboard Keuangan Bisnis & Per Pemilik + Filter Periode
│   │   │   ├── assets/
│   │   │   │   └── page.tsx   # Manajemen Aset & Modal per Pemilik
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx   # Daftar Order & Status
│   │   │   │   └── new/
│   │   │   │       └── page.tsx # Form Order & Kalkulator Bagi Hasil Unit + Potong Transportasi
│   │   │   ├── expenses/
│   │   │   │   └── page.tsx   # Pencatatan Pengeluaran Bersama & Perorangan
│   │   │   ├── crm/
│   │   │   │   └── page.tsx   # Database Organisasi, Event, Prospek & Pipeline Penawaran
│   │   │   ├── owners/
│   │   │   │   └── page.tsx   # Konfigurasi Profil 3 Pemilik & Ringkasan Hak
│   │   │   └── audit-log/
│   │       │   └── page.tsx   # Jejak Audit Transaksi Keuangan
│   │   ├── api/               # Route Handlers / Server Actions
│   │   └── page.tsx           # Root redirector (/ -> /dashboard atau /login)
│   ├── components/
│   │   ├── ui/                # Komponen UI fungsional (Tabel, Modal, Badge, Input Rupiah)
│   │   ├── finance/           # Komponen Kartu Balik Modal, Tabel Alokasi Order, Breakdown Profit
│   │   └── crm/               # Komponen Pipeline Status Prospek & Modal Konversi ke Order
│   ├── lib/
│   │   ├── finance-engine.ts  # Murni fungsi kalkulasi keuangan, bagi hasil, balik modal, & profit
│   │   ├── validations.ts     # Validasi stok unit pemilik, keseimbangan alokasi, & anti-negatif
│   │   ├── formatters.ts      # Formatter Rupiah (tabular-nums) & tanggal Indonesia
│   │   └── auth.ts            # Session management & pengecekan 3 akun admin
│   └── types/
│       └── index.ts           # Kontrak TypeScript untuk seluruh entitas
```
