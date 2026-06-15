/** Extraordinary Life: seat layout, pricing, and legal copy */

export const BRAND = {
  name: 'Extraordinary Life',
  shortName: 'ExtraordinaryLife',
  primary: '#E85D04',
  navy: '#0A1931',
};

export const VENUE = {
  addressLines: ['12 Ebitu Ukiwe Street', 'Jabi', 'Abuja'],
  phone: '+234 816 523 5161',
  phoneTel: '+2348165235161',
};

export const VENUE_HOURS = {
  open: '09:00',
  close: '17:00',
};

/** Hourly slots from open through close (e.g. 09:00 … 17:00). */
export function getHourlyTimeSlots() {
  const slots = [];
  const [openH] = VENUE_HOURS.open.split(':').map(Number);
  const [closeH] = VENUE_HOURS.close.split(':').map(Number);
  for (let h = openH; h <= closeH; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
}

export function getConferenceTimes(sessionType) {
  if (sessionType === 'full') return { startTime: '09:00', endTime: '17:00' };
  return { startTime: '09:00', endTime: '13:00' };
}

export const PRICES = {
  desk: 10000,
  conferenceHalf: 25000,
  conferenceFull: 45000,
};

export const BOOKING_RULES = {
  minAdvanceDays: 1,
  calendarDays: 90,
  juneYear: 2026,
  juneMaxDays: 10,
  conferenceMaxPerMonth: 1,
};

/** Blocked dates admins cannot unblock (e.g. fixed closures) */
export const PROTECTED_BLOCKED_DATES = ['2026-06-25'];

export const TERMS_AND_CONDITIONS = `
<h3>Extraordinary Life Terms &amp; Conditions</h3>
<p><strong>Last updated:</strong> June 2026</p>

<h4>1. Acceptable Use of the Space</h4>
<p>Extraordinary Life is a professional co-working environment. Members must use facilities respectfully, keep noise to a minimum in designated quiet zones, and comply with all house rules posted on-site. Commercial solicitation of other members without prior consent is prohibited.</p>

<h4>2. Cancellation Policy</h4>
<p>Cancellations made more than 24 hours before the booked date are eligible for a full refund to the original payment method. <strong>No refund</strong> will be issued for cancellations made within 24 hours of the booking date, including no-shows.</p>

<h4>3. Liability Disclaimer</h4>
<p>Extraordinary Life and its operators are not liable for loss, theft, or damage to personal property. Members use the space at their own risk. Extraordinary Life is not responsible for interruptions due to maintenance, power outages, or events beyond reasonable control.</p>

<h4>4. Data Consent</h4>
<p>By registering and booking, you consent to Extraordinary Life collecting and processing your personal data (name, email, phone, organisation, profile photo, and booking history) for account management, access control, and operational communications. Data is stored securely and not sold to third parties.</p>

<h4>5. House Rules</h4>
<ul>
  <li><strong>No food at desks:</strong> meals and snacks are permitted only in the kitchen area.</li>
  <li><strong>Quiet zones:</strong> phone calls must be taken in designated areas or the conference room when booked.</li>
  <li>Keep workstations tidy; remove personal items at end of day.</li>
  <li>Conference room bookings must end on time; overrun may incur additional charges.</li>
  <li>Guests must be signed in at reception and are the member's responsibility.</li>
  <li>Smoking and vaping are prohibited inside the building.</li>
</ul>

<p>By accepting these terms, you agree to abide by all policies above. Extraordinary Life reserves the right to suspend accounts for violations.</p>
`;

export const CONSENT_TEXT =
  'I agree to Extraordinary Life collecting and using my personal information (name, email, phone, organisation, and profile photo) for account management and workspace access, as described in the Privacy Policy.';

/** All 17 hot desk seats with grid positions for floor plan */
export const HOT_DESKS = [
  { id: '17', label: 'Seat 17', cluster: 'top-left', row: 0, col: 0 },
  { id: '16', label: 'Seat 16', cluster: 'top-left', row: 0, col: 1 },
  { id: '15', label: 'Seat 15', cluster: 'top-left', row: 1, col: 0 },
  { id: '14', label: 'Seat 14', cluster: 'top-left', row: 1, col: 1 },
  { id: '13', label: 'Seat 13', cluster: 'top-right', row: 0, col: 0 },
  { id: '12', label: 'Seat 12', cluster: 'top-right', row: 0, col: 1 },
  { id: '10', label: 'Seat 10', cluster: 'top-right', row: 1, col: 0 },
  { id: '11', label: 'Seat 11', cluster: 'top-right', row: 1, col: 1 },
  { id: '05', label: 'Seat 05', cluster: 'mid-left', wide: true },
  { id: '02', label: 'Seat 02', cluster: 'mid-left-grid', row: 0, col: 0 },
  { id: '04', label: 'Seat 04', cluster: 'mid-left-grid', row: 0, col: 1 },
  { id: '01', label: 'Seat 01', cluster: 'mid-left-grid', row: 1, col: 0 },
  { id: '03', label: 'Seat 03', cluster: 'mid-left-grid', row: 1, col: 1 },
  { id: '07', label: 'Seat 07', cluster: 'mid-center', row: 0, col: 0 },
  { id: '09', label: 'Seat 09', cluster: 'mid-center', row: 0, col: 1 },
  { id: '06', label: 'Seat 06', cluster: 'mid-center', row: 1, col: 0 },
  { id: '08', label: 'Seat 08', cluster: 'mid-center', row: 1, col: 1 },
];

export const CONFERENCE_ROOM = {
  id: 'CONF',
  label: 'Conference Room',
  type: 'conference',
};

export const ALL_SEATS = [...HOT_DESKS, CONFERENCE_ROOM];

export function getSeatById(id) {
  return ALL_SEATS.find((s) => s.id === id) || null;
}

export function isConference(seatId) {
  return seatId === 'CONF';
}

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function padSeatId(id) {
  if (id === 'CONF') return 'CONF';
  return String(id).padStart(2, '0');
}
