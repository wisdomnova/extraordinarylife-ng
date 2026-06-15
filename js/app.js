import { getCurrentUser, logout, isAdmin } from './auth.js';
import { syncEssentials, syncFromApi } from './data.js';
import { renderAuthView, bindAuthView } from './views/auth-view.js';
import { renderShell } from './views/layout.js';
import { renderBookView, bindBookView } from './views/book-view.js';
import { renderProfileView } from './views/profile-view.js';
import { renderVoucherView, bindVoucherView } from './views/voucher-view.js';
import {
  renderAdminDashboard,
  bindAdminDashboard,
  renderScannerView,
  bindScannerView,
} from './views/admin-view.js';
import { stopScanner } from './components/scanner.js';
import { showConfirm } from './components/confirm.js';

let currentPage = null;
let scannerCleanup = null;

async function navigate(page) {
  if (page === 'logout') {
    const ok = await showConfirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to book a desk or view your vouchers.',
      confirmText: 'Sign out',
      cancelText: 'Stay signed in',
      variant: 'danger',
    });
    if (!ok) return;
    stopScanner();
    scannerCleanup?.();
    logout();
    render();
    return;
  }
  render(page);
}

function render(forcedPage = null) {
  const app = document.getElementById('app');
  const loading = document.getElementById('loading-screen');
  loading?.classList.add('loading-screen--hide');

  const user = getCurrentUser();

  if (!user) {
    document.body.classList.add('auth-active');
    app.innerHTML = renderAuthView();
    bindAuthView(app, () => render());
    return;
  }

  document.body.classList.remove('auth-active');

  const admin = isAdmin(user);
  let page = forcedPage || currentPage;

  if (!page) page = admin ? 'admin' : 'book';
  if (admin && !['admin', 'scanner'].includes(page)) page = 'admin';
  if (!admin && ['admin', 'scanner'].includes(page)) page = 'book';

  currentPage = page;
  scannerCleanup?.();
  stopScanner();

  let content = '';
  let bind = null;

  switch (page) {
    case 'book':
      content = renderBookView(user);
      bind = (root) => bindBookView(root, user, navigate);
      break;
    case 'profile':
      content = renderProfileView(user);
      break;
    case 'vouchers':
      content = renderVoucherView(user);
      bind = (root) => bindVoucherView(root, user);
      break;
    case 'admin':
      content = renderAdminDashboard();
      bind = (root) => bindAdminDashboard(root, navigate);
      break;
    case 'scanner':
      content = renderScannerView();
      bind = (root) => {
        scannerCleanup = bindScannerView(root, navigate);
      };
      break;
    default:
      content = renderBookView(user);
      bind = (root) => bindBookView(root, user, navigate);
  }

  app.innerHTML = renderShell(content, user, page);

  app.querySelectorAll('[data-nav]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });

  bind?.(app.querySelector('.main'));
}

async function boot() {
  try {
    await syncEssentials();
    render();
    window.__EL_APP_READY__ = true;
    const err = document.getElementById('boot-error');
    if (err) err.hidden = true;
    syncFromApi().catch((e) => console.warn('[Extraordinary Life] background sync:', e));
  } catch (e) {
    console.error('[Extraordinary Life] boot failed:', e);
    throw e;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
