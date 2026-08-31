import {
  buildBookURL,
  buildHymnURL,
  getActiveBook,
  getAllHymns,
  getBooks,
  getHymnByNumber,
  getHymnsAlphabetically,
  getLibrary,
  getNextHymn,
  getPreviousHymn,
  getRecordKey,
  getSongSections,
  loadBook,
  loadLibrary,
  searchAcrossBooks,
  searchHymns
} from './data.js';
import { addHistory, getFavorites, getHistory, toggleFavorite } from './storage.js';
import { $, renderMiniLists, toast } from './ui.js';
import { initSettings } from './settings.js';

const PAGE_SIZE = 60;
let catalogSongs = [];
let visibleSongCount = PAGE_SIZE;

const selectedBookId = () => new URLSearchParams(location.search).get('book');
const setText = (selector, value = '—') => document.querySelectorAll(selector).forEach(node => { node.textContent = value || '—'; });

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function applyBookTheme(book) {
  const accent = book?.theme?.accent;
  const accentSoft = book?.theme?.accentSoft;
  if (accent) document.documentElement.style.setProperty('--book-accent', accent);
  else document.documentElement.style.removeProperty('--book-accent');
  if (accentSoft) document.documentElement.style.setProperty('--book-accent-soft', accentSoft);
  else document.documentElement.style.removeProperty('--book-accent-soft');
}

function renderAppDetails() {
  const library = getLibrary()?.library;
  if (!library) return;
  setText('[data-library-name]', library.name);
  setText('[data-library-eyebrow]', library.eyebrow || 'Digital songbook library');
  setText('[data-library-title]', library.title);
  setText('[data-library-intro]', library.intro);
  setText('[data-library-about]', library.about);
  setText('[data-book-count]', getBooks().length);
  const totalSongs = getBooks().reduce((total, book) => total + (Number.isInteger(book.songCount) ? book.songCount : 0), 0);
  setText('[data-total-song-count]', totalSongs || '—');
  const image = $('[data-library-image]');
  if (image && library.heroImage) {
    image.src = library.heroImage;
    image.alt = library.heroImageAlt || library.name;
  }
}

function renderBookList() {
  const node = $('[data-book-list]');
  if (!node) return;
  node.replaceChildren();
  getBooks().forEach(book => {
    const link = createElement('a', 'book-card');
    link.href = buildBookURL(book);
    link.setAttribute('aria-label', `Open ${book.title}`);
    if (book.theme?.accent) link.style.setProperty('--card-accent', book.theme.accent);
    const image = createElement('img', 'book-card-cover');
    image.src = book.coverImage || 'assets/Rongmei Gospel song books.png';
    image.alt = book.coverImageAlt || `Cover of ${book.title}`;
    const content = createElement('span', 'book-card-content');
    content.append(
      createElement('span', 'book-card-label', 'Songbook'),
      createElement('strong', '', book.title),
      createElement('small', '', book.subtitle || book.language || 'Digital songbook'),
      createElement('span', 'book-card-credit', `Edited by ${book.credits.editor}`),
      createElement('span', 'book-card-open', `${book.songCount || 'View'} songs  →`)
    );
    link.append(image, content);
    node.append(link);
  });
}

function renderBookFooter(book) {
  if (!book) return;
  setText('[data-book-footer-title]', book.title);
  setText('[data-book-editor]', book.credits.editor);
  setText('[data-book-compiler]', book.credits.compiledBy);
  setText('[data-book-publisher]', book.credits.publisher);
  setText('[data-book-year]', book.credits.year);
  setText('[data-book-rights]', book.credits.rights);
  const source = $('[data-book-source]');
  if (source) {
    const externalURL = book.songs?.url?.trim();
    source.hidden = !externalURL;
    if (externalURL) source.href = externalURL;
  }
}

function renderChangelog(book) {
  const block = $('[data-book-changelog]');
  const list = $('[data-book-changelog-list]');
  if (!block || !list) return;
  const entries = Array.isArray(book.changelog) ? book.changelog : [];
  block.hidden = !entries.length;
  list.replaceChildren();
  entries.forEach(entry => {
    const item = createElement('li');
    const date = createElement('time', 'changelog-date', entry.date || 'Update');
    if (entry.date) date.dateTime = entry.date;
    item.append(date, createElement('span', '', entry.note || 'Editorial update.'));
    list.append(item);
  });
}

