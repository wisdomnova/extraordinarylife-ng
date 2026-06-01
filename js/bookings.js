/** Booking helpers — reads from in-memory cache synced via API */

import { BOOKING_RULES, PRICES, isConference } from './config.js';
import {
  getCacheBookings,
  getMaintenanceSeats,
  getCacheBookableDates,
  getCacheAvailability,
  getCacheMetrics,
  getCacheJuneQuota,
  findCachedMemberById,
} from './storage.js';
import {
  todayISO,
  addDays,
  isJune2026,
  monthKey,
  getCalendarDates,
} from './utils.js';

export function getBookableDates() {
  const cached = getCacheBookableDates();
  return cached.length ? cached : getCalendarDates(true);
}

export function getUserDeskBookingOnDate(userId, dateStr) {
  return getCacheBookings().find(
    (b) =>
      b.userId === userId &&
      b.date === dateStr &&
      !isConference(b.seatId) &&
      b.paymentStatus === 'paid'
  );
}

export function getSeatBookingOnDate(seatId, dateStr) {
  return getCacheBookings().find(
    (b) => b.seatId === seatId && b.date === dateStr && b.paymentStatus === 'paid'
  );
}

export function countUserJuneBookings(userId) {
  return getCacheBookings().filter(
    (b) =>
      b.userId === userId &&
      isJune2026(b.date) &&
      !isConference(b.seatId) &&
      b.paymentStatus === 'paid'
  ).length;
}

export function countUserConferenceInMonth(userId, dateStr) {
  const mk = monthKey(dateStr);
  return getCacheBookings().filter(
    (b) =>
      b.userId === userId &&
      isConference(b.seatId) &&
      monthKey(b.date) === mk &&
      b.paymentStatus === 'paid'
  ).length;
}

export function isSeatInMaintenance(seatId) {
  return getMaintenanceSeats().includes(seatId);
}

export function getSeatStatus(seatId, dateStr, userId) {
  const cached = getCacheAvailability(dateStr);
  if (cached?.[seatId]) return cached[seatId];

  if (isSeatInMaintenance(seatId)) return 'maintenance';
  const booked = getSeatBookingOnDate(seatId, dateStr);
  if (booked) {
    if (booked.userId === userId) return 'yours';
    return 'booked';
  }
  return 'available';
}

export function validateBooking(userId, seatId, dateStr, sessionType = null) {
  const errors = [];

  const minDate = addDays(todayISO(), BOOKING_RULES.minAdvanceDays);
  if (dateStr < minDate) {
    errors.push('Bookings must be made at least 1 day in advance.');
  }

  const bookable = getBookableDates();
  if (!bookable.includes(dateStr)) {
    errors.push('Selected date is outside the 90-day booking window.');
  }

  if (isSeatInMaintenance(seatId)) {
    errors.push('This seat is unavailable for maintenance.');
  }

  const existingSeat = getSeatBookingOnDate(seatId, dateStr);
  if (existingSeat) {
    errors.push('This seat is already booked for the selected date.');
  }

  if (!isConference(seatId)) {
    const userDesk = getUserDeskBookingOnDate(userId, dateStr);
    if (userDesk) {
      errors.push('You already have a desk booking on this date (one seat per day).');
    }

    if (isJune2026(dateStr)) {
      const juneCount = countUserJuneBookings(userId);
      const alreadyHasThis = getCacheBookings().some(
        (b) =>
          b.userId === userId &&
          b.date === dateStr &&
          !isConference(b.seatId) &&
          b.paymentStatus === 'paid'
      );
      if (!alreadyHasThis && juneCount >= BOOKING_RULES.juneMaxDays) {
        errors.push(
          `June 2026 limit reached: you have used all ${BOOKING_RULES.juneMaxDays} allowed booking days.`
        );
      }
    }
  } else {
    if (countUserConferenceInMonth(userId, dateStr) >= BOOKING_RULES.conferenceMaxPerMonth) {
      errors.push('Conference room limit: maximum 1 booking per calendar month.');
    }
    const confBooked = getSeatBookingOnDate('CONF', dateStr);
    if (confBooked && sessionType) {
      if (confBooked.sessionType === 'full' || sessionType === 'full') {
        errors.push('Conference room is not available for the selected session.');
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function calculatePrice(seatId, sessionType) {
  if (isConference(seatId)) {
    return sessionType === 'full' ? PRICES.conferenceFull : PRICES.conferenceHalf;
  }
  return PRICES.desk;
}

export function getUserBookings(userId) {
  return getCacheBookings()
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getAllBookings() {
  return [...getCacheBookings()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getTodayMetrics() {
  const cached = getCacheMetrics();
  if (cached) return cached;

  const today = todayISO();
  const bookings = getCacheBookings().filter((b) => b.date === today && b.paymentStatus === 'paid');
  const revenue = bookings.reduce((s, b) => s + (b.amountPaid ?? b.amount ?? 0), 0);
  const checkIns = bookings.filter((b) => b.checkedIn).length;
  const deskBooked = bookings.filter((b) => !isConference(b.seatId)).length;

  return {
    bookingsToday: bookings.length,
    revenue,
    availableSeats: Math.max(0, 17 - deskBooked),
    checkIns,
  };
}

export function getJuneQuotaList() {
  const cached = getCacheJuneQuota();
  if (cached.length) return cached;

  return [];
}

export function findMemberById(id) {
  return findCachedMemberById(id);
}
