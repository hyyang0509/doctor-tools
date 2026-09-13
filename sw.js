const CACHE='hy-tools-v9';
const CORE=['./','./index.html','./assets/styles.css','./assets/app.js','./assets/icon.svg','./manifest.webmanifest','./lipid/','./lipid/style.css?v=20260913','./lipid/app.js?v=20260913','./lipid/rules.js?v=20260913','./lipid/formulary.js?v=20260913','./followup/','./taifex-alert/','./taifex-alert/calculator.js','./taifex-alert/app.js','./text-game/','./text-game/style.css','./text-game/app.js','./text-game/gameState.js','./text-game/eventsData.js','./text-game/eventEngine.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      fetch(event.request)
        .then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;})
        .catch(()=>caches.match(event.request).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
      return response;
    }))
  );
});

