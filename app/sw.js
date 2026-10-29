const C='atlas-app-v2',SWV='sw-2026-10-29d';self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(l=>Promise.all(l.filter(k=>k!==C&&k!=='atlas-diag'&&k!=='atlas-geteilt'&&k!=='atlas-antworten'&&k!=='atlas-mitteilungen').map(k=>caches.delete(k))))
 .then(()=>caches.open('atlas-diag')).then(c=>c.put('/__sw_version',new Response(SWV))).catch(()=>{}).then(()=>self.clients.claim())));
/* 26.10. (Oleg: "per Handy Atlas ein Foto schicken"): Galerie -> Teilen -> Atlas. Das Handy schickt die Dateien hierher (share_target im Manifest);
   sie kommen in den Cache 'atlas-geteilt', die App oeffnet "An Atlas" damit (?geteilt=1) */
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='POST'||!u.pathname.endsWith('/teilen')||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith((async()=>{try{const fd=await e.request.formData(),c=await caches.open('atlas-geteilt'),id=Date.now(),fl=fd.getAll('dateien').filter(f=>f&&f.size);
  const meta={id:id,text:[fd.get('title'),fd.get('text'),fd.get('url')].filter(Boolean).join(' '),dateien:[]};
  for(let i=0;i<fl.length&&i<8;i++){const k='/__geteilt/'+id+'/'+i;await c.put(k,new Response(fl[i],{headers:{'Content-Type':fl[i].type||'application/octet-stream'}}));
   meta.dateien.push({k:k,name:fl[i].name||('datei'+i),typ:fl[i].type||''});}
  await c.put('/__geteilt/neu',new Response(JSON.stringify(meta)));}catch(x){}
  return Response.redirect(self.registration.scope+'?geteilt=1',303);})());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r;}
  return caches.match(e.request,{ignoreSearch:true}).then(c=>c||r);}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(x){d={titel:'Atlas',text:e.data?e.data.text():''}}
 const o={body:d.text||'',tag:d.tag||undefined,renotify:!!d.tag,silent:false,vibrate:[300,150,300],icon:'icon-192.png',badge:'icon-192.png',data:{anker:d.anker||'',url:d.url||'',id:'',frage:!!(d.frage||(d.knoepfe||[]).length)}};
 /* 29.10. (Oleg: "fragt Ja/Nein, aber ich kann nicht antworten"): Antwort-Knoepfe direkt in der Benachrichtigung (Android: max. 2), sonst in der App */
 const kn=(d.knoepfe||[]).slice(0,8);if(kn.length&&kn.length<=2)o.actions=kn.map((k,i)=>({action:'k'+i,title:k.t}));  /* 23.10.: kam lautlos an -> immer mit Vibration, nie still */
 /* 29.10. (Oleg: "Benachrichtigung antippen - kann ich nicht komplett oeffnen"): lange Texte (Morgen-Nachrichten, Atlas denkt voraus) schneidet Android ab.
    Jede Mitteilung vollstaendig im Cache 'atlas-mitteilungen' merken (neueste 40); Antippen ohne eigenes Ziel zeigt sie in der App ganz an */
 const mid=Date.now().toString(36)+Math.random().toString(36).slice(2,6);o.data.id=mid;
 const mitMerken=caches.open('atlas-mitteilungen').then(c=>c.match('/__liste').then(r=>r?r.json():[]).catch(()=>[]).then(l=>{l.unshift({id:mid,zeit:new Date().toISOString(),titel:d.titel||'Atlas',text:d.text||'',anker:d.anker||'',url:d.url||'',knoepfe:kn,frage:o.data.frage});
  return c.put('/__liste',new Response(JSON.stringify(l.slice(0,40))));})).catch(()=>{});
 if(d.dringend){o.requireInteraction=true;o.vibrate=[1000,300,1000,300,1000,300,2000];o.silent=false;}
 const merk=st=>caches.open('atlas-diag').then(c=>c.put('/__letzter_push',new Response(JSON.stringify({zeit:new Date().toISOString(),titel:d.titel||'',status:st})))
  .then(()=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(b&&b.basis)return fetch(b.basis+'/sprechen/diag?token='+encodeURIComponent(b.token),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:'PUSH-ANGEKOMMEN '+SWV+' '+(d.titel||'')+' -> '+st})});})).catch(()=>{});
 /* 23.10.: Bild von der Familie (bildpost) gross in der Benachrichtigung - Adresse+Schluessel der Bridge legt die App im Cache ab */
 const mitBild=d.bild?caches.open('atlas-diag').then(c=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(b&&b.basis)o.image=b.basis+d.bild+(d.bild.indexOf('?')>=0?'&':'?')+'token='+encodeURIComponent(b.token);}).catch(()=>{}):Promise.resolve();
 /* 26.10. (Oleg): Antwort vom PC aufs Handy - die Sprachausgabe erst laden (max. 8 s), dann die Benachrichtigung: beim Oeffnen ohne Ladezeit vorlesen */
 const mitAudio=d.audio?Promise.race([caches.open('atlas-diag').then(c=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(!b||!b.basis)return;
   return fetch(b.basis+d.audio+'&token='+encodeURIComponent(b.token)).then(r=>r.ok?caches.open('atlas-antworten').then(c=>c.put('/__antwort/'+(d.audio.split('id=')[1]||''),r)):null);}),
   new Promise(r=>setTimeout(r,8000))]).catch(()=>{}):Promise.resolve();
 e.waitUntil(mitMerken.then(()=>mitAudio).then(()=>mitBild).then(()=>self.registration.showNotification(d.titel||'Atlas',o)).then(()=>merk('angezeigt'),err=>merk('Fehler: '+err)));});
