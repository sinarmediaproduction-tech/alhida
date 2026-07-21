let kategoriCache = [];
let currentTipe = 'pemasukan';

document.addEventListener('DOMContentLoaded', () => {
  initAuthListeners();
  initTabListeners();
  initFormListeners();
  cekSesi();
});

// ============================================================
// AUTH
// ============================================================
async function cekSesi() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    tampilkanAdmin();
  } else {
    document.getElementById('viewLogin').style.display = 'block';
    document.getElementById('viewAdmin').style.display = 'none';
  }
}

function initAuthListeners() {
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!email || !password) return tampilkanToast('Isi email dan kata sandi', true);

    const btn = document.getElementById('btnLogin');
    btn.disabled = true; btn.textContent = 'Memproses…';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    btn.disabled = false; btn.textContent = 'Masuk';

    if (error) return tampilkanToast('Login gagal: email/sandi salah', true);
    tampilkanAdmin();
  });

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.reload();
  });

  document.getElementById('btnCloseAdmin').addEventListener('click', () => {
    document.getElementById('viewAdmin').style.display = 'none';
    document.body.style.overflow = '';
  });
}

async function tampilkanAdmin() {
  document.getElementById('viewLogin').style.display = 'none';
  document.getElementById('viewAdmin').style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.getElementById('tTanggal').valueAsDate = new Date();
  document.getElementById('dTanggal').valueAsDate = new Date();
  await Promise.all([muatKategoriKeForm(), muatProfilAdmin()]);
  await Promise.all([muatTransaksiAdmin(), muatDonaturAdmin()]);
}

// ============================================================
// TAB SWITCHING
// ============================================================
function initTabListeners() {
  document.querySelectorAll('.toggle-group button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-group button[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.style.display = p.dataset.panel === target ? 'block' : 'none';
      });
    });
  });

  // Toggle pemasukan/pengeluaran di form transaksi
  document.querySelectorAll('.toggle-group button[data-tipe]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-group button[data-tipe]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTipe = btn.dataset.tipe;
      document.getElementById('tTipe').value = currentTipe;
      isiDropdownKategori();
    });
  });
}

// ============================================================
// KATEGORI
// ============================================================
async function muatKategoriKeForm() {
  const { data, error } = await supabase.from('kategori').select('*').order('urutan');
  if (error) return tampilkanToast('Gagal memuat kategori', true);
  kategoriCache = data || [];
  isiDropdownKategori();
}

function isiDropdownKategori() {
  const select = document.getElementById('tKategori');
  const filtered = kategoriCache.filter(k => k.tipe === currentTipe);
  select.innerHTML = filtered.map(k => `<option value="${k.id}">${escapeHtml(k.nama)}</option>`).join('')
    || '<option value="">(Belum ada kategori)</option>';
}

