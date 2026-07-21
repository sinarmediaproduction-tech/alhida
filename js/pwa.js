// ============================================================
// PWA: registrasi service worker + tombol "Instal Aplikasi"
// Dipakai bersama oleh index.html (publik) & admin.html
// ============================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('Service worker gagal didaftarkan:', err);
    });
  });
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  tampilkanBannerInstall();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  sembunyikanBannerInstall();
});

function tampilkanBannerInstall() {
  if (document.getElementById('pwaInstallBanner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.innerHTML = `
    <span>Pasang aplikasi ini di layar utama untuk akses lebih cepat.</span>
    <div style="display:flex;gap:8px;flex-shrink:0;">
      <button id="pwaInstallYes" class="btn btn-gold" style="padding:8px 14px;font-size:13px;">Pasang</button>
      <button id="pwaInstallNo" class="btn btn-outline" style="padding:8px 14px;font-size:13px;background:transparent;border-color:rgba(246,242,233,0.35);color:inherit;">Nanti</button>
    </div>
  `;
  banner.style.cssText = `
    position:fixed; left:0; right:0; bottom:0; z-index:200;
    background:var(--tinta); color:var(--kertas);
    padding:14px 18px; display:flex; align-items:center; justify-content:space-between;
    gap:14px; font-size:13.5px; box-shadow:0 -6px 20px rgba(18,59,57,0.18);
    flex-wrap:wrap;
  `;
  document.body.appendChild(banner);

  document.getElementById('pwaInstallYes').addEventListener('click', async () => {
    sembunyikanBannerInstall();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  document.getElementById('pwaInstallNo').addEventListener('click', sembunyikanBannerInstall);
}

function sembunyikanBannerInstall() {
  const el = document.getElementById('pwaInstallBanner');
  if (el) el.remove();
}
