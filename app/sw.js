const C='atlas-app-v2',SWV='sw-2026-10-23d';self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(l=>Promise.all(l.filter(k=>k!==C&&k!=='atlas-diag').map(k=>caches.delete(k))))
 .then(()=>caches.open('atlas-diag')).then(c=>c.put('/__sw_version',new Response(SWV))).catch(()=>{}).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r;}
  return caches.match(e.request,{ignoreSearch:true}).then(c=>c||r);}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={titel:'Atlas',text:e.data?e.data.text():''}}
 const o={body:d.text||'',tag:d.tag||undefined,renotify:!!d.tag,silent:false,vibrate:[300,150,300],icon:'icon-192.png',badge:'icon-192.png',data:{anker:d.anker||'',url:d.url||''}};  /* 23.10.: kam lautlos an -> immer mit Vibration, nie still */
 if(d.dringend){o.requireInteraction=true;o.vibrate=[1000,300,1000,300,1000,300,2000];o.silent=false;}
 const merk=st=>caches.open('atlas-diag').then(c=>c.put('/__letzter_push',new Response(JSON.stringify({zeit:new Date().toISOString(),titel:d.titel||'',status:st})))
  .then(()=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(b&&b.basis)return fetch(b.basis+'/sprechen/diag?token='+encodeURIComponent(b.token),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:'PUSH-ANGEKOMMEN '+SWV+' '+(d.titel||'')+' -> '+st})});})).catch(()=>{});
 /* 23.10.: Bild von der Familie (bildpost) gross in der Benachrichtigung - Adresse+Schluessel der Bridge legt die App im Cache ab */
 const mitBild=d.bild?caches.open('atlas-diag').then(c=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(b&&b.basis)o.image=b.basis+d.bild+(d.bild.indexOf('?')>=0?'&':'?')+'token='+encodeURIComponent(b.token);}).catch(()=>{}):Promise.resolve();
 e.waitUntil(mitBild.then(()=>self.registration.showNotification(d.titel||'Atlas',o)).then(()=>merk('angezeigt'),err=>merk('Fehler: '+err)));});
self.addEventListener('notificationclick',e=>{e.notification.close();const nd=e.notification.data||{};
 if(nd.url){e.waitUntil(clients.openWindow(nd.url));return;}
 const a=nd.anker||'';const u=self.registration.scope+'index.html'+(a?'#'+a:'');
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if('focus' in c&&c.url.startsWith(self.registration.scope)){
  if(a&&'navigate' in c)c.navigate(u).catch(()=>{});return c.focus();}}return clients.openWindow(u);}));});