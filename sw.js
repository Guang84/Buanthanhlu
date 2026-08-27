const CACHE = 'buanthlu-v8';
const SHELL = ['./', './index.html', './hymn.html', './404.html', './policy.html', './css/main.css', './js/app.js', './js/data.js', './js/storage.js', './js/ui.js', './js/settings.js', './js/reader-fix.js', './js/contact.js', './data/hymns.json', './data/metadata.json', './data/contact.json', './pdf/Buanthanh_Lu_interactive_home.pdf', './manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  const isData = new URL(event.request.url).pathname.includes('/data/');
  event.respondWith(
    isData ?
    fetch(event.request, {
      cache: 'no-store'
    }).then(response => {
      if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
      const copy = response.clone();
      return caches.open(CACHE).then(cache => cache.put(event.request, copy)).then(() => response);
    }).catch(() => caches.match(event.request).then(cached => cached || Promise.reject(new Error('Data unavailable')))) :
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
