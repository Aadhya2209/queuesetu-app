/* Browser test. Run all with: npm run test:browser (needs: npm i -D playwright && npx playwright install chromium) */
const { chromium } = require('playwright');
const url=process.argv[2]||'http://localhost:3000/', out=(process.env.SHOTS || require('os').tmpdir()) + '/' + 'ta_';
const ALLOW=/^(English|Dr|Rakesh|Gupta|QueueSetu|OPD|SMS|BP|Casualty|Lab|QR|AI|Wi|Fi|HackCache|Team|EL|Dorado|Reimagining|Government|Demo|District|Hospital|localhost|http|EN)$/;
(async()=>{
  const b=await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c=await b.newContext({viewport:{width:360,height:780}}); const p=await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url); await p.evaluate(()=>localStorage.setItem('baari-lang','doi')); await p.reload();
  const res={};
  async function scan(hash, prep){
    await p.goto(url+hash); await p.waitForTimeout(700); if(prep) await prep();
    const txt=await p.evaluate(()=>{ const vis=e=>e.offsetParent!==null||e.tagName==='BODY'; let s=''; const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); let n; while(n=w.nextNode()){ const el=n.parentElement; if(!el||['SCRIPT','STYLE'].includes(el.tagName)) continue; if(el.closest('[hidden]')||!vis(el)) continue; s+=' '+n.textContent;} document.querySelectorAll('input[placeholder]').forEach(i=>s+=' '+i.placeholder); return s;});
    const latin=[...new Set((txt.match(/[A-Za-z]{2,}|[\u0B80-\u0BFF]+/g)||[]).filter(w=>!ALLOW.test(w)))];
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth);
    res[hash]={latin, overflow:ov>360?ov:0};
    await p.screenshot({path:out+hash.replace('#','')+'.png',fullPage:true});
  }
  for (const h of ['#home','#patient','#queue','#find','#help','#slip','#track']) await scan(h);
  await scan('#register');
  await p.goto(url+'#register'); await p.fill('#f-name','रमेश कुमार'); await p.click('#regform button[type=submit]'); await p.waitForSelector('.depts-f');
  await p.fill('#f-complaint','मेरी छाती च बड़ा दर्द ऐ'); await p.dispatchEvent('#f-complaint','input'); await p.waitForTimeout(300);
  await p.screenshot({path:out+'step2.png',fullPage:true});
  const step2=await p.evaluate(()=>document.querySelector('#app').innerText);
  res.step2Latin=[...new Set((step2.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!ALLOW.test(w)))];
  res.urgentShown=await p.isVisible('#urgent');
  await p.click('.dcard:has(input[value=MED]) .dc-t'); await p.click('#regform button[type=submit]'); await p.waitForSelector('.review');
  await p.click('#regform button[type=submit]'); await p.waitForSelector('.ticket .t-code'); await p.waitForTimeout(500);
  const tk=await p.evaluate(()=>document.querySelector('#app').innerText);
  res.ticketLatin=[...new Set((tk.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!ALLOW.test(w)))];
  res.ticketOverflow=await p.evaluate(()=>document.documentElement.scrollWidth);
  res.listenVisible=await p.isVisible('#tlisten');
  await p.screenshot({path:out+'ticket.png',fullPage:true});
  await p.click('#sosfab'); await p.waitForSelector('#sos .sheet'); await p.waitForTimeout(300);
  const sos=await p.evaluate(()=>document.querySelector('#sos').innerText);
  res.sosLatin=[...new Set((sos.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!ALLOW.test(w)))];
  await p.screenshot({path:out+'sos.png'});
  for (const h of ['#settings']) await scan(h);
  await p.goto(url+'#patient'); await p.waitForTimeout(500); await p.click('.lostbar'); await p.waitForSelector('#lost .sheet');
  const lost=await p.evaluate(()=>document.querySelector('#lost').innerText);
  res.lostLatin=[...new Set((lost.match(/[A-Za-z]{2,}/g)||[]).filter(w=>!ALLOW.test(w)))];
  const R=[]; const ok=(n,c,x='')=>R.push((c?'PASS ':'FAIL ')+n+(x?' — '+x:''));
  for (const [h,r] of Object.entries(res)) if (h.startsWith('#')) { ok('Dogri '+h+': no English left', !r.latin.length, r.latin.join(',')); ok('Dogri '+h+': fits 360 px', !r.overflow, String(r.overflow)); }
  ok('Dogri registration step 2: no English left (hospital name is configured, allowed)', res.step2Latin.every(w=>/^(DEMO|DISTRICT|HOSPITAL)$/.test(w)), res.step2Latin.join(','));
  ok('Dogri urgent warning shown for chest pain typed in Dogri', res.urgentShown);
  ok('Dogri token screen: no English left', res.ticketLatin.every(w=>/^(DEMO|DISTRICT|HOSPITAL|Dr|Rakesh|Gupta)$/.test(w)), res.ticketLatin.join(','));
  ok('Dogri Listen available (read with a Hindi voice)', res.listenVisible);
  ok('Dogri emergency sheet: no English left', !res.sosLatin.length, res.sosLatin.join(','));
  ok("Dogri I'm lost: no English left", !res.lostLatin.length, res.lostLatin.join(','));
  console.log(R.join('\n')); console.log('ERRORS',errs);
  await b.close();
})();
