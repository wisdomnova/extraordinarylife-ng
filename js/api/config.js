/** API base URL — set in index.html via window.EL_API_URL */
const DEFAULT_API = 'https://extraordinarylife-backend-production.up.railway.app';

export const API_BASE_URL = (window.EL_API_URL || DEFAULT_API).replace(/\/$/, '');
