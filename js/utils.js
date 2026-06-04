/** Shared utilities */

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateCode6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function todayISO() {
  const d = new Date();
  return formatDateISO(d);
}

export function formatDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateISO(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr, days) {
  const d = parseDateISO(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export function formatDisplayDate(dateStr) {
  const d = parseDateISO(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMemberSince(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isSunday(dateStr) {
  return parseDateISO(dateStr).getDay() === 0;
}

export function getCalendarDates() {
  const dates = [];
  const minBookable = new Date();
  minBookable.setDate(minBookable.getDate() + 1);

  for (let i = 0; i < 90; i++) {
    const d = new Date(minBookable);
    d.setDate(minBookable.getDate() + i);
    const iso = formatDateISO(d);
    if (!isSunday(iso)) dates.push(iso);
  }
  return dates;
}

export function isJune2026(dateStr) {
  const d = parseDateISO(dateStr);
  return d.getFullYear() === 2026 && d.getMonth() === 5;
}

export function monthKey(dateStr) {
  const d = parseDateISO(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** List price shown at booking (full rate before discounts). */
export function getBookingListPrice(booking) {
  return booking.listPrice ?? booking.amount ?? 0;
}

/** Amount actually paid (0 during free launch). */
export function getBookingPaidAmount(booking) {
  if (booking.listPrice != null) return booking.amountPaid ?? 0;
  return booking.amount ?? 0;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
