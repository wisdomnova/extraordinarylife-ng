import { formatNaira, HOT_DESKS, CONFERENCE_ROOM } from '../config.js';
import {
  getAllBookings,
  getTodayMetrics,
  getJuneQuotaList,
  findMemberById,
} from '../bookings.js';
import { getMaintenanceSeats, getCacheMembers } from '../storage.js';
import { getSeatById } from '../config.js';
import { formatDisplayDate, formatTimeRange } from '../utils.js';
import { updateMaintenanceSeats, lookupBooking, checkInBooking } from '../data.js';
import { startScanner, stopScanner } from '../components/scanner.js';
import { toast } from '../components/toast.js';

export function renderAdminDashboard() {
  const metrics = getTodayMetrics();
  const bookings = getAllBookings();
  const members = getCacheMembers();
  const juneQuota = getJuneQuotaList();
  const maintenance = getMaintenanceSeats();

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
          <div class="table-wrap">
            <table class="table table--compact">
              <thead><tr><th>Member</th><th>Used</th><th>Remaining</th></tr></thead>
              <tbody>
                ${juneQuota
                  .map(
                    (q) => `<tr>
                    <td>${q.name}</td>
                    <td>${q.used}</td>
                    <td><span class="badge ${q.used >= q.max ? 'badge--danger' : 'badge--primary'}">${q.max - q.used}</span></td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card admin-section">
        <h2>All bookings</h2>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Member</th><th>Date</th><th>Time</th><th>Seat</th><th>Amount</th>
                <th>Payment</th><th>Check-in</th><th>Barcode</th>
              </tr>
            </thead>
            <tbody>
              ${bookings
                .map((b) => {
                  const u = findMemberById(b.userId);
                  const seat = getSeatById(b.seatId);
                  return `<tr>
                    <td>${u?.fullName || 'n/a'}</td>
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
          </table>
        </div>
      </div>

      <div class="card admin-section">
        <h2>Registered members</h2>
        <div class="user-grid">
          ${members
            .map((u) => {
              const photo = u.photo
                ? `<img src="${u.photo}" class="user-card__photo" alt="" />`
                : `<div class="user-card__photo user-card__photo--ph"><ion-icon name="person"></ion-icon></div>`;
              return `
              <div class="user-card">
                ${photo}
                <div>
                  <strong>${u.fullName}</strong>
                  <p class="text-muted">${u.email}</p>
                  <p class="text-muted">${u.phone}</p>
                  <span class="badge badge--primary">${u.bookingCount ?? 0} bookings</span>
                </div>
              </div>`;
            })
            .join('')}
        </div>
      </div>
    </div>
  `;
}

export function bindAdminDashboard(root) {
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
