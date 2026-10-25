/* Browser test. Run all with: npm run test:browser (needs: npm i -D playwright && npx playwright install chromium) */
/* Browser checks for the 10 new features. Usage: node f10.js [baseUrl] */
const { chromium } = require('playwright');
const url = process.argv[2] || 'http://localhost:3000/';
const out = (process.env.SHOTS || require('os').tmpdir()) + '/f10_';
const R = []; const ok = (n, c, x = '') => R.push((c ? 'PASS ' : 'FAIL ') + n + (x ? ' — ' + x : ''));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const errs = [];
  const spy = () => { window.__notes = []; const rec = (t, o) => window.__notes.push({ t, body: o && o.body, tag: o && o.tag });
    try { const P = ServiceWorkerRegistration.prototype.showNotification; ServiceWorkerRegistration.prototype.showNotification = function (t, o) { rec(t, o); return P.call(this, t, o).catch(() => {}); }; } catch (e) {}
    try { const N = window.Notification; if (N) { const W = function (t, o) { rec(t, o); return new N(t, o); }; W.requestPermission = (...a) => N.requestPermission(...a); Object.defineProperty(W, 'permission', { get: () => N.permission }); window.Notification = W; } } catch (e) {} };
  const mk = async (o = {}, lang = 'en', name = 'p') => {
    const c = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, o));
    if (lang) await c.addInitScript(l => { try { if (!localStorage.getItem('baari-lang')) localStorage.setItem('baari-lang', l); } catch (e) {} }, lang);
    await c.addInitScript(spy);
    const p = await c.newPage(); p.on('pageerror', e => errs.push(name + ': ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/fonts|ERR_TUNNEL|status of 40[0134]|status of 429/.test(m.text())) errs.push(name + ' console: ' + m.text()); });
    return { c, p };
  };
  async function register(p, name, dept) {
    await p.goto(url + '#register'); await p.waitForSelector('#f-name');
    await p.fill('#f-name', name); await p.click('#regform button[type=submit]'); await p.waitForSelector('.depts-f');
    await p.click(`.dcard:has(input[value=${dept}]) .dc-t`); await p.click('#regform button[type=submit]'); await p.waitForSelector('.review');
    await p.click('#regform button[type=submit]'); await p.waitForSelector('.ticket #tdetails .slipinfo'); await sleep(300);
    return (await p.textContent('.ticket .t-code')).trim();
  }

  // ---------- Staff and admin sign in
  const { p: st } = await mk({ viewport: { width: 1366, height: 900 } }, 'en', 'staff');
  await st.goto(url + '#staff'); await st.waitForSelector('#pin'); await st.fill('#pin', '1234'); await st.click('#loginform button'); await st.waitForSelector('#ops-now');
  const { p: ad } = await mk({ viewport: { width: 1366, height: 900 } }, 'en', 'admin');
  await ad.goto(url + '#staff'); await ad.waitForSelector('#pin'); await ad.fill('#pin', '4321'); await ad.click('#loginform button'); await ad.waitForSelector('#ops-now');
  await ad.goto(url + '#admin'); await ad.waitForSelector('#demopanel');

  // ---------- 5. First-visit language picker
  {
    const { c, p } = await mk({}, null, 'first');
    await p.goto(url + '#patient'); await p.waitForSelector('#langpick', { timeout: 4000 }).catch(() => {});
    ok('5 First visit shows the language picker', await p.isVisible('#langpick'));
    const names = await p.$$eval('[data-pick-lang] b', x => x.map(e => e.textContent));
    ok('5 Each language in its own script', names.join('|') === 'हिन्दी|English|डोगरी', names.join('|'));
    await p.keyboard.press('Escape'); ok('5 Picker cannot be dismissed by accident', await p.isVisible('#langpick'));
    await p.click('[data-pick-lang=doi]'); await sleep(300);
    ok('5 Choice applied', !(await p.isVisible('#langpick')) && /जी आयां गी/.test(await p.textContent('h1')));
    await p.reload(); await sleep(800);
    ok('5 Saved: no picker on next visit', !(await p.isVisible('#langpick')) && await p.evaluate(() => localStorage.getItem('baari-lang')) === 'doi');
    await p.click('[data-glang=en]'); await sleep(300); ok('5 Switch language from the top bar', /Welcome/.test(await p.textContent('h1')));
    const { p: s2 } = await mk({ viewport: { width: 1200, height: 800 } }, null, 'staff-first'); await s2.goto(url + '#staff'); await sleep(800);
    ok('5 No picker on staff screens', !(await s2.isVisible('#langpick')));
    await c.close();
  }

  // ---------- 1, 4, 6. Register, slip with doctor, estimate, alerts
  const { c: pc, p: ph } = await mk({}, 'en', 'phone');
  await pc.grantPermissions(['notifications'], { origin: url.replace(/\/$/, '') });
  const code = await register(ph, 'Feature Test Patient', 'MED');
  const det = await ph.textContent('#tdetails');
  ok('1 Slip shows the doctor of the queue', /Dr\. Rakesh Gupta/.test(det), det.match(/Doctor.{0,40}/)?.[0]);
  ok('1 Slip shows hospital, token, department, issued, wait, status, instructions', ['Hospital', 'Token', 'Department', 'Issued', 'Estimated wait', 'Status', 'What to do'].every(k => det.includes(k)) && det.includes(code));
  ok('1 Slip has the QR code', Boolean(await ph.$('#tqr canvas')));
  ok('4 Wait shown as an estimate in plain words', /Approximately \d+ minutes/.test(det) && /Estimate based on the last \d+ patients/.test(det), det.match(/Approximately[^.]*\.[^.]*\./)?.[0]);
  const pub = await ph.evaluate(() => fetch('/api/state').then(r => r.json()));
  ok('4 Server sends last-10 averages per queue', pub.service.MED.source === 'history' && pub.service.MED.n === 10, JSON.stringify(pub.service.MED));
  await ph.emulateMedia({ media: 'print' }); await ph.screenshot({ path: out + 'print.png', fullPage: true }); await ph.emulateMedia({ media: 'screen' });
  ok('6 Alerts card explains before asking', /Turn on alerts/.test(await ph.textContent('#tnotif')) && /never your name/.test(await ph.textContent('#tnotif')));
  await ph.click('[data-notif=on]'); await sleep(600);
  ok('6 Granted: alerts on', /Alerts are on/.test(await ph.textContent('#tnotif')));
  let notes = await ph.evaluate(() => window.__notes);
  ok('6 "Token created" alert shown', notes.some(n => n.body && n.body.includes(code) && /created/.test(n.body)), JSON.stringify(notes));
  await ph.screenshot({ path: out + 'ticket.png', fullPage: true });

  // ---------- 9. Send to end of queue (staff) and the patient's screen follows
  await st.selectOption('#deptsel', 'MED'); await sleep(300);
  const posBefore = await ph.evaluate(() => { const s = window.__s; return null; });
  await st.fill('#s-q', code); await sleep(300);
  const myRow = await st.$(`#qbody tr:has(.tcode:text-is("${code}"))`);
  ok('9 "To end" hidden for the last patient in line', myRow && !(await myRow.$('[data-kind=requeue]')));
  await st.fill('#s-q', ''); await sleep(300);
  const firstCode = (await st.textContent('#qbody tr:first-child .tcode')).trim();
  await st.click('#qbody tr:first-child [data-kind=requeue]'); await sleep(200);
  ok('9 Asks for confirmation and explains the longer wait', /may wait about \d+ min longer/.test(await st.textContent('.picker.requeue')));
  await st.screenshot({ path: out + 'requeue.png' });
  await st.click('[data-act=confirm-requeue]'); await sleep(600);
  const order = await st.$$eval('#qbody .tcode', x => x.map(e => e.textContent.trim()));
  ok('9 Patient moved to the end, no duplicate', order[order.length - 1] === firstCode && order.filter(c => c === firstCode).length === 1, firstCode + ' → ' + order.slice(-3).join(','));
  ok('9 Logged with role and time', /sent to the end of the queue/.test(await st.textContent('#audit')) && /Counter staff/.test(await st.textContent('#audit')));
  const aheadTxt = await ph.textContent('#tstatus'); ok('9 Patient phone updates its place', /ahead|next/i.test(aheadTxt));

  // ---------- 6. Turn is close + called alerts (no names)
  for (let i = 0; i < 12; i++) { const a = await ph.evaluate(() => document.querySelector('#tstatus').textContent); if (/next|[0-3] ahead/.test(a)) break; await st.click('[data-act=next]'); await sleep(350); }
  await sleep(600); notes = await ph.evaluate(() => window.__notes);
  ok('6 "Turn is close" alert for the right token', notes.some(n => n.body && n.body.includes(code) && /close/.test(n.body)), notes.map(n => n.body).join(' | '));
  for (let i = 0; i < 6; i++) { if (/turn/i.test(await ph.textContent('#tstatus')) && /It’s your turn/.test(await ph.textContent('#tstatus'))) break; await st.click('[data-act=next]'); await sleep(400); }
  await sleep(600); notes = await ph.evaluate(() => window.__notes);
  ok('6 "It’s your turn" alert', notes.some(n => n.body && n.body.includes(code) && /your turn/.test(n.body)));
  ok('6 Alerts never include the name', notes.every(n => !/Feature Test/.test(n.body || '')));
  const calledDoc = await ph.textContent('#tdetails .sd-doc');
  ok('1 Called slip keeps the doctor who sees them', /Dr\. Rakesh Gupta/.test(calledDoc));
  {
    const { c: dc, p } = await mk({}, 'en', 'denied');
    await dc.addInitScript(() => { try { Notification.requestPermission = () => Promise.resolve('denied'); } catch (e) {} }); // the person taps "Block"
    await register(p, 'Denied Alerts', 'EYE');
    await p.click('[data-notif=on]'); await sleep(500);
    const t = await p.textContent('#tnotif');
    ok('6 Denied: explains and does not ask again', /blocked/.test(t) && !(await p.$('[data-notif=on]')), t.trim());
  }

  // ---------- 3. I'm lost (does not change the token)
  await ph.goto(url + '#patient'); await ph.waitForSelector('.lostbar');
  const before = await ph.evaluate(() => localStorage.getItem('baari-my-token'));
  await ph.click('.lostbar'); await ph.waitForSelector('#lost .sheet');
  const lostTxt = await ph.textContent('#lost');
  ok('3 I’m lost opens with simple steps', /How to get a token/.test(lostTxt) && /token number means/.test(lostTxt) && /How long you will wait/.test(lostTxt) && /Where your doctor is/.test(lostTxt));
  ok('3 Shows my token, room and doctor', lostTxt.includes(code) && /Room 12/.test(lostTxt) && /Dr\./.test(lostTxt));
  await ph.click('#lost-help'); await sleep(200); ok('3 Way to the Help desk', (await ph.$$('#lost-hmap .steps li')).length >= 2);
  await ph.screenshot({ path: out + 'lost.png' });
  await ph.keyboard.press('Escape'); await sleep(200);
  ok('3 Closes with Esc, token unchanged', !(await ph.$('#lost')) && before === await ph.evaluate(() => localStorage.getItem('baari-my-token')));
  await ph.goto(url + '#find'); await ph.waitForSelector('[data-lost]'); await ph.click('[data-lost]'); ok('3 Available on every patient screen', await ph.isVisible('#lost .sheet')); await ph.keyboard.press('Escape');

  // ---------- 2. Crowding indicators change with the queue
  const { p: q } = await mk({ viewport: { width: 1280, height: 900 } }, 'en', 'queue');
  await q.goto(url + '#queue'); await q.waitForSelector('.qc-row .crowd');
  const lvl = async () => q.$$eval('.qc-rows .qc-row', rows => rows.map(r => (r.querySelector('.crowd') || {}).className || '').map(c => (c.match(/c-(\w+)/) || [])[1]));
  const before2 = await lvl();
  ok('2 Every department shows a level with words, not colour alone', before2.length === 6 && before2.every(Boolean) && (await q.$$eval('.qc-rows .qc-row .crowd .ctext', x => x.every(e => e.textContent.trim().length > 2))));
  await ad.click('[data-demo=add]'); await sleep(900);
  const after2 = await lvl();
  const rank = { low: 0, moderate: 1, high: 2, critical: 3 };
  ok('2 Level rises when 20 patients arrive (live)', after2.some((l, i) => rank[l] > rank[before2[i]]), before2.join(',') + ' → ' + after2.join(','));
  await q.screenshot({ path: out + 'crowd.png' });

  // ---------- 10. Demo controls
  let s = await ad.evaluate(() => fetch('/api/staff/state', { headers: { 'x-staff-pin': '4321' } }).then(r => r.json()));
  const demoCount = s.tokens.filter(t => t.sample && t.demo).length;
  ok('10 Add 20 patients', demoCount === 20, String(demoCount));
  const realBefore = s.tokens.filter(t => !t.sample).map(t => t.id + ':' + t.status).sort().join();
  await ad.dblclick('[data-demo=add]'); await sleep(900);
  s = await ad.evaluate(() => fetch('/api/staff/state', { headers: { 'x-staff-pin': '4321' } }).then(r => r.json()));
  ok('10 Double-click adds one batch, not two', s.tokens.filter(t => t.demo).length === 40, String(s.tokens.filter(t => t.demo).length));
  await ad.click('[data-sim=start]'); await sleep(400);
  ok('10 Simulation status is shown', /Simulation running · 10× speed/.test(await ad.textContent('#demopanel')));
  const sim0 = (await ad.evaluate(() => fetch('/api/state').then(r => r.json()))).sim.simNow, t0 = Date.now();
  await sleep(4000);
  for (let i = 0; i < 40; i++) { const x = await ad.evaluate(() => fetch('/api/state').then(r => r.json())); if (x.sim.served > 0) break; await sleep(1000); }
  s = await ad.evaluate(() => fetch('/api/staff/state', { headers: { 'x-staff-pin': '4321' } }).then(r => r.json()));
  ok('10 Simulated clock runs at about 10×', (s.sim.simNow - sim0) / (Date.now() - t0) > 7, ((s.sim.simNow - sim0) / (Date.now() - t0)).toFixed(1) + '×');
  ok('10 Simulation serves demo patients by itself', s.sim.served > 0 && s.tokens.some(t => t.sample && t.status === 'called' && t.simulated), `${s.sim.served} served`);
  const realNow = s.tokens.filter(t => !t.sample).map(t => t.id + ':' + t.status).sort().join();
  ok('10 Real patients untouched by the simulation', realNow === realBefore);
  const { p: tv } = await mk({ viewport: { width: 1600, height: 900 } }, 'en', 'tv'); await tv.goto(url + '#display'); await sleep(800);
  ok('10 Hall display shows the simulation banner', /Simulation running/.test(await tv.textContent('#bsim')));
  await tv.screenshot({ path: out + 'tv.png' });
  await ad.screenshot({ path: out + 'admin.png', fullPage: true });
  await ad.click('[data-sim=pause]'); await sleep(400); const pz = (await ad.evaluate(() => fetch('/api/state').then(r => r.json()))).sim.simNow; await sleep(800);
  ok('10 Pause freezes the simulated clock', pz === (await ad.evaluate(() => fetch('/api/state').then(r => r.json()))).sim.simNow);
  await ad.click('[data-sim=stop]'); await sleep(400);
  ok('10 Stop ends the simulation', !(await ad.evaluate(() => fetch('/api/state').then(r => r.json()))).sim.running);
  await ad.click('[data-demo=clear]'); await ad.click('[data-demo=clear]'); await sleep(800);
  s = await ad.evaluate(() => fetch('/api/staff/state', { headers: { 'x-staff-pin': '4321' } }).then(r => r.json()));
  ok('10 Remove demo data keeps real patients', s.tokens.length > 0 && s.tokens.every(t => !t.sample) && s.tokens.some(t => t.name === 'Feature Test Patient'), `${s.tokens.length} left`);
  const staffDemo = await st.evaluate(() => fetch('/api/admin/demo/add', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pin': '1234' }, body: JSON.stringify({ key: 'staffkey-123' }) }).then(r => r.status));
  ok('10 Counter staff cannot use demo controls', staffDemo === 403);

  // ---------- 7. QR scanning
  const { p: sc } = await mk({}, 'en', 'scan');
  await sc.goto(url + '#slip');
  const tokId = await sc.evaluate(c => fetch('/api/state').then(r => r.json()).then(s => s.tokens.find(t => t.code === c).id), code);
  await sc.goto(url + '#slip'); await sc.waitForSelector('#sl-scan');
  await sc.click('#sl-scan'); await sc.waitForSelector('#scanner .sheet');
  ok('7 Camera is not started until asked', await sc.evaluate(() => !document.querySelector('#scanner video').srcObject));
  await sc.click('#sc-start'); await sleep(1500);
  const live = await sc.evaluate(() => Boolean(document.querySelector('#scanner video').srcObject));
  ok('7 Live camera preview with instructions', live && /Looking for a QR code/.test(await sc.textContent('.sc-msg')), await sc.textContent('.sc-msg'));
  await sc.screenshot({ path: out + 'scanner.png' });
  await sc.click('#sc-stop'); await sleep(200);
  ok('7 Stop closes the camera', await sc.evaluate(() => !document.querySelector('#scanner video').srcObject));
  const mkQR = async text => { const data = await sc.evaluate(t => { const q = window.qrcode(0, 'M'); q.addData(t); q.make(); const n = q.getModuleCount(), cell = 8, pad = 4, px = (n + pad * 2) * cell; const c = document.createElement('canvas'); c.width = c.height = px; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, px, px); x.fillStyle = '#000'; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + pad) * cell, (r + pad) * cell, cell, cell); return c.toDataURL('image/png').split(',')[1]; }, text); return { name: 'qr.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') }; };
  await sc.setInputFiles('#sc-file', await mkQR('https://example.org/something')); await sleep(1200);
  ok('7 Rejects a QR code that is not a QueueSetu slip', /isn’t a QueueSetu slip/.test(await sc.textContent('.sc-msg')), await sc.textContent('.sc-msg'));
  await sc.setInputFiles('#sc-file', await mkQR(url + '#verify-0123456789abcdef')); await sleep(1200);
  ok('7 Checks with the server: unknown slip refused', /isn’t in today’s list/.test(await sc.textContent('.sc-msg')), await sc.textContent('.sc-msg'));
  await sc.fill('#sc-code', 'hello'); await sc.click('.sc-manual button'); await sleep(200);
  ok('7 Manual entry is validated', /like M-27/.test(await sc.textContent('.sc-msg')));
  await sc.setInputFiles('#sc-file', await mkQR(url + '#verify-' + tokId)); await sleep(1500);
  ok('7 Valid slip QR opens the right token', !(await sc.$('#scanner')) && (await sc.textContent('.slipres')).includes(code));
  const pv = await sc.evaluate(id => fetch('/api/verify/' + id).then(r => r.json()), tokId);
  const sv = await st.evaluate(id => fetch('/api/verify/' + id, { headers: { 'x-staff-pin': '1234' } }).then(r => r.json()), tokId);
  ok('7 Public scan shows no personal details; staff scan does', !('name' in pv.token) && sv.token.name === 'Feature Test Patient');
  ok('7 Malformed ids refused', (await sc.evaluate(() => fetch('/api/verify/../../etc').then(r => r.status))) >= 400);

  // ---------- Navigation: three floors and "Avoid stairs"
  {
    const { p: nv } = await mk({}, 'en', 'floors');
    await nv.goto(url + '#find'); await nv.waitForSelector('[data-to=GYN]'); await nv.click('[data-to=GYN]'); await sleep(400);
    const s1 = await nv.$$eval('#fway .steps li', x => x.map(e => e.textContent));
    ok('Floors: route to the Second floor uses the stairs by default', s1.some(t => /Take the stairs up to the Second floor/.test(t)) && (await nv.$$('#fway .map')).length === 2);
    await nv.click('#fway [data-nostairs]'); await sleep(300);
    const s2 = await nv.$$eval('#fway .steps li', x => x.map(e => e.textContent));
    ok('Floors: Avoid stairs switches to Lift B, no stairs in the steps', s2.some(t => /Take Lift B up to the Second floor/.test(t)) && !s2.some(t => /Take the stairs/.test(t)));
    await nv.selectOption('#fd-from', 'EYE'); await sleep(300);
    const s3 = await nv.$$eval('#fway .steps li.vstep', x => x.map(e => e.textContent));
    ok('Floors: Lift A skips the Second floor, so it goes down Lift A and up Lift B', s3.join('|') === 'Take Lift A down to the Ground floor.|Take Lift B up to the Second floor.', s3.join('|'));
    ok('Floors: one map per floor on the route', (await nv.$$eval('#fway .mapfloor', x => x.map(e => e.textContent))).join(',') === '1First floor,2Ground floor,3Second floor');
    await nv.reload(); await sleep(600); await nv.click('[data-to=ORT]'); await sleep(300);
    ok('Floors: Avoid stairs is remembered on the phone', await nv.isChecked('#fway [data-nostairs]') && (await nv.textContent('#fway .steps')).includes('Lift A'));
    ok('Floors: room cards show the floor', /Floor 1/.test(await nv.textContent('[data-to=ORT]')) || /First floor/.test(await nv.textContent('#fway')));
  }

  // ---------- 8. Settings: high contrast and three text sizes
  const { p: se } = await mk({ viewport: { width: 360, height: 780 } }, 'en', 'settings');
  await se.goto(url + '#settings'); await se.waitForSelector('#set-hc');
  ok('8 Medium is the default', await se.evaluate(() => document.documentElement.classList.contains('ts-m')));
  await se.click('#set-hc'); await se.click('label.sz-l'); await sleep(200);
  const hc = await se.evaluate(() => ({ hc: document.documentElement.classList.contains('hc'), l: document.documentElement.classList.contains('ts-l'), bg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(document.querySelector('h1')).color }));
  ok('8 High contrast applies (black on white)', hc.hc && hc.bg === 'rgb(255, 255, 255)' && hc.ink === 'rgb(0, 0, 0)', JSON.stringify(hc));
  await se.screenshot({ path: out + 'settings.png', fullPage: true });
  const overflow = [];
  for (const h of ['#patient', '#register', '#track', '#find', '#slip', '#queue', '#help', '#settings']) { await se.goto(url + h); await sleep(400); const w = await se.evaluate(() => document.documentElement.scrollWidth); if (w > 362) overflow.push(h + ':' + w); }
  ok('8 Large text + high contrast: no sideways scrolling at 360 px', !overflow.length, overflow.join(' '));
  await se.goto(url + '#patient'); await sleep(300); await se.screenshot({ path: out + 'large-hc.png', fullPage: true });
  await se.reload(); await sleep(600);
  ok('8 Saved between visits', await se.evaluate(() => document.documentElement.classList.contains('hc') && document.documentElement.classList.contains('ts-l')));
  await se.goto(url + '#settings'); await se.click('label.sz-s'); await sleep(150);
  ok('8 Small size applies', await se.evaluate(() => document.documentElement.classList.contains('ts-s')));
  await se.click('#set-reset'); await sleep(200);
  ok('8 Reset to default', await se.evaluate(() => document.documentElement.classList.contains('ts-m') && !document.documentElement.classList.contains('hc')));
  await se.keyboard.press('Tab'); ok('8 Visible keyboard focus', await se.evaluate(() => { const a = document.activeElement; return a && getComputedStyle(a).outlineStyle !== 'none'; }));

  /* 11. Send token by SMS (phone's own SMS app) and the shared live link */
  {
    const { p: sp } = await mk({}, 'en', 'sms'); await register(sp, 'Sms Tester', 'MED');
    const href = await sp.getAttribute('#tsms', 'href'), body = decodeURIComponent(href.split('body=')[1] || '');
    ok('11 SMS button opens the SMS app', /^sms:\??&?body=/.test(href), href.slice(0, 14));
    ok('11 SMS text has token, room, floor and a live link', /Token M-\d+/.test(body) && /Room 12/.test(body) && /Ground floor/.test(body) && /#t-[a-f0-9]{16}$/.test(body), body);
    const link = body.match(/https?:\S+/)[0], code = (await sp.textContent('.ticket .t-code')).trim();
    const { p: fp } = await mk({}, 'hi', 'family'); await fp.goto(link); await fp.waitForSelector('.ticket', { timeout: 8000 });
    ok('11 Family phone opens the same token live', (await fp.textContent('.ticket .t-code')).trim() === code && await fp.evaluate(() => location.hash) === '#status');
    ok('11 SMS text follows the language (Hindi)', /टोकन/.test(decodeURIComponent((await fp.getAttribute('#tsms', 'href')).split('body=')[1])));
    ok('11 No sideways scrolling with the SMS card', await sp.evaluate(() => document.documentElement.scrollWidth) <= 390);
  }

  console.log(R.join('\n')); console.log('ERRORS', JSON.stringify(errs));
  await b.close();
})().catch(e => { console.error(e); console.log(R.join('\n')); process.exit(1); });
