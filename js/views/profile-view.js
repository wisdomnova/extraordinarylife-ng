import { formatNaira, getSeatById, BOOKING_RULES, isConference } from '../config.js';
import { getUserBookings, countUserJuneBookings } from '../bookings.js';
import {
  formatDisplayDate,
  formatMemberSince,
  formatTimeRange,
  getBookingListPrice,
  getBookingPaidAmount,
} from '../utils.js';

function formatBookingAmountCell(booking) {
  const list = getBookingListPrice(booking);
  const paid = getBookingPaidAmount(booking);
  if (paid === 0 && list > 0) {
    return `<span class="price-cell"><s>${formatNaira(list)}</s> <strong>${formatNaira(0)}</strong></span>`;
  }
  return formatNaira(paid || list);
}

function formatBookingType(booking) {
  if (isConference(booking.seatId)) {
    return booking.sessionType === 'full' ? 'Full day' : 'Half day';
  }
  return 'Hot desk';
}

export function renderProfileView(user) {
  const bookings = getUserBookings(user.id).filter((b) => b.paymentStatus === 'paid');
  const totalSpent = bookings.reduce((s, b) => s + getBookingPaidAmount(b), 0);
  const juneUsed = countUserJuneBookings(user.id);
  const juneMax = BOOKING_RULES.juneMaxDays;
  const juneLeft = Math.max(0, juneMax - juneUsed);
  const junePercent = Math.min(100, Math.round((juneUsed / juneMax) * 100));
  const memberSince = formatMemberSince(user.createdAt);
  const photo = user.photo
    ? `<img src="${user.photo}" alt="${user.fullName}" class="profile-avatar" />`
    : `<div class="profile-avatar profile-avatar--placeholder"><ion-icon name="person"></ion-icon></div>`;

  return `
    <div class="page profile-page">
      <div class="profile-header card">
        ${photo}
        <div class="profile-header__info">
          <h1>${user.fullName}</h1>
          <p class="text-muted">${user.organisation}</p>
          <div class="profile-meta">
            <span><ion-icon name="mail"></ion-icon> ${user.email}</span>
            <span><ion-icon name="call"></ion-icon> ${user.phone}</span>
            ${
              memberSince
                ? `<span><ion-icon name="calendar"></ion-icon> Since ${memberSince}</span>`
                : ''
            }
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-pill">
            <span class="stat-pill__value">${bookings.length}</span>
            <span class="stat-pill__label">Total bookings</span>
          </div>
          <div class="stat-pill">
            <span class="stat-pill__value">${formatNaira(totalSpent)}</span>
            <span class="stat-pill__label">Total spent</span>
          </div>
          <div class="stat-pill ${juneUsed >= juneMax ? 'stat-pill--warning' : ''}">
            <span class="stat-pill__value">${juneUsed}/${juneMax}</span>
            <span class="stat-pill__label">June days used</span>
          </div>
          <div class="stat-pill ${juneLeft === 0 ? 'stat-pill--warning' : ''}">
            <span class="stat-pill__value">${juneLeft}</span>
            <span class="stat-pill__label">June days left</span>
          </div>
        </div>
      </div>

      <div class="card june-quota-card">
        <div class="june-quota-card__header">
          <h2>June 2026 quota</h2>
          <span class="june-quota-card__count">${juneUsed} of ${juneMax} days used</span>
        </div>
        <div
          class="june-quota-bar"
          role="progressbar"
          aria-valuenow="${juneUsed}"
          aria-valuemin="0"
          aria-valuemax="${juneMax}"
          aria-label="June 2026 booking quota"
        >
          <div class="june-quota-bar__fill" style="width: ${junePercent}%"></div>
        </div>
      </div>

      <div class="card">
        <h2>Booking history</h2>
        ${
          bookings.length === 0
            ? '<p class="text-muted empty-state">No bookings yet. <a href="#" data-nav="book">Book your first desk</a></p>'
            : `<div class="table-wrap"><table class="table">
          <thead><tr><th>Date</th><th>Time</th><th>Seat</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            ${bookings
              .map((b) => {
                const seat = getSeatById(b.seatId);
                const isPast = b.date < new Date().toISOString().slice(0, 10);
                return `<tr>
                  <td>${formatDisplayDate(b.date)}</td>
                  <td>${formatTimeRange(b.startTime, b.endTime) || '9:00 AM – 5:00 PM'}</td>
                  <td>${seat?.label || b.seatId}</td>
                  <td>${formatBookingType(b)}</td>
                  <td>${formatBookingAmountCell(b)}</td>
                  <td><span class="badge badge--${b.checkedIn ? 'success' : isPast ? 'muted' : 'primary'}">${b.checkedIn ? 'Checked in' : isPast ? 'Completed' : 'Upcoming'}</span></td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table></div>`
        }
      </div>
    </div>
  `;
}