function renderBookDetails() {
  const book = getActiveBook();
  if (!book) return;
  applyBookTheme(book);
  setText('[data-active-book-title]', book.title);
  setText('[data-active-book-name]', book.name);
  setText('[data-active-book-subtitle]', book.subtitle);
  setText('[data-active-book-summary]', book.intro.summary);
  setText('[data-active-book-description]', book.intro.description);
  setText('[data-active-book-language]', book.language);
  setText('[data-active-song-count]', book.songCount);
  setText('[data-active-book-updated]', book.updatedAt);
  const cover = $('[data-active-cover]');
  if (cover) {
    cover.src = book.coverImage || 'assets/Rongmei Gospel song books.png';
    cover.alt = book.coverImageAlt || `Cover of ${book.title}`;
  }
  const random = $('[data-random-link]');
  if (random) random.href = `hymn.html?book=${encodeURIComponent(book.id)}&random=1`;
  document.title = `${book.title} | Rongmei Hymnal`;
  renderBookFooter(book);
  renderChangelog(book);
}

function renderSongTable(songs = getHymnsAlphabetically(), reset = false) {
  const body = $('[data-song-table]');
  if (!body) return;
  if (reset || songs !== catalogSongs) visibleSongCount = PAGE_SIZE;
  catalogSongs = songs;
  body.replaceChildren();
  songs.slice(0, visibleSongCount).forEach(song => {
    const row = document.createElement('tr');
    const number = createElement('td', 'table-number', song.number);
    const titleCell = document.createElement('td');
    const title = createElement('a', '', song.title);
    title.href = buildHymnURL(song);
    titleCell.append(title);
    const actionCell = createElement('td', 'table-action');
    const action = createElement('a', '', 'Read →');
    action.href = buildHymnURL(song);
    action.setAttribute('aria-label', `Open song ${song.number}: ${song.title}`);
    actionCell.append(action);
    row.append(number, titleCell, actionCell);
    body.append(row);
  });
  if (!songs.length) {
    const row = document.createElement('tr');
    row.append(createElement('td', 'empty-state', 'No songs match this search.'));
    row.firstChild.colSpan = 3;
    body.append(row);
  }
  const pageStatus = $('[data-catalog-page-status]');
  const more = $('[data-load-more]');
  if (pageStatus) pageStatus.textContent = songs.length ? `Showing ${Math.min(visibleSongCount, songs.length)} of ${songs.length} songs.` : '';
  if (more) more.hidden = visibleSongCount >= songs.length || !songs.length;
}

function initCatalogPaging() {
  const more = $('[data-load-more]');
  if (!more) return;
  more.addEventListener('click', () => {
    visibleSongCount += PAGE_SIZE;
    renderSongTable(catalogSongs);
    more.focus();
  });
}

function initSearch() {
  const input = $('[data-search-input]');
  const status = $('[data-search-status]');
  const clear = $('[data-clear-search]');
  if (!input || !status || !clear) return;
  input.addEventListener('input', () => {
    const query = input.value.trim();
    clear.hidden = !query;
    const matches = searchHymns(query);
    status.textContent = query ? `${matches.length} matching song${matches.length === 1 ? '' : 's'} in ${getActiveBook().title}` : '';
    const matchedIds = new Set(matches.map(song => song.id));
    renderSongTable(query ? getHymnsAlphabetically().filter(song => matchedIds.has(song.id)) : getHymnsAlphabetically(), true);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  });
}

function renderGlobalSearchResults(results, query) {
  const node = $('[data-library-search-results]');
  if (!node) return;
  node.replaceChildren();
  if (!query) return;
  if (!results.length) {
    node.append(createElement('p', 'empty-state', 'No songs match that search across the library.'));
    return;
  }
  results.slice(0, 18).forEach(({ book, song }) => {
    const link = createElement('a', 'library-search-result');
    link.href = buildHymnURL(song, book);
    link.append(
      createElement('span', 'search-result-book', book.title),
      createElement('strong', '', `${song.number} · ${song.title}`),
      createElement('span', 'search-result-action', 'Read song →')
    );
    node.append(link);
  });
  if (results.length > 18) node.append(createElement('p', 'search-result-limit', `Showing the first 18 of ${results.length} matching songs.`));
}

