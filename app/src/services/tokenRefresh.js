import axios from 'axios';

// Same base URL resolution as services/api.js. Kept here (rather than imported
// from api.js) so this module has no dependency on api.js — api.js imports US,
// and a back-import would create a cycle.
const BASE_URL = process.env.NODE_ENV !== 'production'
  ? 'https://localhost:7077/api/'
  : 'https://api.willowdrive.com/api/';

// Bare client with NO interceptors, so refreshing never recurses through the
// 401 handler in api.js (which is what calls us).
const refreshClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

let refreshTimer = null;
let inFlight = null; // single-flight: concurrent 401s share one refresh call

export function getToken() {
  try { return localStorage.getItem('token'); } catch (e) { return null; }
}
function getRefreshToken() {
  try { return localStorage.getItem('refreshToken'); } catch (e) { return null; }
}

function storeTokens(data) {
  try {
    if (data.token) localStorage.setItem('token', data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
  } catch (e) { /* ignore storage errors */ }
}

export function clearAuth() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  } catch (e) { /* ignore storage errors */ }
  stopTokenRefresh();
}

// Exchange the stored refresh token for a fresh access+refresh pair.
// Resolves to the new access token string, or null if refresh failed.
// Concurrent callers share a single in-flight request.
export function refreshTokens() {
  if (inFlight) return inFlight;

  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(null);

  inFlight = refreshClient.post('refresh', { RefreshToken: rt })
    .then((res) => {
      const data = res.data || {};
      storeTokens(data);
      scheduleProactiveRefresh(); // re-arm against the new token's exp
      return data.token || null;
    })
    .catch(() => {
      // Refresh token itself is dead/revoked — this is a real logout.
      clearAuth();
      return null;
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}

// Decode a JWT's `exp` (seconds since epoch) without pulling in a library.
function getExpMs(token) {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (e) { return null; }
}

// Arm a one-shot timer to refresh shortly BEFORE the current access token
// expires, so an idle kiosk renews itself with zero user interaction.
export function scheduleProactiveRefresh() {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }

  const token = getToken();
  if (!token) return;

  const expMs = getExpMs(token);
  if (!expMs) return;

  const lifetime = expMs - Date.now();
  // Refresh after ~80% of the remaining lifetime, but always at least 30s before
  // expiry so a refresh never races an expiring token.
  let delay = lifetime - Math.max(lifetime * 0.2, 30000);

  if (delay <= 0) {
    // Token already expired or about to — refresh immediately.
    refreshTokens();
    return;
  }

  refreshTimer = setTimeout(() => { refreshTokens(); }, delay);
}

// Call on app boot and right after login. No-op if there's no token.
export function startTokenRefresh() {
  if (!getToken()) return;
  scheduleProactiveRefresh();
}

export function stopTokenRefresh() {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}
