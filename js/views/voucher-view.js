import { formatNaira, getSeatById } from '../config.js';
import { getUserBookings } from '../bookings.js';
import { renderBarcode } from '../barcode.js';
import {
  formatDisplayDate,
  formatTimeRange,
  todayISO,
  getBookingListPrice,
  getBookingPaidAmount,
} from '../utils.js';

export function renderVoucherView(user) {
  const bookings = getUserBookings(user.id).filter((b) => b.paymentStatus === 'paid');
  const upcoming = bookings.filter((b) => b.date >= todayISO()).sort((a, b) => a.date.localeCompare(b.date));
  const past = bookings.filter((b) => b.date < todayISO()).sort((a, b) => b.date.localeCompare(a.date));

  return `
    <div class="page voucher-page">
      <div class="page-header">
        <div>
          <h1>Your vouchers</h1>
          <p class="page-subtitle">Access codes and barcodes for check-in</p>
        </div>
      </div>

      ${upcoming.length ? `<h2 class="section-title">Upcoming</h2><div class="voucher-grid" id="voucher-upcoming">${upcoming.map((b, i) => voucherCard(b, i)).join('')}</div>` : ''}
      ${past.length ? `<h2 class="section-title">Past</h2><div class="voucher-grid voucher-grid--past">${past.map((b, i) => voucherCard(b, `p${i}`)).join('')}</div>` : ''}
      ${!bookings.length ? '<div class="card empty-state"><p>No vouchers yet.</p></div>' : ''}
    </div>
  `;
}

function formatVoucherPrice(booking) {
  const list = getBookingListPrice(booking);
  const paid = getBookingPaidAmount(booking);
  if (paid === 0 && list > 0) {
    return `<s>${formatNaira(list)}</s> ${formatNaira(0)}`;
  }
  return formatNaira(paid || list);
}

function voucherCard(booking, idx) {
  const seat = getSeatById(booking.seatId);
  const svgId = `barcode-${booking.id}`;
  return `
    <div class="voucher-card card" id="voucher-${booking.id}">
      <div class="voucher-card__header">
        <div>
          <h3>${seat?.label || booking.seatId}</h3>
          <p>${formatDisplayDate(booking.date)} · ${formatTimeRange(booking.startTime, booking.endTime) || '9:00 AM – 5:00 PM'}</p>
        </div>
        <span class="badge badge--${booking.checkedIn ? 'success' : 'primary'}">${booking.checkedIn ? 'Checked in' : 'Valid'}</span>
      </div>
      <div class="voucher-code">
        <span class="voucher-code__label">Sign-in code</span>
        <span class="voucher-code__value">${booking.accessCode}</span>
      </div>
      <svg id="${svgId}" class="voucher-barcode"></svg>
      <p class="voucher-ref">${booking.barcodeRef}</p>
      <div class="voucher-card__footer">
        <span class="voucher-price">${formatVoucherPrice(booking)}</span>
        <button type="button" class="btn btn--ghost btn--sm" data-download="${booking.id}">
          <ion-icon name="download-outline"></ion-icon> Download
        </button>
      </div>
    </div>
  `;
}

export function bindVoucherView(root, user) {
  const bookings = getUserBookings(user.id).filter((b) => b.paymentStatus === 'paid');
  bookings.forEach((b) => {
    renderBarcode(`barcode-${b.id}`, b.barcodeRef);
  });

  root.querySelectorAll('[data-download]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.download;
      const card = root.querySelector(`#voucher-${id}`);
      if (!card) return;
      const win = window.open('', '_blank');
      win.document.write(`
        <!DOCTYPE html><html><head><title>Extraordinary Life Voucher</title>
        <style>body{font-family:sans-serif;padding:24px;max-width:400px;margin:0 auto}
        h1{color:#E85D04;font-size:20px} .code{font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0}
        </style></head><body>${card.innerHTML}</body></html>`);
      win.document.close();
      win.print();
    });
  });
}
