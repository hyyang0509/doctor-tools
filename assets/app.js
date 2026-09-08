(function(){
  'use strict';

  var tools=[].slice.call(document.querySelectorAll('[data-tool-id]'));
  var search=document.getElementById('toolSearch');
  var empty=document.getElementById('searchEmpty');

  function applySearch(){
    var q=(search&&search.value||'').trim().toLowerCase();
    var visibleCount=0;
    tools.forEach(function(shell){
      var hay=((shell.getAttribute('data-title')||'')+' '+(shell.getAttribute('data-search')||'')).toLowerCase();
      var show=!q||hay.indexOf(q)!==-1;
      shell.hidden=!show;
      if(show)visibleCount++;
    });
    [].slice.call(document.querySelectorAll('.section[data-tool-section]')).forEach(function(section){
      section.hidden=!section.querySelector('.tool-shell:not([hidden])');
    });
    if(empty)empty.classList.toggle('show',!!q&&visibleCount===0);
  }

  if(search){
    search.addEventListener('input',applySearch);
    document.addEventListener('keydown',function(e){
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
        e.preventDefault();
        search.focus();
        search.select();
      }
    });
  }

  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('./sw.js').catch(function(){});
    });
  }
})();
