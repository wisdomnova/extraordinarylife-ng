import { TERMS_AND_CONDITIONS, formatNaira, isConference, getSeatById, PRICES, VENUE } from '../config.js';
import { renderFloorPlan } from '../floor-plan.js';
import {
  getBookableDates,
  validateBooking,
  calculatePrice,
  countUserJuneBookings,
} from '../bookings.js';
import { loadAvailability, createBooking } from '../data.js';
import { completeFreeCheckout } from '../payment.js';
import { formatDisplayDate } from '../utils.js';
import { openModal } from '../components/modal.js';
import { renderSelectField, renderSelectInline } from '../components/select-field.js';
import { toast } from '../components/toast.js';
import { BOOKING_RULES } from '../config.js';

export function renderBookView(user) {
  const dates = getBookableDates();
  const juneUsed = countUserJuneBookings(user.id);
  const defaultDate = dates[0];

  return `
    <div class="page book-page">
      <div class="page-header">
        <div>
          <h1>Book a workspace</h1>
          <p class="page-subtitle">Select a date, then click a seat on the floor plan</p>
        </div>
        <div class="june-badge ${juneUsed >= BOOKING_RULES.juneMaxDays ? 'june-badge--full' : ''}">
          <ion-icon name="calendar"></ion-icon>
          June 2026: <strong>${juneUsed}</strong> / ${BOOKING_RULES.juneMaxDays} days used
        </div>
      </div>

      <div class="book-layout">
        <aside class="book-sidebar card">
          <h3>Booking details</h3>
          ${renderSelectField({
            id: 'book-date',
            label: 'Date',
            optionsHtml: dates.map((d) => `<option value="${d}">${formatDisplayDate(d)}</option>`).join(''),
          })}
          <div class="booking-summary" id="booking-summary">
            <p class="text-muted">Click a seat on the map to continue</p>
          </div>
          <button type="button" class="btn btn--primary btn--full" id="btn-confirm-book" disabled>
            Continue to payment
          </button>
          ${renderVenueContact()}
        </aside>
        <div class="book-map card" id="floor-plan-container"></div>
      </div>
    </div>
  `;
}

export function bindBookView(root, user, refresh) {
  let selectedSeatId = null;
  let sessionType = 'half';
  const dateSelect = root.querySelector('#book-date');
  const summary = root.querySelector('#booking-summary');
  const confirmBtn = root.querySelector('#btn-confirm-book');
  const mapContainer = root.querySelector('#floor-plan-container');

  const getDate = () => dateSelect.value;

  const updateMap = async () => {
    selectedSeatId = null;
    confirmBtn.disabled = true;
    summary.innerHTML = '<p class="text-muted">Click a seat on the map to continue</p>';
    mapContainer.innerHTML = '<p class="text-muted" style="padding:24px">Loading availability…</p>';
    try {
      await loadAvailability(getDate());
    } catch (err) {
      toast(err.message || 'Could not load availability', 'error');
    }
    mapContainer.innerHTML = renderFloorPlan({
      dateStr: getDate(),
      userId: user.id,
      selectedSeatId: null,
      onSeatSelect: onSeatSelect,
    });
    bindMapClicks();
  };

  const onSeatSelect = (seatId) => {
    selectedSeatId = seatId;
    updateSummary();
    mapContainer.innerHTML = renderFloorPlan({
      dateStr: getDate(),
      userId: user.id,
      selectedSeatId,
      onSeatSelect,
    });
    bindMapClicks();
  };

  const bindMapClicks = () => {
    mapContainer.querySelectorAll('.seat:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => onSeatSelect(btn.dataset.seatId));
    });
    const conf = mapContainer.querySelector('#conference-room-btn');
    if (conf && !conf.classList.contains('room-block--booked')) {
      conf.addEventListener('click', () => onSeatSelect('CONF'));
    }
  };

  const updateSummary = () => {
    if (!selectedSeatId) return;
    const seat = getSeatById(selectedSeatId);
    const conf = isConference(selectedSeatId);
    const price = calculatePrice(selectedSeatId, sessionType);

    summary.innerHTML = `
      <div class="summary-row"><span>Seat</span><strong>${seat?.label || selectedSeatId}</strong></div>
      <div class="summary-row"><span>Date</span><strong>${formatDisplayDate(getDate())}</strong></div>
      ${
        conf
          ? `
        <div class="form-group" style="margin-top:12px">
          <label for="session-type">Session</label>
          ${renderSelectInline({
            id: 'session-type',
            optionsHtml: `
            <option value="half" ${sessionType === 'half' ? 'selected' : ''}>Half day (${formatNaira(PRICES.conferenceHalf)})</option>
            <option value="full" ${sessionType === 'full' ? 'selected' : ''}>Full day (${formatNaira(PRICES.conferenceFull)})</option>`,
          })}
        </div>`
          : `<div class="summary-row"><span>Rate</span><strong>${formatNaira(PRICES.desk)} / day</strong></div>`
      }
      <div class="summary-total">
        <span>Total</span>
        <strong id="summary-price">${formatNaira(price)}</strong>
      </div>
    `;

    summary.querySelector('#session-type')?.addEventListener('change', (e) => {
      sessionType = e.target.value;
      updateSummary();
    });

    confirmBtn.disabled = false;
  };

  dateSelect.addEventListener('change', updateMap);
  updateMap();

  confirmBtn.addEventListener('click', () => {
    if (!selectedSeatId) return;
    const dateStr = getDate();
    const validation = validateBooking(user.id, selectedSeatId, dateStr, sessionType);
    if (!validation.ok) {
      toast(validation.errors[0], 'error');
      return;
    }
    showTermsAndPay(user, selectedSeatId, dateStr, sessionType, refresh);
  });
}

