const CACHE='seonyu-public-app-shell-v6';
const FILES=['./','./index.html','./style.css?v=master100-20261020-1','./bootstrap.js?v=master100-20261020-1','./app.js?v=master100-20261020-1','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate', event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch', event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(res=>{if(res.ok){let copy=res.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return res;}).catch(()=>caches.match(event.request)));
});