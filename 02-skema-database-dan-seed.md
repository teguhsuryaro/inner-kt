# 02 — Skema Database Relasional & Data Seeding (`inner-kt`)

Dokumen ini mendefinisikan struktur data lengkap untuk mendukung **Pencatatan Keuangan & Aset** (sesuai spesifikasi logika keuangan) serta **Pencatatan Organisasi, Event, dan Calon Pelanggan (CRM)**.

Prinsip utama database ini:
1. **Jumlah pemilik disimpan sebagai data** di tabel `Owner`, bukan di-*hardcode* di rumus.
2. **Snapshot Transaksi Historis:** Saat order difinalisasi atau pengeluaran disimpan, pembagian nominal ke masing-masing pemilik disimpan di tabel alokasi (`OrderOwnerAllocation` dan `ExpenseOwnerAllocation`) sehingga perubahan stok aset atau jumlah pemilik di masa depan tidak merusak laporan historis.
3. **Anti Double-Counting Transportasi:** Pengeluaran yang berasal dari transportasi order diberi flag `is_order_transport = true` dan `order_id` agar tercatat di rekap pengeluaran, tetapi tidak dikurangkan dua kali saat menghitung profit.

---

## 1. Skema Prisma (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./inner-kt.db"
}

// 1. TABEL PEMILIK BISNIS
model Owner {
  id          String   @id @default(cuid())
  code        String   @unique // Contoh: "OWNER_1", "OWNER_2", "OWNER_3"
  name        String   // Contoh: "Surya", "Pemilik B", "Pemilik C"
  isActive    Boolean  @default(true)
  joinedAt    DateTime @default(now())
  notes       String?

  adminUser          AdminUser?
  assets             Asset[]
  orderItemsUsed     OrderItemOwnerUsage[]
  orderAllocations   OrderOwnerAllocation[]
  expensesPaid       Expense[]              @relation("ExpensePaidBy")
  expenseAllocations ExpenseOwnerAllocation[]
}

// 2. TABEL AKUN LOGIN ADMIN (admin1, admin2, admin3)
model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique // "admin1", "admin2", "admin3"
  email        String   @unique // "admin1@kanaltiga.internal", dst.
  passwordHash String
  displayName  String
  ownerId      String?  @unique
  owner        Owner?   @relation(fields: [ownerId], references: [id])
  createdAt    DateTime @default(now())

  auditLogs    AuditLog[]
}

// 3. TABEL ASET / INVENTARIS BARANG
model Asset {
  id               String   @id @default(cuid())
  name             String   // Contoh: "HT Baofeng BF-888S", "Headset Earphone HT", "Charger Dock"
  category         String   // Contoh: "HT", "Aksesoris", "Perangkat Pendukung"
  ownerId          String
  owner            Owner    @relation(fields: [ownerId], references: [id])
  quantity         Int      // Jumlah unit milik pemilik ini
  capitalPerUnit   Int      // Nilai modal per unit (Rupiah, integer)
  totalCapital     Int      // quantity * capitalPerUnit
  purchaseDate     DateTime
  conditionStatus  String   @default("BAIK") // "BAIK", "PERLU_SERVIS", "RUSAK"
  isInitialCapital Boolean  @default(true)   // True = Modal Awal, False = Modal Tambahan
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  orderUsages      OrderItemOwnerUsage[]
}

// 4. TABEL ORDER PENYEWAAN
model RentalOrder {
  id                  String   @id @default(cuid())
  orderNumber         String   @unique // Contoh: "ORD-202610-001"
  customerOrgName     String   // Nama organisasi / penyewa
  eventName           String   // Nama event
  orderDate           DateTime
  startDate           DateTime
  endDate             DateTime
  durationDays        Int      // Minimal 1 hari
  calculatedGross     Int      // Hasil hitung sistem: sum(unit * tarif * hari)
  finalGrossRevenue   Int      // Total pembayaran sewa aktual (bisa ada diskon/paket)
  priceAdjustmentNote String?  // Alasan jika finalGrossRevenue != calculatedGross
  transportCost       Int      @default(0) // Biaya transportasi (dipotong sebelum bagi hasil)
  netOrderRevenue     Int      // finalGrossRevenue - transportCost
  status              String   @default("DRAFT") // "DRAFT", "FINAL", "CANCELLED"
  notes               String?
  
  // Relasi opsional ke CRM Lead/Prospek jika order berasal dari konversi calon pelanggan
  crmLeadId           String?  @unique
  crmLead             CrmLead? @relation(fields: [crmLeadId], references: [id])

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  itemUsages          OrderItemOwnerUsage[]
  ownerAllocations    OrderOwnerAllocation[]
  linkedExpenses      Expense[]
}

