-- ============================================================================
-- INNER-KT V2.0 — SUPABASE POSTGRESQL SCHEMA & INITIAL SEED (TANPA PRISMA)
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bersihkan tabel lama jika ingin reset dari awal (opsional saat setup pertama)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expense_owner_allocations CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS order_owner_allocations CASCADE;
DROP TABLE IF EXISTS order_item_owner_usages CASCADE;
DROP TABLE IF EXISTS rental_orders CASCADE;
DROP TABLE IF EXISTS crm_leads CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS owners CASCADE;

-- 1. TABEL PEMILIK BISNIS (OWNERS)
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,          -- 'OWNER_1', 'OWNER_2', 'OWNER_3'
  name TEXT NOT NULL,                 -- 'Surya', 'Pemilik B', 'Pemilik C'
  color_badge TEXT DEFAULT 'indigo',  -- 'indigo', 'teal', 'amber'
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- 2. TABEL AKUN ADMIN INTERNAL (EQUAL CO-OWNERS: admin1, admin2, admin3)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,      -- 'admin1', 'admin2', 'admin3'
  email TEXT UNIQUE NOT NULL,         -- 'admin1@kanaltiga.internal', dst.
  password_plain TEXT NOT NULL,       -- Disimpan untuk login internal sederhana / sinkron Supabase Auth
  display_name TEXT NOT NULL,
  owner_id UUID UNIQUE REFERENCES owners(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'CO_OWNER',       -- Semua setara ('CO_OWNER')
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ASET / INVENTARIS BARANG
-- Catatan Revisi v2.0:
-- - category adalah TEXT bebas (diisi manual oleh user, bukan enum/dropdown kaku)
-- - Kolom condition_status DIHAPUS karena seluruh barang dipastikan dalam kondisi baik
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                 -- Nama barang (misal: 'HT Baofeng BF-888S', 'Megaphone Toa', dll)
  category TEXT NOT NULL,             -- Diisi manual oleh user (misal: 'HT', 'Audio', 'Tenda', dll)
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  capital_per_unit BIGINT NOT NULL CHECK (capital_per_unit >= 0),
  total_capital BIGINT NOT NULL CHECK (total_capital >= 0), -- quantity * capital_per_unit
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_initial_capital BOOLEAN DEFAULT TRUE, -- TRUE = Modal Awal, FALSE = Modal Tambahan
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL CRM & CALON PELANGGAN (PROSPEK EVENT)
-- Catatan Revisi v2.0:
-- - pic_phone (WhatsApp) dan pic_instagram keduanya OPSIONAL
-- - Ditambahkan kolom pic_gender ('LAKI_LAKI', 'PEREMPUAN', 'TIDAK_DIKETAHUI')
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,    -- 'BEM_HIMA_UKM', 'SEKOLAH', 'EO_UMUM', 'INSTANSI', 'KOMUNITAS', 'LAINNYA'
  event_name TEXT NOT NULL,
  event_date DATE,
  estimated_duration INTEGER NOT NULL DEFAULT 1 CHECK (estimated_duration >= 1),
  estimated_units INTEGER NOT NULL DEFAULT 10 CHECK (estimated_units >= 1),
  estimated_budget BIGINT DEFAULT 0,
  pic_name TEXT NOT NULL,
  pic_gender TEXT NOT NULL DEFAULT 'TIDAK_DIKETAHUI', -- 'LAKI_LAKI', 'PEREMPUAN', 'TIDAK_DIKETAHUI'
  pic_role TEXT,                      -- Jabatan di kepanitiaan
  pic_phone TEXT,                     -- Opsional (Nomor WhatsApp)
  pic_instagram TEXT,                 -- Opsional (Username Instagram, misal: '@rakaperkap')
  pipeline_status TEXT NOT NULL DEFAULT 'IDENTIFIED',
  -- Nilai pipeline_status: 'IDENTIFIED' | 'CONTACTED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'WON' | 'LOST'
  loss_reason TEXT,                   -- Catatan alasan jika status = 'LOST' (Batal)
  voucher_code_offered TEXT,
  next_follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL ORDER PENYEWAAN
CREATE TABLE rental_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_org_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days >= 1),
  calculated_gross BIGINT NOT NULL DEFAULT 0,
  final_gross_revenue BIGINT NOT NULL DEFAULT 0,
  price_adjustment_note TEXT,
  transport_cost BIGINT NOT NULL DEFAULT 0,
  net_order_revenue BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT' | 'FINAL' | 'CANCELLED'
  notes TEXT,
  crm_lead_id UUID UNIQUE REFERENCES crm_leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RINCIAN PENGGUNAAN ASET PER PEMILIK DALAM ORDER
CREATE TABLE order_item_owner_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  units_used INTEGER NOT NULL CHECK (units_used > 0),
  rate_per_day BIGINT NOT NULL CHECK (rate_per_day >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days >= 1),
  subtotal_gross BIGINT NOT NULL DEFAULT 0
);

