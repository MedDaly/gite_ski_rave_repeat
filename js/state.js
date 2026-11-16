// Password + identity + theme, remembered on the device.
import { GUEST } from './config.js';

const KEYS = { pw: 'gh_pw', identity: 'gh_identity', theme: 'gh_theme', admin: 'gh_admin_pw' };
const memory = {}; // fallback when localStorage is unavailable (private mode…)

function read(key) {
  try { return localStorage.getItem(key); } catch { return memory[key] ?? null; }
}
function write(key, value) {
  try {
    if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, value);
  } catch {
    if (value == null) delete memory[key]; else memory[key] = value;
  }
}

const listeners = new Set();
const adminListeners = new Set();

export const state = {
  get password() { return read(KEYS.pw); },
  set password(v) { write(KEYS.pw, v); },

  get identity() { return read(KEYS.identity); },
  set identity(v) {
    write(KEYS.identity, v);
    listeners.forEach((fn) => fn(v));
  },
  get isGuest() { return this.identity === GUEST; },

  get adminPassword() { return read(KEYS.admin); },
  set adminPassword(v) {
    write(KEYS.admin, v);
    adminListeners.forEach((fn) => fn(!!v));
  },
  get isAdmin() { return !!this.adminPassword; },

  get theme() { return read(KEYS.theme); }, // 'light' | 'dark' | null (auto)
  set theme(v) { write(KEYS.theme, v); },
};

export function onIdentityChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function onAdminChange(fn) {
  adminListeners.add(fn);
  return () => adminListeners.delete(fn);
}