self.addEventListener('notificationclick',e=>{e.notification.close();const nd=e.notification.data||{};
 if(nd.url&&!e.action){e.waitUntil(clients.openWindow(nd.url));return;}
 /* 29.10. (Oleg: "antippen -> Mitteilung soll sich sofort oeffnen, mit Antwort, wenn eine Frage drin ist"): immer die ganze Mitteilung
    (Kalender usw. per Knopf darin); nur Antworten/Bilder/SOS haben eigene Fenster. Offene App bekommt eine Nachricht -
    navigate() scheiterte still (App kam nur nach vorn); erst wenn die App nicht antwortet, neu laden */
 const eigen=/^(antwort-|bild-|sos$)/.test(nd.anker||'');
 const a=nd.id&&!eigen?'mitteilung-'+nd.id+(e.action?'-'+e.action:''):(nd.anker||'');const u=self.registration.scope+'index.html'+(a?'#'+a:'');
 /* 29.10. (2) Oleg: "es oeffnet sich nur die App" - Ziel zusaetzlich im Cache merken ('/__oeffnen'); die App schaut beim Start und beim
    Sichtbarwerden nach (unabhaengig davon, ob Anker oder Nachricht ankommen). Ferndiagnose: KLICK-Zeilen in sprechen_diag.log */
 const sd=t=>caches.open('atlas-diag').then(c=>c.match('/__bridge')).then(r=>r?r.json():null).then(b=>{if(b&&b.basis)return fetch(b.basis+'/sprechen/diag?token='+encodeURIComponent(b.token),
   {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:'KLICK '+SWV+' '+t})});}).catch(()=>{});
 const merk=a?caches.open('atlas-diag').then(c=>c.put('/__oeffnen',new Response(JSON.stringify({a:a,zeit:Date.now()})))).catch(()=>{}):Promise.resolve();
 e.waitUntil(merk.then(()=>clients.matchAll({type:'window',includeUncontrolled:true})).then(l=>{const c=l.find(x=>x.url.startsWith(self.registration.scope));
  if(!c)return clients.openWindow(u).then(w=>sd(a+' -> neu geoeffnet ('+(w?'ok':'kein Fenster')+')'),x=>sd(a+' -> oeffnen FEHLER '+x));
  const f=Promise.resolve('focus' in c?c.focus():c).catch(()=>c);
  if(!a)return f;
  return f.then(()=>new Promise(ok=>{const k=new MessageChannel(),t=setTimeout(()=>ok(false),2500);k.port1.onmessage=()=>{clearTimeout(t);ok(true);};
    try{c.postMessage({atlasAnker:a},[k.port2]);}catch(x){clearTimeout(t);ok(false);}}))
   .then(da=>sd(a+' -> App war offen ('+c.url.slice(-40)+'), Nachricht '+(da?'bestaetigt':'OHNE Antwort - App holt es aus dem Speicher')));}));});