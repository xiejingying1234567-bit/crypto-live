// 生成简单的 SVG 图标（用 canvas 生成 PNG）
// 部署时自动创建，这里放一个内联的 service worker

const CACHE_NAME = 'crypto-live-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      // 网络优先，缓存兜底
      return fetch(e.request).catch(() => cached);
    })
  );
});