function initGlobalSearch() {
  const input = $('[data-library-search-input]');
  const status = $('[data-library-search-status]');
  const clear = $('[data-library-clear-search]');
  if (!input || !status || !clear) return;
  let request = 0;
  let timer;
  const search = async () => {
    const query = input.value.trim();
    clear.hidden = !query;
    const currentRequest = ++request;
    if (!query) {
      status.textContent = '';
      renderGlobalSearchResults([], '');
      return;
    }
    status.textContent = 'Searching all songbooks…';
    try {
      const matches = await searchAcrossBooks(query);
      if (currentRequest !== request) return;
      status.textContent = `${matches.length} matching song${matches.length === 1 ? '' : 's'} across ${getBooks().length} songbooks.`;
      renderGlobalSearchResults(matches, query);
    } catch {
      if (currentRequest !== request) return;
      status.textContent = 'Some songbooks could not be searched. Please try again.';
      renderGlobalSearchResults([], query);
    }
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 180);
  });
  clear.addEventListener('click', () => {
    input.value = '';
    clearTimeout(timer);
    search();
    input.focus();
  });
}

function renderHome() {
  renderAppDetails();
  renderBookList();
  initGlobalSearch();
}

function renderBookPage() {
  const book = getActiveBook();
  renderBookDetails();
  renderSongTable(getHymnsAlphabetically(), true);
  initCatalogPaging();
  renderMiniLists();
  const latest = getHistory().find(recordKey => recordKey.startsWith(`${book.id}:`));
  const lastSong = getAllHymns().find(song => getRecordKey(song) === latest);
  if (lastSong) {
    $('[data-continue-section]').hidden = false;
    setText('[data-continue-title]', `${lastSong.number} · ${lastSong.title}`);
    $('[data-continue-link]').href = buildHymnURL(lastSong);
  }
  initSearch();
}

function renderLyrics(song) {
  const lyrics = $('[data-lyrics]');
  const outline = $('[data-song-outline]');
  const sections = getSongSections(song);
  lyrics.replaceChildren();
  if (outline) outline.replaceChildren();
  sections.forEach((section, index) => {
    const block = createElement('section', `song-section song-section--${section.type}`);
    block.id = `song-section-${index + 1}`;
    block.setAttribute('aria-label', section.label || `Song section ${index + 1}`);
    if (section.label) block.append(createElement('h2', 'song-section-label', section.label));
    section.lines.forEach(line => block.append(createElement('p', '', line)));
    lyrics.append(block);
    if (outline && section.label && !['frontmatter', 'attribution'].includes(section.type)) {
      const link = createElement('a', `song-outline-link song-outline-link--${section.type}`, section.label);
      link.href = `#${block.id}`;
      outline.append(link);
    }
  });
  if (outline) outline.hidden = outline.childElementCount < 2;
}

function initPresentationMode() {
  const button = $('[data-presentation-button]');
  if (!button) return;
  const toggle = () => {
    const enabled = document.body.classList.toggle('presentation-mode');
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = enabled ? 'Exit presentation' : 'Present';
  };
  button.addEventListener('click', toggle);
  return toggle;
}

