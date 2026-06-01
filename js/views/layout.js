import { BRAND } from '../config.js';
import { isAdmin } from '../auth.js';

export function renderNav(user, activePage, navigate) {
  const admin = isAdmin(user);
  const links = admin
    ? [
        { id: 'admin', label: 'Dashboard', icon: 'grid' },
        { id: 'scanner', label: 'Scanner', icon: 'scan' },
      ]
    : [
        { id: 'book', label: 'Book', icon: 'map' },
        { id: 'vouchers', label: 'Vouchers', icon: 'ticket' },
        { id: 'profile', label: 'Profile', icon: 'person' },
      ];

  return `
    <header class="nav">
      <a href="#" class="nav__brand" data-nav="home">
        Extraordinary<span>Life</span>
      </a>
      <nav class="nav__links">
        ${links
          .map(
            (l) => `
          <a href="#" class="nav__link ${activePage === l.id ? 'nav__link--active' : ''}" data-nav="${l.id}">
            <ion-icon name="${l.icon}-outline"></ion-icon>
            <span>${l.label}</span>
          </a>`
          )
          .join('')}
      </nav>
      <div class="nav__actions">
        <button type="button" class="btn btn--ghost btn--sm" data-nav="logout">
          <ion-icon name="log-out-outline"></ion-icon>
          <span class="hide-mobile">Sign out</span>
        </button>
      </div>
    </header>
  `;
}

export function renderShell(content, user, activePage) {
  return `
    <div class="app-shell">
      <header class="mobile-top-bar" aria-hidden="false">
        <span class="nav__brand">Extraordinary<span>Life</span></span>
      </header>
      ${renderNav(user, activePage)}
      <main class="main">${content}</main>
    </div>
  `;
}
