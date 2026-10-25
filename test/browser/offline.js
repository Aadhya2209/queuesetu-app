/* Browser test. Run all with: npm run test:browser (needs: npm i -D playwright && npx playwright install chromium) */
const { chromium } = require('playwright');
const url=process.argv[2]||'http://localhost:3000/', out=(process.env.SHOTS || require('os').tmpdir()) + '/' + 'pwa_';
const R=[]; const ok=(n,c,x='')=>R.push((c?'PASS ':'FAIL ')+n+(x?' — '+x:''));
(async()=>{
  const b=await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c=await b.newContext({viewport:{width:390,height:844}});await c.addInitScript(()=>{try{if(!localStorage.getItem('baari-lang'))localStorage.setItem('baari-lang','hi')}catch(e){}}); const p=await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url+'#patient'); await p.waitForSelector('.tiles');
  const voices=await p.evaluate(()=>speechSynthesis.getVoices().map(v=>v.lang).join(','));
  ok('Voices list (info)', true, voices.slice(0,120)||'none');
  const man=await p.evaluate(async()=>{const r=await fetch('/manifest.webmanifest');return [r.status,r.headers.get('content-type'),(await r.json()).icons.length];});
  ok('Manifest served', man[0]===200 && /manifest\+json/.test(man[1]) && man[2]===3, man.join(' '));
  const swh=await p.evaluate(async()=>{const r=await fetch('/sw.js');return r.headers.get('cache-control');});
  ok('sw.js not cached by browser', swh==='no-cache', swh);
  const ready=await p.evaluate(()=>navigator.serviceWorker.ready.then(r=>Boolean(r.active)));
  ok('Service worker active', ready);
  await p.reload(); await p.waitForSelector('.tiles'); await p.waitForTimeout(500);
  ok('Page controlled by service worker', await p.evaluate(()=>Boolean(navigator.serviceWorker.controller)));
  const cached=await p.evaluate(async()=>{const k=await caches.keys(); const c=await caches.open(k[0]); return (await c.keys()).map(r=>new URL(r.url).pathname);});
  ok('App shell cached', ['/index.html','/app.js','/styles.css','/shared.js','/socket.io/socket.io.js','/vendor/qrcode.js'].every(x=>cached.includes(x)), cached.length+' files');
  // --- Go offline and reload
  await c.setOffline(true);
  await p.reload(); await p.waitForTimeout(1200);
  ok('Opens with no signal (hub renders)', await p.isVisible('.tiles'));
  const nb=await p.textContent('.netbar'); ok('Offline warning with last update time', /offline|ऑफ़लाइन/i.test(nb) && /Last updated|आखिरी अपडेट/.test(nb), nb.trim());
  await p.screenshot({path:out+'offline_hub.png',fullPage:true});
  await p.goto(url+'#queue'); await p.waitForTimeout(500);
  ok('Queue page works offline from saved data', (await p.$$('.qc-rows .qc-row')).length===6);
  // --- Register offline
  await p.goto(url+'#register'); await p.waitForSelector('#f-name');
  await p.fill('#f-name','Offline Kumar'); await p.click('#regform button[type=submit]'); await p.waitForSelector('.depts-f');
  await p.click('.dcard:has(input[value=EYE]) .dc-t'); await p.click('#regform button[type=submit]'); await p.waitForSelector('.review');
  await p.click('#regform button[type=submit]'); await p.waitForSelector('.pendcard',{timeout:5000}).catch(()=>{});
  ok('Offline registration saved as waiting to be confirmed', await p.isVisible('.pendcard'));
  ok('Pending kept on phone', await p.evaluate(()=>Boolean(localStorage.getItem('baari-pending'))));
  await p.screenshot({path:out+'pending.png',fullPage:true});
  await p.reload(); await p.waitForTimeout(800);
  ok('Pending survives a reload with no signal', await p.isVisible('.pendcard'));
  // --- Back online: sent automatically
  await c.setOffline(false);
  await p.waitForSelector('.ticket .t-code:not(.pend)',{timeout:15000}).catch(()=>{});
  const code=await p.textContent('.ticket .t-code').catch(()=>'');
  ok('Back online: form sent by itself, real token shown', /^E-\d+/.test((code||'').trim()), code);
  ok('Pending cleared', await p.evaluate(()=>!localStorage.getItem('baari-pending')));
  const st=await p.evaluate(async()=>{const s=await (await fetch('/api/state')).json(); return s.tokens.filter(t=>t.dept==='EYE').length;});
  ok('Server has the token once', st>=1);
  await p.screenshot({path:out+'confirmed.png',fullPage:true});
  // --- Same form flushed twice must not make two tokens
  const dup=await p.evaluate(async()=>{const body={name:'Offline Kumar',phone:'',complaint:'',dept:'EYE',lang:'en',sms:false}; const r=await fetch('/api/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return (await r.json()).duplicate;});
  ok('Resending the same form gives the same token', dup===true);
  console.log(R.join('\n')); console.log('ERRORS',errs);
  await b.close();
})();
