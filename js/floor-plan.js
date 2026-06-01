/** Interactive floor plan renderer */

import { HOT_DESKS, CONFERENCE_ROOM } from './config.js';
import { getSeatStatus } from './bookings.js';

function renderSeat(seat, dateStr, userId, selectedId, onSelect) {
  const status = getSeatStatus(seat.id, dateStr, userId);
  const isSelected = selectedId === seat.id;
  const clickable = status === 'available' || status === 'yours';
  const wide = seat.wide ? ' seat--wide' : '';

  return `
    <button
      type="button"
      class="seat seat--${status}${wide}${isSelected ? ' seat--selected' : ''}"
      data-seat-id="${seat.id}"
      ${!clickable ? 'disabled' : ''}
      title="${seat.label}: ${status}"
    >
      <span class="seat__num">${seat.id}</span>
      <span class="seat__status">${statusLabel(status)}</span>
    </button>
  `;
}

function statusLabel(status) {
  const map = {
    available: 'Open',
    booked: 'Taken',
    yours: 'Yours',
    maintenance: 'Maint.',
  };
  return map[status] || status;
}

function renderCluster2x2(seats, dateStr, userId, selectedId) {
  const sorted = [...seats].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });
  return `<div class="cluster cluster--2x2">${sorted.map((s) => renderSeat(s, dateStr, userId, selectedId)).join('')}</div>`;
}

export function renderFloorPlan({ dateStr, userId, selectedSeatId, onSeatSelect }) {
  const byCluster = (name) => HOT_DESKS.filter((s) => s.cluster === name);

  const html = `
    <div class="floor-plan" id="floor-plan">
      <div class="floor-plan__legend">
        <span><i class="dot dot--available"></i> Available</span>
        <span><i class="dot dot--booked"></i> Booked</span>
        <span><i class="dot dot--yours"></i> Yours</span>
        <span><i class="dot dot--maintenance"></i> Maintenance</span>
      </div>

      <div class="floor-plan__room">
        <!-- Top row -->
        <div class="floor-plan__top">
          <div class="floor-plan__cluster-group">
            ${renderCluster2x2(byCluster('top-left'), dateStr, userId, selectedSeatId)}
          </div>
          <div class="floor-plan__walkway floor-plan__walkway--v" aria-label="Walkway"></div>
          <div class="floor-plan__cluster-group">
            ${renderCluster2x2(byCluster('top-right'), dateStr, userId, selectedSeatId)}
          </div>
          <div class="floor-plan__right-column">
            <div class="room-block room-block--conference" data-seat-id="CONF" id="conference-room-btn">
              <ion-icon name="people"></ion-icon>
              <span>Conference</span>
              <span class="room-block__price">from ₦25k</span>
            </div>
            <div class="room-block room-block--kitchen">
              <ion-icon name="cafe"></ion-icon>
              <span>Kitchen</span>
            </div>
          </div>
        </div>

        <!-- Middle -->
        <div class="floor-plan__middle">
          <div class="floor-plan__left">
            ${renderSeat(byCluster('mid-left')[0], dateStr, userId, selectedSeatId)}
            ${renderCluster2x2(byCluster('mid-left-grid'), dateStr, userId, selectedSeatId)}
          </div>
          <div class="floor-plan__center">
            ${renderCluster2x2(byCluster('mid-center'), dateStr, userId, selectedSeatId)}
          </div>
          <div class="floor-plan__right-spacer"></div>
        </div>

        <!-- Bottom -->
        <div class="floor-plan__bottom">
          <div class="room-block room-block--entrance">
            <ion-icon name="enter"></ion-icon>
            <span>Entrance</span>
          </div>
          <div class="floor-plan__open-space">
            <span>Open Space</span>
            <small>Not bookable</small>
          </div>
          <div class="room-block room-block--restroom">
            <ion-icon name="water"></ion-icon>
            <span>Rest Room</span>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const plan = document.getElementById('floor-plan');
    if (!plan) return;

    plan.querySelectorAll('.seat:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => onSeatSelect?.(btn.dataset.seatId));
    });

    const conf = document.getElementById('conference-room-btn');
    if (conf) {
      const status = getSeatStatus('CONF', dateStr, userId);
      conf.classList.add(`room-block--${status}`);
      if (status === 'available' || status === 'yours') {
        conf.style.cursor = 'pointer';
        conf.addEventListener('click', () => onSeatSelect?.('CONF'));
      }
      if (selectedSeatId === 'CONF') conf.classList.add('room-block--selected');
    }
  }, 0);

  return html;
}

export function bindFloorPlanEvents(container, onSeatSelect) {
  container?.querySelectorAll('.seat:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => onSeatSelect(btn.dataset.seatId));
  });
}