function renderVenueContact() {
  const address = VENUE.addressLines.join('<br />');
  return `
    <div class="venue-contact">
      <h4 class="venue-contact__title">Visit us</h4>
      <p class="venue-contact__row">
        <ion-icon name="location-outline" aria-hidden="true"></ion-icon>
        <span>${address}</span>
      </p>
      <p class="venue-contact__row">
        <ion-icon name="call-outline" aria-hidden="true"></ion-icon>
        <a href="tel:${VENUE.phoneTel}">${VENUE.phone}</a>
      </p>
    </div>
  `;
}

function renderCheckoutPricing(listPrice) {
  return `
    <div class="checkout-pricing">
      <div class="checkout-pricing__row">
        <span class="checkout-pricing__label">Standard rate</span>
        <span class="checkout-pricing__value">${formatNaira(listPrice)}</span>
      </div>
      <div class="checkout-pricing__row checkout-pricing__row--discount">
        <span class="checkout-pricing__label">Launch offer</span>
        <span class="checkout-pricing__badge">-100%</span>
        <span class="checkout-pricing__value checkout-pricing__value--minus">-${formatNaira(listPrice)}</span>
      </div>
      <div class="checkout-pricing__total">
        <span class="checkout-pricing__total-label">Total</span>
        <div class="checkout-pricing__total-amounts">
          <s class="checkout-pricing__struck">${formatNaira(listPrice)}</s>
          <strong class="checkout-pricing__final">${formatNaira(0)}</strong>
        </div>
      </div>
      <p class="checkout-pricing__note">Full rates apply soon. You pay nothing during the launch period.</p>
    </div>
  `;
}

function showTermsAndPay(user, seatId, dateStr, sessionType, refresh) {
  const listPrice = calculatePrice(seatId, sessionType);
  const seat = getSeatById(seatId);

  const { close } = openModal({
    title: 'Confirm booking',
    wide: true,
    bodyHtml: `
      <div class="confirm-booking">
        <p class="confirm-booking__meta"><strong>${seat?.label}</strong>, ${formatDisplayDate(dateStr)}</p>
        ${renderCheckoutPricing(listPrice)}
        <div class="terms-content terms-content--compact">${TERMS_AND_CONDITIONS}</div>
        <label class="checkbox">
          <input type="checkbox" id="booking-terms" />
          <span>I accept the Terms &amp; Conditions</span>
        </label>
      </div>
    `,
    footerHtml: `
      <button type="button" class="btn btn--ghost" id="cancel-book">Cancel</button>
      <button type="button" class="btn btn--primary" id="confirm-book" disabled>
        <ion-icon name="checkmark-circle-outline"></ion-icon> Confirm booking
      </button>
    `,
  });

  const modal = document.querySelector('.modal-overlay:last-child');
  const termsCb = modal.querySelector('#booking-terms');
  const confirmBtn = modal.querySelector('#confirm-book');

  termsCb.addEventListener('change', () => {
    confirmBtn.disabled = !termsCb.checked;
  });
  modal.querySelector('#cancel-book').addEventListener('click', close);

  confirmBtn.addEventListener('click', async () => {
    if (!termsCb.checked) return;
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-inline"></span> Confirming...';

    try {
      await completeFreeCheckout({ listPrice, email: user.email });
      await createBooking({
        seatId,
        date: dateStr,
        sessionType: isConference(seatId) ? sessionType : 'full',
        termsAccepted: true,
      });
      close();
      toast('Booking confirmed! View your voucher.', 'success');
      refresh('vouchers');
    } catch (err) {
      toast(err.message || 'Booking failed', 'error');
      confirmBtn.disabled = false;
      confirmBtn.innerHTML =
        '<ion-icon name="checkmark-circle-outline"></ion-icon> Confirm booking';
    }
  });
}