-- 7. SNAPSHOT PEMBAGIAN HASIL ORDER KE SETIAP PEMILIK
CREATE TABLE order_owner_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES rental_orders(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  total_units_used INTEGER NOT NULL DEFAULT 0,
  gross_share BIGINT NOT NULL DEFAULT 0,
  transport_cost_share BIGINT NOT NULL DEFAULT 0,
  net_share BIGINT NOT NULL DEFAULT 0
);

-- 8. TABEL PENGELUARAN OPERASIONAL
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,             -- 'TRANSPORTASI', 'PARKIR', 'STIKER_BRANDING', 'PERLENGKAPAN', 'PERAWATAN', 'LAINNYA'
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  allocation_type TEXT NOT NULL,      -- 'SHARED' (Bagi Rata) | 'INDIVIDUAL' (Perorangan)
  paid_by_owner_id UUID REFERENCES owners(id) ON DELETE SET NULL,
  order_id UUID REFERENCES rental_orders(id) ON DELETE CASCADE,
  is_order_transport BOOLEAN DEFAULT FALSE,
  description TEXT,
  receipt_ref TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'VOID'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SNAPSHOT BEBAN PENGELUARAN PER PEMILIK
CREATE TABLE expense_owner_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
  allocated_amount BIGINT NOT NULL DEFAULT 0
);

-- 10. TABEL AUDIT LOG (MENCATAT SEMUA AKSI TAMBAH, EDIT, HAPUS OLEH ADMIN 1/2/3)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT NOT NULL,
  admin_display_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,          -- 'ASSET' | 'ORDER' | 'EXPENSE' | 'CRM_LEAD' | 'OWNER'
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,               -- 'CREATE' | 'UPDATE' | 'DELETE' | 'FINALIZE_ORDER' | 'CANCEL_ORDER' | 'CONVERT_TO_ORDER'
  summary TEXT NOT NULL,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matikan RLS atau buka policy penuh untuk operasional internal aplikasi
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE rental_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_owner_usages DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_owner_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_owner_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DATA SEEDING AWAL (3 PEMILIK, 3 ADMIN SETARA, ASET, ORDER, PENGELUARAN, CRM)
-- ============================================================================

INSERT INTO owners (id, code, name, color_badge, is_active, notes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'OWNER_1', 'Surya', 'indigo', TRUE, 'Pemilik 1 Kanal Tiga'),
  ('22222222-2222-2222-2222-222222222222', 'OWNER_2', 'Pemilik B', 'teal', TRUE, 'Pemilik 2 Kanal Tiga'),
  ('33333333-3333-3333-3333-333333333333', 'OWNER_3', 'Pemilik C', 'amber', TRUE, 'Pemilik 3 Kanal Tiga')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admin_users (username, email, password_plain, display_name, owner_id, role) VALUES
  ('admin1', 'admin1@kanaltiga.internal', 'Admin1KanalTiga!', 'Admin 1 — Surya', '11111111-1111-1111-1111-111111111111', 'CO_OWNER'),
  ('admin2', 'admin2@kanaltiga.internal', 'Admin2KanalTiga!', 'Admin 2 — Pemilik B', '22222222-2222-2222-2222-222222222222', 'CO_OWNER'),
  ('admin3', 'admin3@kanaltiga.internal', 'Admin3KanalTiga!', 'Admin 3 — Pemilik C', '33333333-3333-3333-3333-333333333333', 'CO_OWNER')
ON CONFLICT (username) DO NOTHING;

