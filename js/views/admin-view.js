import { formatNaira, HOT_DESKS, CONFERENCE_ROOM, PROTECTED_BLOCKED_DATES } from '../config.js';
import { getTodayMetrics } from '../bookings.js';
import { getMaintenanceSeats, getCacheBlockedDates, getProtectedBlockedDates } from '../storage.js';
import { getSeatById } from '../config.js';
import { formatDisplayDate, formatTimeRange, addDays, todayISO, formatMemberSince } from '../utils.js';
import {
  updateMaintenanceSeats,
  addBlockedDate,
  removeBlockedDate,
  lookupBooking,
  checkInBooking,
  fetchAdminBookings,
  fetchAdminMembers,
  fetchAdminMember,
  fetchAdminJuneQuota,
  syncFromApi,
} from '../data.js';
import { openModal } from '../components/modal.js';
import { renderPagination, bindPagination } from '../components/pagination.js';
import { startScanner, stopScanner } from '../components/scanner.js';
import { toast } from '../components/toast.js';

export function renderAdminDashboard() {
  const metrics = getTodayMetrics();
  const maintenance = getMaintenanceSeats();
  const blockedDates = getCacheBlockedDates();
  const protectedBlocked = new Set([
    ...getProtectedBlockedDates(),
    ...PROTECTED_BLOCKED_DATES,
  ]);
  const minBlockDate = addDays(todayISO(), 1);

  return `
    <div class="page admin-page">
      <div class="page-header">
        <h1>Admin dashboard</h1>
        <p class="page-subtitle">Live overview &amp; management</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card card">
          <ion-icon name="calendar"></ion-icon>
          <div>
            <span class="metric-card__value">${metrics.bookingsToday}</span>
            <span class="metric-card__label">Bookings today</span>
          </div>
        </div>
        <div class="metric-card card">
          <ion-icon name="cash"></ion-icon>
          <div>
            <span class="metric-card__value">${formatNaira(metrics.revenue)}</span>
            <span class="metric-card__label">Revenue today</span>
          </div>
        </div>
        <div class="metric-card card">
          <ion-icon name="desktop"></ion-icon>
          <div>
            <span class="metric-card__value">${metrics.availableSeats}</span>
            <span class="metric-card__label">Desks available</span>
          </div>
        </div>
        <div class="metric-card card">
          <ion-icon name="checkmark-done"></ion-icon>
          <div>
            <span class="metric-card__value">${metrics.checkIns}</span>
            <span class="metric-card__label">Check-ins today</span>
          </div>
        </div>
      </div>

      <div class="admin-grid">
        <div class="card admin-section">
          <h2>Maintenance: mark seats unavailable</h2>
          <div class="maintenance-grid">
            ${[...HOT_DESKS, CONFERENCE_ROOM]
              .map(
                (s) => `
              <label class="maintenance-chip">
                <input type="checkbox" value="${s.id}" ${maintenance.includes(s.id) ? 'checked' : ''} />
                <span>${s.label || s.id}</span>
              </label>`
              )
              .join('')}
          </div>
          <button type="button" class="btn btn--primary btn--sm" id="save-maintenance">Save maintenance</button>
        </div>

        <div class="card admin-section">
          <h2>June 2026 quota tracker</h2>
          <div id="admin-quota-wrap">
            <p class="text-muted admin-loading">Loading…</p>
          </div>
        </div>
      </div>

      <div class="card admin-section">
        <h2>Block booking dates</h2>
        <p class="admin-section__hint text-muted">
          Closed days are hidden from the member booking calendar. Sundays are already excluded.
        </p>
        <form class="blocked-dates-form" id="blocked-dates-form">
          <div class="form-group blocked-dates-form__field">
            <label for="blocked-date-input">Date to block</label>
            <input
              type="date"
              id="blocked-date-input"
              class="blocked-dates-form__input"
              min="${minBlockDate}"
              required
            />
          </div>
          <button type="submit" class="btn btn--primary btn--sm">Block date</button>
        </form>
        ${
          blockedDates.length
            ? `<ul class="blocked-dates-list" id="blocked-dates-list">
            ${blockedDates
              .map(
                (d) => `
              <li class="blocked-dates-list__item">
                <span>${formatDisplayDate(d)}${protectedBlocked.has(d) ? ' <span class="badge badge--muted">Fixed closure</span>' : ''}</span>
                ${
                  protectedBlocked.has(d)
                    ? ''
                    : `<button type="button" class="btn btn--ghost btn--sm" data-unblock="${d}" aria-label="Unblock ${formatDisplayDate(d)}">
                  <ion-icon name="close-outline"></ion-icon> Remove
                </button>`
                }
              </li>`
              )
              .join('')}
          </ul>`
            : '<p class="text-muted blocked-dates-empty">No blocked dates. Add a date above to close it for bookings.</p>'
        }
      </div>

      <div class="card admin-section">
        <h2>All bookings</h2>
        <div id="admin-bookings-wrap">
          <p class="text-muted admin-loading">Loading…</p>
        </div>
      </div>

      <div class="card admin-section">
        <h2>Registered members</h2>
        <div id="admin-members-wrap">
          <p class="text-muted admin-loading">Loading…</p>
        </div>
      </div>
    </div>
  `;
}

