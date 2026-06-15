/** Sync in-memory cache from the API */

import { api, getToken, clearToken } from './api/client.js';
import {
  resetCache,
  setCacheUser,
  getCacheUser,
  setCacheBookings,
  setCacheMaintenance,
  setCacheBookableDates,
  setCacheBlockedDates,
  getProtectedBlockedDates,
  setCacheAvailability,
  setCacheMetrics,
  upsertBooking,
  clearAvailabilityCache,
} from './storage.js';

/** Minimal data needed to sign in and use the app quickly */
export async function syncEssentials(userFromAuth = null) {
  if (!getToken()) {
    resetCache();
    return null;
  }

  let user = userFromAuth || getCacheUser();
  if (!user) {
    const me = await api('/api/me');
    user = me.user;
  }
  setCacheUser(user);

  const tasks = [
    api('/api/bookings/dates'),
    api('/api/blocked-dates'),
    api('/api/maintenance'),
  ];
  if (user.role !== 'admin') {
    tasks.push(api('/api/bookings'));
  }

  const results = await Promise.all(tasks);
  setCacheBookableDates(results[0].dates);
  setCacheBlockedDates(results[1].dates, results[1].protected || []);
  setCacheMaintenance(results[2].seats);
  setCacheBookings(user.role === 'admin' ? [] : results[3].bookings);

  return user;
}

export async function syncFromApi() {
  try {
    const user = await syncEssentials();
    if (!user) return null;
    if (user.role === 'admin') {
      const { metrics } = await api('/api/admin/metrics');
      setCacheMetrics(metrics);
    }
    return user;
  } catch (err) {
    if (err.status === 401) {
      clearToken();
      resetCache();
      return null;
    }
    throw err;
  }
}

export async function fetchAdminBookings(page = 1) {
  return api(`/api/admin/bookings?page=${page}&limit=20`);
}

export async function fetchAdminMembers(page = 1) {
  return api(`/api/admin/members?page=${page}&limit=12`);
}

export async function fetchAdminMember(id) {
  return api(`/api/admin/members/${id}`);
}

export async function fetchAdminJuneQuota(page = 1) {
  return api(`/api/admin/june-quota?page=${page}&limit=15`);
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
  setCacheBlockedDates(res.dates, res.protected || getProtectedBlockedDates());
  clearAvailabilityCache();
  await refreshBookableDates();
  return res.dates;
}

export async function removeBlockedDate(date) {
  const res = await api(`/api/blocked-dates/${encodeURIComponent(date)}`, {
    method: 'DELETE',
  });
  setCacheBlockedDates(res.dates, res.protected || getProtectedBlockedDates());
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
