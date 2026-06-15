/** Sync in-memory cache from the API */

import { api, getToken, clearToken } from './api/client.js';
import {
  resetCache,
  setCacheUser,
  setCacheBookings,
  setCacheMaintenance,
  setCacheBookableDates,
  setCacheBlockedDates,
  getCacheBlockedDates,
  setCacheAvailability,
  setCacheMembers,
  setCacheMetrics,
  setCacheJuneQuota,
  upsertBooking,
  clearAvailabilityCache,
} from './storage.js';

export async function syncFromApi() {
  if (!getToken()) {
    resetCache();
    return;
  }

  try {
    const { user } = await api('/api/me');
    setCacheUser(user);

    const [bookingsRes, maintRes, datesRes, blockedRes] = await Promise.all([
      api('/api/bookings'),
      api('/api/maintenance'),
      api('/api/bookings/dates'),
      api('/api/blocked-dates'),
    ]);

    setCacheBookings(bookingsRes.bookings);
    setCacheMaintenance(maintRes.seats);
    setCacheBookableDates(datesRes.dates);
    setCacheBlockedDates(blockedRes.dates);

    if (user.role === 'admin') {
      const [metricsRes, membersRes, quotaRes] = await Promise.all([
        api('/api/admin/metrics'),
        api('/api/admin/members'),
        api('/api/admin/june-quota'),
      ]);
      setCacheMetrics(metricsRes.metrics);
      setCacheMembers(membersRes.members);
      setCacheJuneQuota(quotaRes.quota);
    }
  } catch (err) {
    if (err.status === 401) {
      clearToken();
      resetCache();
      return;
    }
    throw err;
  }
}

export async function loadAvailability(date) {
  const { statuses } = await api(`/api/bookings/availability?date=${encodeURIComponent(date)}`);
  setCacheAvailability(date, statuses);
  return statuses;
}

export async function createBooking(payload) {
  const res = await api('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  upsertBooking(res.booking);
  clearAvailabilityCache();
  return res.booking;
}

export async function refreshBookableDates() {
  const { dates } = await api('/api/bookings/dates');
  setCacheBookableDates(dates);
  return dates;
}

export async function addBlockedDate(date) {
  const res = await api('/api/blocked-dates', {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
  setCacheBlockedDates(res.dates);
  clearAvailabilityCache();
  await refreshBookableDates();
  return res.dates;
}

export async function removeBlockedDate(date) {
  const res = await api(`/api/blocked-dates/${encodeURIComponent(date)}`, {
    method: 'DELETE',
  });
  setCacheBlockedDates(res.dates);
  clearAvailabilityCache();
  await refreshBookableDates();
  return res.dates;
}

export async function updateMaintenanceSeats(seats) {
  const res = await api('/api/maintenance', {
    method: 'PUT',
    body: JSON.stringify({ seats }),
  });
  setCacheMaintenance(res.seats);
  clearAvailabilityCache();
  return res.seats;
}

export async function lookupBooking(barcodeRef) {
  return api(`/api/bookings/lookup?barcodeRef=${encodeURIComponent(barcodeRef)}`);
}

export async function checkInBooking(id) {
  const res = await api(`/api/bookings/${id}/check-in`, { method: 'PATCH' });
  upsertBooking(res.booking);
  return res.booking;
}
