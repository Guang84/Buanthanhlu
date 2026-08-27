import {
  loadHymns,
  getAllHymns,
  getHymnByNumber,
  getPreviousHymn,
  getNextHymn,
  buildHymnURL,
  searchHymns
} from './data.js';
import {
  addHistory,
  getFavorites,
  getHistory,
  toggleFavorite
} from './storage.js';
import {
  $,
  escapeHTML,
  renderMiniLists,
  toast
} from './ui.js';
import {
  initSettings
} from './settings.js';
const markQuery = (text, query) => {
  const safe = escapeHTML(text);
  if (!query) return safe;
  return safe.replace(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'ig'), '<mark>$1</mark>')
};
async function applyPdfLink() {
  const link = $('[data-pdf-link]');
  if (!link) return;
  try {
    const metadata = await (await fetch('data/metadata.json', {
      cache: 'no-store'
    })).json();
    const pdfUrl = metadata.source?.pdfUrl || metadata.source?.file;
    if (pdfUrl) {
      link.href = pdfUrl;
      if (pdfUrl.startsWith('http')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer'
      }
    }
  } catch {}
}

function renderIndex() {
  const node = $('[data-hymn-index]');
  node.replaceChildren();
  getAllHymns().forEach(hymn => {
    const link = document.createElement('a');
    link.className = 'hymn-number';
    link.href = buildHymnURL(hymn);
    link.textContent = hymn.number;
    link.setAttribute('aria-label', `Open hymn ${hymn.number}: ${hymn.title}`);
    node.append(link)
  });
  $('[data-hymn-count]').textContent = `${getAllHymns().length} hymns`
}

function initSearch() {
  const input = $('[data-search-input]'),
    results = $('[data-search-results]'),
    status = $('[data-search-status]'),
    clear = $('[data-clear-search]');
  if (!input) return;
  input.addEventListener('input', () => {
    const query = input.value.trim();
    clear.hidden = !query;
    const matches = searchHymns(query);
    status.textContent = query ? `${matches.length} result${matches.length===1?'':'s'}` : '';
    results.replaceChildren();
    matches.slice(0, 30).forEach(hymn => {
      const link = document.createElement('a');
      link.className = 'result-link';
      link.href = buildHymnURL(hymn);
      link.innerHTML = `<strong>${hymn.number}</strong><span>${markQuery(hymn.title,query)}</span>`;
      results.append(link)
    });
    if (query && !matches.length) results.innerHTML = '<p class="empty-state">No hymns match that search.</p>'
  });
  clear.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus()
  })
}

function renderHome() {
  renderIndex();
  renderMiniLists();
  const last = getAllHymns().find(h => h.id === getHistory()[0]);
  if (last) {
    $('[data-continue-section]').hidden = false;
    $('[data-continue-title]').textContent = `Hymn ${last.number} · ${last.title}`;
    $('[data-continue-link]').href = buildHymnURL(last)
  }
  initSearch()
}

function renderReader() {
  const number = new URLSearchParams(location.search).get('number');
  const hymn = number ? getHymnByNumber(number) : location.search.includes('random') ? getAllHymns()[Math.floor(Math.random() * getAllHymns().length)] : null;
  if (!hymn) {
    $('[data-reader-error]').hidden = false;
    return
  }
  addHistory(hymn.id);
  const reader = $('[data-reader]');
  reader.hidden = false;
  $('[data-reader-number]').textContent = `Hymn ${hymn.number}`;
  $('[data-reader-title]').textContent = hymn.title;
  $('[data-verification]').textContent = hymn.verification?.status === 'verified' ? 'Verified transcription' : 'Transcribed from supplied PDF; editorial review pending';
  const lyrics = $('[data-lyrics]');
  hymn.content.lines.forEach(line => {
    const p = document.createElement('p');
    p.textContent = line;
    lyrics.append(p)
  });
  const favorite = $('[data-favorite-button]');
  const updateFavorite = () => {
    favorite.textContent = getFavorites().includes(hymn.id) ? '★ Favorited' : '☆ Favorite'
  };
  updateFavorite();
  favorite.addEventListener('click', () => {
    const active = toggleFavorite(hymn.id);
    updateFavorite();
    toast(active ? 'Added to favorites' : 'Removed from favorites')
  });
  const previous = getPreviousHymn(hymn),
    next = getNextHymn(hymn);
  const nav = $('[data-reader-nav]');
  nav.hidden = false;
  for (const [selector, item, label] of [
      ['[data-previous]', previous, '[data-previous-label]'],
      ['[data-next]', next, '[data-next-label]']
    ]) {
    const link = $(selector);
    if (item) {
      link.href = buildHymnURL(item);
      $(label).textContent = `${item.number} · ${item.title}`
    } else {
      link.setAttribute('aria-disabled', 'true');
      link.removeAttribute('href');
      $(label).textContent = 'End of hymnal'
    }
  }
  $('[data-share-button]').addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) await navigator.share({
        title: `Hymn ${hymn.number} · ${hymn.title}`,
        url
      });
      else {
        await navigator.clipboard.writeText(url);
        toast('Link copied')
      }
    } catch {
      toast('Unable to share this link')
    }
  });
  $('[data-print-button]').addEventListener('click', () => print())
}

function initKeys() {
  document.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (event.key === '/' && $('[data-search-input]')) {
      event.preventDefault();
      $('[data-search-input]').focus()
    }
    if (event.key.toLowerCase() === 'h') location.href = 'index.html';
    if (document.body.dataset.page === 'reader') {
      if (event.key === 'ArrowLeft' && !$('[data-previous]').getAttribute('aria-disabled')) location.href = $('[data-previous]').href;
      if (event.key === 'ArrowRight' && !$('[data-next]').getAttribute('aria-disabled')) location.href = $('[data-next]').href;
      if (event.key.toLowerCase() === 'f') $('[data-favorite-button]').click()
    }
  })
}
async function init() {
  initSettings();
  initKeys();
  applyPdfLink();
  try {
    await loadHymns();
    document.body.dataset.page === 'home' ? renderHome() : renderReader()
  } catch {
    $('[data-hymn-index]')?.replaceChildren(Object.assign(document.createElement('p'), {
      className: 'error-state',
      textContent: 'Unable to load hymnal data. Please try again.'
    }))
  }
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(registration => {
    const showUpdate = () => {
      const node = $('[data-update]');
      if (node) {
        node.hidden = false;
        node.querySelector('button')?.addEventListener('click', () => location.reload(), {
          once: true
        })
      }
    };
    if (registration.waiting) showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (worker) worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate()
      })
    });
    registration.update()
  }).catch(() => {})
}
initServiceWorker();
init();
