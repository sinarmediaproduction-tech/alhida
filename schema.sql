-- ============================================================
-- SKEMA: Dashboard Keuangan Mushola
-- Prinsip: SEMUA data kas & infaq bisa dibaca publik (transparansi),
-- hanya admin (1 akun, via Supabase Auth) yang bisa tulis/edit/hapus.
-- ============================================================

-- 1. KATEGORI transaksi (mis: Infaq Jumat, Listrik, Kebersihan, dst)
create table if not exists kategori (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('pemasukan', 'pengeluaran')),
  urutan int default 0,
  created_at timestamptz default now()
);

-- 2. TRANSAKSI kas (buku besar utama)
create table if not exists transaksi (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  tipe text not null check (tipe in ('pemasukan', 'pengeluaran')),
  kategori_id uuid references kategori(id) on delete set null,
  jumlah numeric(14,2) not null check (jumlah >= 0),
  keterangan text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. DONATUR / Infaq (buku terpisah biar bisa ditampilkan sebagai "papan infaq")
create table if not exists donatur (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null default current_date,
  nama text not null default 'Hamba Allah',
  anonim boolean not null default false,
  jenis text not null default 'infaq_jumat'
    check (jenis in ('infaq_jumat', 'infaq_kotak', 'donasi', 'wakaf', 'lainnya')),
  jumlah numeric(14,2) not null check (jumlah >= 0),
  keterangan text,
  masuk_ke_transaksi boolean default true, -- true = otomatis kehitung juga di total kas
  created_at timestamptz default now()
);

-- 4. PROFIL MUSHOLA (nama, alamat, dsb — buat header dashboard publik)
create table if not exists profil_mushola (
  id int primary key default 1,
  nama_mushola text not null default 'Mushola',
  alamat text,
  nama_bendahara text,
  tahun_lpj_berjalan int default extract(year from now())::int,
  constraint single_row check (id = 1)
);
insert into profil_mushola (id, nama_mushola) values (1, 'Mushola Kita')
  on conflict (id) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_transaksi_tanggal on transaksi(tanggal desc);
create index if not exists idx_transaksi_tipe on transaksi(tipe);
create index if not exists idx_donatur_tanggal on donatur(tanggal desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- Baca: semua orang (anon + authenticated)
-- Tulis/ubah/hapus: hanya authenticated (akun admin tunggal)
-- ============================================================
alter table kategori enable row level security;
alter table transaksi enable row level security;
alter table donatur enable row level security;
alter table profil_mushola enable row level security;

-- KATEGORI
create policy "kategori_public_read" on kategori for select using (true);
create policy "kategori_admin_write" on kategori for insert with check (auth.role() = 'authenticated');
create policy "kategori_admin_update" on kategori for update using (auth.role() = 'authenticated');
create policy "kategori_admin_delete" on kategori for delete using (auth.role() = 'authenticated');

-- TRANSAKSI
create policy "transaksi_public_read" on transaksi for select using (true);
create policy "transaksi_admin_write" on transaksi for insert with check (auth.role() = 'authenticated');
create policy "transaksi_admin_update" on transaksi for update using (auth.role() = 'authenticated');
create policy "transaksi_admin_delete" on transaksi for delete using (auth.role() = 'authenticated');

-- DONATUR
create policy "donatur_public_read" on donatur for select using (true);
create policy "donatur_admin_write" on donatur for insert with check (auth.role() = 'authenticated');
create policy "donatur_admin_update" on donatur for update using (auth.role() = 'authenticated');
create policy "donatur_admin_delete" on donatur for delete using (auth.role() = 'authenticated');

-- PROFIL
create policy "profil_public_read" on profil_mushola for select using (true);
create policy "profil_admin_update" on profil_mushola for update using (auth.role() = 'authenticated');

-- ============================================================
-- SEED kategori umum (opsional, bisa diedit lewat admin nanti)
-- ============================================================
insert into kategori (nama, tipe, urutan) values
  ('Infaq Jumat', 'pemasukan', 1),
  ('Infaq Kotak Amal', 'pemasukan', 2),
  ('Donasi', 'pemasukan', 3),
  ('Wakaf', 'pemasukan', 4),
  ('Listrik', 'pengeluaran', 10),
  ('Air (PDAM)', 'pengeluaran', 11),
  ('Kebersihan', 'pengeluaran', 12),
  ('Perlengkapan Ibadah', 'pengeluaran', 13),
  ('Renovasi/Perbaikan', 'pengeluaran', 14),
  ('Kegiatan/Peringatan', 'pengeluaran', 15),
  ('Lainnya', 'pengeluaran', 99)
on conflict do nothing;

-- ============================================================
-- VIEW: Rekap saldo & ringkasan cepat
-- ============================================================
create or replace view v_ringkasan_kas as
select
  coalesce(sum(case when tipe = 'pemasukan' then jumlah else 0 end), 0) as total_pemasukan,
  coalesce(sum(case when tipe = 'pengeluaran' then jumlah else 0 end), 0) as total_pengeluaran,
  coalesce(sum(case when tipe = 'pemasukan' then jumlah else -jumlah end), 0) as saldo
from transaksi;