function renderBookingsTable(bookings) {
  if (!bookings.length) {
    return '<p class="text-muted empty-state">No bookings yet.</p>';
  }
  return `<div class="table-wrap"><table class="table">
    <thead>
      <tr>
        <th>Member</th><th>Date</th><th>Time</th><th>Seat</th><th>Amount</th>
        <th>Payment</th><th>Check-in</th><th>Barcode</th>
      </tr>
    </thead>
    <tbody>
      ${bookings
        .map((b) => {
          const seat = getSeatById(b.seatId);
          return `<tr>
            <td>${b.memberName || 'n/a'}</td>
            <td>${formatDisplayDate(b.date)}</td>
            <td>${formatTimeRange(b.startTime, b.endTime) || '—'}</td>
            <td>${seat?.label || b.seatId}</td>
            <td>${formatNaira(b.amount ?? b.amountPaid ?? 0)}</td>
            <td><span class="badge badge--${b.paymentStatus === 'paid' ? 'success' : 'muted'}">${b.paymentStatus}</span></td>
            <td><span class="badge badge--${b.checkedIn ? 'success' : 'muted'}">${b.checkedIn ? 'Yes' : 'No'}</span></td>
            <td class="mono">${b.barcodeRef || 'n/a'}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table></div>`;
}

function renderMembersGrid(members) {
  if (!members.length) {
    return '<p class="text-muted empty-state">No members registered yet.</p>';
  }
  return `<div class="user-grid user-grid--compact">
    ${members
      .map(
        (u) => `
      <div class="user-card user-card--compact">
        <div class="user-card__body">
          <strong>${u.fullName}</strong>
          <p class="text-muted">${u.email}</p>
          <p class="text-muted">${u.phone}</p>
          <p class="text-muted">${u.organisation || ''}</p>
          <span class="badge badge--primary">${u.bookingCount ?? 0} bookings</span>
          <button type="button" class="btn btn--ghost btn--sm user-card__view" data-view-member="${u.id}">
            <ion-icon name="person-outline"></ion-icon> View profile
          </button>
        </div>
      </div>`
      )
      .join('')}
  </div>`;
}

function renderMemberProfileBody(member) {
  const since = formatMemberSince(member.createdAt);
  const photo = member.photo
    ? `<img src="${member.photo}" class="member-profile__photo" alt="${member.fullName}" />`
    : `<div class="member-profile__photo member-profile__photo--ph"><ion-icon name="person"></ion-icon></div>`;

  return `
    <div class="member-profile">
      ${photo}
      <div class="member-profile__details">
        <h3 class="member-profile__name">${member.fullName}</h3>
        <p class="text-muted">${member.organisation || '—'}</p>
        <dl class="member-profile__meta">
          <div><dt>Email</dt><dd>${member.email}</dd></div>
          <div><dt>Phone</dt><dd>${member.phone}</dd></div>
          ${since ? `<div><dt>Member since</dt><dd>${since}</dd></div>` : ''}
          <div><dt>Total bookings</dt><dd>${member.bookingCount ?? 0}</dd></div>
        </dl>
      </div>
    </div>
  `;
}

async function showMemberProfile(memberId) {
  const { close, el } = openModal({
    title: 'Member profile',
    wide: true,
    bodyHtml: '<p class="text-muted admin-loading">Loading profile…</p>',
    footerHtml: '<button type="button" class="btn btn--ghost" id="member-profile-close">Close</button>',
  });

  el.querySelector('#member-profile-close')?.addEventListener('click', close);

  try {
    const { member } = await fetchAdminMember(memberId);
    const body = el.querySelector('.modal__body');
    if (body) body.innerHTML = renderMemberProfileBody(member);
  } catch (err) {
    const body = el.querySelector('.modal__body');
    if (body) {
      body.innerHTML = `<p class="text-muted">${err.message || 'Could not load profile.'}</p>`;
    }
  }
}

function bindMemberViewButtons(container) {
  container.querySelectorAll('[data-view-member]').forEach((btn) => {
    btn.addEventListener('click', () => showMemberProfile(btn.dataset.viewMember));
  });
}

function renderQuotaTable(quota) {
  if (!quota.length) {
    return '<p class="text-muted empty-state">No members yet.</p>';
  }
  return `<div class="table-wrap"><table class="table table--compact">
    <thead><tr><th>Member</th><th>Used</th><th>Remaining</th></tr></thead>
    <tbody>
      ${quota
        .map(
          (q) => `<tr>
          <td>${q.name}</td>
          <td>${q.used}</td>
          <td><span class="badge ${q.used >= q.max ? 'badge--danger' : 'badge--primary'}">${q.max - q.used}</span></td>
        </tr>`
        )
        .join('')}
    </tbody>
  </table></div>`;
}

async function loadAdminBookingsPage(root, page) {
  const wrap = root.querySelector('#admin-bookings-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<p class="text-muted admin-loading">Loading…</p>';
  try {
    const data = await fetchAdminBookings(page);
    wrap.innerHTML = `
      ${renderBookingsTable(data.bookings)}
      ${renderPagination({
        id: 'admin-bookings-pagination',
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      })}
    `;
    const pag = wrap.querySelector('#admin-bookings-pagination');
    bindPagination(pag, {
      onPageChange: (p) => loadAdminBookingsPage(root, p),
    });
  } catch (err) {
    wrap.innerHTML = `<p class="text-muted">Could not load bookings. ${err.message || ''}</p>`;
  }
}

async function loadAdminMembersPage(root, page) {
  const wrap = root.querySelector('#admin-members-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<p class="text-muted admin-loading">Loading…</p>';
  try {
    const data = await fetchAdminMembers(page);
    wrap.innerHTML = `
      ${renderMembersGrid(data.members)}
      ${renderPagination({
        id: 'admin-members-pagination',
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      })}
    `;
    const pag = wrap.querySelector('#admin-members-pagination');
    bindPagination(pag, {
      onPageChange: (p) => loadAdminMembersPage(root, p),
    });
    bindMemberViewButtons(wrap);
  } catch (err) {
    wrap.innerHTML = `<p class="text-muted">Could not load members. ${err.message || ''}</p>`;
  }
}

async function loadAdminQuotaPage(root, page) {
  const wrap = root.querySelector('#admin-quota-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<p class="text-muted admin-loading">Loading…</p>';
  try {
    const data = await fetchAdminJuneQuota(page);
    wrap.innerHTML = `
      ${renderQuotaTable(data.quota)}
      ${renderPagination({
        id: 'admin-quota-pagination',
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
      })}
    `;
    const pag = wrap.querySelector('#admin-quota-pagination');
    bindPagination(pag, {
      onPageChange: (p) => loadAdminQuotaPage(root, p),
    });
  } catch (err) {
    wrap.innerHTML = `<p class="text-muted">Could not load quota. ${err.message || ''}</p>`;
  }
}

export function bindAdminDashboard(root, refresh) {
  syncFromApi()
    .then(() => {
      const m = getTodayMetrics();
      const vals = root.querySelectorAll('.metric-card__value');
      if (vals[0]) vals[0].textContent = m.bookingsToday;
      if (vals[1]) vals[1].textContent = formatNaira(m.revenue);
      if (vals[2]) vals[2].textContent = m.availableSeats;
      if (vals[3]) vals[3].textContent = m.checkIns;
    })
    .catch(() => {});

  loadAdminBookingsPage(root, 1);
  loadAdminMembersPage(root, 1);
  loadAdminQuotaPage(root, 1);

  root.querySelector('#save-maintenance')?.addEventListener('click', async () => {
    const checked = [...root.querySelectorAll('.maintenance-chip input:checked')].map(
      (i) => i.value
    );
    try {
      await updateMaintenanceSeats(checked);
      toast('Maintenance seats updated', 'success');
    } catch (err) {
      toast(err.message || 'Failed to update maintenance', 'error');
    }
  });

  root.querySelector('#blocked-dates-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = root.querySelector('#blocked-date-input');
    const date = input?.value;
    if (!date) return;
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true;
    try {
      await addBlockedDate(date);
      toast('Date blocked for bookings', 'success');
      input.value = '';
      refresh('admin');
    } catch (err) {
      toast(err.message || 'Failed to block date', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  root.querySelectorAll('[data-unblock]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const date = btn.dataset.unblock;
      btn.disabled = true;
      try {
        await removeBlockedDate(date);
        toast('Date unblocked', 'success');
        refresh('admin');
      } catch (err) {
        toast(err.message || 'Failed to unblock date', 'error');
        btn.disabled = false;
      }
    });
  });
}

export function renderScannerView() {
  return `
    <div class="page scanner-page">
      <div class="page-header">
        <h1>Barcode scanner</h1>
        <p class="page-subtitle">Scan member voucher (Code 128)</p>
      </div>
      <div class="scanner-layout">
        <div class="card scanner-video-wrap">
          <video id="scanner-video" playsinline></video>
          <div class="scanner-overlay"></div>
          <p class="scanner-hint">Point camera at barcode</p>
        </div>
        <div class="card scanner-result" id="scanner-result">
          <div class="form-group" style="margin-bottom:16px">
            <label for="manual-barcode">Or enter barcode reference</label>
            <div class="barcode-lookup-row">
              <input type="text" id="manual-barcode" placeholder="EL-20260615-05-123456" class="mono barcode-lookup-input" />
              <button type="button" class="btn btn--primary btn--sm" id="manual-lookup">Lookup</button>
            </div>
          </div>
          <div id="scanner-result-body">
            <div class="empty-state">
              <ion-icon name="scan-outline"></ion-icon>
              <p>Scan a barcode to view booking details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindScannerView(root, refresh) {
  const video = root.querySelector('#scanner-video');
  const resultBody = root.querySelector('#scanner-result-body');
  let stopFn = null;

  const showBooking = async (text) => {
    resultBody.innerHTML = '<p class="text-muted">Looking up booking…</p>';
    try {
      const { booking, member } = await lookupBooking(text);
      const user = member;
      const seat = getSeatById(booking.seatId);
      resultBody.innerHTML = `
      <div class="scan-details">
        ${user?.photo ? `<img src="${user.photo}" class="scan-details__photo" />` : ''}
        <h2>${user?.fullName || 'Unknown member'}</h2>
        <p class="text-muted">${user?.email || ''}${user?.phone ? `, ${user.phone}` : ''}</p>
        <div class="scan-details__grid">
          <div><span>Seat</span><strong>${seat?.label}</strong></div>
          <div><span>Date</span><strong>${formatDisplayDate(booking.date)}</strong></div>
          <div><span>Time</span><strong>${formatTimeRange(booking.startTime, booking.endTime) || '—'}</strong></div>
          <div><span>Payment</span><strong class="badge badge--success">${booking.paymentStatus}</strong></div>
          <div><span>Check-in</span><strong>${booking.checkedIn ? 'Done' : 'Pending'}</strong></div>
          <div><span>Code</span><strong>${booking.accessCode}</strong></div>
          <div><span>Ref</span><strong class="mono">${booking.barcodeRef}</strong></div>
        </div>
        ${
          !booking.checkedIn
            ? `<button type="button" class="btn btn--primary btn--full" id="mark-checkin">Mark as checked in</button>`
            : '<p class="text-success">Already checked in</p>'
        }
      </div>
    `;
      resultBody.querySelector('#mark-checkin')?.addEventListener('click', async () => {
        try {
          await checkInBooking(booking.id);
          toast(`${user?.fullName || 'Member'} checked in!`, 'success');
          refresh('scanner');
        } catch (err) {
          toast(err.message || 'Check-in failed', 'error');
        }
      });
    } catch {
      resultBody.innerHTML = `<div class="scanner-error"><ion-icon name="alert-circle"></ion-icon><p>Booking not found for: <code>${text}</code></p></div>`;
      toast('Barcode not recognized', 'error');
      setTimeout(() => startScan(), 2000);
    }
  };

  const onDetected = (text) => showBooking(text);

  root.querySelector('#manual-lookup')?.addEventListener('click', () => {
    const val = root.querySelector('#manual-barcode')?.value?.trim();
    if (val) showBooking(val);
  });

  const startScan = async () => {
    try {
      stopFn = await startScanner(video, onDetected);
    } catch (e) {
      resultBody.innerHTML = `<p class="scanner-error">${e.message}</p><p class="text-muted" style="margin-top:8px;font-size:0.85rem">Use manual entry above or allow camera access.</p>`;
    }
  };

  startScan();

  return () => {
    stopScanner();
    stopFn?.();
  };
}
