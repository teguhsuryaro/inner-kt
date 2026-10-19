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
  ('SYSTEM', 'System Production Reset', 'SYSTEM', 'PROD-INIT', 'RESET', 'Seluruh data sampel telah dibersihkan. Sistem siap digunakan untuk pencatatan manual.');
