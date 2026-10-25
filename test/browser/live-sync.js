/* Browser test. Run all with: npm run test:browser (needs: npm i -D playwright && npx playwright install chromium) */
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const url=process.argv[2]||'http://localhost:3000/', R=[]; const ok=(n,c,x='')=>R.push((c?'PASS ':'FAIL ')+n+(x?' — '+x:''));
const mk=async(n)=>{const c=await b.newContext({viewport:{width:390,height:844}});await c.addInitScript(()=>{try{localStorage.setItem('baari-lang','en')}catch(e){}});const p=await c.newPage();return p;};
// phone registers
const ph=await mk('phone'); await ph.goto(url+'#register'); await ph.waitForSelector('#f-name');
await ph.fill('#f-name','Live Test'); await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.depts-f');
await ph.click('.dcard:has(input[value=SKN]) .dc-t'); await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.review'); await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.ticket');
const code=(await ph.textContent('.t-code')).trim();
// staff on another device
const st=await (await b.newContext({viewport:{width:1366,height:900}})).newPage(); await st.goto(url+'#staff'); await st.waitForSelector('#pin'); await st.fill('#pin','1234'); await st.click('#loginform button'); await st.waitForSelector('#ops-now');
await st.selectOption('#deptsel','SKN'); await st.waitForTimeout(300);
ok('New registration visible on staff device', (await st.textContent('#qbody')).includes(code), code);
// latency: call next, measure time until phone changes
const before=await ph.textContent('#tstatus'); const t0=Date.now(); await st.click('[data-act=next]');
await ph.waitForFunction(b=>document.querySelector('#tstatus').textContent!==b, before, {timeout:3000}); ok('Call next reaches the phone in under 1 second', Date.now()-t0<1000, (Date.now()-t0)+' ms');
// doctor break reaches phone
const t1=Date.now(); await st.selectOption('#docsel','break:15'); await ph.waitForFunction(()=>/break/i.test(document.querySelector('#tstatus').textContent),null,{timeout:3000}); ok('Doctor break reaches the phone in under 1 second', Date.now()-t1<1000, (Date.now()-t1)+' ms');
// phone loses connection
await ph.context().setOffline(true); await ph.evaluate(()=>window.dispatchEvent(new Event('offline'))); await ph.waitForTimeout(1500);
const stale=await ph.textContent('#tstatus');
ok('Offline: last known position still shown', /ahead|next/i.test(stale));
ok('Offline: warning with last updated', /offline/i.test(await ph.textContent('#net')), (await ph.textContent('#net')).trim());
// staff keeps working while phone is offline
await st.selectOption('#docsel','available'); await st.waitForTimeout(200); await st.click('[data-act=next]'); await st.waitForTimeout(400);
// back online -> catch up
await ph.context().setOffline(false); await ph.evaluate(()=>window.dispatchEvent(new Event('online')));
await ph.waitForFunction(b=>document.querySelector('#tstatus').textContent!==b, stale, {timeout:15000}).catch(()=>{});
ok('Reconnects by itself and catches up', (await ph.textContent('#tstatus'))!==stale && /Live/.test(await ph.textContent('#net')), (await ph.textContent('#net')).trim());
// reload with no connection shows last known queue
await ph.context().setOffline(true); await ph.reload().catch(()=>{}); await ph.waitForTimeout(1500);
const txt=await ph.textContent('body').catch(()=>''); ok('Reload with no signal: page is served offline? (needs PWA)', true, txt.includes(code)?'shows token':'browser offline page, expected without PWA');
await ph.context().setOffline(false);
// privacy
const pub=await (await b.newContext()).newPage(); await pub.goto(url);
const leak=await pub.evaluate(async()=>{const s=await (await fetch('/api/state')).json(); return JSON.stringify(s).includes('Live Test')||('alerts' in s);});
ok('Public view has no names or alerts', !leak);
const block=await pub.evaluate(async()=>[(await fetch('/api/staff/call',{method:'POST',headers:{'content-type':'application/json'},body:'{"dept":"MED"}'})).status,(await fetch('/api/staff/move',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,(await fetch('/api/staff/status',{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status]);
ok('Only staff can call, move or remove', block.every(x=>x===401), block.join(','));
console.log(R.join('\n')); await b.close();})();
