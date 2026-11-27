// 스코어북 서비스워커: 체육관 와이파이가 끊겨도 앱 화면이 열리게 캐시
const CACHE = 'scorebook-v3';
const CORE = ['./', './index.html', './firebase-config.js', './manifest.json', './icon-192.png', './icon-512.png'];
const CDN = /^https:\/\/(www\.gstatic\.com\/firebasejs|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 이 사이트 파일: 인터넷 되면 최신, 안 되면 캐시 (업데이트가 바로 반영되게)
  if (url.origin === location.origin) {
    e.respondWith(fetch(req).then(r => {
      if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req.mode === 'navigate' ? './index.html' : req, c)); }
      return r;
    }).catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  // Firebase SDK·폰트: 캐시 먼저
  if (CDN.test(req.url)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    })));
  }
  // Firestore 통신은 건드리지 않음
});
