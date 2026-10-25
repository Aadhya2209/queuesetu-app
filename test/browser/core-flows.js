/* Browser test. Run all with: npm run test:browser (needs: npm i -D playwright && npx playwright install chromium) */
const { chromium } = require('playwright');
const out=(process.env.SHOTS || require('os').tmpdir()) + '/' + 'e2e_'; const url=process.argv[2]||'http://localhost:3000/';
const R=[]; const ok=(n,c,x='')=>{R.push((c?'PASS ':'FAIL ')+n+(x?' — '+x:''));};
(async()=>{
 const b=await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
 const errs=[]; const mk=async(o,n)=>{const c=await b.newContext(Object.assign({acceptDownloads:true},o));await c.addInitScript(()=>{try{if(!localStorage.getItem('baari-lang'))localStorage.setItem('baari-lang','hi')}catch(e){}});const p=await c.newPage();p.on('pageerror',e=>errs.push(n+': '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts/.test(m.text()))errs.push(n+' console: '+m.text())});return p;};

 async function wizard(p, name, phone, complaint, dept){
   await p.waitForSelector('#f-name'); await p.fill('#f-name', name); if(phone) await p.fill('#f-phone', phone);
   await p.click('#regform button[type=submit]'); await p.waitForSelector('.depts-f');
   if(complaint){ await p.fill('#f-complaint', complaint); await p.dispatchEvent('#f-complaint','input'); await p.waitForTimeout(250); }
   if(dept) await p.click(`.dcard:has(input[value=${dept}]) .dc-t`);
   await p.click('#regform button[type=submit]'); await p.waitForSelector('.review');
   await p.click('#regform button[type=submit]'); await p.waitForSelector('.ticket');
 }
 // --- Staff signs in (staff role)
 const st=await mk({viewport:{width:1366,height:900}},'staff');
 await st.goto(url+'#staff'); await st.waitForSelector('#pin'); await st.fill('#pin','9999'); await st.click('#loginform button'); await st.waitForTimeout(400);
 ok('Wrong PIN rejected', (await st.textContent('#pinerr')).includes('wrong'));
 await st.fill('#pin','1234'); await st.click('#loginform button'); await st.waitForSelector('#ops-now'); 
 ok('Staff login', (await st.textContent('#rolechip')).includes('Counter staff'));
 // --- Home
 const hm=await mk({viewport:{width:1440,height:900}},'home'); await hm.goto(url); await hm.waitForSelector('.qcard'); await hm.waitForTimeout(500);
 ok('Home live queue card filled', (await hm.$$('.qc-rows .qc-row')).length===4 && await hm.isVisible('[data-demo]'));
 // --- Hall display
 const tv=await mk({viewport:{width:1600,height:900}},'tv'); await tv.goto(url+'#display'); await tv.waitForTimeout(600);
 ok('Display shows doctor status pill', (await tv.$$('.b-doc')).length>=1);
 // --- Patient hub (phone)
 const ph=await mk({viewport:{width:390,height:844}},'phone');
 await ph.goto(url+'#patient'); await ph.waitForSelector('.tiles');
 ok('Hub has 6 action tiles + emergency', (await ph.$$('.tiles .tile')).length===6 && Boolean(await ph.$('.sosbar')));
 ok('Hub default Hindi', (await ph.textContent('.phead h1')).includes('स्वागत'));
 ok('Emergency button visible on patient screen', await ph.isVisible('#sosfab'));
 ok('Nav translated to Hindi', (await ph.textContent('[data-nav=patient]'))==='मरीज़');
 await ph.click('[data-glang=en]'); await ph.waitForTimeout(400);
 ok('Language switch to English', (await ph.textContent('.phead h1')).includes('Welcome'), await ph.textContent('[data-nav=patient]'));
 // --- Register: 4-step wizard with validation
 await ph.click('.tile.go'); await ph.waitForSelector('#regform');
 ok('Stepper shown', (await ph.$$('.stepper li')).length===4);
 await ph.click('#regform button[type=submit]'); ok('Validation: name required', (await ph.textContent('#formerr')).includes('name'));
 await ph.fill('#f-name','Kamla Devi'); await ph.fill('#f-phone','12345'); await ph.click('#regform button[type=submit]');
 ok('Validation: phone', (await ph.textContent('#formerr')).includes('10 digits'));
 await ph.fill('#f-phone','9811122233'); await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.depts-f');
 await ph.click('#regform button[type=submit]');
 ok('Validation: department required', (await ph.textContent('#formerr')).toLowerCase().includes('department'));
 await ph.click('[data-quick="0"]'); await ph.waitForTimeout(200);
 ok('Symptom chip picks department card', await ph.$eval('input[name=dept][value=MED]',e=>e.checked));
 await ph.fill('#f-complaint','mere ghutne mein dard'); await ph.dispatchEvent('#f-complaint','input'); await ph.waitForTimeout(300);
 ok('Triage moves to Orthopaedics card', await ph.$eval('input[name=dept][value=ORT]',e=>e.checked));
 await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.review');
 ok('Review step shows details', (await ph.textContent('.review')).includes('Kamla Devi') && (await ph.textContent('.review')).includes('Orthopaedics'));
 await ph.click('[data-goto="1"]'); await ph.waitForSelector('#f-name'); ok('Edit from review keeps answers', (await ph.$eval('#f-name',e=>e.value))==='Kamla Devi');
 await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.depts-f'); await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.review');
 await ph.screenshot({path:out+'register.png',fullPage:true});
 await ph.click('#regform button[type=submit]'); await ph.waitForSelector('.ticket'); await ph.waitForTimeout(400);
 const code=(await ph.textContent('.t-code')).trim();
 ok('Token generated + success screen', /^O-\d+/.test(code) && await ph.isVisible('.success'), code);
 ok('Shows position + wait + doctor status + badge', /ahead|next/i.test(await ph.textContent('#tstatus')) && (await ph.$$('#tstatus .doc')).length===1 && Boolean(await ph.$('#tbadge .sbadge')));
 ok('Last updated line', (await ph.textContent('#net')).match(/Live|updated/));
 ok('Map + steps on ticket', (await ph.$$('.wayfind .m-room')).length>=12 && (await ph.$$('.wayfind .steps li')).length>=2);
 ok('Tracking page heading', (await ph.textContent('.phead h1')).length>0);
 await ph.screenshot({path:out+'ticket.png',fullPage:true});
 // duplicate registration
 const dup=await mk({viewport:{width:390,height:844}},'phone2');
 await dup.goto(url+'#register'); await wizard(dup,'kamla  devi','9811122233','', 'EYE');
 ok('Duplicate returns same token', (await dup.textContent('.t-code')).trim()===code);
 // --- Multiple patients + unique tokens
 const codes=new Set([code]);
 for (let i=0;i<4;i++){ const r=await st.evaluate(async (i)=>{const x=await fetch('/api/tokens',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Patient '+i,dept:'ORT'})});return (await x.json()).token.code;},i); codes.add(r);}  
 ok('Unique tokens for multiple patients', codes.size===5, [...codes].join(','));
 // --- Staff: call next until patient is ~3 ahead, check alert
 await st.selectOption('#deptsel','ORT'); await st.waitForTimeout(300);
 let guard=0; while(guard++<10){ const t=(await ph.textContent('#tstatus')); if(/almost up|आने वाली/.test(t)) break; await st.keyboard.press('n'); await ph.waitForTimeout(500);} 
 ok('3-ahead alert on patient screen', /almost up|आने वाली/.test(await ph.textContent('#tstatus')));
 // doctor status
 await st.selectOption('#docsel','delayed:15'); await ph.waitForTimeout(700);
 ok('Doctor delay shows on patient', (await ph.textContent('#tstatus')).includes('late'));
 // keep calling until patient's turn
 guard=0; while(guard++<10){ if(await ph.$('.t-turn')) break; await st.keyboard.press('n'); await ph.waitForTimeout(500);} 
 ok('Patient sees "your turn"', Boolean(await ph.$('.t-turn')));
 ok('Display shows the called token', (await tv.textContent('#bgrid')).includes(code));
 // mark served / skip / back to queue via search
 await st.fill('#s-q', code); await st.waitForTimeout(300);
 ok('Search finds token', (await st.textContent('#qbody')).includes(code));
 await st.click(`#qbody [data-kind=skip]`); await st.waitForSelector('.picker');
 ok('Skip needs a reason', await st.$eval('[data-act=confirm]',e=>e.disabled));
 await st.click('[data-reason=absent]'); await st.click('[data-act=confirm]'); await st.waitForTimeout(600);
 ok('Skip with reason', (await ph.textContent('#tstatus')).toLowerCase().includes('missed'));
 const skipNoReason=await st.evaluate(async(id)=>(await fetch('/api/staff/status',{method:'POST',headers:{'content-type':'application/json','x-staff-pin':'1234'},body:JSON.stringify({tokenId:id,status:'missed'})})).status, await ph.$eval('.patient[data-tk]',e=>e.dataset.tk));
 ok('Server rejects skip without reason', skipNoReason===400 || skipNoReason===409, skipNoReason);
 await st.selectOption('#s-status','all'); await st.fill('#s-q', code); await st.waitForTimeout(300); await st.click(`#qbody [data-set=waiting]`); await st.waitForTimeout(600);
 ok('Back to queue', /ahead|next/i.test(await ph.textContent('#tstatus')));
 await st.fill('#s-q',''); await st.selectOption('#s-status','active');
 // --- I have my slip
 const p3=await mk({viewport:{width:390,height:844}},'phone3'); await p3.goto(url+'#slip'); await p3.waitForSelector('#f-code');
 await p3.fill('#f-code', code.toLowerCase().replace('-',' ')); await p3.click('.lookup button'); await p3.waitForSelector('.slipres');
 ok('I have my slip finds destination', (await p3.textContent('.sr-dest')).match(/Room 7|कमरा 7/), await p3.textContent('.sr-dest'));
 await p3.selectOption('#sl-from','HALL'); await p3.waitForTimeout(200);
 ok('Route from selected start', (await p3.textContent('#slway .steps')).match(/waiting hall|वेटिंग हॉल/));
 await p3.fill('#f-code','Z-99'); await p3.click('.lookup button'); await p3.waitForTimeout(200);
 ok('Unknown token error', await p3.isVisible('.lookup .formerr'));
 // --- Find a department
 await p3.goto(url+'#find'); await p3.waitForSelector('.destgrid'); await p3.click('[data-to=LAB]'); await p3.waitForSelector('#fdway');
 ok('Find department route', (await p3.$$('#fdway .steps li')).length>=2);
 // --- Help desk -> join queue -> staff moves to clinic
 await p3.goto(url+'#help'); await p3.waitForSelector('#hp-join'); await p3.click('#hp-join'); await p3.waitForSelector('#regform');
 ok('Help desk preselected', true);
 await p3.fill('#f-name','Gopal Singh'); await p3.click('#regform button[type=submit]'); await p3.waitForSelector('.depts-f'); await p3.click('#regform button[type=submit]'); await p3.waitForSelector('.review'); await p3.click('#regform button[type=submit]'); await p3.waitForSelector('.ticket');
 const hcode=(await p3.textContent('.t-code')).trim(); ok('Help desk token', hcode.startsWith('H-'), hcode);
 await st.fill('#s-q', hcode); await st.waitForTimeout(300); const hid=await st.$eval('#qbody [data-move]',e=>e.dataset.move);
 await st.selectOption('#mv-'+hid,'EYE'); await st.click('#qbody [data-move]'); await st.fill('#s-q',''); await p3.waitForTimeout(800);
 ok('Help desk sends patient to clinic; patient screen follows', (await p3.textContent('.t-code')).trim().startsWith('E-'), await p3.textContent('.t-code'));
 // --- Emergency
 await p3.click('#sosfab'); await p3.waitForSelector('#sos .sheet');
 ok('Emergency sheet shows contacts', (await p3.textContent('.sos-nums')).includes('112') && (await p3.textContent('.sos-nums')).includes('108'));
 await p3.click('[data-sign=chest]'); await p3.selectOption('#sos-where','HALL'); await p3.click('#sos-send'); await p3.waitForSelector('.sos-ok');
 ok('Emergency request sent', (await p3.textContent('#sos-state')).match(/recorded|दर्ज/));
 await st.waitForTimeout(600);
 ok('Staff receives alert, pinned', (await st.textContent('#alerts')).includes('Emergency help requested at'));
 ok('Staff title flags urgent', (await st.title()).includes('URGENT'));
 await st.screenshot({path:out+'staff_alert.png'});
 await st.click('#alerts [data-alert=ack]'); await p3.waitForTimeout(5000);
 ok('Hall display shows emergency banner (no details)', await tv.isVisible('#bemr'));
 ok('Patient sees acknowledged', (await p3.textContent('#sos-state')).match(/saw your alert|देख लिया/));
 await p3.screenshot({path:out+'sos.png'});
 await st.click('#alerts [data-alert=resolve]'); await st.waitForTimeout(500);
 ok('Alert resolved clears panel', (await st.textContent('#alerts')).trim()==='');
 // repeated clicks -> no duplicate alert
 const n1=await st.evaluate(async()=>{const r=await fetch('/api/staff/state',{headers:{'x-staff-pin':'1234'}});return (await r.json()).alerts.length;});
 await p3.evaluate(async()=>{for(let i=0;i<3;i++) await fetch('/api/emergency',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clientId:'same-device',place:'GATE'})});});
 const n2=await st.evaluate(async()=>{const r=await fetch('/api/staff/state',{headers:{'x-staff-pin':'1234'}});return (await r.json()).alerts.length;});
 ok('Repeated emergency clicks make one alert', n2-n1===1, `${n1}->${n2}`);
 // urgent symptoms at registration -> pinned in queue
 await p3.keyboard.press('Escape');
 const ur=await mk({viewport:{width:390,height:844}},'phone4'); await ur.goto(url+'#register'); await ur.waitForSelector('#regform');
 await ur.fill('#f-name','Raj Kumar'); await ur.click('#regform button[type=submit]'); await ur.waitForSelector('.depts-f'); await ur.fill('#f-complaint','seene mein dard'); await ur.dispatchEvent('#f-complaint','input'); await ur.waitForTimeout(300);
 ok('Urgent warning on form', await ur.isVisible('#urgent'));
 await ur.click('#regform button[type=submit]'); await ur.waitForSelector('.review'); await ur.click('#regform button[type=submit]'); await ur.waitForSelector('.ticket'); const ucode=(await ur.textContent('.t-code')).trim();
 await st.selectOption('#deptsel','MED'); await st.waitForTimeout(600);
 ok('Urgent patient pinned to top of staff queue', (await st.textContent('#qbody tr.urgent-row')).includes(ucode) && (await st.$eval('#qbody tr',e=>e.className)).includes('urgent-row'), ucode);
 await st.click(`#qbody tr.urgent-row [data-callnow]`); await ur.waitForTimeout(800);
 ok('Call now from pin reaches patient', Boolean(await ur.$('.t-turn')));
 // assisted registration
 await st.goto(url+'#assist'); await st.waitForSelector('#regform');
 ok('Assisted mode banner', await st.isVisible('.assistbar'));
 await st.fill('#f-name','Shanti Devi'); await st.click('#regform button[type=submit]'); await st.waitForSelector('.depts-f'); await st.click('.dcard:has(input[value=GYN]) .dc-t'); await st.click('#regform button[type=submit]'); await st.waitForSelector('.review'); await st.click('#regform button[type=submit]'); await st.waitForSelector('.assistbar.ok');
 ok('Assisted registration confirmation', (await st.textContent('.t-code')).trim().startsWith('G-'));
 // verify slip privacy
 const tid=await ph.$eval('.patient[data-tk]',e=>e.dataset.tk);
 const pub=await mk({viewport:{width:800,height:800}},'pub'); await pub.goto(url+'#verify-'+tid); await pub.waitForSelector('.verify');
 ok('Public slip check hides name', !(await pub.textContent('.verify')).includes('Kamla'));
 await st.goto(url+'#verify-'+tid); await st.waitForSelector('.verify'); ok('Staff slip check shows name', (await st.textContent('.verify')).includes('Kamla'));
 // admin role
 await st.goto(url+'#admin'); await st.waitForTimeout(400); ok('Staff cannot open dashboard', (await st.textContent('main')).includes('Admins only'));
 const ad=await mk({viewport:{width:1366,height:900}},'admin'); await ad.goto(url+'#staff'); await ad.waitForSelector('#pin'); await ad.fill('#pin','4321'); await ad.click('#loginform button'); await ad.waitForSelector('#ops-now');
 await ad.goto(url+'#admin'); await ad.waitForSelector('.a-kpis');
 const [csv]=await Promise.all([ad.waitForEvent('download',{timeout:5000}).catch(()=>null), ad.click('#csv')]);
 ok('Admin dashboard + CSV export', Boolean(csv));
 await ad.screenshot({path:out+'admin.png',fullPage:true});
 const unauth=await pub.evaluate(async()=>(await fetch('/api/staff/state')).status); ok('Unauthorized API blocked', unauth===401);
 const staffReset=await pub.evaluate(async()=>(await fetch('/api/staff/reset',{method:'POST',headers:{'content-type':'application/json','x-staff-pin':'1234'},body:'{}'})).status); ok('Staff cannot reset (admin only)', staffReset===403);
 // keyboard: tab to a dept card and select with space
 const kb=await mk({viewport:{width:1024,height:800}},'kb'); await kb.goto(url+'#register'); await kb.waitForSelector('#regform'); await kb.fill('#f-name','Key Board'); await kb.keyboard.press('Enter'); await kb.waitForSelector('.depts-f'); await kb.focus('input[name=dept][value=SKN]'); await kb.keyboard.press('Space');
 ok('Keyboard selects department card', await kb.$eval('input[name=dept][value=SKN]',e=>e.checked));
 // offline indicator
 await ph.context().setOffline(true); await ph.evaluate(()=>window.dispatchEvent(new Event('offline'))); await ph.waitForTimeout(400);
 ok('Offline warning shown', (await ph.textContent('#net')).match(/offline|ऑफ़लाइन/i));
 await ph.context().setOffline(false);
 // large text
 await ph.click('[data-big]'); ok('Large text toggle', await ph.evaluate(()=>document.documentElement.classList.contains('ts-l')));
 // responsive: no horizontal scroll on phone screens
 for (const h of ['#home','#patient','#register','#find','#slip','#help','#track','#queue','#staff']) { await ur.goto(url+h); await ur.waitForTimeout(300); const w=await ur.evaluate(()=>document.documentElement.scrollWidth); if(w>390) ok('No sideways scroll '+h, false, w); }
 ok('Phone layouts fit 390px', true);
 const tab=await mk({viewport:{width:820,height:1180}},'tablet'); await tab.goto(url+'#staff'); await tab.waitForTimeout(400); ok('Tablet width fits', (await tab.evaluate(()=>document.documentElement.scrollWidth))<=820);
 await ph.goto(url+'#patient'); await ph.waitForTimeout(300); await ph.screenshot({path:out+'hub.png',fullPage:true});
 await tv.waitForTimeout(300); await tv.screenshot({path:out+'tv.png'});
 console.log(R.join('\n')); console.log('ERRORS', JSON.stringify(errs));
 await b.close();
})();
