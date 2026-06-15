/** Authentication via API */

import { api, setToken, clearToken } from './api/client.js';
import { setCacheUser, getCacheUser, resetCache } from './storage.js';
import { syncEssentials } from './data.js';
import { fileToBase64 } from './utils.js';

export function getCurrentUser() {
  return getCacheUser();
}

export async function login(email, password) {
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    setCacheUser(res.user);
    await syncEssentials(res.user);
    return { ok: true, user: res.user };
  } catch (err) {
    return { ok: false, error: err.message || 'Login failed' };
  }
}

export function logout() {
  clearToken();
  resetCache();
}

export async function register(data) {
  const { fullName, email, phone, organisation, password, photoFile, consent, termsAccepted } =
    data;

  if (!consent) {
    return { ok: false, error: 'You must consent to personal data use.' };
  }
  if (!termsAccepted) {
    return { ok: false, error: 'You must accept the Terms & Conditions.' };
  }

  let photo = null;
  if (photoFile) {
    photo = await fileToBase64(photoFile);
  }

  try {
    const res = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        fullName,
        email,
        phone,
        organisation,
        password,
        photo,
        consent,
        termsAccepted,
      }),
    });
    setToken(res.token);
    setCacheUser(res.user);
    await syncEssentials(res.user);
    return { ok: true, user: res.user };
  } catch (err) {
    return { ok: false, error: err.message || 'Registration failed' };
  }
}

export function isAdmin(user) {
  return user?.role === 'admin';
}
