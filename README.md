# Dashboard Keuangan Mushola

## Struktur
- `index.html` — dashboard publik (read-only, tanpa login) untuk transparansi ke jamaah
- `admin.html` — panel admin (login) untuk catat transaksi, infaq/donasi, laporan, profil
- `schema.sql` — jalankan sekali di Supabase SQL Editor
- `js/supabase-client.js` — isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di sini

## Setup (sekali di awal)

1. Buat project baru di https://supabase.com
2. Buka **SQL Editor** → paste isi `schema.sql` → Run
3. Buka **Project Settings → API** → salin `Project URL` dan `anon public key`,
   tempel ke `js/supabase-client.js`
4. Buka **Authentication → Users → Add user** → buat 1 akun admin
   (email + password bebas, ini yang dipakai login di `admin.html`)
5. Buka `index.html` untuk dashboard publik, `admin.html` untuk login admin

## Catatan desain

- **Tidak ada enkripsi field-level** seperti di SinarKeu — datanya memang
  dirancang untuk transparan/publik, jadi RLS Supabase yang mengatur:
  semua orang (anon) bisa **baca**, hanya akun admin yang login yang bisa
  **tulis/ubah/hapus**.
- Kolom `masuk_ke_transaksi` di tabel `donatur`: kalau dicentang saat input,
  otomatis dibuatkan entri di buku `transaksi` juga supaya saldo kas ikut
  ter-update. Kalau infaq dicatat terpisah dari kas umum, uncheck kolom ini.
- Tabel `kategori` sudah diisi kategori umum mushola (Infaq Jumat, Listrik,
  Kebersihan, dst) — bisa ditambah langsung lewat SQL Editor kalau perlu
  kategori baru (belum ada UI kelola kategori di versi ini).
- Laporan di tab "Laporan" menghasilkan teks polos siap salin-tempel
  untuk pengumuman Jumat/rapat takmir, bukan PDF — kalau nanti perlu versi
  PDF-nya tinggal bilang.

## PWA (Progressive Web App)

Aplikasi ini sudah bisa dipasang (install) ke layar utama HP/laptop:

- `manifest.json` — nama, ikon, warna tema
- `sw.js` — service worker: app shell (html/css/js/ikon) di-cache biar tetap
  kebuka meski koneksi lemot; data Supabase & library CDN **tidak** di-cache,
  selalu diambil langsung supaya angka kas selalu yang terbaru
- `js/pwa.js` — daftarin service worker + tombol "Pasang" muncul otomatis
  kalau browser mendukung (Chrome/Edge Android & desktop; Safari iOS pakai
  "Tambahkan ke Layar Utama" dari menu Share, tidak ada banner otomatis)
- `icons/` — ikon 192/512/512-maskable/apple-touch-icon, motif bintang
  segi-8 emas di atas latar teal, sama seperti identitas dashboard

**Penting:** Service worker cuma aktif di HTTPS (atau `localhost` saat
development). GitHub Pages otomatis HTTPS, jadi begitu di-deploy langsung
jalan. Kalau dites dari `file://` langsung, service worker tidak akan aktif
— pakai `python3 -m http.server` atau sejenisnya untuk tes lokal.


- UI kelola kategori (saat ini via SQL)
- Multi-user/role (baru single admin)
- Export PDF laporan
- Upload bukti transaksi (foto struk)
