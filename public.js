document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.motif-divider').forEach(el => {
    el.insertAdjacentHTML('afterbegin', svgBintang());
    el.insertAdjacentHTML('beforeend', svgBintang());
  });
  muatSemua();
});

async function muatSemua() {
  await Promise.all([
    muatProfil(),
    muatRingkasan(),
    muatTransaksiTerbaru(),
    muatDonaturTerbaru(),
  ]);
  document.getElementById('lastUpdate').textContent =
    'Terakhir dimuat: ' + new Date().toLocaleString('id-ID');
}

async function muatProfil() {
  const { data, error } = await supabase.from('profil_mushola').select('*').eq('id', 1).single();
  if (error || !data) return;
  document.getElementById('namaMushola').textContent = data.nama_mushola || 'Mushola';
  document.title = (data.nama_mushola || 'Mushola') + ' — Dashboard Keuangan';
  if (data.alamat) document.getElementById('alamatMushola').textContent = data.alamat;
}

async function muatRingkasan() {
  const { data, error } = await supabase.from('v_ringkasan_kas').select('*').single();
  if (error || !data) {
    document.getElementById('saldoNilai').textContent = formatRupiah(0);
    return;
  }
  document.getElementById('saldoNilai').textContent = formatRupiah(data.saldo);
  document.getElementById('totalMasuk').textContent = formatRupiah(data.total_pemasukan);
  document.getElementById('totalKeluar').textContent = formatRupiah(data.total_pengeluaran);
}

async function muatTransaksiTerbaru() {
  const { data, error } = await supabase
    .from('transaksi')
    .select('id, tanggal, tipe, jumlah, keterangan, kategori:kategori_id(nama)')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  const el = document.getElementById('listTransaksi');
  if (error || !data || data.length === 0) {
    el.innerHTML = '<div class="empty">Belum ada transaksi tercatat.</div>';
    return;
  }
  el.innerHTML = data.map(t => `
    <div class="list-item">
      <div class="kiri">
        <div class="nama">${escapeHtml(t.kategori?.nama || (t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'))}</div>
        <div class="meta">${formatTanggal(t.tanggal)}${t.keterangan ? ' · ' + escapeHtml(t.keterangan) : ''}</div>
      </div>
      <div class="kanan ${t.tipe === 'pemasukan' ? 'masuk' : 'keluar'}">
        ${t.tipe === 'pemasukan' ? '+' : '−'} ${formatRupiah(t.jumlah)}
      </div>
    </div>
  `).join('');
}

async function muatDonaturTerbaru() {
  const { data, error } = await supabase
    .from('donatur')
    .select('*')
    .order('tanggal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  const el = document.getElementById('listDonatur');
  if (error || !data || data.length === 0) {
    el.innerHTML = '<div class="empty">Belum ada infaq/donasi tercatat.</div>';
    return;
  }
  const labelJenis = {
    infaq_jumat: 'Infaq Jumat',
    infaq_kotak: 'Infaq Kotak Amal',
    donasi: 'Donasi',
    wakaf: 'Wakaf',
    lainnya: 'Lainnya',
  };
  el.innerHTML = data.map(d => `
    <div class="list-item">
      <div class="kiri">
        <div class="nama">${d.anonim ? 'Hamba Allah' : escapeHtml(d.nama)}</div>
        <div class="meta">${formatTanggal(d.tanggal)} · <span class="tag">${labelJenis[d.jenis] || d.jenis}</span></div>
      </div>
      <div class="kanan masuk">+ ${formatRupiah(d.jumlah)}</div>
    </div>
  `).join('');
}
