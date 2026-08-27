const KEYS = {
  favorites: 'buanthlu:favorites',
  history: 'buanthlu:history',
  settings: 'buanthlu:settings'
};

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function getFavorites() {
  return read(KEYS.favorites, [])
}
export function toggleFavorite(id) {
  const values = getFavorites();
  const next = values.includes(id) ? values.filter(value => value !== id) : [...values, id];
  write(KEYS.favorites, next);
  return next.includes(id)
}
export function getHistory() {
  return read(KEYS.history, [])
}
export function addHistory(id) {
  write(KEYS.history, [id, ...getHistory().filter(value => value !== id)].slice(0, 10))
}
export function getSettings() {
  return {
    ...{
      font: 18,
      spacing: 'normal',
      width: 'normal',
      theme: 'system'
    },
    ...read(KEYS.settings, {})
  }
}
export function saveSettings(settings) {
  write(KEYS.settings, settings)
}
