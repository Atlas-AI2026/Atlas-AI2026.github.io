const C='atlas-app-v2';self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(l=>Promise.all(l.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r;}
  return caches.match(e.request,{ignoreSearch:true}).then(c=>c||r);}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={titel:'Atlas',text:e.data?e.data.text():''}}
 const o={body:d.text||'',tag:d.tag||undefined,renotify:!!d.tag,data:{anker:d.anker||'',url:d.url||''}};
 if(d.dringend){o.requireInteraction=true;o.vibrate=[1000,300,1000,300,1000,300,2000];o.silent=false;}
 const merk=st=>caches.open('atlas-diag').then(c=>c.put('/__letzter_push',new Response(JSON.stringify({zeit:new Date().toISOString(),titel:d.titel||'',status:st})))).catch(()=>{});
 e.waitUntil(self.registration.showNotification(d.titel||'Atlas',o).then(()=>merk('angezeigt'),err=>merk('Fehler: '+err)));});
self.addEventListener('notificationclick',e=>{e.notification.close();const nd=e.notification.data||{};
 if(nd.url){e.waitUntil(clients.openWindow(nd.url));return;}
 const a=nd.anker||'';const u=self.registration.scope+'index.html'+(a?'#'+a:'');
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c&&c.url.startsWith(self.registration.scope)){
  if(a&&'navigate' in c)c.navigate(u).catch(()=>{});return c.focus();}}return clients.openWindow(u);}));});