// ============================================================
// FORM TRANSAKSI
// ============================================================
function initFormListeners() {
  document.getElementById('formTransaksi').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      tanggal: document.getElementById('tTanggal').value,
      tipe: currentTipe,
      kategori_id: document.getElementById('tKategori').value || null,
      jumlah: Number(document.getElementById('tJumlah').value),
      keterangan: document.getElementById('tKeterangan').value.trim() || null,
    };
    const { error } = await supabase.from('transaksi').insert(payload);
    if (error) return tampilkanToast('Gagal menyimpan: ' + error.message, true);
    tampilkanToast('Transaksi tersimpan');
    e.target.reset();
    document.getElementById('tTanggal').valueAsDate = new Date();
    muatTransaksiAdmin();
  });

  document.getElementById('formDonatur').addEventListener('submit', async (e) => {
    e.preventDefault();
    const anonim = document.getElementById('dAnonim').checked;
    const payload = {
      tanggal: document.getElementById('dTanggal').value,
      nama: anonim ? 'Hamba Allah' : (document.getElementById('dNama').value.trim() || 'Hamba Allah'),
      anonim,
      jenis: document.getElementById('dJenis').value,
      jumlah: Number(document.getElementById('dJumlah').value),
      masuk_ke_transaksi: document.getElementById('dMasukKas').checked,
    };
    const { data: inserted, error } = await supabase.from('donatur').insert(payload).select().single();
    if (error) return tampilkanToast('Gagal menyimpan: ' + error.message, true);

    // Jika dicentang, otomatis buat entri di buku transaksi juga (kategori sesuai jenis infaq)
    if (payload.masuk_ke_transaksi) {
      const kategoriInfaq = kategoriCache.find(k =>
        k.tipe === 'pemasukan' &&
        k.nama.toLowerCase().includes(payload.jenis.replace('infaq_', '').replace('_', ' '))
      ) || kategoriCache.find(k => k.tipe === 'pemasukan');
      await supabase.from('transaksi').insert({
        tanggal: payload.tanggal,
        tipe: 'pemasukan',
        kategori_id: kategoriInfaq?.id || null,
        jumlah: payload.jumlah,
        keterangan: `Infaq/donasi dari ${payload.nama} (auto)`,
      });
    }

    tampilkanToast('Infaq/donasi tersimpan');
    e.target.reset();
    document.getElementById('dTanggal').valueAsDate = new Date();
    document.getElementById('dMasukKas').checked = true;
    muatDonaturAdmin();
    muatTransaksiAdmin();
  });

  document.getElementById('formProfil').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      id: 1,
      nama_mushola: document.getElementById('pNama').value.trim(),
      alamat: document.getElementById('pAlamat').value.trim() || null,
      nama_bendahara: document.getElementById('pBendahara').value.trim() || null,
    };
    const { error } = await supabase.from('profil_mushola').upsert(payload);
    if (error) return tampilkanToast('Gagal menyimpan profil: ' + error.message, true);
    tampilkanToast('Profil tersimpan');
    document.getElementById('adminNamaMushola').textContent = payload.nama_mushola;
  });

  document.getElementById('btnBuatLaporan').addEventListener('click', buatLaporan);
  document.getElementById('btnSalinLaporan').addEventListener('click', () => {
    const ta = document.getElementById('hasilLaporan');
    ta.select();
    document.execCommand('copy');
    tampilkanToast('Teks laporan disalin');
  });
}

