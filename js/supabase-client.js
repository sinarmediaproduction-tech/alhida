// ============================================================
// KONFIGURASI SUPABASE
// Ganti dua nilai di bawah dengan punya proyek Supabase kamu.
// Ambil dari: Project Settings > API
// ============================================================
const SUPABASE_URL = 'https://neciaqiobajadyrkybfz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lY2lhcWlvYmFqYWR5cmt5YmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODgyMTcsImV4cCI6MjA5NzU2NDIxN30.MECkNuEoBZ0dkjEaZA7Fj_eIWJZDMKTP7gM9eDLRQhs';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Helper format angka ---
function formatRupiah(angka) {
  const n = Number(angka || 0);
  return 'Rp' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

function formatTanggal(tglStr) {
  const d = new Date(tglStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatBulan(tglStr) {
  const d = new Date(tglStr);
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

// --- Toast notifikasi ringan ---
function tampilkanToast(pesan, error = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (error ? ' error' : '');
  el.textContent = pesan;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// --- SVG bintang segi-8 (signature motif), dipakai di divider ---
function svgBintang() {
  return `<svg class="motif-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0l2.6 6.2 6.2.6-4.7 4.2 1.4 6.1L12 14l-5.5 3.1 1.4-6.1L3.2 6.8l6.2-.6z" opacity="0"/>
    <g>
      <rect x="10.5" y="0" width="3" height="24" rx="0.5" transform="rotate(0 12 12)"/>
      <rect x="10.5" y="0" width="3" height="24" rx="0.5" transform="rotate(45 12 12)"/>
      <rect x="10.5" y="0" width="3" height="24" rx="0.5" transform="rotate(90 12 12)"/>
      <rect x="10.5" y="0" width="3" height="24" rx="0.5" transform="rotate(135 12 12)"/>
    </g>
  </svg>`;
}