INSERT INTO assets (id, name, category, owner_id, quantity, capital_per_unit, total_capital, purchase_date, is_initial_capital, notes) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', 'HT Baofeng BF-888S', 'Handy Talky (HT)', '11111111-1111-1111-1111-111111111111', 10, 100000, 1000000, '2026-01-10', TRUE, 'Batch awal milik Surya'),
  ('aaaa2222-2222-2222-2222-222222222222', 'HT Baofeng BF-888S', 'Handy Talky (HT)', '22222222-2222-2222-2222-222222222222', 15, 100000, 1500000, '2026-01-10', TRUE, 'Batch awal milik Pemilik B'),
  ('aaaa3333-3333-3333-3333-333333333333', 'HT Baofeng BF-888S', 'Handy Talky (HT)', '33333333-3333-3333-3333-333333333333', 5, 100000, 500000, '2026-01-10', TRUE, 'Batch awal milik Pemilik C')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_leads (id, organization_name, organization_type, event_name, event_date, estimated_duration, estimated_units, estimated_budget, pic_name, pic_gender, pic_role, pic_phone, pic_instagram, pipeline_status, loss_reason, voucher_code_offered, next_follow_up_date, notes) VALUES
  ('cccc1111-1111-1111-1111-111111111111', 'Panitia Dies Natalis FT Unsoed', 'BEM_HIMA_UKM', 'Dies Natalis Fakultas Teknik 2026', '2026-10-15', 1, 20, 200000, 'Raka Pratama', 'LAKI_LAKI', 'Koordinator Perkap', '081234567890', '@rakapratama_ft', 'WON', NULL, 'KT-DIESFT26', NULL, 'Deal 20 unit HT, sudah masuk ke Order #1'),
  ('cccc2222-2222-2222-2222-222222222222', 'BEM KM Unsoed', 'BEM_HIMA_UKM', 'Soedirman Student Summit 2026', '2026-11-05', 2, 30, 600000, 'Nadia Putri', 'PEREMPUAN', 'Staf Logistik', '085712345678', '@nadiaputri.s3', 'WON', NULL, 'KT-SUMMIT50', '2026-10-25', 'Sudah sepakat menyewa 30 unit selama 2 hari, siap dikonversi ke order'),
  ('cccc3333-3333-3333-3333-333333333333', 'HMIF Informatika', 'BEM_HIMA_UKM', 'Informatics Championship', '2026-11-12', 1, 15, 150000, 'Dimas Anggara', 'LAKI_LAKI', 'Kadiv Acara', NULL, '@dimas.hmif', 'PROPOSAL_SENT', NULL, NULL, '2026-10-22', 'Dihubungi lewat DM Instagram, pricelist sudah dikirim'),
  ('cccc4444-4444-4444-4444-444444444444', 'OSIS SMAN 1 Purwokerto', 'SEKOLAH', 'Pensi Smansa Euphoria', '2026-11-20', 1, 25, 250000, 'Alya Rahma', 'PEREMPUAN', 'Wakil Ketua Panitia', '082198765432', NULL, 'NEGOTIATION', NULL, 'KT-SMANSA', '2026-10-21', 'Sedang negosiasi tambahan headset dan biaya antar'),
  ('cccc5555-5555-5555-5555-555555555555', 'UKM Musik Kampus', 'KOMUNITAS', 'Parade Band Akustik', '2026-10-10', 1, 10, 100000, 'Bima Sakti', 'LAKI_LAKI', 'Perkap', '081399887766', '@bimasakti_musik', 'LOST', 'Acara diundur tahun depan oleh pihak kampus', NULL, NULL, 'Batal karena izin venue kampus ditunda')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rental_orders (id, order_number, customer_org_name, event_name, order_date, start_date, end_date, duration_days, calculated_gross, final_gross_revenue, transport_cost, net_order_revenue, status, crm_lead_id, notes) VALUES
  ('dddd1111-1111-1111-1111-111111111111', 'ORD-202610-001', 'Panitia Dies Natalis FT Unsoed', 'Dies Natalis Fakultas Teknik 2026', '2026-10-15', '2026-10-15', '2026-10-15', 1, 200000, 200000, 12000, 188000, 'FINAL', 'cccc1111-1111-1111-1111-111111111111', 'Order perdana sesuai contoh spesifikasi')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_item_owner_usages (order_id, asset_id, owner_id, units_used, rate_per_day, duration_days, subtotal_gross) VALUES
  ('dddd1111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 10, 10000, 1, 100000),
  ('dddd1111-1111-1111-1111-111111111111', 'aaaa2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 6, 10000, 1, 60000),
  ('dddd1111-1111-1111-1111-111111111111', 'aaaa3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 4, 10000, 1, 40000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_owner_allocations (order_id, owner_id, total_units_used, gross_share, transport_cost_share, net_share) VALUES
  ('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 10, 100000, 4000, 96000),
  ('dddd1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 6, 60000, 4000, 56000),
  ('dddd1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 4, 40000, 4000, 36000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO expenses (id, title, category, expense_date, amount, allocation_type, paid_by_owner_id, order_id, is_order_transport, description, status) VALUES
  ('eeee1111-1111-1111-1111-111111111111', 'Biaya Transportasi Order ORD-202610-001', 'TRANSPORTASI', '2026-10-15', 12000, 'SHARED', '11111111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', TRUE, 'Otomatis dipotong dari pendapatan kotor Order ORD-202610-001', 'ACTIVE'),
  ('eeee2222-2222-2222-2222-222222222222', 'Pembelian Stiker Penanda HT Bersama', 'STIKER_BRANDING', '2026-10-16', 60000, 'SHARED', '11111111-1111-1111-1111-111111111111', NULL, FALSE, 'Stiker nomor dan logo Kanal Tiga untuk seluruh unit', 'ACTIVE'),
  ('eeee3333-3333-3333-3333-333333333333', 'Beli Pouch / Tas Pribadi Aset Surya', 'PERLENGKAPAN', '2026-10-17', 30000, 'INDIVIDUAL', '11111111-1111-1111-1111-111111111111', NULL, FALSE, 'Pengeluaran pribadi Surya untuk tas penyimpanan HT miliknya', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO expense_owner_allocations (expense_id, owner_id, allocated_amount) VALUES
  ('eeee1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 4000),
  ('eeee1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 4000),
  ('eeee1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 4000),
  ('eeee2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 20000),
  ('eeee2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 20000),
  ('eeee2222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 20000),
  ('eeee3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 30000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (admin_email, admin_display_name, entity_type, entity_id, action, summary) VALUES
  ('admin1@kanaltiga.internal', 'Admin 1 — Surya', 'SYSTEM', 'INIT', 'CREATE', 'Inisialisasi awal database Supabase inner-kt v2.0 beserta seed 3 pemilik dan transaksi contoh.')
ON CONFLICT (id) DO NOTHING;
