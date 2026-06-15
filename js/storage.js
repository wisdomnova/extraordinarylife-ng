/** In-memory cache synced from the API */

const cache = {
  user: null,
  bookings: [],
  maintenance: [],
  availability: {},
  bookableDates: [],
  blockedDates: [],
  protectedBlockedDates: [],
  members: [],
  metrics: null,
  juneQuota: [],
};

export function resetCache() {
  cache.user = null;
  cache.bookings = [];
  cache.maintenance = [];
  cache.availability = {};
  cache.bookableDates = [];
  cache.blockedDates = [];
  cache.protectedBlockedDates = [];
  cache.members = [];
  cache.metrics = null;
  cache.juneQuota = [];
}

export function getCacheUser() {
  return cache.user;
}

export function setCacheUser(user) {
  cache.user = user;
}

export function getCacheBookings() {
  return cache.bookings;
}

export function setCacheBookings(bookings) {
  cache.bookings = bookings;
}

export function upsertBooking(booking) {
  const idx = cache.bookings.findIndex((b) => b.id === booking.id);
  if (idx >= 0) cache.bookings[idx] = booking;
  else cache.bookings.push(booking);
}

export function getMaintenanceSeats() {
  return cache.maintenance;
}

export function setCacheMaintenance(seats) {
  cache.maintenance = seats;
}

export function getCacheAvailability(date) {
  return cache.availability[date] || null;
}

export function setCacheAvailability(date, statuses) {
  cache.availability[date] = statuses;
}

export function clearAvailabilityCache() {
  cache.availability = {};
}

export function getCacheBookableDates() {
  return cache.bookableDates;
}

export function setCacheBookableDates(dates) {
  cache.bookableDates = dates;
}

export function getCacheBlockedDates() {
  return cache.blockedDates;
}

export function setCacheBlockedDates(dates, protectedDates = []) {
  cache.blockedDates = dates;
  cache.protectedBlockedDates = protectedDates;
}

export function getProtectedBlockedDates() {
  return cache.protectedBlockedDates;
}

export function getCacheMembers() {
  return cache.members;
}

export function setCacheMembers(members) {
  cache.members = members;
}

export function getCacheMetrics() {
  return cache.metrics;
}

export function setCacheMetrics(metrics) {
  cache.metrics = metrics;
}

export function getCacheJuneQuota() {
  return cache.juneQuota;
}

export function setCacheJuneQuota(quota) {
  cache.juneQuota = quota;
}

export function findCachedMemberById(id) {
  return cache.members.find((m) => m.id === id) || null;
}