// ============================================================
// RIWAYAT TRANSAKSI (admin, dengan hapus)
// ============================================================
async function muatTransaksiAdmin() {
  const { data, error } = await supabase
    .from('transaksi')
    .select('id, tanggal, tipe, jumlah, keterangan, kategori:kategori_id(nama)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);

  const el = document.getElementById('listTransaksiAdmin');
  if (error) { el.innerHTML = '<div class="empty">Gagal memuat data.</div>'; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty">Belum ada transaksi.</div>'; return; }

  el.innerHTML = data.map(t => `
    <div class="list-item">
      <div class="kiri">
        <div class="nama">${escapeHtml(t.kategori?.nama || '-')}</div>
        <div class="meta">${formatTanggal(t.tanggal)}${t.keterangan ? ' · ' + escapeHtml(t.keterangan) : ''}</div>
      </div>
      <div class="kanan ${t.tipe === 'pemasukan' ? 'masuk' : 'keluar'}">
        ${formatRupiah(t.jumlah)}
        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;margin-left:8px;" onclick="hapusTransaksi('${t.id}')">Hapus</button>
      </div>
    </div>
  `).join('');
}

async function hapusTransaksi(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  const { error } = await supabase.from('transaksi').delete().eq('id', id);
  if (error) return tampilkanToast('Gagal menghapus', true);
  tampilkanToast('Transaksi dihapus');
  muatTransaksiAdmin();
}

// ============================================================
// RIWAYAT DONATUR (admin, dengan hapus)
// ============================================================
async function muatDonaturAdmin() {
  const { data, error } = await supabase
    .from('donatur')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(30);

  const el = document.getElementById('listDonaturAdmin');
  if (error) { el.innerHTML = '<div class="empty">Gagal memuat data.</div>'; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty">Belum ada infaq/donasi.</div>'; return; }

  el.innerHTML = data.map(d => `
    <div class="list-item">
      <div class="kiri">
        <div class="nama">${d.anonim ? 'Hamba Allah' : escapeHtml(d.nama)}</div>
        <div class="meta">${formatTanggal(d.tanggal)} · <span class="tag">${d.jenis}</span></div>
      </div>
      <div class="kanan masuk">
        ${formatRupiah(d.jumlah)}
        <button class="btn btn-danger" style="padding:4px 10px;font-size:12px;margin-left:8px;" onclick="hapusDonatur('${d.id}')">Hapus</button>
      </div>
    </div>
  `).join('');
}

async function hapusDonatur(id) {
  if (!confirm('Hapus catatan infaq/donasi ini? (Catatan di buku transaksi otomatis tidak ikut terhapus, hapus manual jika perlu)')) return;
  const { error } = await supabase.from('donatur').delete().eq('id', id);
  if (error) return tampilkanToast('Gagal menghapus', true);
  tampilkanToast('Catatan dihapus');
  muatDonaturAdmin();
}

// ============================================================
// PROFIL
// ============================================================
async function muatProfilAdmin() {
  const { data, error } = await supabase.from('profil_mushola').select('*').eq('id', 1).single();
  if (error || !data) return;
  document.getElementById('adminNamaMushola').textContent = data.nama_mushola;
  document.getElementById('pNama').value = data.nama_mushola || '';
  document.getElementById('pAlamat').value = data.alamat || '';
  document.getElementById('pBendahara').value = data.nama_bendahara || '';
}

// ============================================================
// LAPORAN RINGKAS (teks siap salin untuk pengumuman Jumat)
// ============================================================
async function buatLaporan() {
  const hari = Number(document.getElementById('rentangLaporan').value);
  const sejak = new Date();
  sejak.setDate(sejak.getDate() - hari);
  const sejakStr = sejak.toISOString().slice(0, 10);

  const { data: transaksi, error } = await supabase
    .from('transaksi')
    .select('tanggal, tipe, jumlah, keterangan, kategori:kategori_id(nama)')
    .gte('tanggal', sejakStr)
    .order('tanggal', { ascending: true });

  if (error) return tampilkanToast('Gagal membuat laporan', true);

  const { data: ringkas } = await supabase.from('v_ringkasan_kas').select('*').single();

  const totalMasuk = (transaksi || []).filter(t => t.tipe === 'pemasukan').reduce((a, b) => a + Number(b.jumlah), 0);
  const totalKeluar = (transaksi || []).filter(t => t.tipe === 'pengeluaran').reduce((a, b) => a + Number(b.jumlah), 0);

  let teks = `LAPORAN KAS MUSHOLA\n`;
  teks += `Periode: ${hari} hari terakhir (sejak ${formatTanggal(sejakStr)})\n`;
  teks += `${'='.repeat(40)}\n\n`;
  teks += `Pemasukan periode ini : ${formatRupiah(totalMasuk)}\n`;
  teks += `Pengeluaran periode ini: ${formatRupiah(totalKeluar)}\n`;
  teks += `Selisih periode ini    : ${formatRupiah(totalMasuk - totalKeluar)}\n\n`;
  teks += `Saldo kas keseluruhan  : ${formatRupiah(ringkas?.saldo || 0)}\n`;
  teks += `${'='.repeat(40)}\n\n`;
  teks += `RINCIAN TRANSAKSI:\n`;

  if (!transaksi || transaksi.length === 0) {
    teks += `(tidak ada transaksi pada periode ini)\n`;
  } else {
    transaksi.forEach(t => {
      const tanda = t.tipe === 'pemasukan' ? '+' : '-';
      teks += `${formatTanggal(t.tanggal)} | ${tanda} ${formatRupiah(t.jumlah)} | ${t.kategori?.nama || '-'}${t.keterangan ? ' - ' + t.keterangan : ''}\n`;
    });
  }

  teks += `\nBarakallahu fiikum, jazaakumullahu khairan atas segala infaq dan perhatiannya.`;

  document.getElementById('hasilLaporan').value = teks;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