// 5. RINCIAN PENGGUNAAN ASET PER PEMILIK DALAM ORDER
model OrderItemOwnerUsage {
  id            String      @id @default(cuid())
  orderId       String
  order         RentalOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  assetId       String
  asset         Asset       @relation(fields: [assetId], references: [id])
  ownerId       String
  owner         Owner       @relation(fields: [ownerId], references: [id])
  unitsUsed     Int         // Jumlah unit milik owner ini yang dipakai pada order
  ratePerDay    Int         // Tarif per unit per hari (Rp)
  durationDays  Int         // Mengikuti durasi order atau per item
  subtotalGross Int         // unitsUsed * ratePerDay * durationDays
}

// 6. SNAPSHOT PEMBAGIAN HASIL ORDER KE SETIAP PEMILIK
model OrderOwnerAllocation {
  id                  String      @id @default(cuid())
  orderId             String
  order               RentalOrder @relation(fields: [orderId], references: [id], onDelete: Cascade)
  ownerId             String
  owner               Owner       @relation(fields: [ownerId], references: [id])
  totalUnitsUsed      Int         // Total unit milik owner ini di order tersebut
  grossShare          Int         // Bagian pendapatan kotor untuk owner ini
  transportCostShare  Int         // Bagian potongan transportasi (transportCost / 3 pemilik)
  netShare            Int         // grossShare - transportCostShare (Boleh bernilai negatif jika 0 unit dipakai tapi menanggung 1/3 transport)
}

// 7. TABEL PENGELUARAN OPERASIONAL
model Expense {
  id               String       @id @default(cuid())
  title            String       // Nama pengeluaran (misal: "Cetak Stiker HT", "Bensin Antar Jemput")
  category         String       // "TRANSPORTASI", "PARKIR", "STIKER_BRANDING", "PERLENGKAPAN", "PERAWATAN", "LAINNYA"
  expenseDate      DateTime
  amount           Int          // Nominal total pengeluaran (Rp)
  allocationType   String       // "SHARED" (Bersama/Bagi Rata) atau "INDIVIDUAL" (Perorangan)
  paidByOwnerId    String?      // Siapa yang nalangin/membayar duluan (opsional)
  paidByOwner      Owner?       @relation("ExpensePaidBy", fields: [paidByOwnerId], references: [id])
  
  // Relasi ke Order (Khusus untuk pencatatan otomatis biaya transportasi order agar tidak double count)
  orderId          String?
  order            RentalOrder? @relation(fields: [orderId], references: [id])
  isOrderTransport Boolean      @default(false) // TRUE jika ini otomatis dari transportCost order

  description      String?
  receiptRef       String?      // Catatan nomor nota / link bukti
  status           String       @default("ACTIVE") // "ACTIVE" atau "VOID" (jika order terkait dibatalkan)
  createdAt        DateTime     @default(now())

  ownerAllocations ExpenseOwnerAllocation[]
}

// 8. SNAPSHOT BEBAN PENGELUARAN PER PEMILIK
model ExpenseOwnerAllocation {
  id              String  @id @default(cuid())
  expenseId       String
  expense         Expense @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  ownerId         String
  owner           Owner   @relation(fields: [ownerId], references: [id])
  allocatedAmount Int     // Beban yang ditanggung pemilik ini
}

// 9. MODUL CRM: ORGANISASI & CALON PELANGGAN (PROSPEK EVENT)
model CrmLead {
  id                  String       @id @default(cuid())
  organizationName    String       // Nama UKM / Himpunan / Kampus / EO / Instansi
  organizationType    String       // "BEM_HIMA_UKM", "SEKOLAH", "EO_UMUM", "INSTANSI", "KOMUNITAS"
  eventName           String       // Nama acara yang akan diselenggarakan
  eventDate           DateTime?    // Perkiraan atau tanggal pasti acara
  estimatedDuration   Int          @default(1) // Estimasi hari sewa
  estimatedUnits      Int          @default(10) // Estimasi jumlah HT/alat yang dibutuhkan
  estimatedBudget     Int?         // Estimasi nilai penawaran (Rp)
  picName             String       // Nama kontak panitia / PIC
  picPhone            String       // Nomor WhatsApp PIC
  picRole             String?      // Jabatan di kepanitiaan (misal: Koordinator Perkap / Humas)
  
  // Pipeline Status Penawaran Jasa:
  // "IDENTIFIED" (Target Baru) -> "CONTACTED" (Sudah Dihubungi) -> "PROPOSAL_SENT" (Penawaran/Voucher Dikirim) 
  // -> "NEGOTIATION" (Negosiasi) -> "WON" (Deal/Konversi ke Order) -> "LOST" (Batal/Tidak Jadi)
  pipelineStatus      String       @default("IDENTIFIED")
  voucherCodeOffered  String?      // Jika terhubung dengan distribusi voucher dari web publik Kanal Tiga
  nextFollowUpDate    DateTime?
  notes               String?
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  convertedOrder      RentalOrder?
}

