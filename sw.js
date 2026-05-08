var CACHE = ‘hyrox-plan-v4’;
var ASSETS = [’/’, ‘/index.html’, ‘/manifest.json’, ‘/icon.svg’];

self.addEventListener(‘install’, function(event) {
event.waitUntil(
caches.open(CACHE).then(function(cache) {
return cache.addAll(ASSETS);
})
);
self.skipWaiting();
});

self.addEventListener(‘activate’, function(event) {
event.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE; })
.map(function(k) { return caches.delete(k); })
);
})
);
self.clients.claim();
});

self.addEventListener(‘fetch’, function(event) {
// Never cache the Runna function
if (event.request.url.indexOf(’.netlify/functions’) >= 0) {
event.respondWith(fetch(event.request));
return;
}
// Network first for HTML so updates always come through
if (event.request.url.indexOf(’.html’) >= 0 || event.request.mode === ‘navigate’) {
event.respondWith(
fetch(event.request).then(function(response) {
var clone = response.clone();
caches.open(CACHE).then(function(cache) { cache.put(event.request, clone); });
return response;
}).catch(function() {
return caches.match(event.request);
})
);
return;
}
// Cache first for other assets
event.respondWith(
caches.match(event.request).then(function(cached) {
return cached || fetch(event.request);
})
);
});