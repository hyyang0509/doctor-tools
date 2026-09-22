const CACHE='hy-tools-v13';
const CORE=['./','./index.html','./assets/styles.css','./assets/app.js','./assets/icon.svg','./manifest.webmanifest','./lipid/','./lipid/app.mjs','./lipid/config/copy.mjs','./lipid/config/drugs.mjs','./lipid/config/nhi.mjs','./lipid/config/targets.mjs','./lipid/modules/drugPolicy.mjs','./lipid/modules/drugRecommendation.mjs','./lipid/modules/nhiEligibility.mjs','./lipid/modules/resultPresenter.mjs','./lipid/modules/riskAssessment.mjs','./lipid/modules/treatmentStatus.mjs','./sarcopenia/','./sarcopenia/styles.css','./sarcopenia/app.mjs','./sarcopenia/config.mjs','./sarcopenia/screeningRules.mjs','./sarcopenia/storage.mjs','./sarcopenia/formSync.mjs','./followup/','./taifex-alert/','./taifex-alert/calculator.js','./taifex-alert/app.js','./text-game/','./text-game/style.css','./text-game/app.js','./text-game/gameState.js','./text-game/eventsData.js','./text-game/eventEngine.js'];

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
