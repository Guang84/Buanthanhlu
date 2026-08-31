import {
  buildHymnURL,
  getActiveBook,
  getHymnById
} from './data.js';
import {
  getFavorites,
  getHistory
} from './storage.js';
export const $ = selector => document.querySelector(selector);
export function toast(message) {
  const node = $('[data-toast]');
  node.textContent = message;
  node.classList.add('visible');
  setTimeout(() => node.classList.remove('visible'), 2200)
}
export function renderMiniLists() {
  for (const [selector, ids] of [
      ['[data-favorites-list]', getFavorites()],
      ['[data-history-list]', getHistory()]
    ]) {
    const node = $(selector);
    if (!node) return;
    node.replaceChildren();
    const bookId = getActiveBook()?.id;
    const hymns = ids
      .filter(id => id.startsWith(`${bookId}:`))
      .map(id => getHymnById(id.slice(bookId.length + 1)))
      .filter(Boolean);
    if (!hymns.length) {
      node.innerHTML = '<p class="empty-state">No ' + (selector.includes('favorites') ? 'favorite' : 'recently viewed') + ' songs yet.</p>';
      continue
    }
    hymns.forEach(hymn => {
      const link = document.createElement('a');
      link.className = 'mini-link';
      link.href = buildHymnURL(hymn);
      link.innerHTML = `<span>${hymn.number}</span><b>${escapeHTML(hymn.title)}</b>`;
      node.append(link)
    })
  }
}
export function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  } [char]))
}