// 10. TABEL AUDIT LOG (JEJAK PERUBAHAN TRANSAKSI)
model AuditLog {
  id          String    @id @default(cuid())
  adminUserId String
  adminUser   AdminUser @relation(fields: [adminUserId], references: [id])
  entityType  String    // "ASSET", "ORDER", "EXPENSE", "CRM_LEAD", "OWNER"
  entityId    String
  action      String    // "CREATE", "FINALIZE_ORDER", "CANCEL_ORDER", "UPDATE", "VOID_EXPENSE"
  summary     String    // Deskripsi bahasa manusia yang jelas
  payloadJson String?   // Snapshot JSON sebelum/sesudah perubahan
  createdAt   DateTime  @default(now())
}
```

---

## 2. Spesifikasi Data Seeding Awal (`prisma/seed.ts`)

Saat sistem pertama kali dijalankan, seeder wajib mengisi data berdasarkan contoh nyata di spesifikasi `inner-kt` agar admin bisa langsung memverifikasi kebenaran rumus:

1. **3 Pemilik Bisnis:**
   - `OWNER_1`: **Surya** (Aktif)
   - `OWNER_2`: **Pemilik B** (Aktif)
   - `OWNER_3`: **Pemilik C** (Aktif)
2. **3 Akun Admin Login:**
   - `admin1@kanaltiga.internal` -> terhubung ke **Surya**
   - `admin2@kanaltiga.internal` -> terhubung ke **Pemilik B**
   - `admin3@kanaltiga.internal` -> terhubung ke **Pemilik C**
3. **Data Aset Awal (Sesuai Tabel Contoh Spesifikasi):**
   - HT milik **Surya**: `10 unit` × `Rp100.000` = **Rp1.000.000**
   - HT milik **Pemilik B**: `15 unit` × `Rp100.000` = **Rp1.500.000**
   - HT milik **Pemilik C**: `5 unit` × `Rp100.000` = **Rp500.000**
   - *(Total Aset Bisnis: 30 unit HT, Total Nilai Modal: Rp3.000.000)*
4. **Data Order Contoh #1 (`ORD-202610-001`, Status: `FINAL`):**
   - Penyewa: Panitia Dies Natalis Fakultas Teknik
   - Total sewa: 20 unit HT, durasi 1 hari, tarif Rp10.000/unit/hari -> Pendapatan Kotor = **Rp200.000**
   - Rincian unit dipakai:
     - Surya: 10 unit (Kotor: Rp100.000)
     - Pemilik B: 6 unit (Kotor: Rp60.000)
     - Pemilik C: 4 unit (Kotor: Rp40.000)
   - Biaya Transportasi: **Rp12.000** (Dibagi 3 pemilik = Rp4.000/orang)
   - Hasil Bersih Order:
     - Surya: `Rp100.000 - Rp4.000 = Rp96.000`
     - Pemilik B: `Rp60.000 - Rp4.000 = Rp56.000`
     - Pemilik C: `Rp40.000 - Rp4.000 = Rp36.000`
     - Total Pendapatan Bersih: **Rp188.000**
5. **Data Pengeluaran Contoh:**
   - Pengeluaran Bersama: **Pembelian Stiker Bersama** senilai **Rp60.000** -> Dibagi rata 3 pemilik (`Rp20.000` per pemilik).
   - Pengeluaran Perorangan: **Perlengkapan Pribadi Aset Surya** senilai **Rp30.000** -> Ditanggung penuh oleh Surya (`Rp30.000`).
6. **Data CRM Calon Pelanggan Contoh:**
   - 4 sampel organisasi/event kampus di berbagai tahap pipeline (`IDENTIFIED`, `CONTACTED`, `PROPOSAL_SENT`, `NEGOTIATION`).
