const CACHE = 'rongmei-songbooks-v9';
const DOWNLOAD_CACHE = 'rongmei-songbooks-downloads-v1';
const SHELL = ['./', './index.html', './book.html', './hymn.html', './404.html', './policy.html', './css/main.css', './js/app.js', './js/data.js', './js/storage.js', './js/ui.js', './js/settings.js', './js/contact.js', './js/offline.js', './data/songbooks/index.json', './data/contact.json', './assets/Rongmei%20Gospel%20song%20books.png', './assets/buanthanhlu-cover.png', './assets/icons/icon.svg', './assets/icons/icon-192.png', './assets/icons/icon-512.png', './manifest.webmanifest'];

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => client.postMessage(message));
}

async function registeredBookFiles() {
  try {
    const response = await fetch('./data/songbooks/index.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Book index failed: ${response.status}`);
    const index = await response.json();
    const books = Array.isArray(index.books) ? index.books.filter(book => /^[a-z0-9][a-z0-9-]*$/i.test(book?.directory || '')) : [];
    const resources = await Promise.all(books.map(async book => {
      const metadata = `./data/songbooks/${book.directory}/${book.metadata || 'metadata.json'}`;
      const metadataResponse = await fetch(metadata, { cache: 'no-store' });
      if (!metadataResponse.ok) return [metadata];
      const data = await metadataResponse.json();
      const songFile = data.songs?.file;
      const localSong = !data.songs?.url && typeof songFile === 'string' && /^[a-z0-9][a-z0-9._-]*\.json$/i.test(songFile) ? `./data/songbooks/${book.directory}/${songFile}` : null;
      return [metadata, localSong].filter(Boolean);
    }));
    return resources.flat();
  } catch (error) {
    console.warn('Unable to read songbook index during install', error);
    return [];
  }
}

async function libraryFiles() {
  const files = [...SHELL, ...await registeredBookFiles()];
  return [...new Set(files)];
}

async function downloadLibrary(source) {
  const files = await libraryFiles();
  const cache = await caches.open(DOWNLOAD_CACHE);
  let completed = 0;
  const failed = [];
  for (const url of files) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(String(response.status));
      await cache.put(url, response);
    } catch {
      failed.push(url);
    }
    completed += 1;
    source?.postMessage({ type: 'OFFLINE_PROGRESS', completed, total: files.length });
  }
  const result = { type: 'OFFLINE_COMPLETE', completed, total: files.length, failed: failed.length };
  source?.postMessage(result);
  return result;
}

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const results = await Promise.allSettled(SHELL.map(url => cache.add(url)));
  const failed = results.filter(result => result.status === 'rejected');
  if (failed.length) await notifyClients({ type: 'CACHE_WARNING', count: failed.length });
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key !== CACHE && key !== DOWNLOAD_CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'DOWNLOAD_LIBRARY') event.waitUntil(downloadLibrary(event.source));
  if (event.data?.type === 'CLEAR_DOWNLOADS') event.waitUntil(caches.delete(DOWNLOAD_CACHE).then(() => {
    event.source?.postMessage({ type: 'OFFLINE_CLEARED' });
  }));
  if (event.data?.type === 'GET_OFFLINE_STATUS') event.waitUntil((async () => {
    const cache = await caches.open(DOWNLOAD_CACHE);
    const entries = await cache.keys();
    event.source?.postMessage({ type: 'OFFLINE_STATUS', downloaded: entries.length > 0, count: entries.length });
  })());
});
self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestURL.origin !== location.origin) return;
  const isData = requestURL.pathname.includes('/data/');
  event.respondWith((async () => {
    try {
      if (isData) {
        const response = await fetch(event.request, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
        await (await caches.open(CACHE)).put(event.request, response.clone());
        return response;
      }
      const cached = await caches.match(event.request, { ignoreSearch: isData });
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') await (await caches.open(CACHE)).put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await caches.match(event.request, { ignoreSearch: isData });
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await caches.match('./404.html')) || Response.error();
      await notifyClients({ type: 'NETWORK_ERROR', url: requestURL.pathname });
      return new Response('This item is unavailable offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
