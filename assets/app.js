(function(){
  'use strict';
  var STORAGE_FAVORITES='doctorTools:favorites';
  var STORAGE_RECENTS='doctorTools:recents';
  var MAX_RECENTS=4;

  function safeParse(value,fallback){try{return JSON.parse(value)}catch(_){return fallback}}
  function readList(key){var v=safeParse(localStorage.getItem(key),[]);return Array.isArray(v)?v:[]}
  function writeList(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(_){}}
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}

  var tools=[].slice.call(document.querySelectorAll('[data-tool-id]'));
  var search=document.getElementById('toolSearch');
  var empty=document.getElementById('searchEmpty');
  var favoriteList=document.getElementById('favoriteList');
  var recentList=document.getElementById('recentList');

  function metaFromShell(shell){
    return {
      id:shell.getAttribute('data-tool-id'),
      title:shell.getAttribute('data-title')||'',
      href:shell.querySelector('.tool-card').getAttribute('href'),
      symbol:(shell.querySelector('.tool-symbol')||{}).textContent||'•'
    };
  }

  var catalog={}; tools.forEach(function(shell){var meta=metaFromShell(shell);catalog[meta.id]=meta});

  function favorites(){return readList(STORAGE_FAVORITES).filter(function(id){return catalog[id]})}
  function recents(){return readList(STORAGE_RECENTS).filter(function(id){return catalog[id]})}

  function renderChips(target,ids,emptyText){
    if(!target)return;
    if(!ids.length){target.innerHTML='<span class="empty-inline">'+escapeHtml(emptyText)+'</span>';return}
    target.innerHTML=ids.map(function(id){var t=catalog[id];return '<a class="chip" href="'+escapeHtml(t.href)+'" data-quick-tool="'+escapeHtml(id)+'"><span aria-hidden="true">'+escapeHtml(t.symbol)+'</span>'+escapeHtml(t.title)+'</a>'}).join('');
  }

  function syncFavoriteButtons(){
    var favs=favorites();
    tools.forEach(function(shell){var btn=shell.querySelector('.favorite-btn');if(!btn)return;var active=favs.indexOf(shell.getAttribute('data-tool-id'))!==-1;btn.setAttribute('aria-pressed',active?'true':'false');btn.setAttribute('title',active?'取消收藏':'加入收藏');btn.textContent=active?'★':'☆'})
  }

  function renderDashboard(){renderChips(favoriteList,favorites(),'點工具右側 ☆ 加入收藏');renderChips(recentList,recents(),'你開過的工具會出現在這裡');syncFavoriteButtons()}

  function toggleFavorite(id){
    var favs=favorites();var i=favs.indexOf(id);if(i===-1){favs.unshift(id)}else{favs.splice(i,1)}
    writeList(STORAGE_FAVORITES,favs);renderDashboard();
  }

  function recordRecent(id){
    if(!catalog[id])return;
    var list=recents().filter(function(x){return x!==id});list.unshift(id);writeList(STORAGE_RECENTS,list.slice(0,MAX_RECENTS));
  }

  tools.forEach(function(shell){
    var id=shell.getAttribute('data-tool-id');
    var btn=shell.querySelector('.favorite-btn');
    var card=shell.querySelector('.tool-card');
    if(btn)btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();toggleFavorite(id)});
    if(card)card.addEventListener('click',function(){recordRecent(id)});
  });

  document.addEventListener('click',function(e){var quick=e.target.closest('[data-quick-tool]');if(quick)recordRecent(quick.getAttribute('data-quick-tool'))});

  function applySearch(){
    var q=(search&&search.value||'').trim().toLowerCase();
    var visibleCount=0;
    tools.forEach(function(shell){var hay=(shell.getAttribute('data-search')||'').toLowerCase();var show=!q||hay.indexOf(q)!==-1;shell.hidden=!show;if(show)visibleCount++});
    [].slice.call(document.querySelectorAll('.section[data-tool-section]')).forEach(function(section){section.hidden=!section.querySelector('.tool-shell:not([hidden])')});
    if(empty)empty.classList.toggle('show',!!q&&visibleCount===0);
  }
  if(search){search.addEventListener('input',applySearch);document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus();search.select()}})}

  if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})})}
  renderDashboard();
})();