function renderReader() {
  const book = getActiveBook();
  applyBookTheme(book);
  const params = new URLSearchParams(location.search);
  const number = params.get('number');
  const song = number ? getHymnByNumber(number) : params.has('random') ? getAllHymns()[Math.floor(Math.random() * getAllHymns().length)] : null;
  if (!song) {
    $('[data-reader-error]').hidden = false;
    return;
  }
  const bookURL = buildBookURL(book);
  $('[data-reader-back]').href = bookURL;
  $('[data-book-home]').href = bookURL;
  addHistory(getRecordKey(song));
  $('[data-reader]').hidden = false;
  setText('[data-reader-book]', book.title);
  setText('[data-reader-number]', `Song ${song.number}`);
  setText('[data-reader-title]', song.title);
  setText('[data-verification]', song.verification?.note || (song.verification?.status === 'verified' ? 'Verified song text' : `${book.title} digital edition`));
  document.title = `${song.title} | ${book.title}`;
  renderLyrics(song);
  const favorite = $('[data-favorite-button]');
  const recordKey = getRecordKey(song);
  const updateFavorite = () => { favorite.textContent = getFavorites().includes(recordKey) ? '★ Favorited' : '☆ Favorite'; };
  updateFavorite();
  favorite.addEventListener('click', () => {
    const active = toggleFavorite(recordKey);
    updateFavorite();
    toast(active ? 'Added to favorites' : 'Removed from favorites');
  });
  const previous = getPreviousHymn(song);
  const next = getNextHymn(song);
  $('[data-reader-nav]').hidden = false;
  for (const [selector, item, label] of [['[data-previous]', previous, '[data-previous-label]'], ['[data-next]', next, '[data-next-label]']]) {
    const link = $(selector);
    if (item) {
      link.href = buildHymnURL(item);
      link.removeAttribute('aria-disabled');
      setText(label, `${item.number} · ${item.title}`);
    } else {
      link.setAttribute('aria-disabled', 'true');
      link.removeAttribute('href');
      setText(label, 'End of songbook');
    }
  }
  renderBookFooter(book);
  initPresentationMode();
  $('[data-share-button]').addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: song.title, text: book.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        toast('Link copied');
      }
    } catch {
      toast('Unable to share this link');
    }
  });
  $('[data-print-button]').addEventListener('click', () => print());
}

function initKeys() {
  document.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (event.key === '/' && $('[data-search-input]')) {
      event.preventDefault();
      $('[data-search-input]').focus();
    }
    if (event.key.toLowerCase() === 'h') location.href = 'index.html';
    if (document.body.dataset.page === 'reader') {
      if (event.key === 'ArrowLeft' && !$('[data-previous]').getAttribute('aria-disabled')) location.href = $('[data-previous]').href;
      if (event.key === 'ArrowRight' && !$('[data-next]').getAttribute('aria-disabled')) location.href = $('[data-next]').href;
      if (event.key.toLowerCase() === 'f') $('[data-favorite-button]').click();
      if (event.key.toLowerCase() === 'p') $('[data-presentation-button]')?.click();
    }
  });
}

function renderLoadError(error) {
  console.error('Unable to load songbook library', error);
  const message = 'Unable to load this songbook. Check your connection and refresh to try again.';
  const homeError = $('[data-book-list]');
  if (homeError) homeError.replaceChildren(createElement('p', 'error-state', message));
  const table = $('[data-song-table]');
  if (table) {
    const row = document.createElement('tr');
    const cell = createElement('td', 'error-state', message);
    cell.colSpan = 3;
    row.append(cell);
    table.replaceChildren(row);
  }
  const readerError = $('[data-reader-error]');
  if (readerError) {
    readerError.hidden = false;
    readerError.querySelector('h1').textContent = 'Songbook unavailable';
    readerError.querySelector('p').textContent = message;
  }
}

async function init() {
  initSettings();
  initKeys();
  try {
    await loadLibrary();
    if (document.body.dataset.page === 'home') {
      renderHome();
      return;
    }
    await loadBook(selectedBookId());
    document.body.dataset.page === 'book' ? renderBookPage() : renderReader();
  } catch (error) {
    renderLoadError(error);
  }
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js').then(registration => {
    const reloadForUpdate = () => {
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    };
    const showUpdate = () => {
      const node = $('[data-update]');
      if (!node) return;
      node.hidden = false;
      node.querySelector('button')?.addEventListener('click', reloadForUpdate, { once: true });
    };
    if (registration.waiting) showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (worker) worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
      });
    });
    registration.update().catch(error => console.warn('Service worker update check failed', error));
  }).catch(error => console.warn('Service worker registration failed', error));
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'NETWORK_ERROR') toast('You are offline; this item is not saved yet.');
    if (event.data?.type === 'CACHE_WARNING') console.warn(`${event.data.count} app files could not be saved for offline use.`);
  });
}

initServiceWorker();
init();
