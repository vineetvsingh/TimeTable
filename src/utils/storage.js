// localStorage can be unavailable (private mode, blocked storage), so every
// access is wrapped and failures fall back to defaults.
export const storage = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
  }
};

export const DARK_MODE_KEY = 'tt-dark-mode';
export const draftKey = (uid) => `tt-draft-${uid}`;
