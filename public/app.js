/* QueueSetu browser app: patient screens, staff console, hall display and dashboard. */
(function () {
  const { DEPTS, DEPT, CLINICS, REASONS, REASON, PLACES, suggestDept, waitingIn, currentIn, aheadOf, estMin, queueEst } = window.BaariShared;

  const QUICK = [
    { hi: "बुख़ार", doi: "बुखार", en: "Fever", d: "MED" }, { hi: "सिर दर्द", doi: "सिरै दा दर्द", en: "Headache", d: "MED" }, { hi: "खाँसी", doi: "खंग", en: "Cough", d: "MED" },
    { hi: "पेट दर्द", doi: "पेटै दा दर्द", en: "Stomach pain", d: "MED" }, { hi: "हड्डी या जोड़ का दर्द", doi: "हड्डी जां जोड़ें दा दर्द", en: "Bone or joint pain", d: "ORT" },
    { hi: "बच्चे की जाँच", doi: "बच्चे दी जांच", en: "Child check-up", d: "PAE" }, { hi: "गर्भावस्था जाँच", doi: "गर्भ दी जांच", en: "Pregnancy check-up", d: "GYN" },
    { hi: "आँख की तकलीफ़", doi: "अक्खीं दी तकलीफ", en: "Eye problem", d: "EYE" }, { hi: "त्वचा पर खुजली", doi: "चमड़ी पर खारश", en: "Skin itching", d: "SKN" }
  ];
  const T = {
    hi: { title: "OPD टोकन लें", name: "आपका नाम", complaint: "क्या तकलीफ़ है?", dept: "विभाग चुनें", phone: "मोबाइल नंबर (ज़रूरी नहीं)",
      sms: "बारी पास आने पर SMS भेजें", get: "टोकन लें", suggested: "आपकी बात से सुझाया गया। आप बदल सकते हैं।",
      speak: "बोलकर बताएँ", listening: "सुन रहे हैं… बोलिए", noVoice: "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है। कृपया टाइप करें।",
      micBlocked: "माइक की अनुमति नहीं मिली। कृपया टाइप करें।", voiceErr: "आवाज़ समझ नहीं आई। फिर से कोशिश करें या टाइप करें।",
      needName: "कृपया अपना नाम लिखें।", badPhone: "मोबाइल नंबर 10 अंकों का होना चाहिए और 6, 7, 8 या 9 से शुरू होना चाहिए।", saveErr: "टोकन नहीं बन पाया। इंटरनेट देखें और फिर से कोशिश करें।",
      qhint: (n, m) => n ? `अभी ${n} लोग इंतज़ार में हैं, लगभग ${m} मिनट` : "अभी कोई इंतज़ार में नहीं है",
      your: "आपका टोकन", ahead: n => n === 0 ? "अगला नंबर आपका है" : `आपसे पहले ${n} लोग`, wait: m => `लगभग ${m} मिनट`,
      turn: "अब आपकी बारी है", goto: r => `${r} में जाएँ`, done: "आपकी जाँच हो गई", doneSub: "QueueSetu इस्तेमाल करने के लिए धन्यवाद।",
      missed: "आपका नंबर निकल गया", missedSub: "कृपया हेल्प डेस्क पर अपना टोकन दिखाएँ। स्टाफ़ आपको फिर से कतार में जोड़ सकता है।",
      sit: "आप आराम से बैठ सकते हैं। नंबर आने पर यह स्क्रीन अपने आप बदल जाएगी।", nowServing: "अभी चल रहा है", none: "कोई नहीं",
      smsOn: p => `${p} पर SMS आएगा जब आपकी बारी पास होगी।`, newToken: "नया टोकन लें", gone: "यह टोकन आज की सूची में नहीं है।" },
    en: { title: "Get your OPD token", name: "Your name", complaint: "What’s the problem?", dept: "Choose a department", phone: "Mobile number (optional)",
      sms: "Text me when my turn is close", get: "Get token", suggested: "Suggested from what you said. You can change it.",
      speak: "Speak instead", listening: "Listening… speak now", noVoice: "Voice input isn’t available in this browser. Please type instead.",
      micBlocked: "Microphone access was blocked. Please type instead.", voiceErr: "Couldn’t catch that. Try again or type it.",
      needName: "Please enter your name.", badPhone: "The mobile number should have 10 digits and start with 6, 7, 8 or 9.", saveErr: "Couldn’t create your token. Check the connection and try again.",
      qhint: (n, m) => n ? `${n} waiting right now, about ${m} min` : "Nobody is waiting right now",
      your: "Your token", ahead: n => n === 0 ? "You’re next" : `${n} ahead of you`, wait: m => `Approximately ${m} ${m === 1 ? "minute" : "minutes"}`,
      turn: "It’s your turn", goto: r => `Go to ${r}`, done: "Your consultation is done", doneSub: "Thank you for using QueueSetu.",
      missed: "Your number was missed", missedSub: "Please show your token at the Help desk. Staff can put you back in the queue.",
      sit: "You can sit down. This screen changes by itself when your turn comes.", nowServing: "Now serving", none: "None",
      smsOn: p => `We’ll text ${p} when your turn is close.`, newToken: "Get a new token", gone: "This token isn’t in today’s list." },
    doi: { title: "OPD टोकन लैओ", name: "तुंदा नां", complaint: "के तकलीफ ऐ?", dept: "बिभाग चुनो", phone: "मोबाइल नंबर (ज़रूरी नेईं)",
      sms: "बारी कोल औने पर SMS भेजो", get: "टोकन लैओ", suggested: "तुंदी गल्ल सुनियै सुझाया गेआ। तुस बदली सकदे ओ।",
      speak: "बोलियै दस्सो", listening: "सुना करदे आं… बोलो", noVoice: "इस ब्राउज़र च बोलियै लिखने दी सुविधा नेईं ऐ। किरपा करियै टाइप करो।",
      micBlocked: "माइक दी इजाजत नेईं मिली। किरपा करियै टाइप करो।", voiceErr: "आवाज़ समझ नेईं आई। फ्ही कोशश करो जां टाइप करो।",
      needName: "किरपा करियै अपना नां लिखो।", badPhone: "मोबाइल नंबर 10 अंकें दा होना चाहिदा ऐ ते 6, 7, 8 जां 9 कन्नै शुरू होना चाहिदा ऐ।", saveErr: "टोकन नेईं बनी सकेआ। इंटरनेट दिक्खो ते फ्ही कोशश करो।",
      qhint: (n, m) => n ? `हुन ${n} लोक इंतजार करा करदे न, लगभग ${m} मिंट` : "हुन कोई इंतजार नेईं करा करदा",
      your: "तुंदा टोकन", ahead: n => n === 0 ? "अगला नंबर तुंदा ऐ" : `तुंदे शा पैह्लें ${n} लोक`, wait: m => `लगभग ${m} मिंट`,
      turn: "हुन तुंदी बारी ऐ", goto: r => `इत्थै जाओ: ${r}`, done: "तुंदी जांच होई गेई ऐ", doneSub: "QueueSetu बरतने आस्तै धन्नवाद।",
      missed: "तुंदा नंबर निकली गेआ", missedSub: "हेल्प डेस्क पर अपना टोकन दस्सो। स्टाफ तुसेंगी फ्ही कतार च जोड़ी सकदा ऐ।",
      sit: "तुस आराम कन्नै बेही सकदे ओ। बारी औने पर एह् स्क्रीन अपने आप बदली जाग।", nowServing: "हुन बुलाए गेदे", none: "कोई नेईं",
      smsOn: p => `बारी कोल औने पर ${p} नंबर पर SMS औग।`, newToken: "नमां टोकन लैओ", gone: "एह् टोकन अज्जै दी लिस्ट च नेईं ऐ।" }
  };

  /* ---------- Helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const mins = ms => Math.max(0, Math.round(ms / 60000));
  const clock = t => new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: ls.get("baari-lang") !== "doi" });
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const LANGS = ["hi", "en", "doi"];
  const getLang = () => LANGS.includes(ls.get("baari-lang")) ? ls.get("baari-lang") : "hi";
  const setLang = l => { const v = LANGS.includes(l) ? l : "hi"; ls.set("baari-lang", v); document.documentElement.lang = v; };
  /* Pick the string for the current language: Hindi, English, Dogri. */
  const L3 = (lg, hi, en, doi) => lg === "hi" ? hi : lg === "doi" ? doi : en;
  const SPEECH = { hi: "hi-IN", en: "en-IN", doi: "hi-IN" };
  const big = () => ls.get("baari-big") === "1";
  /* Token code from what a patient types: "m27", "M 27", "m-027" → "M-27" */
  function normCode(v) {
    const m = /^\s*([A-Za-z])\s*[-–]?\s*0*(\d{1,3})\s*$/.exec(String(v || ""));
    return m ? m[1].toUpperCase() + "-" + String(Number(m[2])).padStart(2, "0") : null;
  }
  const PATIENT_VIEWS = ["home", "patient", "register", "status", "track", "slip", "find", "help", "queue", "verify", "settings"];

  /* ---------- Connection to the server ---------- */
  const Store = {
    state: null, staff: false, role: null, connected: false, lastAt: 0, subs: new Set(),
    on(f) { this.subs.add(f); },
    emit() { this.subs.forEach(f => { try { f(this.state); } catch (e) { console.error(e); } }); },
    remember() { // keep the last public queue on this phone, so a reload with no signal still shows it
      if (this.state && !this.state.staff) { try { localStorage.setItem("baari-last-state", JSON.stringify({ at: this.lastAt, s: this.state })); } catch (e) {} }
    },
    async init() {
      try {
        const r = await fetch("/api/state");
        if (!r.ok) throw new Error("state " + r.status);
        this.state = await r.json(); this.lastAt = Date.now(); this.remember();
      } catch (e) {
        let saved = null; try { saved = JSON.parse(localStorage.getItem("baari-last-state") || "null"); } catch (x) {}
        if (!saved || !saved.s) throw e;
        this.state = saved.s; this.lastAt = saved.at || 0; this.cached = true;
      }
      if (typeof io !== "function") { // socket library missing (opened offline before it was ever saved): try again when back online
        addEventListener("online", () => location.reload(), { once: true });
        addEventListener("online", () => this.emit()); addEventListener("offline", () => this.emit());
        return;
      }
      this.socket = io({ transports: ["websocket", "polling"] });
      this.socket.on("connect", () => { this.connected = true; this.join(); this.emit(); Pending.flush(); });
      this.socket.on("disconnect", () => { this.connected = false; this.emit(); });
      this.socket.on("state", s => {
        if (this.state && s.rev < this.state.rev && s.date === this.state.date && s.staff === this.state.staff) return;
        this.state = s; this.lastAt = Date.now(); this.cached = false; this.remember(); this.emit();
      });
      addEventListener("online", () => { this.emit(); Pending.flush(); });
      addEventListener("offline", () => this.emit());
    },
    online() { return this.connected && navigator.onLine !== false; },
    join() {
      const pin = ls.get("baari-pin");
      if (!pin || !this.socket) { this.staff = false; this.role = null; return Promise.resolve(false); }
      return new Promise(ok => this.socket.emit("join", { pin }, r => {
        this.staff = Boolean(r && r.staff); this.role = r && r.role || null;
        if (!this.staff) ls.del("baari-pin");
        this.emit(); ok(this.staff);
      }));
    },
    async post(path, body, staff) {
      const headers = { "Content-Type": "application/json" };
      if (staff) headers["x-staff-pin"] = ls.get("baari-pin") || "";
      let r;
      try { r = await fetch(path, { method: "POST", headers, body: JSON.stringify(body || {}) }); }
      catch (x) { const e = new Error("No connection. Check the internet and try again."); e.status = 0; throw e; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(j.error || "Something went wrong. Please try again."); e.status = r.status; throw e; }
      return j;
    }
  };
  /* Registrations made with no signal wait on this phone and are sent as soon as the connection is back. */
  const Pending = {
    busy: false,
    get() { try { return JSON.parse(ls.get("baari-pending") || "null"); } catch (e) { return null; } },
    save(body) { ls.set("baari-pending", JSON.stringify({ body, at: Date.now() })); },
    clear() { ls.del("baari-pending"); },
    async flush() {
      const p = this.get(); if (!p || this.busy || navigator.onLine === false) return;
      this.busy = true;
      try {
        const j = await Store.post("/api/tokens", p.body);
        try { const r = await fetch("/api/state"); if (r.ok) { const st = await r.json(); if (!Store.staff && (!Store.state || st.rev >= Store.state.rev || st.date !== Store.state.date)) { Store.state = st; Store.lastAt = Date.now(); Store.remember(); } } } catch (x) {}
        this.clear();
        trackToken(j.token, { name: p.body.name, phone: j.token.phone, sms: j.token.sms, urgent: j.token.urgent });
        ls.set("baari-just", j.duplicate ? "dup" : "new"); ls.set("baari-just-notify", j.token.id);
        const lg = getLang();
        toast(L3(lg, `आपका टोकन पक्का हो गया: ${j.token.code}`, `Your token is confirmed: ${j.token.code}`, `तुंदा टोकन पक्का होई गेआ: ${j.token.code}`));
        Store.emit();
      } catch (e) {
        if (e.status && e.status !== 0 && e.status !== 429 && e.status < 500) this.clear(); // the server refused it for good; the screen explains
      } finally { this.busy = false; }
    }
  };
  function syncChip() {
    if (Store.online()) return `<span class="syncchip live" title="Every phone and screen sees the same queue"><i></i>Live</span>`;
    return `<span class="syncchip off" title="Trying to reconnect to the server"><i></i>Reconnecting…</span>`;
  }
  /* Patient-facing connection line: live with the last update time, or a clear offline warning. */
  function ago(ts, lang) {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (!ts) return L3(lang, "पता नहीं", "unknown", "पता नेईं");
    if (m < 1) return L3(lang, "अभी-अभी", "just now", "हुनै-हुनै");
    if (m < 60) return L3(lang, `${m} मिनट पहले`, `${m} ${m === 1 ? "minute" : "minutes"} ago`, `${m} मिंट पैह्लें`);
    return clock(ts);
  }
  function netLine(lang) {
    const t = ago(Store.lastAt, lang);
    if (navigator.onLine === false) return `<p class="netbar off" role="status">${L3(lang, `आप ऑफ़लाइन हैं। आपकी जगह की जानकारी पुरानी हो सकती है। आखिरी अपडेट: ${t}`, `You’re offline. Your place in the queue may be out of date. Last updated ${t}.`, `तुस ऑफलाइन ओ। कतार च तुंदी जगह दी जानकारी पुरानी होई सकदी ऐ। आखरी अपडेट: ${t}.`)}</p>`;
    if (!Store.connected) return `<p class="netbar off" role="status">${L3(lang, `अस्पताल सर्वर से दोबारा जुड़ रहे हैं… आखिरी अपडेट: ${t}`, `Reconnecting to the hospital server… Last updated ${t}.`, `अस्पताल सर्वर कन्नै फ्ही जुड़ा करदे आं… आखरी अपडेट: ${t}.`)}</p>`;
    return `<p class="netbar" role="status"><i class="live-dot"></i>${L3(lang, `लाइव · अपने आप अपडेट होता है`, `Live · updates by itself`, `लाइव · अपने आप अपडेट होंदा ऐ`)}</p>`;
  }

  /* ---------- Sound ---------- */
  let audioCtx = null, soundOn = false;
  function ensureAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } try { audioCtx && audioCtx.resume && audioCtx.resume(); } catch (e) {} }
  function tone(seq, vol) {
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    seq.forEach(([f, dt, len]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = f; o.type = "sine";
      g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(vol, t0 + dt + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + (len || 0.5));
      o.connect(g).connect(audioCtx.destination); o.start(t0 + dt); o.stop(t0 + dt + (len || 0.5) + 0.05);
    });
  }
  function chime() { if (soundOn) tone([[880, 0], [660, 0.28]], 0.3); }
  function alarm() { tone([[988, 0, 0.22], [740, 0.25, 0.22], [988, 0.5, 0.22], [740, 0.75, 0.22]], 0.35); }
  function announce(tk) {
    if (!soundOn || !("speechSynthesis" in window)) return;
    try { const d = DEPT[tk.dept]; const u = new SpeechSynthesisUtterance(`टोकन ${d.prefix} ${tk.num}, ${d.roomHi}`); u.lang = "hi-IN"; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) {}
  }

  /* ---------- Read aloud ---------- */
  function speak(text, lng, onEnd) {
    const ss = window.speechSynthesis;
    if (!ss || typeof SpeechSynthesisUtterance === "undefined") return { ok: false };
    ss.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = SPEECH[lng] || "en-IN"; u.rate = 0.92;
    const vs = ss.getVoices() || [];
    const pick = vs.find(v => (v.lang || "").toLowerCase().replace("_", "-").startsWith(lng === "en" ? "en-in" : lng)) || (lng === "en" ? vs.find(v => (v.lang || "").toLowerCase().startsWith("en")) : null);
    if (pick) u.voice = pick;
    u.onend = u.onerror = () => onEnd && onEnd();
    ss.speak(u);
    return { ok: true, voice: Boolean(pick) || !vs.length };
  }
  try { window.speechSynthesis && window.speechSynthesis.getVoices(); } catch (e) {} // Dogri has no browser voice: it is read with a Hindi voice (same script)
  /* A Listen button that reads `getText()` and toggles to Stop. */
  function wireListen(btn, getText, lang, noteEl) {
    if (!btn) return;
    let on = false;
    const label = btn.querySelector("span") || btn;
    btn.classList.add("lsn");
    const L0 = L3(lang, "सुनें", "Listen", "सुनो"), L1 = L3(lang, "रोकें", "Stop", "रोको");
    btn.addEventListener("click", () => {
      if (on) { try { speechSynthesis.cancel(); } catch (e) {} on = false; label.textContent = L0; return; }
      const r = speak(getText(), lang, () => { on = false; label.textContent = L0; });
      if (!r.ok) { if (noteEl) { noteEl.textContent = L3(lang, "इस डिवाइस पर पढ़कर सुनाना उपलब्ध नहीं है।", "Reading aloud isn’t available on this device.", "इस डिवाइस पर पढ़ियै सुनाने दी सुविधा नेईं ऐ।"); noteEl.hidden = false; } return; }
      on = true; label.textContent = L1;
      if (noteEl) { noteEl.hidden = !(lang === "hi" && !r.voice); noteEl.textContent = lang === "hi" ? "इस डिवाइस में हिंदी आवाज़ नहीं मिली, दूसरी आवाज़ में सुना रहे हैं।" : ""; }
    });
  }

  /* ---------- Icons ---------- */
  const svg = (p, cls) => `<svg class="${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I = {
    mic: svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>'),
    spk: svg('<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>'),
    dl: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    print: svg('<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>'),
    big: svg('<path d="M4 20 9 6l5 14M5.5 15h7M16 13h6M19 10v6"/>'),
    reg: svg('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM12 11v6M9 14h6"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: svg('<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    slip: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    sos: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>'),
    phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    dept: {
      MED: svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>'),
      ORT: svg('<path d="M17 10c.7-.7 1.7-.6 2.6-.1a2.5 2.5 0 1 0-1.4-4.1 2.5 2.5 0 1 0-4.1-1.4c.5.9.6 1.9-.1 2.6l-6.6 6.6c-.7.7-1.7.6-2.6.1a2.5 2.5 0 1 0 1.4 4.1 2.5 2.5 0 1 0 4.1 1.4c-.5-.9-.6-1.9.1-2.6z"/>'),
      PAE: svg('<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 0 0 5 0M12 3c-1.2 1.4-1.2 2.8 0 4"/>'),
      GYN: svg('<circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 19h6"/>'),
      EYE: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
      SKN: svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>'),
      HLP: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01"/>')
    }
  };
  const MIC = I.mic, SPK = I.spk, DLD = I.dl, BIG = I.big;
  const DEPT_DESC = {
    MED: { doi: "बुखार, खंग, पेटै दा दर्द, BP, शूगर", en: "Fever, cough, stomach pain, BP, sugar", hi: "बुख़ार, खाँसी, पेट दर्द, BP, शुगर" },
    ORT: { doi: "हड्डी, जोड़, कमर दा दर्द, मोच", en: "Bones, joints, back pain, sprains", hi: "हड्डी, जोड़, कमर दर्द, मोच" },
    PAE: { doi: "14 ब’रें शा निक्के बच्चे", en: "Children under 14", hi: "14 साल से छोटे बच्चे" },
    GYN: { doi: "गर्भ, माहवारी, जनानियें दी सेहत", en: "Pregnancy, periods, women’s health", hi: "गर्भावस्था, माहवारी, महिलाओं की सेहत" },
    EYE: { doi: "अक्खीं, नज़र, लाल जां पानी आह्ली अक्खीं", en: "Eyes, vision, red or watery eyes", hi: "आँखें, नज़र, लाल या पानी वाली आँखें" },
    SKN: { doi: "दाने, खारश, एलर्जी", en: "Rash, itching, allergy", hi: "दाने, खुजली, एलर्जी" },
    HLP: { doi: "स्टाफ तुसेंगी ठीक बिभाग च भेजग", en: "Staff will guide you to the right department", hi: "स्टाफ़ आपको सही विभाग में भेजेगा" }
  };
  /* Doctor status, in plain words */
  function docLine(s, d, lang) {
    const doc = (s.doctors || {})[d] || { status: "available" };
    if (DEPT[d] && DEPT[d].help) return null;
    if (doc.status === "break") return { cls: "break", text: L3(lang, `डॉक्टर ब्रेक पर हैं, लगभग ${doc.mins} मिनट में लौटेंगे`, `Doctor on break, back in about ${doc.mins} min`, `डाक्टर ब्रेक पर न, लगभग ${doc.mins} मिंटें च परतोंगन`) };
    if (doc.status === "delayed") return { cls: "delayed", text: L3(lang, `डॉक्टर लगभग ${doc.mins} मिनट देर से चल रहे हैं`, `Doctor running about ${doc.mins} min late`, `डाक्टर लगभग ${doc.mins} मिंट देरी कन्नै चला करदे न`) };
    return { cls: "ok", text: L3(lang, "डॉक्टर उपलब्ध हैं", "Doctor available", "डाक्टर मजूद न") };
  }

  /* ---------- QR codes (bundled library, works offline) ---------- */
  function qrCanvas(text, size) {
    if (typeof window.qrcode !== "function") return null;
    const q = window.qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount(), quiet = 2, cell = Math.max(1, Math.floor(size / (n + quiet * 2)));
    const px = cell * (n + quiet * 2), c = document.createElement("canvas"); c.width = c.height = px;
    const x = c.getContext("2d"); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, px, px); x.fillStyle = "#0B3D2E";
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + quiet) * cell, (r + quiet) * cell, cell, cell);
    c.setAttribute("role", "img"); c.setAttribute("aria-label", "QR code");
    return c;
  }
  function putQR(el, text, size) {
    const c = qrCanvas(text, size);
    if (c) { c.style.width = c.style.height = size + "px"; el.innerHTML = ""; el.appendChild(c); }
    else el.innerHTML = `<p style="padding:8px;font-size:13px;overflow-wrap:anywhere">${esc(text)}</p>`;
  }


  /* ---------- Works on a weak connection: service worker and install ---------- */
  let installEvt = null;
  const showInstall = on => document.querySelectorAll("[data-install]").forEach(b => { b.hidden = !on; });
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvt = e; showInstall(true); });
  addEventListener("appinstalled", () => { installEvt = null; showInstall(false); });
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-install]"); if (!b || !installEvt) return;
    const ev = installEvt; ev.prompt();
    (ev.userChoice || Promise.resolve()).then(() => { installEvt = null; showInstall(false); }, () => {});
  });
  function installBtn(lg) {
    return `<button type="button" class="btn soft installbtn" data-install ${installEvt ? "" : "hidden"}>${I.dl}<span>${L3(lg, "ऐप इंस्टॉल करें", "Install the app", "ऐप इंस्टॉल करो")}</span></button>`;
  }
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(e => console.warn("Service worker not registered", e)); });
  }
  /* ---------- Shared UI helpers: motion, counters, toasts ---------- */
  const reduceMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  function countTo(el, to) {
    const from = Number(el.dataset.v || 0); el.dataset.v = to;
    if (reduceMotion() || from === to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 900;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function toast(msg, kind) {
    const box = $("#toasts"); if (!box || !msg) return;
    const el = document.createElement("div");
    el.className = "toast " + (kind || "ok");
    el.innerHTML = `${kind === "err" ? I.x : I.check}<span>${esc(msg)}</span>`;
    box.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 300); }, 3800);
  }

  /* ---------- Landing page ---------- */
  const H = {
    en: { badge: "Smarter hospital visits", h1: "Your health matters. Your time does too.",
      lede: "QueueSetu gives every OPD patient a live token, so you can sit down instead of guarding your place in line. Track your turn on your phone, find your department with simple directions, and get help fast.",
      cta1: "Get Your Token", cta2: "Track Your Queue",
      trust: ["See your place in line, live", "A text when your turn is near", "Hindi, English and Dogri, with voice"],
      live: "Live OPD Queue", dept: "Department", waiting: "Waiting", now: "Now", wait: "Est. wait", updated: "Last updated", demo: "Demo data", calling: "Now calling", yourTok: "Your token", ahead: n => n === 0 ? "You’re next" : `${n} ahead of you`, avgToday: "Average wait today", min: "min", none: "None",
      featT: "Everything you need for a smoother hospital visit.", featS: "One simple companion, from the hospital gate to the doctor’s room.",
      feats: [["Smart Token", "Register and receive a token without standing in a long line.", "#register"], ["Live Queue Tracking", "Know your queue position and estimated waiting time.", "#track"], ["Easy Hospital Navigation", "Find the correct department with simple directions.", "#find"], ["Timely Notifications", "Receive updates when your turn approaches.", "#track"]],
      howT: "How QueueSetu works", how: [["Register", "Give your name and problem on your phone or at the kiosk. It takes a minute."], ["Track your turn", "Watch your number move live. Sit, rest, or step out for water."], ["Reach the department", "Follow the map and simple steps to the right room."], ["Get attended to", "Your phone and the hall screen tell you when and where to go."]],
      insT: "No more guarding your place in line.", insS: "People crowd the OPD door because the line is their only proof of a turn. QueueSetu makes the queue visible, and every skip accountable.",
      k: ["patients waiting now", "patients seen today", "min average wait to be called", "out-of-turn calls, each with a logged reason"],
      tryT: "Try it live. Scan and join the queue.", tryS: "Get a token on your phone, then watch it move on the hall display when staff press Call next.",
      localNote: "Phones can’t open “localhost”. Use your online link, or your laptop’s Wi-Fi address like http://192.168.1.5:3000.",
      fPat: "Patients", fHos: "Hospital", fAcc: "Accessibility", fAbout: "About this project",
      links: { reg: "Get a token", track: "Track your queue", find: "Find a department", help: "Help desk", staff: "Staff portal", display: "Hall display", admin: "Dashboard" },
      acc: ["Switch language: EN / हिं / डो at the top", "Large text", "Works with a keyboard and screen readers"], large: "Large text", on: "on", off: "off",
      about: "Built for HackCache ’26 by Team EL Dorado: Aadhya Sharma, Mohit Sharma, Sujal Singh Saini. Track: Reimagining Government. Sample hospital layout and demo patients." },
    hi: { badge: "आसान अस्पताल यात्रा", h1: "आपकी सेहत ज़रूरी है। आपका समय भी।",
      lede: "QueueSetu हर OPD मरीज़ को लाइव टोकन देता है, ताकि आपको कतार में खड़े होकर अपनी जगह न बचानी पड़े। फ़ोन पर अपनी बारी देखें, आसान रास्ते से अपना विभाग ढूँढें, और ज़रूरत पड़ने पर तुरंत मदद पाएँ।",
      cta1: "टोकन लें", cta2: "अपनी बारी देखें",
      trust: ["कतार में अपनी जगह लाइव देखें", "बारी पास आने पर SMS", "हिंदी, अंग्रेज़ी और डोगरी, बोलकर भी"],
      live: "लाइव OPD कतार", dept: "विभाग", waiting: "इंतज़ार", now: "अभी", wait: "अनुमानित समय", updated: "आखिरी अपडेट", demo: "डेमो डेटा", calling: "अभी बुलाया", yourTok: "आपका टोकन", ahead: n => n === 0 ? "अगला नंबर आपका है" : `आपसे पहले ${n} लोग`, avgToday: "आज औसत इंतज़ार", min: "मिनट", none: "कोई नहीं",
      featT: "आसान अस्पताल यात्रा के लिए सब कुछ।", featS: "गेट से डॉक्टर के कमरे तक, एक आसान साथी।",
      feats: [["स्मार्ट टोकन", "लंबी कतार में खड़े हुए बिना रजिस्टर करें और टोकन पाएँ।", "#register"], ["लाइव कतार", "कतार में अपनी जगह और अनुमानित इंतज़ार जानें।", "#track"], ["आसान रास्ता", "आसान दिशाओं के साथ सही विभाग ढूँढें।", "#find"], ["समय पर सूचना", "बारी पास आने पर सूचना पाएँ।", "#track"]],
      howT: "QueueSetu कैसे काम करता है", how: [["रजिस्टर करें", "फ़ोन या कियोस्क पर नाम और तकलीफ़ बताएँ। एक मिनट लगता है।"], ["अपनी बारी देखें", "अपना नंबर लाइव आगे बढ़ते देखें। बैठिए, आराम कीजिए।"], ["विभाग तक पहुँचें", "नक्शे और आसान कदमों से सही कमरे तक जाएँ।"], ["डॉक्टर से मिलें", "बारी आने पर फ़ोन और हॉल की स्क्रीन बताएँगे कि कहाँ जाना है।"]],
      insT: "अब कतार में जगह बचाने की ज़रूरत नहीं।", insS: "लोग OPD के दरवाज़े पर भीड़ इसलिए लगाते हैं क्योंकि कतार ही उनकी बारी का सबूत है। QueueSetu कतार को सबके सामने लाता है, और हर छूट का कारण दर्ज करता है।",
      k: ["मरीज़ अभी इंतज़ार में", "मरीज़ आज देखे गए", "मिनट औसत इंतज़ार", "बारी से पहले बुलाए गए, हर बार कारण के साथ"],
      tryT: "अभी आज़माएँ। स्कैन करें और कतार में जुड़ें।", tryS: "फ़ोन पर टोकन लें, फिर स्टाफ़ के बुलाने पर उसे हॉल की स्क्रीन पर आगे बढ़ते देखें।",
      localNote: "फ़ोन “localhost” नहीं खोल सकता। ऑनलाइन लिंक या लैपटॉप का Wi-Fi पता (जैसे http://192.168.1.5:3000) इस्तेमाल करें।",
      fPat: "मरीज़ों के लिए", fHos: "अस्पताल", fAcc: "सुलभता", fAbout: "इस प्रोजेक्ट के बारे में",
      links: { reg: "टोकन लें", track: "अपनी बारी देखें", find: "विभाग ढूँढें", help: "हेल्प डेस्क", staff: "स्टाफ़ पोर्टल", display: "हॉल डिस्प्ले", admin: "डैशबोर्ड" },
      acc: ["भाषा बदलें: ऊपर EN / हिं / डो", "बड़े अक्षर", "कीबोर्ड और स्क्रीन रीडर से भी चलता है"], large: "बड़े अक्षर", on: "चालू", off: "बंद",
      about: "HackCache ’26 के लिए Team EL Dorado (आध्या शर्मा, मोहित शर्मा, सुजल सिंह सैनी) ने बनाया। ट्रैक: Reimagining Government। नमूना अस्पताल नक्शा और डेमो मरीज़।" },
    doi: { badge: "सौखी अस्पताल फेरी", h1: "तुंदी सेहत ज़रूरी ऐ। तुंदा समां बी।",
      lede: "QueueSetu हर OPD मरीज़ गी लाइव टोकन दिंदा ऐ, तां जे तुसेंगी कतार च खड़ोइयै अपनी जगह नेईं बचानी पवै। फोन पर अपनी बारी दिक्खो, सौखे रस्ते कन्नै अपना बिभाग लब्भो, ते लोड़ पौने पर फौरन मदद लैओ।",
      cta1: "टोकन लैओ", cta2: "अपनी बारी दिक्खो",
      trust: ["कतार च अपनी जगह लाइव दिक्खो", "बारी कोल औने पर SMS", "हिंदी, अंग्रेज़ी ते डोगरी, बोलियै बी"],
      live: "लाइव OPD कतार", dept: "बिभाग", waiting: "इंतजार च", now: "हुन", wait: "अंदाज़न इंतजार", updated: "आखरी अपडेट", demo: "डेमो डेटा", calling: "हुन बुलाया", yourTok: "तुंदा टोकन", ahead: n => n === 0 ? "अगला नंबर तुंदा ऐ" : `तुंदे शा पैह्लें ${n} लोक`, avgToday: "अज्ज औसत इंतजार", min: "मिंट", none: "कोई नेईं",
      featT: "सौखी अस्पताल फेरी आस्तै सब किश।", featS: "गेट थमां डाक्टर दे कमरे तक, इक सौखा साथी।",
      feats: [["स्मार्ट टोकन", "लम्मी कतार च खड़ोए बगैर रजिस्टर करो ते टोकन लैओ।", "#register"], ["लाइव कतार", "कतार च अपनी जगह ते अंदाज़न इंतजार जानो।", "#track"], ["सौखा रस्ता", "सौखे रस्ते कन्नै ठीक बिभाग लब्भो।", "#find"], ["बेल्लै सिर सूचना", "बारी कोल औने पर सूचना लैओ।", "#track"]],
      howT: "QueueSetu कियां कम्म करदा ऐ", how: [["रजिस्टर करो", "फोन जां कियोस्क पर नां ते तकलीफ दस्सो। इक मिंट लगदा ऐ।"], ["अपनी बारी दिक्खो", "अपना नंबर लाइव अग्गें बधदा दिक्खो। बैठो, आराम करो।"], ["बिभाग तक पुज्जो", "नक्शे ते सौखे कदमें कन्नै ठीक कमरे तक जाओ।"], ["डाक्टर गी मिलो", "बारी औने पर फोन ते हॉल दी स्क्रीन दस्सङन जे कुत्थै जाना ऐ।"]],
      insT: "हुन कतार च जगह बचाने दी लोड़ नेईं।", insS: "लोक OPD दे दरोआजे पर भीड़ इस करी लांदे न कीजे कतार गै उंदी बारी दा सबूत ऐ। QueueSetu कतार गी सारें दे सामनै आह्नदा ऐ, ते हर छूट दा कारण दर्ज करदा ऐ।",
      k: ["मरीज़ हुन इंतजार च", "मरीज़ अज्ज दिक्खे गे", "मिंट औसत इंतजार", "बारी शा पैह्लें बुलाए गे, हर बारी कारण कन्नै"],
      tryT: "हुनै अजमाओ। स्कैन करो ते कतार च जुड़ो।", tryS: "फोन पर टोकन लैओ, फ्ही स्टाफ दे बुलाने पर उसी हॉल दी स्क्रीन पर अग्गें बधदा दिक्खो।",
      localNote: "फोन “localhost” नेईं खोली सकदा। ऑनलाइन लिंक जां लैपटॉप दा Wi-Fi पता (जियां http://192.168.1.5:3000) बरतो।",
      fPat: "मरीज़ें आस्तै", fHos: "अस्पताल", fAcc: "सुलभता", fAbout: "इस प्रोजेक्ट बारै",
      links: { reg: "टोकन लैओ", track: "अपनी बारी दिक्खो", find: "बिभाग लब्भो", help: "हेल्प डेस्क", staff: "स्टाफ पोर्टल", display: "हॉल डिस्प्ले", admin: "डैशबोर्ड" },
      acc: ["भाषा बदलो: उप्पर EN / हिं / डो", "बड्डे अक्खर", "कीबोर्ड ते स्क्रीन रीडर कन्नै बी चलदा ऐ"], large: "बड्डे अक्खर", on: "चालू", off: "बंद",
      about: "HackCache ’26 आस्तै Team EL Dorado (आध्या शर्मा, मोहित शर्मा, सुजल सिंह सैनी) ने बनाया। ट्रैक: Reimagining Government। नमूने दा अस्पताल नक्शा ते डेमो मरीज़।" }
  };
  const FEAT_ICONS = () => [I.slip, I.clock, I.pin, svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')];
  function liveQueueCard(lang, compact) {
    const h = H[lang];
    return `<div class="qcard ${compact ? "compact" : ""}" aria-label="${h.live}">
      <div class="qc-head"><div><p class="qc-t">${h.live}</p><p class="qc-h">${esc(Store.state.hospital)}</p></div><div class="qc-tags"><span class="pill live"><i class="live-dot"></i>${L3(lang, "लाइव", "Live", "लाइव")}</span><span class="pill demo" data-demo hidden>${h.demo}</span></div></div>
      <div class="qc-row qc-cols" aria-hidden="true"><span>${h.dept}</span><span>${h.waiting}</span><span>${h.now}</span><span>${h.wait}</span></div>
      <div class="qc-rows" data-rows></div>
      <p class="qc-foot">${compact ? `<a class="qc-all" href="#queue">${L3(lang, "सभी विभाग देखें", "See all departments", "सारे बिभाग दिक्खो")} →</a>` : ""}<span data-upd></span></p></div>`;
  }
  function fillQueueCard(root, lang, last) {
    const s = Store.state, h = H[lang], rowsEl = $("[data-rows]", root); if (!rowsEl) return last;
    const cur = {};
    const compact = rowsEl.closest(".qcard.compact");
    rowsEl.innerHTML = (compact ? CLINICS.slice(0, 4) : CLINICS).map(d => {
      const c = currentIn(s, d.id), q = waitingIn(s, d.id).length, done = s.tokens.filter(t => t.dept === d.id && t.status !== "waiting").length;
      const pct = Math.round(100 * done / Math.max(1, done + q)); cur[d.id] = c ? c.id : null;
      const fl = last && cur[d.id] && cur[d.id] !== last[d.id];
      const doc = docLine(s, d.id, lang), m = q ? queueEst(s, d.id).m : 0;
      return `<div class="qc-row ${fl ? "flash" : ""}"><div class="qc-dept"><span class="qc-ico">${I.dept[d.id]}</span><span><b>${d[lang] || d.en}</b><small>${L3(lang, d.roomHi, d.room, d.roomDoi)} · ${floorName(d.id, lang, true)}${doc && doc.cls !== "ok" ? ` · <em class="${doc.cls}">${doc.cls === "break" ? L3(lang, "ब्रेक", "On break", "ब्रेक") : L3(lang, "देरी", "Delayed", "देरी")}</em>` : ""}</small>${crowdBadge(s, d.id, lang)}</span></div>
        <span class="qc-n tnum">${q}</span><span class="qc-now tnum">${c ? c.code : h.none}</span><span class="qc-w tnum">${q ? `~${m} ${h.min}` : "0"}</span>
        <span class="qc-bar" aria-hidden="true"><span style="width:${pct}%"></span></span></div>`;
    }).join("");
    const demo = $("[data-demo]", root); if (demo) demo.hidden = !s.sample;
    const up = $("[data-upd]", root); if (up) up.innerHTML = Store.online() ? `${h.updated} ${clock(Store.lastAt)}` : `<b class="offtxt">${L3(lang, "ऑफ़लाइन", "Offline", "ऑफलाइन")}</b> · ${h.updated} ${ago(Store.lastAt, lang)}`;
    return cur;
  }

  function viewHome(root) {
    const lang = getLang(), h = H[lang];
    const icons = FEAT_ICONS();
    root.innerHTML = `
    <section class="hero2">
      <div class="hero-bg" aria-hidden="true"><span class="blob b1"></span><span class="blob b2"></span><span class="ring"></span></div>
      <div class="wrap hero2-in">
        <div class="hero2-copy enter">
          <p class="badge">${I.check}<span>${h.badge}</span></p>
          <h1>${h.h1}</h1>
          <p class="lede">${h.lede}</p>
          <div class="cta"><a class="btn go xl" href="#register">${I.reg}<span>${h.cta1}</span></a><a class="btn soft xl" href="#track">${I.clock}<span>${h.cta2}</span></a></div>
          <ul class="trust">${h.trust.map(t => `<li>${I.check}<span>${t}</span></li>`).join("")}</ul>
        </div>
        <div class="hero2-vis enter d2">
          ${liveQueueCard(lang, true)}
          <div class="float f1" data-f1></div>
          <div class="float f2" data-f2></div>
        </div>
      </div>
    </section>

    <section class="wrap sect2">
      <div class="sect-head center"><p class="eyebrow">${L3(lang, "सुविधाएँ", "Features", "सुविधां")}</p><h2>${h.featT}</h2><p class="muted">${h.featS}</p></div>
      <div class="feat">${h.feats.map((f, i) => `<a class="fcard" href="${f[2]}"><span class="f-ico">${icons[i]}</span><h3>${f[0]}</h3><p>${f[1]}</p><span class="f-go">${L3(lang, "खोलें", "Open", "खोलो")} →</span></a>`).join("")}</div>
    </section>

    <section class="wrap sect2">
      <div class="sect-head center"><p class="eyebrow">${L3(lang, "चार आसान कदम", "Four simple steps", "चार सौखे कदम")}</p><h2>${h.howT}</h2></div>
      <ol class="how">${h.how.map((s, i) => `<li><span class="how-n">0${i + 1}</span><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join("")}</ol>
    </section>

    <section class="band">
      <div class="wrap band-in">
        <div class="band-copy"><p class="eyebrow">${L3(lang, "हमारी सोच", "The insight", "साढ़ी सोच")}</p><h2>${h.insT}</h2><p>${h.insS}</p></div>
        <div class="band-k">
          <div><b class="num" data-k="waiting">0</b><span>${h.k[0]}</span></div>
          <div><b class="num" data-k="seen">0</b><span>${h.k[1]}</span></div>
          <div><b class="num" data-k="avg">0</b><span>${h.k[2]}</span></div>
          <div><b class="num" data-k="outs">0</b><span>${h.k[3]}</span></div>
        </div>
      </div>
    </section>

    <section class="wrap sect2">
      <div class="try2">
        <div><p class="eyebrow">${L3(lang, "लाइव डेमो", "Live demo", "लाइव डेमो")}</p><h2>${h.tryT}</h2><p class="muted">${h.tryS}</p><p class="small muted" id="qrnote"></p>
          <div class="cta"><a class="btn go" href="#patient">${L3(lang, "मरीज़ पोर्टल खोलें", "Open the patient portal", "मरीज़ पोर्टल खोलो")}</a><a class="btn soft" href="#display">${L3(lang, "हॉल डिस्प्ले", "Open the hall display", "हॉल डिस्प्ले खोलो")}</a></div></div>
        <div class="try-qr" id="hqr"></div>
      </div>
    </section>

    <footer class="foot2">
      <div class="wrap foot2-in">
        <div class="f-brand"><a class="brand" href="#home"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#FFFFFF"/><circle cx="15" cy="15" r="7.5" fill="none" stroke="#0B5D44" stroke-width="3.4"/><path d="M19.6 19.6 25 25" stroke="#16A86A" stroke-width="3.6" stroke-linecap="round"/></svg><span>QueueSetu</span></a><p>${L3(lang, "आपकी बारी, बिना भीड़ के।", "Your turn, without the crowd.", "तुंदी बारी, भीड़ दे बगैर।")}</p></div>
        <nav aria-label="${h.fPat}"><h3>${h.fPat}</h3><a href="#register">${h.links.reg}</a><a href="#track">${h.links.track}</a><a href="#find">${h.links.find}</a><a href="#help">${h.links.help}</a></nav>
        <nav aria-label="${h.fHos}"><h3>${h.fHos}</h3><a href="#staff">${h.links.staff}</a><a href="#display">${h.links.display}</a><a href="#admin">${h.links.admin}</a></nav>
        <div><h3>${h.fAcc}</h3><p>${h.acc[0]}</p><button type="button" class="linkbtn" data-bigtoggle aria-pressed="${ls.get("baari-big") === "1"}">${h.large}: <b>${ls.get("baari-big") === "1" ? h.on : h.off}</b></button><p>${h.acc[2]}</p><a href="#settings">${SET[lang].title}</a>${installBtn(lang)}</div>
        <div class="f-about"><h3>${h.fAbout}</h3><p>${h.about}</p></div>
      </div>
    </footer>`;

    putQR($("#hqr", root), location.origin + location.pathname + "#patient", 168);
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) $("#qrnote", root).textContent = h.localNote;
    const bt = $("[data-bigtoggle]", root);
    bt.onclick = () => { const on = textSize() !== "l"; setTextSize(on ? "l" : "m"); bt.setAttribute("aria-pressed", on); bt.querySelector("b").textContent = on ? h.on : h.off; };

    let last = null;
    function update() {
      const s = Store.state;
      last = fillQueueCard(root, lang, last);
      const called = s.tokens.filter(t => t.status === "called").sort((a, b) => b.calledAt - a.calledAt)[0];
      $("[data-f1]", root).innerHTML = called ? `<span class="fl-ico calling">${I.spk}</span><span><small>${h.calling}</small><b class="tnum">${called.code}</b><em>${L3(lang, DEPT[called.dept].roomHi, DEPT[called.dept].room, DEPT[called.dept].roomDoi)}</em></span>` : "";
      const mine = myToken();
      const waits = s.tokens.filter(t => t.calledAt).map(t => t.calledAt - t.createdAt).filter(x => x > 0);
      const avg = waits.length ? mins(waits.reduce((a, b) => a + b, 0) / waits.length) : 0;
      $("[data-f2]", root).innerHTML = mine
        ? `<span class="fl-ico">${I.slip}</span><span><small>${h.yourTok}</small><b class="tnum">${mine.code}</b><em>${mine.status === "waiting" ? h.ahead(aheadOf(s, mine)) : mine.status === "called" ? L3(lang, "अब आपकी बारी", "It’s your turn", "हुन तुंदी बारी ऐ") : ""}</em></span>`
        : `<span class="fl-ico mint">${I.clock}</span><span><small>${h.avgToday}</small><b class="tnum">${avg} ${h.min}</b><em>${L3(lang, "बुलाए जाने तक", "to be called", "बुलाए जाने तक")}</em></span>`;
      const vals = { waiting: s.tokens.filter(t => t.status === "waiting").length, seen: s.tokens.filter(t => t.status === "done").length, avg, outs: s.outOfTurnCount || 0 };
      root.querySelectorAll(".num").forEach(el => countTo(el, vals[el.dataset.k]));
    }
    update(); return update;
  }

  /* ---------- Queue information (public) ---------- */
  function viewQueue(root) {
    const lang = getLang(), h = H[lang];
    root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lang, L3(lang, "कतार की जानकारी", "Queue information", "कतार दी जानकारी"), { sub: L3(lang, "हर विभाग में अभी कौन है, कितने लोग इंतज़ार में हैं, और कितना समय लगेगा।", "Who is being seen in each department, how many are waiting, and how long it may take.", "हर बिभाग च हुन कुन ऐ, किन्ने लोक इंतजार च न, ते किन्ना समां लग्गग।") })}
      ${liveQueueCard(lang)}<a class="btn go big" href="#register">${h.cta1}</a></section>`;
    wireHead(root, lang, () => navigate());
    let last = null; const up = () => { last = fillQueueCard(root, lang, last); }; up(); return up;
  }

  /* ---------- Floor maps (sample three-floor plan from shared.js) ---------- */
  const { PLACE_HI_LABEL, route, FLOORS, floorName } = window.BaariShared;
  const PLACE_DOI_LABEL = { GATE: "मेन गेट", REG: "रजिस्ट्रेशन काउंटर", HLP: "हेल्प डेस्क", HALL: "वेटिंग हॉल", EMR: "एमरजेंसी (Casualty)", PHA: "दुआई काउंटर", LAB: "लैब" };
  const PLACE_DOI_SHORT = { GATE: "गेट", REG: "रजिस्ट्रेशन", HLP: "हेल्प डेस्क", HALL: "वेटिंग हॉल", EMR: "एमरजेंसी", PHA: "दुआई काउंटर", LAB: "लैब", ST0: "पौड़ियां", ST1: "पौड़ियां", ST2: "पौड़ियां", LA0: "लिफ्ट A", LA1: "लिफ्ट A", LB0: "लिफ्ट B", LB2: "लिफ्ट B" };
  const PLACE_ORDER = ["GATE", "REG", "HLP", "HALL", "MED", "PAE", "LAB", "PHA", "EMR", "ORT", "EYE", "SKN", "GYN"];
  /* "Avoid stairs" is remembered on this phone and used for every route */
  const noStairs = () => ls.get("baari-nostairs") === "1";
  const setNoStairs = on => ls.set("baari-nostairs", on ? "1" : "0");
  function placeName(k, lang) {
    const d = DEPT[k];
    if (d && !d.help) return L3(lang, `${d.roomHi} · ${d.hi}`, `${d.room} · ${d.en}`, `${d.roomDoi} · ${d.doi}`);
    return L3(lang, PLACE_HI_LABEL[k] || PLACES[k].label, PLACES[k].label, PLACE_DOI_LABEL[k] || PLACES[k].doi);
  }
  /* Place name with its floor when it is not on the ground floor */
  const placeWithFloor = (k, lang) => placeName(k, lang) + (PLACES[k] && PLACES[k].floor ? ` · ${floorName(k, lang, true)}` : "");
  function startSelect(id, val, lang, exclude) {
    return `<label class="lbl" for="${id}">${L3(lang, "आप अभी कहाँ हैं?", "Where are you now?", "तुस हुन कुत्थै ओ?")}</label>
      <select id="${id}" class="sel">${PLACE_ORDER.filter(k => k !== exclude).map(k => `<option value="${k}" ${k === val ? "selected" : ""}>${esc(placeWithFloor(k, lang))}</option>`).join("")}</select>`;
  }
  /* One floor of the route */
  function mapSvg(leg, lang, o) {
    const pts = leg.points, f = leg.floor;
    const ptsAttr = pts.map(p => p.join(",")).join(" ");
    const pathD = pts.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ");
    const start = pts[0] || PLACES.GATE.door, end = pts[pts.length - 1] || start;
    const room = k => DEPT[k] && !DEPT[k].help;
    const label = k => L3(lang, room(k) ? DEPT[k].roomHi : PLACE_HI_LABEL[k] || PLACES[k].label, PLACES[k].label, room(k) ? DEPT[k].roomDoi : PLACE_DOI_SHORT[k] || PLACES[k].label);
    const sub = k => { const p = PLACES[k]; if (p.kind === "lift") return L3(lang, "बिना सीढ़ी", "Step-free", "बिना पौड़ी"); if (lang === "en") return p.sub || ""; if (room(k)) return DEPT[k][lang]; return k === "HALL" ? "हॉल डिस्प्ले" : k === "EMR" ? "24 × 7" : ""; };
    const rooms = Object.keys(PLACES).filter(k => PLACES[k].rect && PLACES[k].floor === f).map(k => {
      const P = PLACES[k], [x, y, w, h] = P.rect, cx = x + w / 2, cy = y + h / 2, small = w < 70;
      const used = k === leg.from || k === leg.to;
      const off = o.avoidStairs && P.kind === "stairs";
      return `<g class="m-room ${k === o.to ? "on" : ""} ${k === o.from ? "from" : ""} ${k === "EMR" ? "emr" : ""} ${P.kind ? "conn " + P.kind : ""} ${P.kind && used ? "used" : ""} ${off ? "off" : ""}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>
        <text x="${cx}" y="${sub(k) ? cy - 2 : cy + 3}" class="m-l" style="font-size:${small ? 8.5 : 10.5}px">${esc(label(k))}</text>
        ${sub(k) ? `<text x="${cx}" y="${cy + 10}" class="m-s">${esc(sub(k))}</text>` : ""}</g>`;
    }).join("");
    const shafts = (window.BaariShared.MAP.noStop[f] || []).map(s => { const [x, y, w, h] = s.rect; return `<g class="m-room nostop"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${y + h / 2 - 2}" class="m-l" style="font-size:8.5px">${esc(L3(lang, s.label.replace("Lift", "लिफ़्ट"), s.label, s.label.replace("Lift", "लिफ्ट")))}</text><text x="${x + w / 2}" y="${y + h / 2 + 10}" class="m-s">${esc(L3(lang, "यहाँ नहीं रुकती", "No stop here", "इत्थै नेईं रुकदी"))}</text></g>`; }).join("");
    const where = o.first ? L3(lang, "आप यहाँ हैं", "You are here", "तुस इत्थै ओ") : L3(lang, "यहाँ पहुँचेंगे", "You arrive here", "इत्थै पुज्जगे");
    const motion = reduceMotion() || pts.length < 2 ? "" : `<circle r="5.5" class="m-dot"><animateMotion dur="${Math.max(2.4, pts.length * 0.8)}s" repeatCount="indefinite" path="${pathD}"/></circle>`;
    const hx = start[0] > 300 ? start[0] - 12 : start[0] + 12, anchor = start[0] > 300 ? "end" : "start";
    const hy = start[1] < 100 ? start[1] + 32 : start[1] + 4;
    const H = { 0: 312, 1: 206, 2: 116 }[f] || 312;
    return `<svg class="map" viewBox="0 0 400 ${H}" role="img" aria-label="${esc(L3(lang, "नक्शा: ", "Map: ", "नक्शा: ") + FLOORS[f][lang] + ". " + placeName(leg.from, lang) + " → " + placeName(leg.to, lang))}">
      <rect class="m-floor" x="6" y="4" width="388" height="${H - 12}" rx="12"/>
      <text x="388" y="${H - 16}" text-anchor="end" class="m-fl">${esc(FLOORS[f].short[lang] || FLOORS[f].short.en)}</text>
      <path class="m-corr" d="${window.BaariShared.MAP.corridors[f]}"/>
      ${rooms}${shafts}
      <polyline class="m-route-bg" points="${ptsAttr}"/><polyline class="m-route" points="${ptsAttr}"/>
      ${motion}
      <circle cx="${end[0]}" cy="${end[1]}" r="7" class="m-end ${o.last ? "" : "via"}"/>
      <g class="m-gate"><circle cx="${start[0]}" cy="${start[1]}" r="6"/><text x="${hx}" y="${hy}" text-anchor="${anchor}" class="m-here">${where}</text></g>
    </svg>`;
  }
  const WF = {
    hi: { avoid: "सीढ़ियों से बचें (सिर्फ़ लिफ़्ट)", lift: "यह रास्ता लिफ़्ट से है, सीढ़ियाँ नहीं।", stairs: "इस रास्ते में सीढ़ियाँ हैं।", floors: n => `${n} मंज़िलें`, step: "कदम" },
    en: { avoid: "Avoid stairs (lifts only)", lift: "This route uses lifts, no stairs.", stairs: "This route uses stairs.", floors: n => `${n} floors`, step: "Step" },
    doi: { avoid: "पौड़ियां नेईं (सिर्फ लिफ्ट)", lift: "एह् रस्ता लिफ्ट कन्नै ऐ, पौड़ियां नेईं।", stairs: "इस रस्ते च पौड़ियां न।", floors: n => `${n} मंजलां`, step: "कदम" }
  };
  /* Map(s) and step-by-step directions. Re-drawn by itself when "Avoid stairs" changes. */
  function wayfind(from, to, lang) {
    const avoid = noStairs(), r = route(from, to, { avoidStairs: avoid }), W = WF[lang];
    const multi = r.legs.length > 1;
    const note = !r.ok ? "" : r.usesLift ? `<p class="wf-note ok">${I.check}<span>${W.lift}</span></p>` : r.usesStairs ? `<p class="wf-note">${svg('<path d="M4 20h4v-4h4v-4h4V8h4"/>')}<span>${W.stairs}</span></p>` : "";
    const maps = r.legs.map((leg, i) => `<div class="mapbox">${multi ? `<p class="mapfloor"><b>${i + 1}</b><span>${esc(FLOORS[leg.floor][lang])}</span></p>` : ""}${mapSvg(leg, lang, { first: i === 0, last: i === r.legs.length - 1, from, to, avoidStairs: avoid })}</div>`).join("");
    return `<div class="wf" data-wf-from="${from}" data-wf-to="${to}" data-wf-lang="${lang}">
      <label class="nostairs"><input type="checkbox" data-nostairs ${avoid ? "checked" : ""}><span>${W.avoid}</span></label>
      ${note}${r.ok ? `<div class="maps ${multi ? "multi" : ""}">${maps}</div>` : ""}
      <ol class="steps ${r.ok ? "" : "bad"}">${r.steps.map(s => `<li class="${s.kind ? "vstep " + s.kind : ""}">${esc(s[lang])}</li>`).join("")}</ol></div>`;
  }
  function refreshWayfinds() {
    document.querySelectorAll(".wf").forEach(el => { const n = document.createElement("div"); n.innerHTML = wayfind(el.dataset.wfFrom, el.dataset.wfTo, el.dataset.wfLang); el.replaceWith(n.firstElementChild); });
  }
  document.addEventListener("change", e => {
    if (!e.target.matches || !e.target.matches("[data-nostairs]")) return;
    setNoStairs(e.target.checked); refreshWayfinds();
    const f = document.querySelector("[data-nostairs]"); if (f) f.focus();
  });
  const stepsText = (from, to, lang) => route(from, to, { avoidStairs: noStairs() }).steps.map(s => s[lang]).join(" ");
  /* ---------- OPD slip image ---------- */
  function drawSlip(t, info, lang, url) {
    const d = DEPT[t.dept], c = document.createElement("canvas"); c.width = 720; c.height = 1080;
    const x = c.getContext("2d"), F = "'Manrope','DM Sans','Noto Sans Devanagari',Arial,sans-serif", H = "'Bricolage Grotesque','DM Sans',Arial,sans-serif";
    x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, 720, 1080);
    x.fillStyle = "#0B3D2E"; x.fillRect(0, 0, 720, 160);
    x.fillStyle = "#FFFFFF"; x.font = `800 48px ${H}`; x.fillText("QueueSetu", 48, 84);
    x.fillStyle = "#BFE6D3"; x.font = `500 24px ${F}`; x.fillText(Store.state.hospital + " · OPD", 48, 124);
    x.textAlign = "right"; x.fillStyle = "#FFFFFF"; x.font = `700 24px ${F}`;
    x.fillText(new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }), 672, 84);
    x.fillStyle = "#BFE6D3"; x.font = `500 22px ${F}`; x.fillText(new Date(t.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), 672, 124);
    x.textAlign = "left"; x.fillStyle = "#4A635A"; x.font = `800 20px ${F}`; x.fillText(lang === "doi" ? "OPD SLIP · OPD पर्ची" : "OPD SLIP · OPD पर्ची", 48, 222);
    x.fillStyle = "#0B3D2E"; x.font = `800 176px ${H}`; x.fillText(t.code, 40, 400);
    x.font = `700 36px ${F}`; x.fillText(`${d.en} · ${d.room} · ${floorName(t.dept, "en", true)}`, 48, 470);
    x.fillStyle = "#4A635A"; x.font = `500 30px ${F}`; x.fillText(lang === "doi" ? `${d.doi} · ${d.roomDoi} · ${floorName(t.dept, "doi", true)}` : `${d.hi} · ${d.roomHi} · ${floorName(t.dept, "hi", true)}`, 48, 516);
    if (info.name) { x.fillStyle = "#0B3D2E"; x.font = `600 30px ${F}`; x.fillText(L3(lang, "नाम: ", "Name: ", "नां: ") + info.name.slice(0, 34), 48, 566); }
    x.fillStyle = "#0B3D2E"; x.font = `600 24px ${F}`; x.fillText(L3(lang, "डॉक्टर: ", "Doctor: ", "डाक्टर: ") + doctorText(Store.state, t, lang).slice(0, 44), 48, 608);
    x.strokeStyle = "#CFE5DA"; x.setLineDash([12, 10]); x.lineWidth = 3; x.beginPath(); x.moveTo(0, 630); x.lineTo(720, 630); x.stroke(); x.setLineDash([]);
    const qc = qrCanvas(url, 240);
    if (qc) { x.imageSmoothingEnabled = false; x.drawImage(qc, 48, 672, 240, 240); }
    x.fillStyle = "#0B3D2E"; x.font = `700 28px ${F}`; x.fillText(L3(lang, "स्टाफ़ इसे स्कैन करके", "Staff can scan this", "स्टाफ इसी स्कैन करियै"), 320, 730);
    x.fillText(L3(lang, "पर्ची जाँच सकते हैं।", "to check your slip.", "पर्ची जांची सकदा ऐ।"), 320, 768);
    x.fillStyle = "#4A635A"; x.font = `500 24px ${F}`;
    x.fillText(L3(lang, "आपका नंबर हॉल की स्क्रीन पर", "Your number is called on", "तुंदा नंबर हॉल दी स्क्रीन पर"), 320, 830);
    x.fillText(L3(lang, "बुलाया जाएगा।", "the hall screen.", "बुलाया जाग।"), 320, 862);
    if (t.status === "waiting") { x.fillStyle = "#0B3D2E"; x.font = `700 24px ${F}`; x.fillText(T[lang].wait(estMin(Store.state, t)) + L3(lang, " (अनुमान)", " (estimate)", " (अंदाज़ा)"), 320, 920); }
    x.fillStyle = "#0A7F55"; x.fillRect(0, 980, 720, 100);
    x.fillStyle = "#FFFFFF"; x.font = `700 26px ${F}`; x.fillText(L3(lang, "QueueSetu · अपनी बारी देखें, आराम से बैठें", "QueueSetu · See your turn. Sit down. Get called.", "QueueSetu · अपनी बारी दिक्खो, आराम कन्नै बैठो"), 48, 1040);
    return c;
  }

  /* ---------- Patient screen chrome: back link, language, text size, listen ---------- */
  const PT = {
    hi: { home: "मरीज़ पोर्टल", big: "बड़े अक्षर", listen: "सुनें", hubTitle: "स्वागत है। चलिए आपकी यात्रा आसान बनाते हैं।", hubSub: "आपको क्या चाहिए? नीचे एक बटन दबाएँ।",
      tiles: { register: ["OPD के लिए रजिस्टर करें", "नाम और तकलीफ़ बताएँ, टोकन पाएँ"], status: ["अपना टोकन देखें", "आपकी बारी कब आएगी"], slip: ["मेरे पास पर्ची है", "टोकन नंबर डालें, रास्ता पाएँ"],
        find: ["विभाग ढूँढें", "नक्शा और आसान रास्ता"], queue: ["कतार की जानकारी", "हर विभाग में अभी कितने लोग"], help: ["मदद माँगें", "हेल्प डेस्क कहाँ है, स्टाफ़ से मदद"], sos: ["आपातकालीन मदद", "अभी स्टाफ़ को बुलाएँ"] },
      yourTok: "आपका टोकन", see: "देखें" },
    en: { home: "Patient portal", big: "Large text", listen: "Listen", hubTitle: "Welcome. Let’s make your visit easier.", hubSub: "What do you need? Press one of the buttons below.",
      tiles: { register: ["Register for an OPD visit", "Tell us your name and problem, get a token"], status: ["Track my token", "See when your turn will come"], slip: ["I have my slip", "Enter your token number, get directions"],
        find: ["Find a department", "Map and simple directions"], queue: ["Queue information", "How many are waiting in each department"], help: ["Ask for help", "Where the Help desk is, or get help"], sos: ["Emergency help", "Alert staff right now"] },
      yourTok: "Your token", see: "Open" },
    doi: { home: "मरीज़ पोर्टल", big: "बड्डे अक्खर", listen: "सुनो", hubTitle: "जी आयां गी। आओ तुंदी फेरी सौखी बनाचै।", hubSub: "तुसेंगी के चाहिदा ऐ? थल्लै इक बटन दबाओ।",
      tiles: { register: ["OPD आस्तै रजिस्टर करो", "नां ते तकलीफ दस्सो, टोकन लैओ"], status: ["अपना टोकन दिक्खो", "तुंदी बारी कदूं औग"], slip: ["मेरे कोल पर्ची ऐ", "टोकन नंबर पाओ, रस्ता लैओ"],
        find: ["बिभाग लब्भो", "नक्शा ते सौखा रस्ता"], queue: ["कतार दी जानकारी", "हर बिभाग च हुन किन्ने लोक"], help: ["मदद मंगो", "हेल्प डेस्क कुत्थै ऐ, स्टाफ दी मदद"], sos: ["एमरजेंसी मदद", "हुनै स्टाफ गी बुलाओ"] },
      yourTok: "तुंदा टोकन", see: "दिक्खो" }
  };
  function pHead(lang, title, opts = {}) {
    return `<div class="phead enter">
      <div class="phead-top">${opts.back === false ? "<span></span>" : `<a class="backlink" href="#patient">${svg('<path d="m15 18-6-6 6-6"/>')}${PT[lang].home}</a>`}
        <div class="ptools">
          <button type="button" class="tbtn lostbtn" data-lost title="${LOST[lang].btn}">${I.help}<span class="tb-l">${LOST[lang].btn}</span></button>
          <button type="button" class="tbtn ${textSize() === "l" ? "on" : ""}" data-big aria-pressed="${textSize() === "l"}" title="${PT[lang].big}">${I.big}<span class="tb-l">${PT[lang].big}</span></button>
          <a class="tbtn" href="#settings" title="${SET[lang].title}" aria-label="${SET[lang].title}">${svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>')}</a>
          ${opts.listen ? `<button type="button" class="tbtn" data-listen title="${PT[lang].listen}">${I.spk}<span class="tb-l">${PT[lang].listen}</span></button>` : ""}
        </div></div>
      ${opts.eyebrow === false ? "" : `<p class="eyebrow">${esc(Store.state.hospital)} · OPD</p>`}
      <h1 lang="${lang}">${title}</h1>${opts.sub ? `<p class="muted psub">${opts.sub}</p>` : ""}
      <p class="micnote" data-note hidden></p>
    </div>`;
  }
  /* Wires language, text size and listen in a patient header. `rerender` rebuilds the screen. */
  function wireHead(root, lang, rerender, listenText) {
    root.querySelectorAll("[data-lang]").forEach(b => b.addEventListener("click", () => { if (b.dataset.lang === lang) return; try { speechSynthesis.cancel(); } catch (e) {} setLang(b.dataset.lang); applyNav(); rerender(); }));
    const bb = root.querySelector("[data-big]");
    if (bb) bb.addEventListener("click", () => setTextSize(textSize() === "l" ? "m" : "l"));
    root.querySelectorAll("[data-lost]").forEach(b => b.addEventListener("click", openLost));
    const lb = root.querySelector("[data-listen]");
    if (lb && listenText) wireListen(lb, listenText, lang, root.querySelector("[data-note]"));
  }

  /* ---------- Emergency button and sheet (on every patient screen) ---------- */
  const SIGN_LIST = [
    ["chest", "सीने में दर्द", "Chest pain", "छाती च दर्द"], ["breath", "साँस लेने में तकलीफ़", "Trouble breathing", "साह् लैने च औखत"], ["faint", "बेहोशी", "Fainting or unconscious", "बेहोशी"],
    ["bleeding", "बहुत खून बहना", "Heavy bleeding", "मता खून बगना"], ["stroke", "चेहरा टेढ़ा, हाथ में कमज़ोरी, बोलने में दिक्कत", "Face drooping, arm weakness, slurred speech", "मूंह् टेढ़ा, बांह् च कमजोरी, बोलने च औखत"],
    ["seizure", "दौरा पड़ना", "Seizure (fits)", "दौरा पौना"], ["injury", "गंभीर चोट", "Serious injury", "गंभीर चोट"], ["burn", "गंभीर जलना", "Serious burn", "गंभीर सड़ना"],
    ["poison", "ज़हर या साँप का काटना", "Poisoning or snake bite", "जैह्र जां सप्पै दा डंग"], ["other", "कुछ और", "Something else", "किश होर"]
  ];
  const ST = {
    hi: { fab: "आपातकाल", title: "आपातकालीन मदद", lead: "अगर किसी की जान को खतरा हो सकता है, तो कतार में इंतज़ार न करें। सीधे इमरजेंसी जाएँ।",
      signs: "इनमें से कुछ हो तो तुरंत इमरजेंसी जाएँ:", call: "फ़ोन करें", callNote: "ये बटन अपने फ़ोन से नंबर मिलाते हैं। QueueSetu ख़ुद किसी को फ़ोन नहीं करता।",
      alert: "अस्पताल स्टाफ़ को अभी बुलाएँ", where: "आप कहाँ हैं?", what: "क्या हुआ? (ज़रूरी नहीं)", send: "स्टाफ़ को अलर्ट भेजें", sending: "भेज रहे हैं…",
      sent: t => `अलर्ट ${t} पर अस्पताल सिस्टम में दर्ज हो गया और स्टाफ़ की स्क्रीन पर दिख रहा है। जहाँ हैं वहीं रहें।`,
      acked: t => `स्टाफ़ ने आपका अलर्ट ${t} पर देख लिया है।`, resolved: t => `स्टाफ़ ने इसे ${t} पर संभाल लिया।`, waitAck: "स्टाफ़ के देखने का इंतज़ार…",
      dup: "आपका अलर्ट पहले ही भेजा जा चुका है।", fail: "अलर्ट नहीं भेज पाए। तुरंत किसी स्टाफ़ को बताएँ या इमरजेंसी जाएँ।",
      way: "इमरजेंसी का रास्ता दिखाएँ", hide: "रास्ता छिपाएँ", close: "बंद करें", again: "नया अलर्ट" },
    en: { fab: "Emergency", title: "Emergency help", lead: "If someone’s life may be in danger, don’t wait in the queue. Go straight to Emergency.",
      signs: "Go to Emergency at once for any of these:", call: "Call", callNote: "These buttons dial from your own phone. QueueSetu does not call anyone by itself.",
      alert: "Alert hospital staff now", where: "Where are you?", what: "What happened? (optional)", send: "Send alert to staff", sending: "Sending…",
      sent: t => `Alert recorded by the hospital system at ${t}. It is showing on staff screens now. Stay where you are.`,
      acked: t => `A staff member saw your alert at ${t}.`, resolved: t => `Staff marked this as handled at ${t}.`, waitAck: "Waiting for staff to see it…",
      dup: "Your alert was already sent.", fail: "Couldn’t send the alert. Tell any staff member now, or go to Emergency.",
      way: "Show the way to Emergency", hide: "Hide the way", close: "Close", again: "Send a new alert" },
    doi: { fab: "एमरजेंसी", title: "एमरजेंसी मदद", lead: "जेकर कुसै दी जान गी खतरा होई सकदा ऐ, तां कतार च इंतजार नेईं करो। सिद्धे एमरजेंसी जाओ।",
      signs: "इंदे चा किश बी होऐ तां फौरन एमरजेंसी जाओ:", call: "फोन करो", callNote: "एह् बटन तुंदे अपने फोन थमां नंबर मलांदे न। QueueSetu आपूं कुसै गी फोन नेईं करदा।",
      alert: "अस्पताल स्टाफ गी हुनै बुलाओ", where: "तुस कुत्थै ओ?", what: "के होआ? (ज़रूरी नेईं)", send: "स्टाफ गी अलर्ट भेजो", sending: "भेजा करदे आं…",
      sent: t => `अलर्ट ${t} बजे अस्पताल सिस्टम च दर्ज होई गेआ ते स्टाफ दी स्क्रीन पर दिक्खा करदा ऐ। जित्थै ओ उत्थै गै रौह्ओ।`,
      acked: t => `स्टाफ ने तुंदा अलर्ट ${t} बजे दिक्खी लेआ।`, resolved: t => `स्टाफ ने इसी ${t} बजे संभाली लेआ।`, waitAck: "स्टाफ दे दिक्खने दा इंतजार…",
      dup: "तुंदा अलर्ट पैह्लें गै भेजेआ जाई चुके दा ऐ।", fail: "अलर्ट नेईं भेजी सके। फौरन कुसै स्टाफ गी दस्सो जां एमरजेंसी जाओ।",
      way: "एमरजेंसी दा रस्ता दस्सो", hide: "रस्ता छपालो", close: "बंद करो", again: "नमां अलर्ट" }
  };
  let sosPoll = null, sosReturn = null;
  function clientId() { let id = ls.get("baari-client"); if (!id) { id = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls.set("baari-client", id); } return id; }
  function sosSaved() { try { const v = JSON.parse(ls.get("baari-sos") || "null"); return v && Date.now() - v.at < 30 * 60000 ? v : null; } catch (e) { return null; } }
  function closeSOS() {
    const el = $("#sos"); if (!el) return;
    clearInterval(sosPoll); sosPoll = null; el.remove(); document.body.classList.remove("modal-open");
    if (sosReturn && sosReturn.focus) sosReturn.focus();
  }
  function openSOS() {
    closeSOS();
    const lang = getLang(), L = ST[lang], s = Store.state, mine = myToken();
    sosReturn = document.activeElement;
    const wrap = document.createElement("div");
    wrap.id = "sos"; wrap.className = "sheet-wrap";
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sos-t" lang="${lang}">
      <div class="sheet-head"><h2 id="sos-t">${I.sos}${L.title}</h2><button type="button" class="tbtn" data-close aria-label="${L.close}">${I.x}</button></div>
      <p class="sos-lead">${L.lead}</p>
      <div class="sos-calls"><p class="lbl">${L.call}</p><div class="sos-nums">${(s.contacts || []).map(c => `<a class="btn sosnum" href="tel:${esc(c.number.replace(/[^0-9+]/g, ""))}">${I.phone}<span><b>${esc(c.number)}</b> ${esc(c[lang])}</span></a>`).join("")}</div><p class="small muted">${L.callNote}</p></div>
      <div class="sos-box">
        <p class="lbl">${L.signs}</p>
        <div class="chips" role="group" aria-label="${L.what}">${SIGN_LIST.map(([k, h, e, doi]) => `<button type="button" class="chip" data-sign="${k}" aria-pressed="false">${L3(lang, h, e, doi)}</button>`).join("")}</div>
        ${startSelect("sos-where", mine ? "HALL" : "GATE", lang).replace(L3(lang, "आप अभी कहाँ हैं?", "Where are you now?", "तुस हुन कुत्थै ओ?"), L.where)}
        <div id="sos-state"></div>
        <button type="button" class="btn danger big" id="sos-send">${L.send}</button>
      </div>
      <button type="button" class="btn ghost" id="sos-way">${L.way}</button><div id="sos-map" class="emrway" hidden></div>
    </div>`;
    document.body.appendChild(wrap); document.body.classList.add("modal-open");
    const sheet = wrap.querySelector(".sheet"), signs = new Set();
    wrap.addEventListener("click", e => { if (e.target === wrap || e.target.closest("[data-close]")) closeSOS(); });
    wrap.addEventListener("keydown", e => {
      if (e.key === "Escape") closeSOS();
      if (e.key === "Tab") { const f = [...sheet.querySelectorAll("button,a[href],select,input")].filter(x => !x.disabled && x.offsetParent !== null); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    sheet.querySelectorAll("[data-sign]").forEach(b => b.addEventListener("click", () => { const k = b.dataset.sign; signs.has(k) ? signs.delete(k) : signs.add(k); b.classList.toggle("on", signs.has(k)); b.setAttribute("aria-pressed", signs.has(k)); }));
    const stateEl = $("#sos-state", sheet), send = $("#sos-send", sheet);
    function showStatus(a, dup) {
      const lines = [`<p class="sos-ok">${I.check}<span>${dup ? L.dup + " " : ""}${L.sent(clock(a.createdAt))}</span></p>`];
      if (a.resolvedAt) lines.push(`<p class="sos-ok">${I.check}<span>${L.resolved(clock(a.resolvedAt))}</span></p>`);
      else if (a.ackAt) lines.push(`<p class="sos-ok">${I.check}<span>${L.acked(clock(a.ackAt))}</span></p>`);
      else lines.push(`<p class="muted small sos-wait"><i class="live-dot"></i>${L.waitAck}</p>`);
      stateEl.innerHTML = lines.join("");
      send.hidden = !a.resolvedAt; send.textContent = L.again; send.disabled = false;
    }
    function poll(id) {
      clearInterval(sosPoll);
      sosPoll = setInterval(async () => {
        try { const r = await fetch("/api/emergency/" + encodeURIComponent(id)); if (!r.ok) return; const j = await r.json(); showStatus(Object.assign({}, j.alert, { createdAt: j.alert.createdAt }), false); if (j.alert.resolvedAt) clearInterval(sosPoll); } catch (e) {}
      }, 4000);
    }
    const saved = sosSaved();
    if (saved) { showStatus({ createdAt: saved.at }, false); poll(saved.id); fetch("/api/emergency/" + saved.id).then(r => r.ok ? r.json() : null).then(j => j && showStatus(j.alert, false)).catch(() => {}); }
    send.addEventListener("click", async () => {
      if (send.disabled) return;
      send.disabled = true; send.textContent = L.sending;
      try {
        const j = await Store.post("/api/emergency", { clientId: clientId(), place: $("#sos-where", sheet).value, signs: [...signs], tokenId: mine ? mine.id : null });
        ls.set("baari-sos", JSON.stringify({ id: j.alert.id, at: j.alert.createdAt }));
        showStatus(j.alert, j.duplicate); poll(j.alert.id);
      } catch (e) { stateEl.innerHTML = `<p class="formerr">${L.fail}</p>`; send.disabled = false; send.textContent = L.send; }
    });
    $("#sos-way", sheet).addEventListener("click", e => {
      const m = $("#sos-map", sheet); m.hidden = !m.hidden;
      if (!m.hidden) m.innerHTML = wayfind($("#sos-where", sheet).value, "EMR", lang);
      e.currentTarget.textContent = m.hidden ? L.way : L.hide;
    });
    $("#sos-where", sheet).addEventListener("change", () => { const m = $("#sos-map", sheet); if (!m.hidden) m.innerHTML = wayfind($("#sos-where", sheet).value, "EMR", lang); });
    setTimeout(() => { const f = sheet.querySelector("[data-close]"); f && f.focus(); }, 30);
  }
  function mountSOS() {
    if ($("#sosfab")) return;
    const b = document.createElement("button");
    b.id = "sosfab"; b.type = "button"; b.className = "sosfab";
    b.addEventListener("click", openSOS);
    document.body.appendChild(b);
  }
  const NAVN = { home: ["होम", "Home", "होम"], patient: ["मरीज़", "Patient", "मरीज़"], staff: ["स्टाफ़", "Staff", "स्टाफ"], display: ["हॉल डिस्प्ले", "Hall Display", "हॉल डिस्प्ले"], admin: ["डैशबोर्ड", "Dashboard", "डैशबोर्ड"] };
  function applyNav() {
    const lang = getLang(), pv = PATIENT_VIEWS.includes(document.body.dataset.view);
    document.querySelectorAll("[data-nav]").forEach(a => { const n = NAVN[a.dataset.nav]; if (n) { a.textContent = L3(lang, n[0], n[1], n[2]); a.lang = lang; } });
    document.querySelectorAll("[data-glang]").forEach(b => { const on = b.dataset.glang === lang; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const sk = $(".skip"); if (sk) sk.textContent = L3(lang, "मुख्य भाग पर जाएँ", "Skip to content", "मुक्ख हिस्से पर जाओ");
    const cta = $("[data-cta]"); if (cta) { cta.textContent = L3(lang, "टोकन लें", "Get Your Token", "टोकन लैओ"); cta.lang = lang; }
    const f = $("#sosfab");
    if (f) { f.hidden = !pv; f.innerHTML = `${I.sos}<span>${ST[lang].fab}</span>`; f.setAttribute("aria-label", ST[lang].title); }
    applyDisplay();
  }
  function wireNav() {
    document.querySelectorAll("[data-glang]").forEach(b => b.addEventListener("click", () => { if (b.dataset.glang === getLang()) return; setLang(b.dataset.glang); toast(L3(b.dataset.glang, "भाषा: हिंदी", "Language: English", "भाषा: डोगरी")); navigate(); }));
    const mb = $("#menubtn"), nav = $("#mainnav");
    if (mb && nav) {
      mb.addEventListener("click", () => { const open = mb.getAttribute("aria-expanded") !== "true"; mb.setAttribute("aria-expanded", open); nav.classList.toggle("open", open); document.body.classList.toggle("menu-open", open); });
      nav.addEventListener("click", e => { if (e.target.closest("a")) { mb.setAttribute("aria-expanded", "false"); nav.classList.remove("open"); document.body.classList.remove("menu-open"); } });
      addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("open")) { mb.click(); mb.focus(); } });
    }
  }

  /* Words for a registration saved offline and not yet confirmed by the hospital. */
  const PEND = {
    hi: { short: "पुष्टि का इंतज़ार", title: "आपका फ़ॉर्म इस फ़ोन में सेव है", body: "अभी इंटरनेट नहीं है, इसलिए टोकन नंबर अभी नहीं मिला। इंटरनेट आते ही QueueSetu आपका फ़ॉर्म अस्पताल को अपने आप भेज देगा और यहाँ आपका नंबर दिखेगा। यह पेज खुला रखें।", retry: "अभी फिर से भेजें", cancel: "फ़ॉर्म हटाएँ", saved: t => `सेव किया: ${t}`, help: "जल्दी हो तो रजिस्ट्रेशन काउंटर या हेल्प डेस्क पर जाएँ।" },
    en: { short: "Waiting to be confirmed", title: "Your form is saved on this phone", body: "There is no internet right now, so you don’t have a token number yet. As soon as the connection is back, QueueSetu sends your form to the hospital by itself and your number appears here. Keep this page open.", retry: "Try sending now", cancel: "Remove this form", saved: t => `Saved ${t}`, help: "In a hurry? Go to the Registration counter or the Help desk." },
    doi: { short: "पक्का होने दा इंतजार", title: "तुंदा फार्म इस फोन च सेव ऐ", body: "हुन इंटरनेट नेईं ऐ, इस करी टोकन नंबर अजें नेईं मिलेआ। इंटरनेट औंदे गै QueueSetu तुंदा फार्म अस्पताल गी अपने आप भेजी देग ते इत्थै तुंदा नंबर लब्भग। एह् पन्ना खुल्ला रक्खो।", retry: "हुनै फ्ही भेजो", cancel: "फार्म हटाओ", saved: t => `सेव कीता: ${t}`, help: "जल्दी ऐ? रजिस्ट्रेशन काउंटर जां हेल्प डेस्क पर जाओ।" }
  };

  /* ---------- My token (kept on this phone) ---------- */
  const mineInfo = () => { try { return JSON.parse(ls.get("baari-my-token") || "null"); } catch (e) { return null; } };
  const myToken = () => { const m = mineInfo(); return m ? Store.state.tokens.find(t => t.id === m.id) || null : null; };
  function trackToken(t, extra) { ls.set("baari-my-token", JSON.stringify(Object.assign({ id: t.id, code: t.code, dept: t.dept }, extra || {}))); }
  const findByCode = c => Store.state.tokens.find(t => t.code === c) || null;

  /* ---------- Patient home: six big actions ---------- */
  function tilesHtml(lang) {
    const t = PT[lang].tiles;
    const tile = (k, href, icon, cls) => `<a class="tile ${cls || ""}" href="${href}" ${k === "sos" ? 'data-sos role="button"' : ""}><span class="tile-ico">${icon}</span><span class="tile-t">${t[k][0]}</span><span class="tile-s">${t[k][1]}</span><span class="tile-go" aria-hidden="true">${svg('<path d="M5 12h14M13 6l6 6-6 6"/>')}</span></a>`;
    return `<div class="tiles" lang="${lang}">
      ${tile("register", "#register", I.reg, "go")}${tile("status", "#track", I.clock)}${tile("slip", "#slip", I.slip)}
      ${tile("find", "#find", I.pin)}${tile("queue", "#queue", svg('<path d="M3 3v18h18"/><path d="M7 15v2M11 11v6M15 7v10M19 12v5"/>'))}${tile("help", "#help", I.help)}</div>`;
  }
  function wireTiles(root) { root.querySelectorAll("[data-sos]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); openSOS(); })); }
  function viewHub(root) {
    function render() {
      const lang = getLang(), L = PT[lang], t = myToken();
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lang, L.hubTitle, { back: false, listen: true, sub: L.hubSub })}
        ${netLine(lang)}
        ${t ? `<a class="mytok enter" href="#track"><span class="mt-l"><span class="eyebrow">${L.yourTok}</span><span class="mytok-code tnum">${t.code}</span></span><span class="mytok-s">${t.status === "waiting" ? T[lang].ahead(aheadOf(Store.state, t)) : t.status === "called" ? T[lang].turn : t.status === "missed" ? T[lang].missed : T[lang].done}</span><span class="vc-go">${L.see} →</span></a>` : ""}
        ${!t && Pending.get() ? `<a class="mytok enter pending" href="#track"><span class="mt-l"><span class="eyebrow">${L.yourTok}</span><span class="mytok-code tnum">…</span></span><span class="mytok-s">${PEND[lang].short}</span><span class="vc-go">${L.see} →</span></a>` : ""}
        ${tilesHtml(lang)}
        <button type="button" class="lostbar" data-lost>${I.help}<span><b>${LOST[lang].btn}</b><small>${LOST[lang].lead}</small></span></button>
        <button type="button" class="sosbar" data-sos>${I.sos}<span><b>${L.tiles.sos[0]}</b><small>${L.tiles.sos[1]}</small></span></button>
        <div class="installrow"><a class="btn ghost" href="#settings">${SET[lang].title}</a>${installBtn(lang)}</div></section>`;
      wireTiles(root);
      wireHead(root, lang, render, () => [L.hubTitle, ...Object.values(L.tiles).map(x => x[0] + ". " + x[1] + ".")].join(" "));
    }
    render();
    return () => {
      const lang = getLang(), n = $(".netbar", root); if (n) n.outerHTML = netLine(lang);
      const t = myToken(), m = $(".mytok-s", root);
      if (t && m) m.textContent = t.status === "waiting" ? T[lang].ahead(aheadOf(Store.state, t)) : t.status === "called" ? T[lang].turn : t.status === "missed" ? T[lang].missed : T[lang].done;
    };
  }

  /* ---------- Registration, token status and assisted registration ---------- */
  const P = {
    hi: { saveSlip: "पर्ची सेव करें", print: "प्रिंट करें", listen: "सुनें", findRoom: r => `${r} तक कैसे जाएँ`,
      mapNote: "यह नमूना नक्शा है। असली अस्पताल का नक्शा यहाँ लगाया जाएगा।", slipQr: "स्टाफ़ इस QR को स्कैन करके आपकी पर्ची जाँच सकते हैं।",
      aiSuggest: "AI का सुझाव", rulesSuggest: "सुझाव", urgentTitle: "यह आपातकालीन हो सकता है", urgentBody: "कतार में इंतज़ार न करें। अभी इमरजेंसी जाएँ, या किसी स्टाफ़ को तुरंत बताएँ।",
      emrWay: "इमरजेंसी का रास्ता दिखाएँ", hideWay: "रास्ता छिपाएँ", saved: "पर्ची आपके फ़ोन में सेव हो गई।", urgentTag: "आपातकालीन संकेत: स्टाफ़ की स्क्रीन पर अलर्ट दिख रहा है।",
      steps3: "तीन आसान कदम: नाम लिखें, तकलीफ़ बताएँ, विभाग चुनें। फिर हरा बटन दबाएँ।",
      formRead: "अपना नाम लिखें। अपनी तकलीफ़ टाइप करें, या माइक का बटन दबाकर बोलें। फिर विभाग चुनें। पता न हो तो हेल्प डेस्क चुनें। आख़िर में टोकन लें बटन दबाएँ।",
      helpCard: "पता नहीं? हेल्प डेस्क से पूछें", needDept: "कृपया एक विभाग चुनें, या हेल्प डेस्क चुनें।",
      doneBanner: "रजिस्ट्रेशन हो गया! यह रहा आपका टोकन।", dupBanner: "इस नाम और नंबर से आज का टोकन पहले से है, इसलिए वही दिखा रहे हैं।",
      near: (a, r) => `आपकी बारी आने वाली है! कृपया वेटिंग हॉल के पास ही रहें। ${a === 0 ? "अगला नंबर आपका है।" : `आपसे पहले सिर्फ़ ${a} लोग हैं।`}`,
      readWait: (c, dn, a, m, r) => `आपका टोकन ${c} है, ${dn}। ${a === 0 ? "अगला नंबर आपका है।" : `आपसे पहले ${a} लोग हैं।`} लगभग ${m} मिनट। आपको ${r} में जाना है।`,
      readTurn: r => `अब आपकी बारी है। ${r} में जाएँ।`, readDone: "आपकी जाँच हो गई है। धन्यवाद।", readMissed: "आपका नंबर निकल गया। कृपया हेल्प डेस्क पर बताएँ।", way: "रास्ता।",
      noTok: "आपके फ़ोन पर अभी कोई टोकन नहीं है।", enterCode: "पर्ची पर लिखा टोकन नंबर डालें (जैसे M-27)", find: "खोजें", badCode: "टोकन नंबर ऐसे लिखें: एक अक्षर और नंबर, जैसे M-27।",
      notFound: "यह टोकन आज की सूची में नहीं मिला। नंबर दोबारा देखें, या हेल्प डेस्क पर पूछें।", orReg: "या नया टोकन लें", statusTitle: "आपकी बारी, बिना इंतज़ार के।", other: "कोई दूसरा टोकन देखें", moved: f => `हेल्प डेस्क ने आपको ${f} से यहाँ भेजा है।` },
    en: { saveSlip: "Save slip", print: "Print", listen: "Listen", findRoom: r => `How to get to ${r}`,
      mapNote: "Sample floor plan. The hospital’s own plan goes here.", slipQr: "Staff can scan this QR code to check your slip.",
      aiSuggest: "AI suggestion", rulesSuggest: "Suggestion", urgentTitle: "This could be an emergency", urgentBody: "Don’t wait in the queue. Go to Emergency now, or tell any staff member right away.",
      emrWay: "Show the way to Emergency", hideWay: "Hide the way", saved: "Slip saved to your device.", urgentTag: "Flagged as possibly urgent. An alert is showing on staff screens.",
      steps3: "Three easy steps: your name, your problem, a department. Then press the green button.",
      formRead: "Type your name. Type your problem, or press the microphone and speak. Then choose a department. If you are not sure, choose the Help desk. Finally press Get token.",
      helpCard: "Not sure? Ask the Help Desk", needDept: "Please choose a department, or choose the Help desk.",
      doneBanner: "You’re registered! Here is your token.", dupBanner: "You already have a token today with this name and number, so here it is.",
      near: (a, r) => `You’re almost up! Please stay near the waiting area. ${a === 0 ? "You’re next." : `Only ${a} ${a === 1 ? "person is" : "people are"} ahead of you.`}`,
      readWait: (c, dn, a, m, r) => `Your token is ${c}, ${dn}. ${a === 0 ? "You are next." : `${a} people are ahead of you.`} About ${m} minutes. Go to ${r}.`,
      readTurn: r => `It is your turn now. Please go to ${r}.`, readDone: "Your consultation is done. Thank you.", readMissed: "Your number was missed. Please tell the Help desk.", way: "Directions.",
      noTok: "There’s no token on this phone yet.", enterCode: "Enter the token number on your slip (for example M-27)", find: "Find", badCode: "Write the token as one letter and a number, like M-27.",
      notFound: "We couldn’t find this token in today’s list. Check the number, or ask at the Help desk.", orReg: "Or get a new token", statusTitle: "Your turn, without the wait.", other: "Track a different token", moved: f => `The Help desk sent you here from ${f}.` },
    doi: { saveSlip: "पर्ची सेव करो", print: "प्रिंट करो", listen: "सुनो", findRoom: r => `${r}: जाने दा रस्ता`,
      mapNote: "एह् नमूने दा नक्शा ऐ। असली अस्पताल दा नक्शा इत्थै लग्गग।", slipQr: "स्टाफ इस QR गी स्कैन करियै तुंदी पर्ची जांची सकदा ऐ।",
      aiSuggest: "AI दा सुझा", rulesSuggest: "सुझा", urgentTitle: "एह् एमरजेंसी होई सकदी ऐ", urgentBody: "कतार च इंतजार नेईं करो। हुनै एमरजेंसी जाओ, जां फौरन कुसै स्टाफ गी दस्सो।",
      emrWay: "एमरजेंसी दा रस्ता दस्सो", hideWay: "रस्ता छपालो", saved: "पर्ची तुंदे फोन च सेव होई गेई।", urgentTag: "एमरजेंसी दा निशान लग्गे दा ऐ: स्टाफ दी स्क्रीन पर अलर्ट दिक्खा करदा ऐ।",
      steps3: "त्रै सौखे कदम: नां लिखो, तकलीफ दस्सो, बिभाग चुनो। फ्ही हरा बटन दबाओ।",
      formRead: "अपना नां लिखो। अपनी तकलीफ टाइप करो, जां माइक दा बटन दबाइयै बोलो। फ्ही बिभाग चुनो। पता नेईं होऐ तां हेल्प डेस्क चुनो। अखीर च हरा बटन दबाओ।",
      helpCard: "पता नेईं? हेल्प डेस्क थमां पुच्छो", needDept: "किरपा करियै इक बिभाग चुनो, जां हेल्प डेस्क चुनो।",
      doneBanner: "रजिस्ट्रेशन होई गेआ! एह् रेहा तुंदा टोकन।", dupBanner: "इस नां ते नंबर कन्नै अज्ज दा टोकन पैह्लें गै ऐ, इस करी ओह्दे गै दस्सा करदे आं।",
      near: (a, r) => `तुंदी बारी औने आह्ली ऐ! किरपा करियै वेटिंग हॉल दे कोल गै रौह्ओ। ${a === 0 ? "अगला नंबर तुंदा ऐ।" : `तुंदे शा पैह्लें ${a} लोक गै न।`}`,
      readWait: (c, dn, a, m, r) => `तुंदा टोकन ${c}, ${dn}. ${a === 0 ? "अगला नंबर तुंदा ऐ।" : `तुंदे शा पैह्लें ${a} लोक न।`} लगभग ${m} मिंट। इत्थै जाओ: ${r}.`,
      readTurn: r => `हुन तुंदी बारी ऐ। इत्थै जाओ: ${r}.`, readDone: "तुंदी जांच होई गेई ऐ। धन्नवाद।", readMissed: "तुंदा नंबर निकली गेआ। किरपा करियै हेल्प डेस्क पर दस्सो।", way: "रस्ता।",
      noTok: "इस फोन पर अजें कोई टोकन नेईं ऐ।", enterCode: "पर्ची पर लिखे दा टोकन नंबर पाओ (जियां M-27)", find: "लब्भो", badCode: "टोकन नंबर इयां लिखो: इक अक्खर ते नंबर, जियां M-27।",
      notFound: "एह् टोकन अज्जै दी लिस्ट च नेईं लब्भा। नंबर फ्ही दिक्खो, जां हेल्प डेस्क पर पुच्छो।", orReg: "जां नमां टोकन लैओ", statusTitle: "तुंदी बारी, बिना इंतजार दे।", other: "कोई होर टोकन दिक्खो", moved: f => `हेल्प डेस्क ने तुसेंगी ${f} थमां इत्थै भेजेआ ऐ।` }
  };
  const LL = lang => Object.assign({}, T[lang], P[lang]);
  const dname = (d, lang) => DEPT[d][lang] || DEPT[d].en;
  const droom = (d, lang) => DEPT[d].help ? L3(lang, DEPT[d].roomHi, DEPT[d].room, DEPT[d].roomDoi) : L3(lang, DEPT[d].roomHi, DEPT[d].room, DEPT[d].roomDoi) + ", " + floorName(d, lang);

  function tokenLookup(lang, onFound) {
    const L = LL(lang);
    return {
      html: `<form class="card form lookup" novalidate><label for="f-code">${L.enterCode}</label>
        <div class="inrow"><input id="f-code" autocomplete="off" autocapitalize="characters" maxlength="8" placeholder="M-27" inputmode="text"><button class="btn primary" type="submit">${L.find}</button></div>
        <p class="formerr" role="alert" hidden></p></form>`,
      wire(root) {
        const f = $(".lookup", root); if (!f) return;
        f.addEventListener("submit", e => {
          e.preventDefault();
          const err = $(".formerr", f), c = normCode($("#f-code", f).value);
          if (!c) { err.textContent = L.badCode; err.hidden = false; return; }
          const t = findByCode(c);
          if (!t) { err.textContent = L.notFound; err.hidden = false; return; }
          err.hidden = true; onFound(t);
        });
      }
    };
  }

  /* mode: "register" | "status" | "assist" */
  function viewFlow(root, mode) {
    let deptTouched = false, shownStatus = null, triage = null, tseq = 0, ttimer = null, wayFrom = "GATE", assisted = null;
    let draft = { name: "", complaint: "", phone: "", sms: true, dept: "" };
    const pre = ls.get("baari-pre-dept"); if (pre && DEPT[pre]) { draft.dept = pre; deptTouched = true; ls.del("baari-pre-dept"); }
    const lang = () => getLang();

    function setDept(d) {
      draft.dept = d; const r = root.querySelector(`input[name="dept"][value="${d}"]`); if (!r) return;
      r.checked = true; root.querySelectorAll(".dcard").forEach(c => c.classList.toggle("on", c.contains(r))); saveDraft(); hint2();
    }
    function showTriage(r) {
      triage = r;
      const hint = $("#depthint", root), urg = $("#urgent", root), lg = lang(), L = LL(lg);
      if (!hint || !urg) return;
      if (!r || !draft.complaint.trim()) { hint.hidden = true; urg.hidden = true; return; }
      if (!deptTouched) setDept(r.dept);
      hint.innerHTML = `<b>${r.source === "ai" ? `<span class="ai-badge">AI</span> ${L.aiSuggest}` : L.rulesSuggest}: ${dname(r.dept, lg)}.</b> ${esc(r["why_" + lg] || "")}`;
      hint.hidden = deptTouched;
      urg.hidden = !r.urgent;
    }
    function runTriage() {
      const ce = $("#f-complaint", root); if (!ce) return;
      const text = ce.value.trim();
      showTriage(text ? window.BaariShared.rulesTriage(text) : null);
      clearTimeout(ttimer);
      if (!text || !Store.state.ai) return;
      const my = ++tseq;
      ttimer = setTimeout(async () => {
        try { const r = await Store.post("/api/triage", { text, lang: lang() }); if (my === tseq && $("#f-complaint", root) && $("#f-complaint", root).value.trim() === text) showTriage(r); } catch (e) {}
      }, 700);
    }
    function hint2() {
      const el = $("#queuehint", root); if (!el) return;
      const ch = root.querySelector('input[name="dept"]:checked'); if (!ch) { el.textContent = ""; return; }
      const d = ch.value, { n, m } = queueEst(Store.state, d), lg = lang();
      const doc = docLine(Store.state, d, lg);
      el.innerHTML = esc(dname(d, lg) + ": " + T[lg].qhint(n, m)) + (doc && doc.cls !== "ok" ? `<br><span class="doc ${doc.cls}">${esc(doc.text)}</span>` : "");
    }
    function listen(btn, input) {
      const note = $("#micnote", root), lg = lang(), L = LL(lg);
      const show = t => { note.textContent = t; note.hidden = false; };
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { show(L.noVoice); return; }
      let rec; try { rec = new SR(); } catch (e) { show(L.noVoice); return; }
      rec.lang = SPEECH[lg] || "en-IN"; rec.interimResults = true; rec.maxAlternatives = 1;
      let failed = false;
      btn.classList.add("on"); btn.setAttribute("aria-pressed", "true"); show(L.listening);
      rec.onresult = e => { let txt = ""; for (const r of e.results) txt += r[0].transcript; input.value = txt; input.dispatchEvent(new Event("input", { bubbles: true })); };
      rec.onerror = e => { failed = true; show(e.error === "not-allowed" || e.error === "service-not-allowed" ? L.micBlocked : L.voiceErr); };
      rec.onend = () => { btn.classList.remove("on"); btn.setAttribute("aria-pressed", "false"); if (!failed) note.hidden = true; };
      try { rec.start(); } catch (e) { btn.classList.remove("on"); show(L.voiceErr); }
    }

    function saveDraft() {
      const v = id => { const el = $("#" + id, root); return el ? el : null; };
      if (v("f-name")) draft.name = v("f-name").value;
      if (v("f-phone")) draft.phone = v("f-phone").value;
      if (v("f-sms")) draft.sms = v("f-sms").checked;
      if (v("f-complaint")) draft.complaint = v("f-complaint").value;
      const ch = root.querySelector('input[name="dept"]:checked'); if (ch) draft.dept = ch.value;
    }
    const W = {
      hi: { steps: ["आपकी जानकारी", "विभाग", "जाँचें", "टोकन"], next: "आगे बढ़ें", back: "पीछे", confirm: "मेरा टोकन बनाएँ", review: "एक बार जाँच लें", edit: "बदलें",
        rName: "नाम", rPhone: "मोबाइल", rProb: "तकलीफ़", rDept: "विभाग", notGiven: "नहीं दिया", none: "नहीं बताया", s1: "अपना नाम लिखें। मोबाइल नंबर देने पर बारी पास आने का SMS मिलेगा।", s2: "अपनी तकलीफ़ बताएँ, फिर विभाग चुनें।", s3: "सब ठीक है तो नीचे हरा बटन दबाएँ।",
        expect: (n, m) => n ? `अभी ${n} लोग आगे हैं, लगभग ${m} मिनट।` : "अभी कोई इंतज़ार में नहीं है।", stepOf: (a, b) => `कदम ${a} / ${b}` },
      en: { steps: ["Your details", "Department", "Review", "Token"], next: "Continue", back: "Back", confirm: "Get my token", review: "Check your details", edit: "Change",
        rName: "Name", rPhone: "Mobile", rProb: "Problem", rDept: "Department", notGiven: "Not given", none: "Not told", s1: "Type your name. Give a mobile number to get a text when your turn is close.", s2: "Tell us your problem, then choose a department.", s3: "If everything looks right, press the green button.",
        expect: (n, m) => n ? `${n} people ahead right now, about ${m} min.` : "Nobody is waiting right now.", stepOf: (a, b) => `Step ${a} of ${b}` },
      doi: { steps: ["तुंदी जानकारी", "बिभाग", "जांच", "टोकन"], next: "अग्गें बधो", back: "पिच्छें", confirm: "मेरा टोकन बनाओ", review: "इक बारी जांची लैओ", edit: "बदलो",
        rName: "नां", rPhone: "मोबाइल", rProb: "तकलीफ", rDept: "बिभाग", notGiven: "नेईं दित्ता", none: "नेईं दस्सेआ", s1: "अपना नां लिखो। मोबाइल नंबर देने पर बारी कोल औने दा SMS औग।", s2: "अपनी तकलीफ दस्सो, फ्ही बिभाग चुनो।", s3: "सब ठीक ऐ तां थल्लै हरा बटन दबाओ।",
        expect: (n, m) => n ? `हुन तुंदे शा पैह्लें ${n} लोक न, लगभग ${m} मिंट।` : "हुन कोई इंतजार नेईं करा करदा।", stepOf: (a, b) => `कदम ${a} / ${b}` }
    };
    let step = 1;
    function stepper(lg) {
      const w = W[lg];
      return `<ol class="stepper" aria-label="${w.stepOf(step, 4)}">${w.steps.map((t, i) => `<li class="${i + 1 < step ? "done" : i + 1 === step ? "cur" : ""}" ${i + 1 === step ? 'aria-current="step"' : ""}><span class="st-n">${i + 1 < step ? I.check : i + 1}</span><span class="st-t">${t}</span></li>`).join("")}</ol>`;
    }
    function form(note) {
      const lg = lang(), L = LL(lg), w = W[lg];
      if (mode === "assist" && !Store.staff) {
        root.innerHTML = `<section class="wrap narrow"><div class="card login"><p class="eyebrow">Assisted registration</p><h1>Staff only</h1><p class="muted">Sign in on the staff portal first, then come back here to register patients on their behalf.</p><a class="btn primary big" href="#staff">Go to the staff portal</a></div></section>`;
        return;
      }
      let body = "";
      if (step === 1) body = `
          <label for="f-name">${L.name} <span class="req" aria-hidden="true">*</span></label>
          <div class="inrow"><input id="f-name" autocomplete="name" maxlength="60" value="${esc(draft.name)}" aria-describedby="formerr" required><button type="button" class="mic" data-target="f-name" aria-label="${L.speak}" aria-pressed="false" title="${L.speak}">${MIC}</button></div>
          <label for="f-phone">${L.phone}</label>
          <input id="f-phone" inputmode="tel" autocomplete="tel" maxlength="14" value="${esc(draft.phone)}" placeholder="98765 43210">
          <label class="check"><input type="checkbox" id="f-sms" ${draft.sms ? "checked" : ""}>${L.sms}</label>`;
      if (step === 2) {
        const deptCards = CLINICS.map(d => `<label class="dcard ${draft.dept === d.id ? "on" : ""}"><input type="radio" name="dept" value="${d.id}" ${draft.dept === d.id ? "checked" : ""}>
          <span class="dc-ico">${I.dept[d.id]}</span><span class="dc-t">${dname(d.id, lg)}</span><span class="dc-r">${droom(d.id, lg)}</span><span class="dc-d">${DEPT_DESC[d.id][lg]}</span><span class="dc-c">${crowdBadge(Store.state, d.id, lg)}</span></label>`).join("");
        body = `
          <label for="f-complaint">${L.complaint}</label>
          <div class="inrow"><textarea id="f-complaint" rows="2" maxlength="300">${esc(draft.complaint)}</textarea><button type="button" class="mic" data-target="f-complaint" aria-label="${L.speak}" aria-pressed="false" title="${L.speak}">${MIC}</button></div>
          <div class="chips" role="group" aria-label="${L3(lg, "आम तकलीफ़ें", "Common problems", "आम तकलीफां")}">${QUICK.map((q, i) => `<button type="button" class="chip" data-quick="${i}">${L3(lg, q.hi, q.en, q.doi)}</button>`).join("")}</div>
          <div class="urgent" id="urgent" role="alert" hidden><p class="u-t">${L.urgentTitle}</p><p>${L.urgentBody}</p>
            <div class="prow"><button type="button" class="btn danger small" data-opensos>${ST[lg].title}</button><button type="button" class="btn ghost small" id="emrbtn">${L.emrWay}</button></div><div id="emrway" class="emrway" hidden></div></div>
          <fieldset class="depts-f"><legend>${L.dept} <span class="req" aria-hidden="true">*</span></legend>
            <div class="dcards">${deptCards}</div>
            <label class="dcard help ${draft.dept === "HLP" ? "on" : ""}"><input type="radio" name="dept" value="HLP" ${draft.dept === "HLP" ? "checked" : ""}><span class="dc-ico">${I.dept.HLP}</span><span class="dc-t">${L.helpCard}</span><span class="dc-d">${DEPT_DESC.HLP[lg]}</span></label>
          </fieldset>
          <p class="hint" id="depthint" hidden></p>
          <p class="queuehint tnum" id="queuehint" aria-live="polite"></p>`;
      }
      if (step === 3) {
        const d = draft.dept, { n, m } = queueEst(Store.state, d), doc = docLine(Store.state, d, lg);
        const row = (k, v, to) => `<div class="rv-row"><dt>${k}</dt><dd>${v}</dd><dd class="rv-e"><button type="button" class="linkbtn" data-goto="${to}">${w.edit}<span class="sr"> ${k}</span></button></dd></div>`;
        body = `<dl class="review">
          ${row(w.rName, esc(draft.name.trim()), 1)}
          ${row(w.rPhone, draft.phone.trim() ? esc(draft.phone.trim()) + (draft.sms ? ` · SMS` : "") : `<span class="muted">${w.notGiven}</span>`, 1)}
          ${row(w.rProb, draft.complaint.trim() ? esc(draft.complaint.trim()) : `<span class="muted">${w.none}</span>`, 2)}
          ${row(w.rDept, `<b>${esc(placeName(DEPT[d].help ? "HLP" : d, lg))}</b><br><span class="muted">${w.expect(n, m)}</span>${doc && doc.cls !== "ok" ? `<br><span class="doc ${doc.cls}">${esc(doc.text)}</span>` : ""}`, 2)}
        </dl>
        ${triage && triage.urgent ? `<div class="urgent" role="alert"><p class="u-t">${L.urgentTitle}</p><p>${L.urgentBody}</p><div class="prow"><button type="button" class="btn danger small" data-opensos>${ST[lg].title}</button></div></div>` : ""}`;
      }
      const sub = step === 1 ? w.s1 : step === 2 ? w.s2 : w.s3;
      root.innerHTML = `<section class="wrap narrow2 patient">
        ${mode === "assist" ? `<div class="assistbar">${I.help}<div><b>Assisted registration</b><span>You are registering a patient on their behalf as ${Store.role === "admin" ? "admin" : "staff"}. The token will not be saved on this device.</span></div><a class="btn small ghost" href="#staff">Back to portal</a></div>` : ""}
        ${pHead(lg, step === 3 ? w.review : L.title, { listen: true, sub, back: mode !== "assist" })}
        ${stepper(lg)}
        ${netLine(lg)}
        ${note ? `<p class="micnote">${note}</p>` : ""}
        ${mode !== "assist" && myToken() && step === 1 ? `<a class="mytok slim" href="#track"><span>${PT[lg].yourTok}: <b>${myToken().code}</b></span><span class="vc-go">${PT[lg].see} →</span></a>` : ""}
        <form id="regform" class="card form wiz step${step}" novalidate lang="${lg}">
          ${body}
          <p class="micnote" id="micnote" role="status" hidden></p>
          <p class="formerr" id="formerr" role="alert" hidden></p>
          <div class="wiz-nav">${step > 1 ? `<button type="button" class="btn soft" data-back>${svg('<path d="m15 18-6-6 6-6"/>')}<span>${w.back}</span></button>` : "<span></span>"}
            <button class="btn go big" type="submit">${step === 3 ? I.check : ""}<span>${step === 3 ? w.confirm : w.next}</span>${step < 3 ? svg('<path d="M5 12h14M13 6l6 6-6 6"/>') : ""}</button></div>
        </form></section>`;
      wireHead(root, lg, () => { saveDraft(); form(); }, () => (step === 1 ? w.s1 : step === 2 ? w.s2 : w.s3) + " " + L.formRead);
      const f = $("#regform", root), comp = $("#f-complaint", root);
      if (comp) comp.addEventListener("input", () => { saveDraft(); runTriage(); });
      f.addEventListener("change", e => { if (e.target.name === "dept") { deptTouched = true; const h = $("#depthint"); if (h) h.hidden = true; setDept(e.target.value); } });
      f.addEventListener("input", e => { saveDraft(); if (e.target.getAttribute("aria-invalid")) { e.target.removeAttribute("aria-invalid"); $("#formerr").hidden = true; } });
      f.addEventListener("click", e => {
        const q = e.target.closest("[data-quick]");
        if (q && comp) { const it = QUICK[+q.dataset.quick], wd = L3(lg, it.hi, it.en, it.doi); comp.value = comp.value.trim() ? comp.value.trim() + ", " + wd : wd; saveDraft(); runTriage(); if (!deptTouched) setDept(it.d); }
        const m = e.target.closest(".mic"); if (m) listen(m, $("#" + m.dataset.target));
        if (e.target.closest("[data-opensos]")) openSOS();
        if (e.target.closest("[data-back]")) { saveDraft(); step--; form(); }
        const g = e.target.closest("[data-goto]"); if (g) { step = +g.dataset.goto; form(); }
        if (e.target.closest("#emrbtn")) { const ww = $("#emrway", root), b = $("#emrbtn", root); ww.hidden = !ww.hidden; if (!ww.hidden && !ww.innerHTML) ww.innerHTML = wayfind("REG", "EMR", lg); b.textContent = ww.hidden ? L.emrWay : L.hideWay; }
      });
      f.addEventListener("submit", async e => {
        e.preventDefault(); saveDraft();
        const err = $("#formerr"), btn = f.querySelector("[type=submit]");
        const name = draft.name.trim(), phone = draft.phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
        const fail = (msg, el) => { err.textContent = msg; err.hidden = false; if (el) { el.focus(); el.setAttribute("aria-invalid", "true"); } f.classList.remove("shake"); void f.offsetWidth; if (!reduceMotion()) f.classList.add("shake"); };
        if (step === 1) {
          if (name.length < 2) return fail(L.needName, $("#f-name"));
          if (phone && !/^[6-9]\d{9}$/.test(phone)) return fail(L.badPhone, $("#f-phone"));
          step = 2; form(); return;
        }
        if (step === 2) {
          if (!draft.dept) return fail(L.needDept, root.querySelector('input[name="dept"]'));
          step = 3; form(); return;
        }
        if (name.length < 2) { step = 1; return form(L.needName); }
        if (!draft.dept) { step = 2; return form(L.needDept); }
        btn.disabled = true; btn.querySelector("span").textContent = L3(lg, "टोकन बन रहा है…", "Creating your token…", "टोकन बना करदा ऐ…");
        const body = { name, phone, complaint: draft.complaint.trim(), dept: draft.dept, lang: lg, sms: draft.sms, urgent: Boolean(triage && triage.urgent) };
        try {
          const j = await Store.post(mode === "assist" ? "/api/staff/register" : "/api/tokens", body, mode === "assist");
          if (!Store.state.tokens.some(t => t.id === j.token.id)) { try { const s = await (await fetch("/api/state")).json(); if (s.rev >= Store.state.rev && !Store.staff) { Store.state = s; Store.lastAt = Date.now(); } } catch (x) {} }
          draft = { name: "", complaint: "", phone: "", sms: true, dept: "" }; deptTouched = false; triage = null; step = 1;
          if (mode === "assist") { assisted = Object.assign({}, j.token, { name, duplicate: j.duplicate }); toast(j.duplicate ? "This patient already has a token today" : `Token ${j.token.code} created`); return assistDone(); }
          trackToken(j.token, { name, phone: j.token.phone, sms: j.token.sms, urgent: j.token.urgent });
          ls.set("baari-just", j.duplicate ? "dup" : "new"); ls.set("baari-just-notify", j.token.id);
          location.hash = "#track";
        } catch (x) {
          if (x.status === 0 && mode !== "assist") { // no signal: keep the form on this phone and send it when the connection is back
            Pending.save(body);
            draft = { name: "", complaint: "", phone: "", sms: true, dept: "" }; deptTouched = false; triage = null; step = 1;
            location.hash = "#track"; return;
          }
          fail(x.message || L.saveErr); btn.disabled = false; btn.querySelector("span").textContent = w.confirm;
        }
      });
      if (step === 2 && draft.complaint.trim()) runTriage();
      if (step === 2) hint2();
      const first = f.querySelector("input:not([type=checkbox]):not([type=radio]),textarea"); if (first && step < 3 && document.activeElement === document.body) first.focus({ preventScroll: true });
    }
    function assistDone() {
      const a = assisted, t = Store.state.tokens.find(x => x.id === a.id) || a, d = DEPT[t.dept], url = location.origin + location.pathname + "#verify-" + t.id;
      root.innerHTML = `<section class="wrap narrow patient">
        <div class="assistbar ok">${I.check}<div><b>${a.duplicate ? "This patient already has a token today" : "Patient registered"}</b><span>Give them the slip, or print it. Their number is now in the queue.</span></div></div>
        <div class="card ticket"><div class="slip-top"><span>${esc(Store.state.hospital)}</span><span>${clock(t.createdAt || Date.now())}</span></div>
          <p class="t-k">OPD slip · ${d.en} · ${d.room}, ${floorName(t.dept, "en")}</p><p class="t-code">${t.code}</p><p class="t-name">${esc(a.name)}</p><p class="small">Doctor: <b>${esc(doctorText(Store.state, t, "en"))}</b> · ${t.status === "waiting" ? esc(T.en.wait(estMin(Store.state, t))) + " (estimate)" : ""}</p>
          <div class="perf" aria-hidden="true"></div><p class="t-sit">${d.hi} · ${d.roomHi}, ${floorName(t.dept, "hi")}</p>
          <div class="slip-foot"><div class="tqr" id="tqr"></div><p class="small muted">Staff can scan this QR code to check the slip. It shows no personal details to the public.</p></div></div>
        <div class="tactions"><button type="button" class="btn ghost" id="aprint">${I.print}<span>Print slip</span></button><button type="button" class="btn ghost" id="asave">${I.dl}<span>Save image</span></button><a class="btn go" href="#assist" id="anext">${I.reg}<span>Next patient</span></a></div>
        </section>`;
      putQR($("#tqr", root), url, 96);
      $("#aprint", root).onclick = () => window.print();
      $("#asave", root).onclick = () => saveSlipImage(t, { name: a.name }, "en", url);
      $("#anext", root).onclick = e => { e.preventDefault(); assisted = null; form(); };
    }

    function badge(t, lg) {
      const s = Store.state, a = aheadOf(s, t), doc = (s.doctors || {})[t.dept];
      const B = L3(lg, { waiting: "इंतज़ार में", almost: "आपकी बारी करीब", go: "कृपया अंदर जाएँ", done: "पूरा हुआ", delayed: "देरी", missed: "छूट गया" },
        { waiting: "Waiting", almost: "Almost your turn", go: "Please proceed", done: "Completed", delayed: "Delayed", missed: "Missed" },
        { waiting: "इंतजार च", almost: "तुंदी बारी कोल ऐ", go: "किरपा करियै अंदर जाओ", done: "पूरा होआ", delayed: "देरी", missed: "छुट्टी गेआ" });
      let k = "waiting", ic = I.clock;
      if (t.status === "called") { k = "go"; ic = svg('<path d="M5 12h14M13 6l6 6-6 6"/>'); }
      else if (t.status === "done") { k = "done"; ic = I.check; }
      else if (t.status === "missed") { k = "missed"; ic = I.x; }
      else if (doc && doc.status !== "available" && doc.mins > 0) { k = "delayed"; ic = I.clock; }
      else if (a >= 0 && a <= 3) { k = "almost"; ic = svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'); }
      return `<span class="sbadge ${k}">${ic}<span>${B[k]}</span></span>`;
    }
    /* The token screen is built once, then only its live parts update. */
    function statusHtml(t, lg) {
      const s = Store.state, d = t.dept, a = aheadOf(s, t), cur = currentIn(s, d), info = mineInfo() || {}, L = LL(lg);
      const servedBefore = s.tokens.filter(x => x.dept === d && x.status !== "waiting" && x.createdAt <= t.createdAt).length;
      const pct = t.status === "waiting" ? Math.round(100 * servedBefore / Math.max(1, servedBefore + Math.max(0, a) + 1)) : 100;
      const doc = docLine(s, d, lg);
      if (t.status === "waiting") return `${a <= 3 ? `<div class="t-near" role="alert">${I.clock}<span>${L.near(a, droom(d, lg))}</span></div>` : ""}
        <div class="t-box"><p class="t-big tnum">${L.ahead(a)}</p><p class="muted tnum">${L.wait(estMin(s, t))} · ${droom(d, lg)}</p></div>
        ${doc ? `<p class="doc ${doc.cls}"><i></i>${esc(doc.text)}</p>` : ""}
        <div class="meter"><div class="meter-bar"><span style="width:${pct}%"></span></div><div class="meter-l tnum"><span>${L.nowServing}: <b>${cur ? cur.code : L.none}</b></span><span>${t.code}</span></div></div>
        <p class="t-sit">${L.sit}</p>${info.sms && info.phone ? `<p class="t-sit">${L.smsOn(esc(info.phone))}</p>` : ""}`;
      if (t.status === "called") return `<div class="t-turn" role="alert"><p class="t-big">${L.turn}</p><p style="font-size:20px;font-weight:700">${L.goto(droom(d, lg))}</p></div>`;
      if (t.status === "missed") return `<div class="t-end missed" role="status"><p class="t-big" style="font-size:22px">${L.missed}</p><p>${L.missedSub}</p></div>`;
      return `<div class="t-end" role="status"><p class="t-big" style="font-size:22px">${L.done}</p><p class="muted">${L.doneSub}</p></div>`;
    }
    function readText(t, lg) {
      const s = Store.state, d = DEPT[t.dept], L = LL(lg), spoken = `${d.prefix} ${t.num}`, room = droom(t.dept, lg);
      const way = d.help ? stepsText(wayFrom, "HLP", lg) : stepsText(wayFrom, t.dept, lg);
      if (t.status === "waiting") return L.readWait(spoken, dname(t.dept, lg), aheadOf(s, t), estMin(s, t), room) + " " + L.way + " " + way;
      if (t.status === "called") return L.readTurn(room) + " " + L.way + " " + way;
      return t.status === "missed" ? L.readMissed : L.readDone;
    }
    function ticket(t) {
      const s = Store.state, d = t.dept, info = mineInfo() || {}, lg = lang(), L = LL(lg);
      const box = $(".patient[data-tk]", root), dest = DEPT[d].help ? "HLP" : d;
      if (!box || box.dataset.tk !== t.id || box.dataset.lang !== lg || box.dataset.dept !== d) {
        const just = ls.get("baari-just"); ls.del("baari-just");
        const verifyUrl = location.origin + location.pathname + "#verify-" + t.id;
        root.innerHTML = `<section class="wrap narrow2 patient" data-tk="${t.id}" data-lang="${lg}" data-dept="${d}">
          ${pHead(lg, just ? L.doneBanner.split("!")[0] + "!" : L.statusTitle, { listen: true, sub: just ? (just === "dup" ? L.dupBanner : L.doneBanner.split("!").slice(1).join("!").trim()) : "" })}
          ${just ? `<div class="success" role="status"><svg class="succ" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><ol class="stepper mini" aria-label="${L3(lg, "कदम 4 / 4", "Step 4 of 4", "कदम 4 / 4")}">${L3(lg, ["जानकारी", "विभाग", "जाँच", "टोकन"], ["Details", "Department", "Review", "Token"], ["जानकारी", "बिभाग", "जांच", "टोकन"]).map((x, i) => `<li class="${i < 3 ? "done" : "cur"}"><span class="st-n">${i < 3 ? I.check : 4}</span><span class="st-t">${x}</span></li>`).join("")}</ol></div>` : ""}
          <div id="net">${netLine(lg)}</div>
          ${info.urgent ? `<div class="urgent" role="alert"><p class="u-t">${L.urgentTitle}</p><p>${L.urgentBody}</p><div class="prow"><button type="button" class="btn danger small" data-opensos>${ST[lg].title}</button></div></div>` : ""}
          <div class="card ticket" lang="${lg}"><div class="slip-top"><span>${esc(s.hospital)}</span><span class="livep"><i class="live-dot"></i>${L3(lg, "लाइव", "Live", "लाइव")}</span></div>
            <p class="t-k">${L.your} · ${dname(d, lg)} · ${droom(d, lg)}</p><div class="t-coderow"><p class="t-code ${just ? "pop" : ""}" aria-live="polite">${t.code}</p><div id="tbadge"></div></div>${info.name ? `<p class="t-name">${esc(info.name)}</p>` : ""}
            ${info.code && info.code !== t.code ? `<p class="small muted">${L.moved(esc(info.code))}</p>` : ""}
            <div class="perf" aria-hidden="true"></div><div id="tstatus" aria-live="polite"></div><div id="tdetails"></div>
            <div class="slip-foot"><div class="tqr" id="tqr"></div><p class="small muted">${L.slipQr}${info.urgent ? `<br><b class="u-tag">${L.urgentTag}</b>` : ""}</p></div></div>
          <div class="tactions" lang="${lg}">
            <button type="button" class="btn ghost" id="tlisten">${SPK}<span>${L.listen}</span></button>
            <button type="button" class="btn ghost" id="tsave">${DLD}<span>${L.saveSlip}</span></button>
            <button type="button" class="btn ghost" id="tprint">${I.print}<span>${L.print}</span></button>
          </div>
          <p class="micnote" id="tnote" hidden></p>
          ${smsCard(t, lg)}
          <div id="tnotif"></div>
          <div class="card wayfind" lang="${lg}"><h2>${L.findRoom(droom(d, lg))}</h2>${startSelect("t-from", wayFrom, lg, dest)}<div id="tway">${wayfind(wayFrom, dest, lg)}</div><p class="small muted">${L.mapNote}</p></div>
          <details class="card other"><summary>${L.other}</summary><div id="otherlook"></div></details>
          <a class="btn soft" href="#register" id="newtoken" lang="${lg}">${L.newToken}</a></section>`;
        wireHead(root, lg, () => { const x = $(".patient[data-tk]", root); if (x) x.dataset.lang = ""; ticket(myToken()); }, () => readText(myToken() || t, lg));
        putQR($("#tqr", root), verifyUrl, 96);
        const note = m => { const n = $("#tnote", root); n.textContent = m; n.hidden = !m; };
        wireListen($("#tlisten", root), () => readText(myToken() || t, lg), lg, $("#tnote", root));
        $("#tsave", root).onclick = () => { saveSlipImage(myToken() || t, info, lg, verifyUrl); note(L.saved); };
        $("#tprint", root).onclick = () => window.print();
        wireSmsCard(root, t, lg);
        $("#t-from", root).onchange = e => { wayFrom = e.target.value; $("#tway", root).innerHTML = wayfind(wayFrom, dest, lg); };
        root.querySelectorAll("[data-opensos]").forEach(b => b.onclick = openSOS);
        const ol = tokenLookup(lg, x => { trackToken(x); shownStatus = null; toast(L3(lg, `अब ${x.code} दिखा रहे हैं`, `Now tracking ${x.code}`, `हुन ${x.code} दस्सा करदे आं`)); ticket(x); });
        $("#otherlook", root).innerHTML = ol.html.replace('class="card form lookup"', 'class="form lookup"'); ol.wire(root);
        $("#tnotif", root).addEventListener("click", async e => {
          const b = e.target.closest("[data-notif]"); if (!b) return;
          if (b.dataset.notif === "on") { b.disabled = true; const p = await Notif.enable(); if (p === "granted") { const cur = myToken(); if (cur) Notif.show(NT[lg].created(cur.code), cur.id + "-created"); } }
          else Notif.disable();
          const cur = myToken(); if (cur) { const n = $("#tnotif", root); n.innerHTML = notifCard(cur, lg); }
        });
      }
      const det = $("#tdetails", root); if (det) { const h = slipDetails(t, lg); if (det.innerHTML !== h) det.innerHTML = h; }
      const nc = $("#tnotif", root); if (nc) { const h = notifCard(t, lg); if (nc.dataset.h !== h) { nc.dataset.h = h; nc.innerHTML = h; } }
      notifyFor(t, lg);
      $("#tstatus", root).innerHTML = statusHtml(t, lg);
      const tb = $("#tbadge", root); if (tb) { const nb = badge(t, lg); if (tb.innerHTML !== nb) tb.innerHTML = nb; }
      const nb = $("#net", root); if (nb) nb.innerHTML = netLine(lg);
      // Alerts on this phone: when 3 or fewer are ahead, and when called
      const a = aheadOf(s, t), key = "baari-near-" + t.id;
      if (t.status === "waiting" && a >= 0 && a <= 3 && !ls.get(key)) {
        ls.set(key, "1");
        if (shownStatus) { try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {} soundOn = true; ensureAudio(); chime(); speak(L.near(a, droom(d, lg)), lg); }
      }
      if (shownStatus && shownStatus !== "called" && t.status === "called") {
        try { navigator.vibrate && navigator.vibrate([400, 150, 400, 150, 400]); } catch (e) {}
        soundOn = true; ensureAudio(); chime(); speak(L.readTurn(droom(d, lg)), lg);
      }
      shownStatus = t.status;
    }
    function pendingView() {
      const lg = lang(), L = PEND[lg], p = Pending.get();
      if ($(".pendcard", root) && root.dataset.plang === lg) { const nb = $(".netbar", root); if (nb) nb.outerHTML = netLine(lg); return; }
      root.dataset.plang = lg;
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lg, L.title, { sub: L.short })}${netLine(lg)}
        <div class="card ticket pendcard" lang="${lg}"><div class="slip-top"><span>${esc(Store.state.hospital)}</span><span>${L.saved(clock(p.at))}</span></div>
          <p class="t-k">${dname(p.body.dept, lg)} · ${droom(p.body.dept, lg)}</p>
          <div class="t-coderow"><p class="t-code pend" aria-hidden="true">…</p><span class="sbadge waiting">${I.clock}<span>${L.short}</span></span></div>
          <p class="t-name">${esc(p.body.name)}</p><div class="perf" aria-hidden="true"></div>
          <p>${L.body}</p><p class="small muted">${L.help}</p>
          <div class="prow"><button type="button" class="btn go" id="pd-retry">${L.retry}</button><button type="button" class="btn ghost" id="pd-cancel">${L.cancel}</button></div></div>
        <div class="card wayfind" lang="${lg}"><h2>${LL(lg).findRoom(placeName("REG", lg))}</h2><div>${wayfind("GATE", "REG", lg)}</div></div></section>`;
      wireHead(root, lg, () => { root.dataset.plang = ""; render(); });
      $("#pd-retry", root).onclick = async e => { e.currentTarget.disabled = true; await Pending.flush(); const b = $("#pd-retry", root); if (b) b.disabled = false; };
      $("#pd-cancel", root).onclick = () => { Pending.clear(); root.dataset.plang = ""; render(); };
    }
    function noToken() {
      const lg = lang(), L = LL(lg), look = tokenLookup(lg, t => { trackToken(t); render(); });
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lg, L.statusTitle, { sub: L3(lg, "पर्ची पर लिखा टोकन नंबर डालें और अपनी बारी लाइव देखें।", "Enter the token number from your slip to see your place in line, live.", "पर्ची पर लिखे दा टोकन नंबर पाओ ते अपनी बारी लाइव दिक्खो।") })}${netLine(lg)}
        ${look.html}<div class="emptycard"><span class="tile-ico">${I.slip}</span><div><b>${L.noTok}</b><p class="muted">${L3(lg, "अभी टोकन नहीं है? एक मिनट में बन जाएगा।", "No token yet? It takes about a minute.", "अजें टोकन नेईं? इक मिंट च बनी जाग।")}</p></div><a class="btn go" href="#register">${L.get}</a></div></section>`;
      wireHead(root, lg, render);
      look.wire(root);
    }
    function render() {
      if (mode === "assist") { if (assisted) return; if (!$("#regform", root)) form(); else hint2(); return; }
      const t = myToken();
      if (mode === "status") {
        if (t) return ticket(t);
        if (mineInfo()) { ls.del("baari-my-token"); }
        if (Pending.get()) return pendingView();
        if (!$(".lookup", root) || $(".pendcard", root)) noToken(); return;
      }
      if ($("#regform", root)) { hint2(); const nb = $(".netbar", root); if (nb) nb.outerHTML = netLine(lang()); } else form();
    }
    render(); return render;
  }

  /* ---------- I have my slip ---------- */
  function viewSlip(root) {
    let found = null, from = "GATE";
    function render() {
      const lg = getLang(), L = LL(lg), s = Store.state;
      const title = L3(lg, "मेरे पास पर्ची है", "I have my slip", "मेरे कोल पर्ची ऐ");
      const look = tokenLookup(lg, t => { found = t.id; render(); });
      const t = found ? s.tokens.find(x => x.id === found) : null;
      let res = "";
      if (t) {
        const d = DEPT[t.dept], dest = d.help ? "HLP" : t.dept, a = aheadOf(s, t), doc = docLine(s, t.dept, lg);
        const st = t.status === "waiting" ? `${L.ahead(a)} · ${L.wait(estMin(s, t))}` : t.status === "called" ? L.turn : t.status === "missed" ? L.missed : L.done;
        res = `<div class="card slipres" aria-live="polite"><p class="eyebrow">${L3(lg, "आपको यहाँ जाना है", "You need to go to", "तुसें इत्थै जाना ऐ")}</p>
          <div class="sr-row"><span class="sr-code">${t.code}</span><div><p class="sr-dest">${esc(placeName(dest, lg))}</p><p class="muted">${st}</p>${doc ? `<p class="doc ${doc.cls}"><i></i>${esc(doc.text)}</p>` : ""}</div></div>
          <div class="prow"><button type="button" class="btn go" id="sl-track">${L3(lg, "इस टोकन की बारी देखें", "Track this token", "इस टोकन दी बारी दिक्खो")}</button><button type="button" class="btn ghost" id="sl-listen">${SPK}<span>${L.listen}</span></button></div></div>
          <div class="card wayfind">${startSelect("sl-from", from, lg, dest)}<div id="slway">${wayfind(from, dest, lg)}</div><p class="small muted">${L.mapNote}</p></div>`;
      }
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lg, title, { sub: L3(lg, "पर्ची पर लिखा टोकन नंबर डालें। हम बताएँगे कि कहाँ जाना है और कैसे।", "Type the token number from your slip. We’ll show you where to go and how.", "पर्ची पर लिखे दा टोकन नंबर पाओ। अस दस्सगे जे कुत्थै ते कियां जाना ऐ।") })}
        <button type="button" class="btn soft scanbtn" id="sl-scan">${svg('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>')}<span>${L3(lg, "पर्ची का QR कोड स्कैन करें", "Scan the QR code on my slip", "पर्ची दा QR कोड स्कैन करो")}</span></button>
        ${look.html}${res}</section>`;
      wireHead(root, lg, render);
      look.wire(root);
      $("#sl-scan", root).onclick = () => openScanner(x => { found = x.id; render(); });
      if (t) {
        const dest = DEPT[t.dept].help ? "HLP" : t.dept;
        $("#f-code", root).value = t.code;
        $("#sl-from", root).onchange = e => { from = e.target.value; $("#slway", root).innerHTML = wayfind(from, dest, lg); };
        $("#sl-track", root).onclick = () => { trackToken(t); location.hash = "#status"; };
        wireListen($("#sl-listen", root), () => `${placeName(dest, lg)}. ${stepsText(from, dest, lg)}`, lg);
      }
    }
    render();
    return () => { if (found) { const x = $(".slipres .muted", root); const t = Store.state.tokens.find(y => y.id === found); if (x && t) { const lg = getLang(), L = LL(lg); x.textContent = t.status === "waiting" ? `${L.ahead(aheadOf(Store.state, t))} · ${L.wait(estMin(Store.state, t))}` : t.status === "called" ? L.turn : t.status === "missed" ? L.missed : L.done; } } };
  }

  /* ---------- Find a department or place ---------- */
  function viewFind(root) {
    let to = null, from = "GATE", q = "";
    const GROUPS = [["rooms", ["MED", "ORT", "PAE", "GYN", "EYE", "SKN"]], ["services", ["REG", "HLP", "HALL", "LAB", "PHA"]], ["emr", ["EMR"]]];
    const GN = { hi: { rooms: "डॉक्टर के कमरे", services: "काउंटर और सुविधाएँ", emr: "इमरजेंसी" }, en: { rooms: "Consultation rooms", services: "Counters and services", emr: "Emergency area" }, doi: { rooms: "डाक्टरें दे कमरे", services: "काउंटर ते सुविधां", emr: "एमरजेंसी" } };
    const searchText = k => { const dd = DEPT_DESC[k] || {}; return [placeName(k, "en"), placeName(k, "hi"), placeName(k, "doi"), dd.en, dd.hi, dd.doi, PLACES[k].en, PLACES[k].hi, PLACES[k].doi].join(" ").toLowerCase(); };
    function grid(lg) {
      const term = q.trim().toLowerCase();
      const parts = GROUPS.map(([g, keys]) => {
        const ks = keys.filter(k => !term || searchText(k).includes(term)); if (!ks.length) return "";
        return `<h2 class="grp">${GN[lg][g]}</h2><div class="destgrid">${ks.map(k => `<button type="button" class="dest ${k === to ? "on" : ""} ${k === "EMR" ? "emr" : ""}" data-to="${k}" aria-pressed="${k === to}"><span class="dc-ico">${DEPT[k] ? I.dept[k] : k === "EMR" ? I.sos : k === "HALL" ? I.clock : k === "REG" ? I.reg : I.pin}</span><span class="dest-t"><b>${esc(placeName(k, lg).split(" · ")[DEPT[k] && !DEPT[k].help ? 1 : 0])}</b><small>${esc(DEPT[k] && !DEPT[k].help ? droom(k, lg) : (DEPT_DESC[k] ? DEPT_DESC[k][lg] : ""))}</small>${DEPT[k] && !DEPT[k].help ? crowdBadge(Store.state, k, lg) : ""}</span></button>`).join("")}</div>`;
      }).join("");
      return parts || `<div class="emptycard"><span class="tile-ico">${I.pin}</span><div><b>${L3(lg, "कोई जगह नहीं मिली", "No place matches", "कोई जगह नेईं लब्भी")}</b><p class="muted">${L3(lg, "दूसरा शब्द लिखें, या हेल्प डेस्क पर पूछें।", "Try another word, or ask at the Help desk.", "कोई होर शब्द लिखो, जां हेल्प डेस्क पर पुच्छो।")}</p></div></div>`;
    }
    function render() {
      const lg = getLang(), L = LL(lg);
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lg, L3(lg, "विभाग ढूँढें", "Find a department", "बिभाग लब्भो"), { sub: L3(lg, "आपको कहाँ जाना है? खोजें या नीचे से चुनें।", "Where do you want to go? Search, or pick a place below.", "तुसें कुत्थै जाना ऐ? लब्भो जां थल्लै चुनो।") })}
        <div class="searchbox">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<label class="sr" for="fd-q">${L3(lg, "विभाग खोजें", "Search departments", "बिभाग लब्भो")}</label><input id="fd-q" type="search" value="${esc(q)}" placeholder="${L3(lg, "जैसे: आँख, बच्चे, दवा, कमरा 12", "For example: eye, children, pharmacy, Room 12", "जियां: अक्ख, बच्चे, दुआई, कमरा 12")}" autocomplete="off"></div>
        <div id="fd-grid">${grid(lg)}</div>
        ${to ? `<div class="card wayfind" id="fway"><h2>${esc(placeName(to, lg))}</h2>${startSelect("fd-from", from, lg, to)}<div id="fdway">${wayfind(from, to, lg)}</div>
          <div class="prow"><button type="button" class="btn soft" id="fd-listen">${SPK}<span>${L.listen}</span></button></div><p class="small muted">${L.mapNote}</p></div>` : ""}
      </section>`;
      wireHead(root, lg, render);
      const qi = $("#fd-q", root);
      qi.addEventListener("input", () => { q = qi.value; $("#fd-grid", root).innerHTML = grid(lg); });
      if (to) {
        $("#fd-from", root).onchange = e => { from = e.target.value; $("#fdway", root).innerHTML = wayfind(from, to, lg); };
        wireListen($("#fd-listen", root), () => `${placeName(to, lg)}. ${stepsText(from, to, lg)}`, lg);
      }
    }
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-to]"); if (!b) return;
      to = b.dataset.to; if (from === to) from = "GATE"; render();
      const w = $("#fway", root); if (w) w.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    });
    render(); return () => {};
  }

  /* ---------- Help desk ---------- */
  function viewHelp(root) {
    let from = "GATE";
    function render() {
      const lg = getLang(), L = LL(lg), q = waitingIn(Store.state, "HLP").length;
      const intro = L3(lg, "हेल्प डेस्क मुख्य गलियारे में है, वेटिंग हॉल के सामने। यहाँ स्टाफ़ फ़ॉर्म भरने, सही विभाग चुनने और पर्ची खोने पर मदद करता है।",
        "The Help desk is on the main hallway, opposite the waiting hall. Staff there help you fill the form, choose the right department, or replace a lost slip.",
        "हेल्प डेस्क मुक्ख गलियारे च ऐ, वेटिंग हॉल दे सामनै। इत्थै स्टाफ फार्म भरने, ठीक बिभाग चुनने ते पर्ची गुआचने पर मदद करदा ऐ।");
      root.innerHTML = `<section class="wrap narrow2 patient">${pHead(lg, L3(lg, "हेल्प डेस्क", "Help desk", "हेल्प डेस्क"), { listen: true })}
        <div class="card helpcard"><p>${intro}</p><p class="muted tnum">${L3(lg, `अभी ${q} लोग हेल्प डेस्क की कतार में हैं।`, `${q} ${q === 1 ? "person is" : "people are"} in the Help desk queue right now.`, `हुन हेल्प डेस्क दी कतार च ${q} लोक न।`)}</p>
          <div class="prow"><button type="button" class="btn go" id="hp-join">${I.reg}<span>${L3(lg, "हेल्प डेस्क की कतार में जुड़ें", "Join the Help desk queue", "हेल्प डेस्क दी कतार च जुड़ो")}</span></button><button type="button" class="btn danger" data-opensos>${I.sos}<span>${ST[lg].title}</span></button></div></div>
        <div class="card wayfind"><h2>${L3(lg, "हेल्प डेस्क तक कैसे जाएँ", "How to get to the Help desk", "हेल्प डेस्क तक कियां जाना")}</h2>${startSelect("hp-from", from, lg, "HLP")}<div id="hpway">${wayfind(from, "HLP", lg)}</div><p class="small muted">${L.mapNote}</p></div>
      </section>`;
      wireHead(root, lg, render, () => intro + " " + stepsText(from, "HLP", lg));
      $("#hp-join", root).onclick = () => { ls.set("baari-pre-dept", "HLP"); location.hash = "#register"; };
      root.querySelectorAll("[data-opensos]").forEach(b => b.onclick = openSOS);
      $("#hp-from", root).onchange = e => { from = e.target.value; $("#hpway", root).innerHTML = wayfind(from, "HLP", lg); };
    }
    render(); return () => {};
  }

  function saveSlipImage(t, info, lang, url) {
    const c = drawSlip(t, info, lang, url);
    c.toBlob(bl => { if (!bl) return; const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = `baari-${t.code}.png`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, "image/png");
  }

  /* =====================================================================
     v7 features: crowding, I'm lost, language picker, alerts, QR scanning,
     settings, slip details, demo and simulation controls
     ===================================================================== */
  const { crowdLevel, serviceStats } = window.BaariShared;

  /* ---------- A reusable accessible sheet (dialog) ---------- */
  function openSheet(id, html, opts = {}) {
    closeSheet(id);
    const back = document.activeElement;
    const wrap = document.createElement("div");
    wrap.id = id; wrap.className = "sheet-wrap " + (opts.cls || "");
    wrap.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="${id}-t" lang="${opts.lang || getLang()}">${html}</div>`;
    document.body.appendChild(wrap); document.body.classList.add("modal-open");
    const sheet = wrap.querySelector(".sheet");
    const close = () => closeSheet(id);
    wrap._back = back; wrap._onClose = opts.onClose;
    if (!opts.sticky) wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    wrap.addEventListener("click", e => { if (e.target.closest("[data-close]")) close(); });
    wrap.addEventListener("keydown", e => {
      if (e.key === "Escape" && !opts.sticky) close();
      if (e.key === "Tab") { const f = [...sheet.querySelectorAll("button,a[href],select,input,video")].filter(x => !x.disabled && x.offsetParent !== null && x.tagName !== "VIDEO"); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    setTimeout(() => { const f = sheet.querySelector(opts.focus || "[data-close],button"); f && f.focus(); }, 30);
    return sheet;
  }
  function closeSheet(id) {
    const el = document.getElementById(id); if (!el) return;
    try { el._onClose && el._onClose(); } catch (e) {}
    el.remove();
    if (!document.querySelector(".sheet-wrap")) document.body.classList.remove("modal-open");
    if (el._back && el._back.focus && document.body.contains(el._back)) el._back.focus();
  }
  function closeAllSheets() { ["lost", "langpick", "scanner", "confirm"].forEach(closeSheet); }

  /* ---------- Overcrowding ---------- */
  const CROWD_TXT = {
    low: { en: "Low", hi: "कम भीड़", doi: "घट्ट भीड़", long: { en: "Queue is manageable", hi: "कतार ठीक है", doi: "कतार ठीक ऐ" } },
    moderate: { en: "Moderate", hi: "मध्यम भीड़", doi: "मध्यम भीड़", long: { en: "Wait is growing", hi: "इंतज़ार बढ़ रहा है", doi: "इंतजार बधा करदा ऐ" } },
    high: { en: "High", hi: "ज़्यादा भीड़", doi: "मती भीड़", long: { en: "Very busy, expect a long wait", hi: "बहुत भीड़, लंबा इंतज़ार", doi: "बड़ी भीड़, लम्मा इंतजार" } },
    critical: { en: "Critical", hi: "बहुत ज़्यादा भीड़", doi: "बड़ी मती भीड़", long: { en: "Extremely crowded, long wait", hi: "बेहद भीड़, बहुत लंबा इंतज़ार", doi: "बेहद भीड़, बड़ा लम्मा इंतजार" } }
  };
  const CROWD_N = { low: 1, moderate: 2, high: 3, critical: 4 };
  /* Colour + text + number of bars, so it never relies on colour alone. */
  function crowdBadge(s, d, lg, opts = {}) {
    if (DEPT[d] && DEPT[d].help && !opts.help) return "";
    const c = crowdLevel(s, d), t = CROWD_TXT[c.level], n = CROWD_N[c.level];
    const label = t[lg] || t.en, long = t.long[lg] || t.long.en;
    const word = L3(lg, "भीड़", "Crowding", "भीड़");
    return `<span class="crowd c-${c.level} ${opts.big ? "big" : ""}" role="img" aria-label="${esc(word)}: ${esc(label)}. ${esc(long)}" title="${esc(long)}"><span class="cbars" aria-hidden="true">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span><span class="ctext">${opts.long ? esc(long) : esc(label)}</span></span>`;
  }

  /* ---------- Waiting time wording ---------- */
  function estNote(s, d, lg) {
    const st = serviceStats(s, d);
    if (st.source === "history") return L3(lg, `यह अनुमान है, पिछले ${st.n} मरीज़ों के समय से। यह तय समय नहीं है।`, `Estimate based on the last ${st.n} ${st.n === 1 ? "patient" : "patients"}. Not a fixed appointment time.`, `एह् अंदाज़ा ऐ, पिछले ${st.n} मरीज़ें दे समें थमां। एह् पक्का समां नेईं ऐ।`);
    return L3(lg, "यह अनुमान है, सामान्य समय से। यह तय समय नहीं है।", "Estimate based on a typical consultation time. Not a fixed appointment time.", "एह् अंदाज़ा ऐ, आम समें थमां। एह् पक्का समां नेईं ऐ।");
  }

  /* ---------- Doctor for a token ---------- */
  function doctorFor(s, t) {
    if (DEPT[t.dept].help) return { name: null, text: null };
    const name = (t.status !== "waiting" && t.doctor) || ((s.doctors || {})[t.dept] || {}).name || null;
    return { name, sample: Boolean(s.doctorsSample) };
  }
  function doctorText(s, t, lg) {
    if (DEPT[t.dept].help) return L3(lg, "हेल्प डेस्क स्टाफ़", "Help desk staff", "हेल्प डेस्क स्टाफ");
    const d = doctorFor(s, t);
    return d.name ? d.name : L3(lg, "डॉक्टर का नाम कमरे पर बताया जाएगा", "Doctor will be confirmed at the room", "डाक्टर दा नां कमरे पर दस्सेआ जाग");
  }
  /* Full slip details: shown on the token screen and printed */
  function slipDetails(t, lg) {
    const s = Store.state, d = t.dept, L = LL(lg), a = aheadOf(s, t);
    const SL = L3(lg, { hosp: "अस्पताल", tok: "टोकन", doc: "डॉक्टर", dept: "विभाग", issued: "जारी", wait: "अनुमानित इंतज़ार", status: "स्थिति", what: "क्या करें" },
      { hosp: "Hospital", tok: "Token", doc: "Doctor", dept: "Department", issued: "Issued", wait: "Estimated wait", status: "Status", what: "What to do" },
      { hosp: "अस्पताल", tok: "टोकन", doc: "डाक्टर", dept: "बिभाग", issued: "जारी", wait: "अंदाज़न इंतजार", status: "हालत", what: "के करना ऐ" });
    const issued = new Date(t.createdAt);
    const dateTxt = issued.toLocaleDateString(lg === "en" ? "en-IN" : "hi-IN", { day: "numeric", month: "short", year: "numeric" }) + " · " + clock(t.createdAt);
    const status = t.status === "waiting" ? L.ahead(a) : t.status === "called" ? L.turn : t.status === "missed" ? L.missed : L.done;
    const what = t.status === "waiting" ? L.sit : t.status === "called" ? L.goto(droom(d, lg)) : t.status === "missed" ? L.missedSub : L.doneSub;
    const wait = t.status === "waiting" ? `<b>${L.wait(estMin(s, t))}</b><br><span class="small muted">${estNote(s, d, lg)}</span>` : "—";
    const row = (k, v, cls) => `<div class="${cls || ""}"><dt>${k}</dt><dd>${v}</dd></div>`;
    return `<dl class="slipinfo">
      ${row(SL.hosp, esc(s.hospital))}
      ${row(SL.tok, `<b class="tnum">${t.code}</b>`)}
      ${row(SL.doc, `<span data-doctor>${esc(doctorText(s, t, lg))}</span>`, "sd-doc")}
      ${row(SL.dept, `${esc(dname(d, lg))} · ${esc(droom(d, lg))}`)}
      ${row(SL.issued, `<span class="tnum">${esc(dateTxt)}</span>`)}
      ${row(SL.wait, wait, "sd-wait")}
      ${row(SL.status, esc(status))}
      ${row(SL.what, esc(what), "sd-what")}
    </dl>`;
  }

  /* ---------- First-visit language picker ---------- */
  function langChosen() { return Boolean(ls.get("baari-lang")); }
  function maybeLangPicker() {
    if (langChosen() || document.getElementById("langpick")) return;
    const pv = PATIENT_VIEWS.includes(document.body.dataset.view);
    if (!pv) return;
    const sheet = openSheet("langpick", `
      <div class="sheet-head"><h2 id="langpick-t"><span lang="hi">अपनी भाषा चुनें</span> · <span lang="en">Choose your language</span> · <span lang="doi">अपनी भाषा चुनो</span></h2></div>
      <p class="muted" style="margin-bottom:14px"><span lang="hi">नमस्ते!</span> · <span lang="en">Welcome!</span> · <span lang="doi">जी आयां गी!</span></p>
      <div class="langbig">
        <button type="button" data-pick-lang="hi" lang="hi"><b>हिन्दी</b><span>Hindi</span></button>
        <button type="button" data-pick-lang="en" lang="en"><b>English</b><span>अंग्रेज़ी</span></button>
        <button type="button" data-pick-lang="doi" lang="doi"><b>डोगरी</b><span>Dogri</span></button>
      </div>
      <p class="small muted" style="margin-top:14px"><span lang="hi">भाषा कभी भी ऊपर से बदल सकते हैं।</span> <span lang="en">You can change it any time at the top.</span> <span lang="doi">भाषा कदें बी उप्पर थमां बदली सकदे ओ।</span></p>`, { sticky: true, cls: "langsheet", focus: "[data-pick-lang]" });
    sheet.addEventListener("click", e => {
      const b = e.target.closest("[data-pick-lang]"); if (!b) return;
      setLang(b.dataset.pickLang); closeSheet("langpick"); applyNav(); navigate();
    });
  }

  /* ---------- I'm lost ---------- */
  const LOST = {
    hi: { btn: "मैं रास्ता भूल गया", title: "रास्ता भूल गए? कोई बात नहीं।", lead: "नीचे आसान कदम हैं। यहाँ कुछ भी दबाने से आपका टोकन नहीं बदलेगा।", mine: "आपका टोकन", way: r => `${r} तक का रास्ता दिखाएँ`, open: "मेरा टोकन खोलें",
      s: [["टोकन कैसे लें", "“OPD के लिए रजिस्टर करें” दबाएँ। नाम लिखें, तकलीफ़ बताएँ, विभाग चुनें। स्क्रीन पर आपका टोकन नंबर आ जाएगा।"],
        ["टोकन नंबर का मतलब", "अक्षर आपका विभाग है (M = मेडिसिन)। नंबर आपकी जगह है। जब यह हॉल की स्क्रीन या आपके फ़ोन पर आए, तब कमरे में जाएँ।"],
        ["कितना इंतज़ार", "“अपना टोकन देखें” खोलें। वहाँ लिखा है कि आपसे पहले कितने लोग हैं और लगभग कितना समय लगेगा।"],
        ["डॉक्टर कहाँ मिलेंगे", "डॉक्टर का नाम और कमरा नंबर आपकी पर्ची पर है। कमरे का नंबर दरवाज़े के ऊपर लिखा होता है।"]],
      find: "विभाग ढूँढें", home: "शुरुआती स्क्रीन पर जाएँ", helpT: "किसी से पूछना है?", helpS: "हेल्प डेस्क वेटिंग हॉल के सामने है। स्टाफ़ आपकी मदद करेगा।", helpWay: "हेल्प डेस्क का रास्ता", call: n => `हेल्प डेस्क को फ़ोन करें: ${n}`, close: "बंद करें" },
    en: { btn: "I’m lost", title: "Lost? That’s okay.", lead: "Here are the simple steps. Nothing here changes or cancels your token.", mine: "Your token", way: r => `Show me the way to ${r}`, open: "Open my token",
      s: [["How to get a token", "Press “Register for an OPD visit”. Type your name, say your problem, pick a department. Your token number appears on the screen."],
        ["What your token number means", "The letter is your department (M is Medicine). The number is your place. When it shows on the hall screen or your phone, go to the room."],
        ["How long you will wait", "Open “Track my token”. It shows how many people are before you and the approximate wait."],
        ["Where your doctor is", "The doctor’s name and room number are on your slip. Room numbers are written above each door."]],
      find: "Find a department", home: "Go to the start screen", helpT: "Want to ask someone?", helpS: "The Help desk is opposite the waiting hall. Staff there will help you.", helpWay: "Way to the Help desk", call: n => `Call the Help desk: ${n}`, close: "Close" },
    doi: { btn: "मैं रस्ता भुल्ली गेआ", title: "रस्ता भुल्ली गे? कोई गल्ल नेईं।", lead: "थल्लै सौखे कदम न। इत्थै किश बी दबाने कन्नै तुंदा टोकन नेईं बदलग।", mine: "तुंदा टोकन", way: r => `${r}: रस्ता दस्सो`, open: "मेरा टोकन खोलो",
      s: [["टोकन कियां लैना", "“OPD आस्तै रजिस्टर करो” दबाओ। नां लिखो, तकलीफ दस्सो, बिभाग चुनो। स्क्रीन पर तुंदा टोकन नंबर आई जाग।"],
        ["टोकन नंबर दा मतलब", "अक्खर तुंदा बिभाग ऐ (M = मेडिसिन)। नंबर तुंदी जगह ऐ। जिसलै एह् हॉल दी स्क्रीन जां तुंदे फोन पर आवै, उसलै कमरे च जाओ।"],
        ["किन्ना इंतजार", "“अपना टोकन दिक्खो” खोलो। उत्थै लिखे दा ऐ जे तुंदे शा पैह्लें किन्ने लोक न ते लगभग किन्ना समां लग्गग।"],
        ["डाक्टर कुत्थै मिलङन", "डाक्टर दा नां ते कमरा नंबर तुंदी पर्ची पर ऐ। कमरे दा नंबर दरोआजे उप्पर लिखे दा होंदा ऐ।"]],
      find: "बिभाग लब्भो", home: "शुरू आह्ली स्क्रीन पर जाओ", helpT: "कुसै थमां पुच्छना ऐ?", helpS: "हेल्प डेस्क वेटिंग हॉल दे सामनै ऐ। उत्थै स्टाफ तुंदी मदद करग।", helpWay: "हेल्प डेस्क दा रस्ता", call: n => `हेल्प डेस्क गी फोन करो: ${n}`, close: "बंद करो" }
  };
  function openLost() {
    const lg = getLang(), L = LOST[lg], s = Store.state, t = myToken();
    const dest = t ? (DEPT[t.dept].help ? "HLP" : t.dept) : null;
    const mine = t ? `<div class="lost-mine"><p class="eyebrow">${L.mine}</p><p class="lm-code tnum">${t.code}</p>
        <p>${esc(dname(t.dept, lg))} · ${esc(droom(t.dept, lg))} · ${esc(doctorText(s, t, lg))}</p>
        ${t.status === "waiting" ? `<p class="muted">${esc(T[lg].ahead(aheadOf(s, t)))} · ${esc(T[lg].wait(estMin(s, t)))}</p>` : ""}
        <div class="prow"><button type="button" class="btn go small" id="lost-way">${esc(L.way(droom(t.dept, lg)))}</button><a class="btn soft small" href="#track" data-close>${L.open}</a></div>
        <div id="lost-map" hidden></div></div>` : "";
    const sheet = openSheet("lost", `
      <div class="sheet-head"><h2 id="lost-t">${I.help}${L.title}</h2><button type="button" class="tbtn" data-close aria-label="${L.close}">${I.x}</button></div>
      <p class="sos-lead" style="background:var(--surface-2);color:var(--ink)">${L.lead}</p>
      ${mine}
      <ol class="lost-steps">${L.s.map(([h, p]) => `<li><b>${h}</b><p>${p}</p></li>`).join("")}</ol>
      <div class="prow"><a class="btn soft" href="#find" data-close>${I.pin}<span>${L.find}</span></a><a class="btn ghost" href="#patient" data-close>${svg('<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>')}<span>${L.home}</span></a></div>
      <div class="lost-help"><p><b>${L.helpT}</b></p><p class="muted">${L.helpS}</p>
        <div class="prow"><button type="button" class="btn soft small" id="lost-help">${L.helpWay}</button>${s.helpPhone ? `<a class="btn ghost small" href="tel:${esc(s.helpPhone.replace(/[^0-9+]/g, ""))}">${I.phone}<span>${esc(L.call(s.helpPhone))}</span></a>` : ""}</div>
        <div id="lost-hmap" hidden></div></div>`, { cls: "lostsheet" });
    const toggle = (btnSel, boxSel, to) => { const b = sheet.querySelector(btnSel), m = sheet.querySelector(boxSel); if (!b) return; b.onclick = () => { m.hidden = !m.hidden; if (!m.hidden && !m.innerHTML) m.innerHTML = startSelect(boxSel.slice(1) + "-from", "HALL", lg, to) + `<div class="lw">${wayfind("HALL", to, lg)}</div>`; const sel = m.querySelector("select"); if (sel) sel.onchange = () => { m.querySelector(".lw").innerHTML = wayfind(sel.value, to, lg); }; }; };
    if (dest) toggle("#lost-way", "#lost-map", dest);
    toggle("#lost-help", "#lost-hmap", "HLP");
  }

  /* ---------- Browser alerts for my token ---------- */
  const NT = {
    hi: { title: "बारी पास आने पर फ़ोन पर सूचना पाएँ", body: "जब आपसे पहले 3 लोग बचें और जब आपको बुलाया जाए, तब फ़ोन सूचना दिखा सकता है, भले आप दूसरा ऐप खोलें। यह पेज पीछे खुला रहने दें। सूचना में सिर्फ़ टोकन नंबर होगा, आपका नाम नहीं।", btn: "सूचना चालू करें", on: "इस टोकन के लिए सूचना चालू है।", off: "सूचना बंद करें", turnedOff: "सूचना बंद है।", denied: "इस ब्राउज़र में सूचना बंद की गई है। आप यह स्क्रीन और हॉल डिस्प्ले देखते रहें।", unsupported: "यह ब्राउज़र सूचना नहीं दिखा सकता। यह स्क्रीन खुली रखें, या हॉल में अपना नंबर सुनें।",
      created: c => `टोकन ${c} बन गया। बारी पास आने पर सूचना देंगे।`, near: (c, a) => `टोकन ${c}: आपकी बारी पास है। ${a === 0 ? "अगला नंबर आपका है।" : `आपसे पहले ${a} लोग।`}`, called: (c, r) => `टोकन ${c}: अब आपकी बारी है। ${r} में जाएँ।`, change: (c, m) => `टोकन ${c}: अब लगभग ${m} मिनट इंतज़ार।` },
    en: { title: "Get an alert when your turn is close", body: "Your phone can show an alert when 3 people are ahead and when you are called, even if you open another app. Keep this page open in the background. Alerts show only your token number, never your name.", btn: "Turn on alerts", on: "Alerts are on for this token.", off: "Turn off alerts", turnedOff: "Alerts are off.", denied: "Alerts are blocked in this browser. Keep watching this screen and the hall display.", unsupported: "This browser can’t show alerts. Keep this screen open, or listen for your number in the hall.",
      created: c => `Token ${c} created. We’ll alert you when your turn is close.`, near: (c, a) => `Token ${c}: your turn is close. ${a === 0 ? "You’re next." : `${a} ahead of you.`}`, called: (c, r) => `Token ${c}: it’s your turn. Go to ${r}.`, change: (c, m) => `Token ${c}: the wait is now about ${m} minutes.` },
    doi: { title: "बारी कोल औने पर फोन पर सूचना लैओ", body: "जिसलै तुंदे शा पैह्लें 3 लोक बचन ते जिसलै तुसेंगी बुलाया जा, उसलै फोन सूचना दस्सी सकदा ऐ, भलें तुस कोई होर ऐप खोलो। एह् पन्ना पिच्छें खुल्ला रौह्न देओ। सूचना च सिर्फ टोकन नंबर होग, तुंदा नां नेईं।", btn: "सूचना चालू करो", on: "इस टोकन आस्तै सूचना चालू ऐ।", off: "सूचना बंद करो", turnedOff: "सूचना बंद ऐ।", denied: "इस ब्राउज़र च सूचना बंद कीती गेदी ऐ। एह् स्क्रीन ते हॉल डिस्प्ले दिक्खदे रौह्ओ।", unsupported: "एह् ब्राउज़र सूचना नेईं दस्सी सकदा। एह् स्क्रीन खुल्ली रक्खो, जां हॉल च अपना नंबर सुनो।",
      created: c => `टोकन ${c} बनी गेआ। बारी कोल औने पर सूचना देगे।`, near: (c, a) => `टोकन ${c}: तुंदी बारी कोल ऐ। ${a === 0 ? "अगला नंबर तुंदा ऐ।" : `तुंदे शा पैह्लें ${a} लोक।`}`, called: (c, r) => `टोकन ${c}: हुन तुंदी बारी ऐ। इत्थै जाओ: ${r}.`, change: (c, m) => `टोकन ${c}: हुन लगभग ${m} मिंट इंतजार।` }
  };
  const Notif = {
    supported() { return "Notification" in window && window.isSecureContext !== false; },
    permission() { return this.supported() ? Notification.permission : "unsupported"; },
    wanted() { return ls.get("baari-notif") === "on"; },
    active() { return this.wanted() && this.permission() === "granted"; },
    async enable() {
      if (!this.supported()) return "unsupported";
      let p = Notification.permission;
      if (p === "default") { try { p = await Notification.requestPermission(); } catch (e) { p = Notification.permission; } }
      ls.set("baari-notif-asked", "1");
      if (p === "granted") { ls.set("baari-notif", "on"); ls.del("baari-notif-declined"); } else { ls.set("baari-notif", "off"); ls.set("baari-notif-declined", "1"); }
      return p;
    },
    disable() { ls.set("baari-notif", "off"); },
    /* Only the token number and where to go. Never a name or complaint. */
    async show(text, tag) {
      if (!this.active()) return false;
      const sentKey = "baari-nt-" + tag; if (ls.get(sentKey)) return false; ls.set(sentKey, "1");
      const opts = { body: text, tag, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", lang: getLang(), renotify: false };
      try {
        const reg = navigator.serviceWorker && await Promise.race([navigator.serviceWorker.ready, new Promise(r => setTimeout(() => r(null), 800))]);
        if (reg && reg.showNotification) { await reg.showNotification("QueueSetu", opts); return true; }
        new Notification("QueueSetu", opts); return true;
      } catch (e) { try { new Notification("QueueSetu", opts); return true; } catch (x) { return false; } }
    }
  };
  function notifCard(t, lg) {
    const L = NT[lg], p = Notif.permission();
    if (t.status !== "waiting") return "";
    if (p === "unsupported") return `<div class="ncard muted-card" role="note">${I.clock}<p class="small">${L.unsupported}</p></div>`;
    if (p === "denied" || (p !== "granted" && ls.get("baari-notif-declined"))) return `<div class="ncard muted-card" role="note">${I.clock}<p class="small">${L.denied} <a href="#settings">${SET[lg].title}</a></p></div>`;
    if (Notif.active()) return `<div class="ncard on" role="status">${I.check}<p class="small">${L.on}</p><button type="button" class="linkbtn" data-notif="off">${L.off}</button></div>`;
    return `<div class="ncard"><div><p><b>${L.title}</b></p><p class="small muted">${L.body}</p></div><button type="button" class="btn soft small" data-notif="on">${svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>')}<span>${L.btn}</span></button></div>`;
  }
  /* Called on every update of my token screen */
  function notifyFor(t, lg, prevStatus) {
    if (!t) return;
    const just = ls.get("baari-just-notify") === t.id;
    if (just) ls.del("baari-just-notify");
    if (!Notif.active()) return;
    const s = Store.state, L = NT[lg], a = aheadOf(s, t), room = droom(t.dept, lg);
    if (just) Notif.show(L.created(t.code), t.id + "-created");
    if (t.status === "waiting" && a >= 0 && a <= 3) Notif.show(L.near(t.code, a), t.id + "-near");
    if (t.status === "called") Notif.show(L.called(t.code, room), t.id + "-called-" + (t.calledAt || 0));
    if (t.status === "waiting") { // a big change in the estimate: at most once every 10 minutes
      const m = estMin(s, t), k = "baari-nt-last-" + t.id;
      let last = null; try { last = JSON.parse(ls.get(k) || "null"); } catch (e) {}
      if (!last) ls.set(k, JSON.stringify({ m, at: Date.now() }));
      else if (Math.abs(m - last.m) >= 15 && Date.now() - last.at > 10 * 60000) { ls.set(k, JSON.stringify({ m, at: Date.now() })); Notif.show(L.change(t.code, m), t.id + "-change-" + Math.floor(Date.now() / 600000)); }
    }
  }

  /* ---------- QR scanning (camera, photo, or typed) ---------- */
  const SC = {
    hi: { title: "पर्ची का QR कोड स्कैन करें", tip: "पर्ची को सीधा पकड़ें, कैमरे से लगभग एक हाथ दूर।", start: "कैमरा चालू करें", stop: "कैमरा बंद करें", photo: "फ़ोटो से स्कैन करें", manual: "या टोकन नंबर लिखें", find: "खोजें", denied: "कैमरे की अनुमति नहीं मिली। ब्राउज़र सेटिंग में कैमरा चालू करें, या टोकन नंबर लिखें।", nocam: "इस डिवाइस में कैमरा नहीं मिला। टोकन नंबर लिखें।", insecure: "कैमरे के लिए सुरक्षित (https) कनेक्शन चाहिए। टोकन नंबर लिखें।", bad: "यह QueueSetu पर्ची का QR कोड नहीं है।", notfound: "यह पर्ची आज की सूची में नहीं है।", generic: "कैमरा चालू नहीं हो पाया। टोकन नंबर लिखें।", looking: "QR कोड ढूँढ रहे हैं…", nophoto: "फ़ोटो में QR कोड नहीं मिला। साफ़ फ़ोटो लें।", checking: "पर्ची जाँच रहे हैं…", close: "बंद करें" },
    en: { title: "Scan the QR code on the slip", tip: "Hold the slip flat, about a hand away from the camera.", start: "Start camera", stop: "Stop camera", photo: "Scan from a photo", manual: "Or type the token number", find: "Find", denied: "Camera permission was blocked. Allow the camera in your browser settings, or type the token number.", nocam: "No camera found on this device. Type the token number instead.", insecure: "The camera needs a secure (https) connection. Type the token number instead.", bad: "This QR code isn’t a QueueSetu slip.", notfound: "This slip isn’t in today’s list.", generic: "The camera couldn’t start. Type the token number instead.", looking: "Looking for a QR code…", nophoto: "No QR code found in that photo. Try a clearer one.", checking: "Checking the slip…", close: "Close" },
    doi: { title: "पर्ची दा QR कोड स्कैन करो", tip: "पर्ची सिद्धी पकड़ो, कैमरे थमां लगभग इक हत्थ दूर।", start: "कैमरा चालू करो", stop: "कैमरा बंद करो", photo: "फोटो थमां स्कैन करो", manual: "जां टोकन नंबर लिखो", find: "लब्भो", denied: "कैमरे दी इजाजत नेईं मिली। ब्राउज़र सेटिंग च कैमरा चालू करो, जां टोकन नंबर लिखो।", nocam: "इस डिवाइस च कैमरा नेईं लब्भा। टोकन नंबर लिखो।", insecure: "कैमरे आस्तै सुरक्खत (https) कनेक्शन चाहिदा ऐ। टोकन नंबर लिखो।", bad: "एह् QueueSetu पर्ची दा QR कोड नेईं ऐ।", notfound: "एह् पर्ची अज्जै दी लिस्ट च नेईं ऐ।", generic: "कैमरा चालू नेईं होई सकेआ। टोकन नंबर लिखो।", looking: "QR कोड लब्भा करदे आं…", nophoto: "फोटो च QR कोड नेईं लब्भा। साफ फोटो लैओ।", checking: "पर्ची जांचा करदे आं…", close: "बंद करो" }
  };
  /* What a slip QR may contain: our verify link (#verify-<16 hex>) or a token code like M-27. */
  function parseScan(text) {
    const v = String(text || "").trim();
    const m = /#verify-([a-f0-9]{16})$/i.exec(v) || /^([a-f0-9]{16})$/i.exec(v);
    if (m) return { id: m[1].toLowerCase() };
    const c = normCode(v); if (c) return { code: c };
    return null;
  }
  let jsqrLoading = null;
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    return jsqrLoading = jsqrLoading || new Promise((ok, bad) => { const sc = document.createElement("script"); sc.src = "/vendor/jsqr.js"; sc.onload = () => ok(window.jsQR); sc.onerror = () => { jsqrLoading = null; bad(new Error("QR reader could not load")); }; document.head.appendChild(sc); });
  }
  async function decodeFrom(source, w, h) {
    if ("BarcodeDetector" in window) {
      try { const det = new window.BarcodeDetector({ formats: ["qr_code"] }); const r = await det.detect(source); if (r && r[0]) return r[0].rawValue; } catch (e) {}
    }
    const jsQR = await loadJsQR();
    const c = document.createElement("canvas"), scale = Math.min(1, 800 / Math.max(w, h)); c.width = Math.round(w * scale); c.height = Math.round(h * scale);
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(source, 0, 0, c.width, c.height);
    const img = x.getImageData(0, 0, c.width, c.height), r = jsQR(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
    return r ? r.data : null;
  }
  /* Checks the scanned slip with the server before showing anything. */
  async function verifyScan(p) {
    if (p.id) {
      const headers = Store.staff ? { "x-staff-pin": ls.get("baari-pin") || "" } : {};
      const r = await fetch("/api/verify/" + p.id, { headers });
      if (r.status === 404) return { error: "notfound" };
      if (!r.ok) throw new Error("verify " + r.status);
      return (await r.json()).token;
    }
    const t = findByCode(p.code);
    return t ? { id: t.id, code: t.code, dept: t.dept, status: t.status } : { error: "notfound" };
  }
  function openScanner(onFound) {
    const lg = getLang(), L = SC[lg];
    let stream = null, timer = null, busy = false;
    const stop = () => { clearInterval(timer); timer = null; if (stream) stream.getTracks().forEach(tr => tr.stop()); stream = null; const v = sheet.querySelector("video"); if (v) v.srcObject = null; const b = sheet.querySelector("#sc-start"); if (b) { b.hidden = false; } const sb = sheet.querySelector("#sc-stop"); if (sb) sb.hidden = true; sheet.querySelector(".sc-view").classList.remove("live"); };
    const sheet = openSheet("scanner", `
      <div class="sheet-head"><h2 id="scanner-t">${svg('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>')}${L.title}</h2><button type="button" class="tbtn" data-close aria-label="${L.close}">${I.x}</button></div>
      <p class="muted">${L.tip}</p>
      <div class="sc-view"><video playsinline muted aria-label="${L.title}"></video><span class="sc-frame" aria-hidden="true"></span></div>
      <p class="sc-msg" role="status" aria-live="polite"></p>
      <div class="prow"><button type="button" class="btn go" id="sc-start">${L.start}</button><button type="button" class="btn ghost" id="sc-stop" hidden>${L.stop}</button>
        <label class="btn soft" for="sc-file">${I.slip}<span>${L.photo}</span></label><input type="file" id="sc-file" accept="image/*" capture="environment" class="sr"></div>
      <form class="form sc-manual" novalidate><label for="sc-code">${L.manual}</label><div class="inrow"><input id="sc-code" autocomplete="off" autocapitalize="characters" maxlength="8" placeholder="M-27"><button class="btn primary" type="submit">${L.find}</button></div></form>`, { onClose: () => stop(), cls: "scansheet" });
    const msg = (t, bad) => { const m = sheet.querySelector(".sc-msg"); m.textContent = t || ""; m.classList.toggle("bad", Boolean(bad)); };
    async function handle(text) {
      const p = parseScan(text);
      if (!p) { msg(L.bad, true); return false; }
      msg(L.checking);
      try {
        const t = await verifyScan(p);
        if (t.error) { msg(L.notfound, true); return false; }
        stop(); closeSheet("scanner"); onFound(t); return true;
      } catch (e) { msg(L.generic, true); return false; }
    }
    sheet.querySelector("#sc-start").onclick = async () => {
      msg("");
      if (!window.isSecureContext) return msg(L.insecure, true);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return msg(L.nocam, true);
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false }); }
      catch (e) { return msg(e && (e.name === "NotAllowedError" || e.name === "SecurityError") ? L.denied : e && (e.name === "NotFoundError" || e.name === "OverconstrainedError") ? L.nocam : L.generic, true); }
      if (!document.getElementById("scanner")) { stream.getTracks().forEach(tr => tr.stop()); return; }
      const v = sheet.querySelector("video"); v.srcObject = stream; try { await v.play(); } catch (e) {}
      sheet.querySelector(".sc-view").classList.add("live"); sheet.querySelector("#sc-start").hidden = true; sheet.querySelector("#sc-stop").hidden = false; msg(L.looking);
      timer = setInterval(async () => {
        if (busy || !v.videoWidth) return; busy = true;
        try { const text = await decodeFrom(v, v.videoWidth, v.videoHeight); if (text) await handle(text); } catch (e) { /* keep looking */ }
        busy = false;
      }, 350);
    };
    sheet.querySelector("#sc-stop").onclick = () => { stop(); msg(""); };
    sheet.querySelector("#sc-file").onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      msg(L.looking);
      try {
        const img = await new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = bad; im.src = URL.createObjectURL(f); });
        const text = await decodeFrom(img, img.naturalWidth, img.naturalHeight);
        URL.revokeObjectURL(img.src);
        if (!text) return msg(L.nophoto, true);
        await handle(text);
      } catch (x) { msg(L.nophoto, true); }
      e.target.value = "";
    };
    sheet.querySelector(".sc-manual").onsubmit = async e => {
      e.preventDefault();
      const c = normCode(sheet.querySelector("#sc-code").value);
      if (!c) return msg(LL(lg).badCode, true);
      await handle(c);
    };
  }

  /* ---------- Display settings: high contrast and three text sizes ---------- */
  const textSize = () => { const v = ls.get("baari-ts"); if (["s", "m", "l"].includes(v)) return v; return ls.get("baari-big") === "1" ? "l" : "m"; };
  const highContrast = () => ls.get("baari-hc") === "1";
  function applyDisplay() {
    const h = document.documentElement, ts = textSize();
    ["ts-s", "ts-m", "ts-l"].forEach(c => h.classList.toggle(c, c === "ts-" + ts));
    h.classList.toggle("hc", highContrast());
    const mt = document.querySelector('meta[name="theme-color"]'); if (mt) mt.content = highContrast() ? "#000000" : "#0B5D44";
    document.querySelectorAll("[data-big]").forEach(b => { b.classList.toggle("on", ts === "l"); b.setAttribute("aria-pressed", ts === "l"); });
  }
  function setTextSize(v) { ls.set("baari-ts", v); ls.set("baari-big", v === "l" ? "1" : "0"); applyDisplay(); }
  const SET = {
    hi: { title: "सेटिंग", sub: "इस फ़ोन पर QueueSetu को पढ़ना और इस्तेमाल करना आसान बनाएँ। ये सेटिंग इसी फ़ोन में सेव रहती हैं।", hc: "हाई कॉन्ट्रास्ट", hcS: "सफ़ेद पर काला, मोटी किनारियाँ। कम रोशनी या कमज़ोर नज़र के लिए।", size: "अक्षरों का आकार", sizes: { s: "छोटा", m: "मध्यम", l: "बड़ा" }, sample: "नमूना: आपका टोकन M-27 है।", lang: "भाषा", notif: "मेरे टोकन की सूचना", notifS: "बारी पास आने पर और बुलाए जाने पर फ़ोन पर सूचना। सिर्फ़ टोकन नंबर दिखता है।", on: "चालू", off: "बंद", reset: "सब पहले जैसा करें", saved: "सेव हो गया", resetDone: "सेटिंग पहले जैसी हो गईं", push: "सूचना तब आती है जब यह पेज खुला हो या पीछे चल रहा हो। ब्राउज़र पूरी तरह बंद होने पर नहीं।" },
    en: { title: "Settings", sub: "Make QueueSetu easier to read and use on this phone. These settings are saved on this phone only.", hc: "High contrast", hcS: "Black on white with thick borders. For bright sunlight or low vision.", size: "Text size", sizes: { s: "Small", m: "Medium", l: "Large" }, sample: "Sample: your token is M-27.", lang: "Language", notif: "Alerts for my token", notifS: "An alert when your turn is close and when you are called. Shows only the token number.", on: "On", off: "Off", reset: "Reset to default", saved: "Saved", resetDone: "Settings reset", push: "Alerts work while this page is open or in the background. Not when the browser is fully closed." },
    doi: { title: "सेटिंग", sub: "इस फोन पर QueueSetu गी पढ़ना ते बरतना सौखा बनाओ। एह् सेटिंग इसै फोन च सेव रौंह्दियां न।", hc: "हाई कॉन्ट्रास्ट", hcS: "चिट्टे पर काला, मोटे किनारे। तेज धुप्प जां कमजोर नज़र आस्तै।", size: "अक्खरें दा आकार", sizes: { s: "निक्का", m: "मध्यम", l: "बड्डा" }, sample: "नमूना: तुंदा टोकन M-27 ऐ।", lang: "भाषा", notif: "मेरे टोकन दी सूचना", notifS: "बारी कोल औने पर ते बुलाए जाने पर फोन पर सूचना। सिर्फ टोकन नंबर लभदा ऐ।", on: "चालू", off: "रोको", reset: "सब पैह्लें आंगर करो", saved: "सेव होई गेआ", resetDone: "सेटिंग पैह्लें आंगर होई गेइयां", push: "सूचना उसलै औंदी ऐ जिसलै एह् पन्ना खुल्ला होऐ जां पिच्छें चला करदा होऐ। ब्राउज़र पूरी चाल्ली बंद होने पर नेईं।" }
  };
  function viewSettings(root) {
    function render() {
      const lg = getLang(), L = SET[lg], ts = textSize(), hc = highContrast(), np = Notif.permission(), nOn = Notif.active();
      const nState = np === "unsupported" ? NT[lg].unsupported : np === "denied" ? NT[lg].denied : "";
      root.innerHTML = `<section class="wrap narrow2 patient settings">${pHead(lg, L.title, { sub: L.sub })}
        <div class="card setcard">
          <div class="setrow"><div><h2 id="hc-l">${L.hc}</h2><p class="small muted">${L.hcS}</p></div>
            <button type="button" class="switch" role="switch" aria-checked="${hc}" aria-labelledby="hc-l" id="set-hc"><span></span></button></div>
          <fieldset class="setrow col"><legend><h2>${L.size}</h2></legend>
            <div class="seg" role="radiogroup" aria-label="${L.size}">${["s", "m", "l"].map(v => `<label class="seg-o ${ts === v ? "on" : ""} sz-${v}"><input type="radio" name="ts" value="${v}" ${ts === v ? "checked" : ""}><span>${L.sizes[v]}</span></label>`).join("")}</div>
            <p class="ts-sample" aria-hidden="true">${L.sample}</p></fieldset>
          <div class="setrow"><div><h2 id="ns-l">${WF[lg].avoid}</h2><p class="small muted">${L3(lg, "रास्ता सीढ़ियों की जगह लिफ़्ट से दिखाएँ। व्हीलचेयर, वॉकर या जिन्हें सीढ़ियाँ चढ़ने में दिक्कत हो, उनके लिए।", "Directions use lifts instead of stairs. For wheelchairs, walkers, prams, and anyone who finds stairs hard.", "रस्ता पौड़ियें दी थाह्र लिफ्ट कन्नै दस्सो। व्हीलचेयर, वॉकर जां जिंदे लेई पौड़ियां चढ़ना औखा ऐ, उंदे आस्तै।")}</p></div>
            <button type="button" class="switch" role="switch" aria-checked="${noStairs()}" aria-labelledby="ns-l" id="set-ns"><span></span></button></div>
          <fieldset class="setrow col"><legend><h2>${L.lang}</h2></legend>
            <div class="seg" role="radiogroup" aria-label="${L.lang}">${[["hi", "हिन्दी"], ["en", "English"], ["doi", "डोगरी"]].map(([v, n]) => `<label class="seg-o ${lg === v ? "on" : ""}" lang="${v}"><input type="radio" name="lg" value="${v}" ${lg === v ? "checked" : ""}><span>${n}</span></label>`).join("")}</div></fieldset>
          <div class="setrow"><div><h2 id="nt-l">${L.notif}</h2><p class="small muted">${L.notifS}</p>${nState ? `<p class="small warnline">${nState}</p>` : `<p class="small muted">${L.push}</p>`}</div>
            <button type="button" class="switch" role="switch" aria-checked="${nOn}" aria-labelledby="nt-l" id="set-nt" ${np === "unsupported" || np === "denied" ? "disabled" : ""}><span></span></button></div>
          <div class="setrow"><button type="button" class="btn ghost" id="set-reset">${L.reset}</button><span class="small muted" id="set-msg" role="status" aria-live="polite"></span></div>
        </div>
        <div class="installrow">${installBtn(lg)}</div></section>`;
      wireHead(root, lg, render);
      const said = t => { const m = $("#set-msg", root); if (m) m.textContent = t; };
      $("#set-hc", root).onclick = () => { ls.set("baari-hc", highContrast() ? "0" : "1"); applyDisplay(); render(); said(SET[getLang()].saved); $("#set-hc", root).focus(); };
      root.querySelectorAll('input[name="ts"]').forEach(r => r.onchange = () => { setTextSize(r.value); render(); said(SET[getLang()].saved); const x = root.querySelector(`input[name="ts"][value="${r.value}"]`); x && x.focus(); });
      root.querySelectorAll('input[name="lg"]').forEach(r => r.onchange = () => { setLang(r.value); applyNav(); render(); const x = root.querySelector(`input[name="lg"][value="${r.value}"]`); x && x.focus(); });
      $("#set-ns", root).onclick = () => { setNoStairs(!noStairs()); render(); said(SET[getLang()].saved); $("#set-ns", root).focus(); };
      $("#set-nt", root).onclick = async () => { if (Notif.active()) Notif.disable(); else await Notif.enable(); render(); $("#set-nt", root).focus(); };
      $("#set-reset", root).onclick = () => { ["baari-ts", "baari-big", "baari-hc", "baari-nostairs"].forEach(k => ls.del(k)); applyDisplay(); render(); said(SET[getLang()].resetDone); };
    }
    render(); return () => {};
  }

  /* ---------- Simulation status and demo controls (admins, demo mode) ---------- */
  function simBanner(s) {
    const m = s.sim || {};
    if (!m.running) return "";
    return `<div class="simbar ${m.paused ? "paused" : ""}" role="status"><b>${m.paused ? "Simulation paused" : `Simulation running · ${m.speed}× speed`}</b><span>Simulated clock ${new Date(m.simNow).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · demo patients only · ${m.served || 0} served, ${m.arrived || 0} arrived</span></div>`;
  }
  function demoPanel(s) {
    if (!s.demoMode) return `<div class="card demo-off"><h2>Demo controls</h2><p class="muted small">Turned off on this server (DEMO_MODE=false).</p></div>`;
    const demo = s.tokens.filter(t => t.sample), m = s.sim || {};
    return `<div class="card a-wide demopanel" id="demopanel"><div class="cardhead"><h2>Demo and simulation controls</h2><span class="tag sample">Demo only</span></div>
      <p class="small muted">For testing and the live demo. Demo patients are marked “Sample”, are never texted, and can be removed without touching real patients. Turn these controls off with DEMO_MODE=false.</p>
      <div class="demo-grid">
        <div><h3>Demo patients</h3><p class="small muted tnum">${demo.length} sample and demo ${demo.length === 1 ? "patient" : "patients"} today · ${demo.filter(t => t.status === "waiting").length} waiting</p>
          <div class="prow"><button class="btn go small" data-demo="add">Add 20 patients</button><button class="btn ghost small" data-demo="clear" ${demo.length ? "" : "disabled"}>Remove demo data</button></div></div>
        <div><h3>Run time 10× faster</h3>${m.running ? simBanner(s) : `<p class="small muted">Off. When on, a simulated clock runs at 10× and demo patients are called and finished by themselves. Real patients are never called by the simulation.</p>`}
          <div class="prow">${!m.running ? `<button class="btn primary small" data-sim="start">Start 10× simulation</button>` : `${m.paused ? `<button class="btn primary small" data-sim="resume">Resume</button>` : `<button class="btn soft small" data-sim="pause">Pause</button>`}<button class="btn ghost small" data-sim="stop">Stop and reset clock</button>`}</div></div>
      </div><p class="small" id="demomsg" role="status" aria-live="polite"></p></div>`;
  }
  function wireDemoPanel(root, rerender) {
    const p = $("#demopanel", root); if (!p) return;
    const msg = t => { const m = $("#demomsg", root); if (m) m.textContent = t; };
    p.addEventListener("click", async e => {
      const b = e.target.closest("[data-demo],[data-sim]"); if (!b || b.disabled) return;
      if (b.dataset.demo === "clear" && !b.dataset.sure) { b.dataset.sure = "1"; b.textContent = "Tap again to remove all demo patients"; b.classList.add("danger"); return; }
      b.disabled = true;
      try {
        if (b.dataset.demo === "add") { const key = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); const r = await Store.post("/api/admin/demo/add", { key }, true); msg(r.duplicate ? "Already added." : `Added ${r.added} demo patients.`); toast(`Added ${r.added} demo patients`); }
        else if (b.dataset.demo === "clear") { const r = await Store.post("/api/admin/demo/clear", {}, true); toast(`Removed ${r.removed} demo patients. Real patients kept.`); }
        else { await Store.post("/api/admin/sim", { action: b.dataset.sim }, true); toast({ start: "Simulation started at 10×", pause: "Simulation paused", resume: "Simulation resumed", stop: "Simulation stopped. Clock reset." }[b.dataset.sim]); }
      } catch (x) { msg(x.message); toast(x.message, "err"); b.disabled = false; }
    });
  }

  /* ---------- Send a token by SMS (the phone's own SMS app, no provider needed) ---------- */
  const SH = {
    hi: { t: "SMS से टोकन भेजें", s: "अपने या परिवार के फ़ोन पर। आपका SMS ऐप खुलेगा, सब लिखा हुआ होगा।", sms: "SMS भेजें", copy: "कॉपी करें", copied: "कॉपी हो गया",
      msg: (c, dn, r, h, u) => `QueueSetu: टोकन ${c}, ${dn}, ${r}। ${h}। लाइव बारी देखें: ${u}` },
    en: { t: "Send this token by SMS", s: "To your own phone or a family member. Opens your SMS app with everything filled in.", sms: "Send SMS", copy: "Copy", copied: "Copied",
      msg: (c, dn, r, h, u) => `QueueSetu: Token ${c}, ${dn}, ${r}. ${h}. Live turn: ${u}` },
    doi: { t: "SMS कन्नै टोकन भेजो", s: "अपने जां टब्बर दे फोन पर। तुंदा SMS ऐप खुल्लग, सब लिखे दा होग।", sms: "SMS भेजो", copy: "कापी करो", copied: "कापी होई गेआ",
      msg: (c, dn, r, h, u) => `QueueSetu: टोकन ${c}, ${dn}, ${r}। ${h}। लाइव बारी दिक्खो: ${u}` }
  };
  const shareUrl = t => location.origin + location.pathname + "#t-" + t.id;
  function smsText(t, lg) {
    const d = DEPT[t.dept], room = L3(lg, d.roomHi, d.room, d.roomDoi) + (d.help ? "" : ", " + floorName(t.dept, lg));
    return SH[lg].msg(t.code, d[lg] || d.en, room, Store.state.hospital, shareUrl(t));
  }
  /* iPhone wants "sms:&body=", Android wants "sms:?body=" */
  const smsHref = text => (/iPhone|iPad|iPod/i.test(navigator.userAgent) ? "sms:&body=" : "sms:?body=") + encodeURIComponent(text);
  function smsCard(t, lg) {
    const W = SH[lg];
    return `<div class="card sharecard" lang="${lg}"><span class="sh-ico" aria-hidden="true">${svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')}</span>
      <div class="sh-txt"><b>${W.t}</b><span>${W.s}</span></div>
      <div class="sh-btns"><a class="btn go small" id="tsms" href="${esc(smsHref(smsText(t, lg)))}">${W.sms}</a><button type="button" class="btn ghost small" id="tcopy">${W.copy}</button></div></div>`;
  }
  function wireSmsCard(root, t, lg) {
    const b = root.querySelector("#tcopy"); if (!b) return;
    b.onclick = async () => {
      const text = smsText(t, lg);
      try { await navigator.clipboard.writeText(text); }
      catch (e) { const a = document.createElement("textarea"); a.value = text; a.setAttribute("readonly", ""); a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (x) {} a.remove(); }
      toast(SH[lg].copied);
    };
  }
  /* ---------- Slip check (opened by scanning the slip’s QR code) ---------- */
  function viewVerify(root, id) {
    function render() {
      const s = Store.state, t = s.tokens.find(x => x.id === id);
      const st = { waiting: "Waiting", called: "Being seen now", done: "Seen", missed: "Missed (no-show)" };
      if (!t) {
        root.innerHTML = `<section class="wrap narrow patient"><div class="card verify bad"><p class="v-mark">✕</p><h1>Not in today’s list</h1>
          <p class="muted">This slip may be from another day, or the queue was reset.</p><a class="btn ghost" href="#staff">Open staff console</a></div></section>`;
        return;
      }
      const d = DEPT[t.dept];
      root.innerHTML = `<section class="wrap narrow patient"><div class="card verify ok">
        <p class="eyebrow">Slip check · ${esc(s.hospital)}</p>
        <div class="v-head"><span class="v-mark" aria-hidden="true">✓</span><div><h1>Valid OPD slip</h1><p class="muted">Issued today at ${clock(t.createdAt)}</p></div></div>
        <p class="t-code">${t.code}</p>
        <dl class="v-list">
          <div><dt>Department</dt><dd>${d.en} · ${d.room}${d.help ? "" : ", " + floorName(t.dept, "en")}</dd></div>
          <div><dt>Doctor</dt><dd>${esc(doctorText(s, t, "en"))}</dd></div>
          <div><dt>Status</dt><dd>${st[t.status] || t.status}${t.outOfTurn ? ` · out of turn (${esc(REASON[t.outOfTurn] || "")})` : ""}</dd></div>
          ${s.staff ? `<div><dt>Name</dt><dd>${esc(t.name || "")}</dd></div><div><dt>Complaint</dt><dd>${esc(t.complaint || "No details")}${t.urgent ? ' <span class="tag urgent">Urgent</span>' : ""}</dd></div>` : `<div><dt>Patient details</dt><dd>Visible to signed-in staff only</dd></div>`}
        </dl>
        <a class="btn ghost" href="#staff">${s.staff ? "Back to staff console" : "Staff sign in"}</a></div></section>`;
    }
    render(); return render;
  }

  /* ---------- Staff portal ---------- */
  const { SKIP_REASONS, SKIP_REASON } = window.BaariShared;
  const PLACE_EN = k => PLACES[k] ? PLACES[k].label : k;
  const SIGN_EN = Object.fromEntries(SIGN_LIST.map(([k, , e]) => [k, e]));
  let alarmTimer = null, alarmOn = true;
  function openAlerts(s) { return (s.alerts || []).filter(a => !a.resolvedAt); }
  function updateAlarm() {
    const s = Store.state, unacked = Store.staff && s.staff ? openAlerts(s).filter(a => !a.ackAt).length : 0;
    const onConsole = document.body.dataset.view === "staff";
    document.title = unacked ? `(${unacked}) URGENT · QueueSetu` : "QueueSetu · Smarter hospital visits";
    if (unacked && onConsole && alarmOn) {
      if (!alarmTimer) { ensureAudio(); alarm(); alarmTimer = setInterval(() => { ensureAudio(); alarm(); }, 5000); }
    } else if (alarmTimer) { clearInterval(alarmTimer); alarmTimer = null; }
  }
  const protectName = n => { const p = String(n || "").trim().split(/\s+/); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : (p[0] || ""); };
  function viewStaff(root) {
    let dept = ls.get("baari-staff-dept"); if (!DEPT[dept]) dept = "MED";
    let pick = { id: null, kind: null, reason: null, note: "" }, resetAsk = false, mode = null, flash = "";
    let filt = { q: "", status: "active", scope: "dept" }, limit = 40;

    function login(msg) {
      mode = "login";
      root.innerHTML = `<section class="wrap"><form class="card login enter" id="loginform" novalidate>
        <span class="tile-ico">${svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>')}</span>
        <p class="eyebrow">Staff portal · ${esc(Store.state.hospital)}</p><h1>Sign in to operations</h1>
        <p class="muted">Counter staff run the queue. Admins also see the dashboard, export data and reset the day.</p>
        <label for="pin" style="font-weight:700">Staff or admin PIN</label>
        <input id="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="12" aria-describedby="pinerr">
        <p class="formerr" id="pinerr" role="alert" ${msg ? "" : "hidden"}>${esc(msg || "")}</p>
        <button class="btn primary big" type="submit">Open the portal</button>
        <p class="small muted">Demo: type only the numbers. Staff PIN <b>1234</b>, admin PIN <b>4321</b>. Change them with STAFF_PIN and ADMIN_PIN on the server. A real hospital needs individual staff logins.</p>
      </form></section>`;
      $("#pin", root).focus();
      $("#pin", root).addEventListener("input", e => { const d = e.target.value.replace(/\D/g, ""); if (d !== e.target.value) e.target.value = d; });
      $("#loginform", root).addEventListener("submit", async e => {
        e.preventDefault();
        const pin = $("#pin", root).value.replace(/\D/g, ""), err = $("#pinerr", root), btn = e.target.querySelector("button");
        btn.disabled = true;
        try {
          await Store.post("/api/staff/login", { pin });
          ls.set("baari-pin", pin); ensureAudio();
          await Store.join();
          if (!Store.staff) { err.textContent = "Couldn’t connect. Try again."; err.hidden = false; btn.disabled = false; return; }
          toast(Store.role === "admin" ? "Signed in as admin" : "Signed in as counter staff");
          shell(); render();
        } catch (x) { err.textContent = x.status === 401 ? "That PIN is wrong." : x.message; err.hidden = false; btn.disabled = false; }
      });
    }
    function shell() {
      mode = "console";
      const nav = (id, icon, label, extra) => `<button type="button" class="sb-link" data-jump="${id}">${icon}<span>${label}</span>${extra || ""}</button>`;
      root.innerHTML = `<section class="ops">
        <aside class="ops-side" aria-label="Staff menu">
          <p class="sb-title">Operations</p>
          <nav class="sb-nav">
            ${nav("ops-now", svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'), "Live queue")}
            ${nav("alerts", I.sos, "Urgent requests", '<b class="sb-count" id="sbu" hidden></b>')}
            ${nav("ops-table", svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'), "Find a patient")}
            ${nav("ops-now", svg('<path d="M12 21s-7-4.5-9-9.5C1.6 8 3.5 4 7.5 4c2 0 3.5 1.2 4.5 2.5C13 5.2 14.5 4 16.5 4c4 0 5.9 4 4.5 7.5-2 5-9 9.5-9 9.5z"/>'), "Doctor status")}
            ${nav("ops-log", svg('<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>'), "Out-of-turn log")}
            ${nav("ops-sms", svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'), "SMS outbox")}
          </nav>
          <div class="sb-sep"></div>
          <a class="sb-link" href="#assist">${I.reg}<span>Register a patient</span></a>
          <a class="sb-link" href="#display">${svg('<rect x="2" y="5" width="20" height="13" rx="2"/><path d="M7 21h10"/>')}<span>Hall display</span></a>
          <a class="sb-link" href="#admin" id="sb-admin">${svg('<path d="M3 3v18h18"/><path d="M7 15v2M11 11v6M15 7v10M19 12v5"/>')}<span>Dashboard</span></a>
          <div class="sb-foot"><span class="rolechip" id="rolechip"></span><button type="button" class="sb-link" data-act="sound" id="soundbtn"></button><button type="button" class="sb-link" data-act="signout">${svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')}<span>Sign out</span></button></div>
        </aside>
        <div class="ops-main">
          <div class="ops-top">
            <div><p class="eyebrow">${esc(Store.state.hospital)}</p><h1>OPD operations</h1></div>
            <div class="ops-tools"><span id="ssync"></span>
              <label class="sr" for="deptsel">Department</label><select id="deptsel" class="sel">${DEPTS.map(d => `<option value="${d.id}">${d.en} · ${d.room}${d.help ? "" : " · " + floorName(d.id, "en", true)}</option>`).join("")}</select>
              <button type="button" class="btn soft" data-act="scan">${svg('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>')}<span>Scan slip</span></button><a class="btn go" href="#assist">${I.reg}<span>Register</span></a></div>
          </div>
          <div class="samplebar" id="samplebar" hidden><span>Demo data: sample patients are loaded. They are marked “Sample” and are never texted.</span></div>
          <div id="ssim"></div>
          <div id="alerts" aria-live="assertive"></div>
          <p class="formerr" id="serr" role="alert" hidden></p>
          <div class="sumcards" id="stats"></div>
          <div class="card nowcard" id="ops-now"></div>
          <div class="card" id="ops-table">
            <div class="cardhead"><h2>Queue</h2><span class="muted small tnum" id="wcount"></span></div>
            <div class="sfilters">
              <div class="searchbox small">${svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<label class="sr" for="s-q">Quick search</label><input id="s-q" type="search" placeholder="Token, name, or last 4 phone digits" autocomplete="off"></div>
              <label class="sr" for="s-status">Status</label><select id="s-status" class="sel"><option value="active">Waiting and being seen</option><option value="all">All statuses</option><option value="waiting">Waiting</option><option value="called">Being seen</option><option value="done">Served</option><option value="missed">Skipped</option></select>
              <label class="sr" for="s-scope">Department filter</label><select id="s-scope" class="sel"><option value="dept">Selected department</option><option value="all">All departments</option></select>
            </div>
            <div class="tablewrap"><table class="qtable"><caption class="sr">Patient queue</caption>
              <thead><tr><th scope="col">Token</th><th scope="col">Patient</th><th scope="col">Department</th><th scope="col">Registered</th><th scope="col">Waiting</th><th scope="col">Status</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
              <tbody id="qbody"></tbody></table></div>
            <div id="more"></div>
          </div>
          <div class="ops-grid">
            <div class="card" id="ops-log"><h2>Out-of-turn log</h2><p class="muted small">Every call that skips the line, with its reason.</p><ul class="log" id="log"></ul></div>
            <div class="card" id="ops-audit"><h2>Activity log</h2><p class="muted small">Send to end of queue, doctor changes and demo actions, with who did it and when.</p><ul class="log" id="audit"></ul></div>
            <div class="card" id="ops-sms"><h2>SMS outbox</h2><p class="muted small" id="smsnote"></p><ul class="log sms" id="sms"></ul></div>
          </div>
          <div class="card"><h2>Day controls</h2><div class="ctrls" id="ctrls"></div></div>
        </div></section>`;
      $("#s-q", root).addEventListener("input", e => { filt.q = e.target.value; limit = 40; renderTable(); });
      $("#s-status", root).addEventListener("change", e => { filt.status = e.target.value; limit = 40; renderTable(); });
      $("#s-scope", root).addEventListener("change", e => { filt.scope = e.target.value; limit = 40; renderTable(); });
    }
    const statusName = { waiting: "Waiting", called: "Being seen", done: "Served", missed: "Skipped" };
    const statusIcon = { waiting: I.clock, called: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'), done: I.check, missed: I.x };
    const stBadge = st => `<span class="sbadge ${{ waiting: "waiting", called: "go", done: "done", missed: "missed" }[st]}">${statusIcon[st]}<span>${statusName[st]}</span></span>`;
    function moveSelect(t) { return `<span class="movebox"><label class="sr" for="mv-${t.id}">Send ${t.code} to</label><select id="mv-${t.id}" class="sel small">${CLINICS.map(d => `<option value="${d.id}">${d.en}</option>`).join("")}</select><button class="btn small primary" data-move="${t.id}">Send</button></span>`; }
    function pickerHtml(t) {
      if (pick.id !== t.id) return "";
      if (pick.kind === "requeue") {
        const s = Store.state, n = waitingIn(s, t.dept).filter(x => x.id !== t.id).length, { m } = queueEst(s, t.dept);
        return `<div class="picker requeue" role="group" aria-label="Confirm send to end of queue"><p><b>Send ${t.code} to the end of the ${DEPT[t.dept].en} queue?</b></p>
          <p class="small">They will be number ${n + 1} in line${n ? `, behind ${n} ${n === 1 ? "person" : "people"}` : ""}, and may wait about ${m} min longer. Their token number and history stay the same. This is logged with your role and the time.</p>
          <div class="prow"><button class="btn warnbtn" data-act="confirm-requeue" data-from="${t.status}">Yes, send ${t.code} to the end</button><button class="btn ghost" data-act="cancel">Cancel</button></div></div>`;
      }
      const isSkip = pick.kind === "skip", list = isSkip ? SKIP_REASONS : REASONS;
      const q = waitingIn(Store.state, t.dept), pos = q.indexOf(t);
      return `<div class="picker" role="group" aria-label="${isSkip ? "Reason for skipping" : "Reason for calling out of turn"}"><p><b>${isSkip ? `Why skip ${t.code}?` : `Why should ${t.code} go before ${pos} ${pos === 1 ? "person" : "people"}?`}</b> <span class="muted small">A reason is required.</span></p>
        <div class="reasons">${list.map(r => `<button type="button" class="chip ${pick.reason === r.id ? "on" : ""}" data-reason="${r.id}" aria-pressed="${pick.reason === r.id}">${r.en}</button>`).join("")}</div>
        <label for="pick-note" class="small" style="font-weight:700">Note (optional)</label><input id="pick-note" maxlength="140" value="${esc(pick.note)}" placeholder="${isSkip ? "For example: called twice, not in the hall" : "For example: chest pain, BP 180/110"}">
        <div class="prow"><button class="btn ${isSkip ? "warnbtn" : "go"}" data-act="confirm" ${pick.reason ? "" : "disabled"}>${isSkip ? `Skip ${t.code}` : `Call ${t.code} now`}</button><button class="btn ghost" data-act="cancel">Cancel</button></div>
        <p class="small muted">${isSkip ? "The reason is saved with the token. Staff can put the patient back in the queue later." : "This call and its reason go into the out-of-turn log."}</p></div>`;
    }
    function rowActions(t, urgent, firstInDept) {
      const a = [];
      if (t.status === "waiting") {
        if (urgent) a.push(`<button class="btn small go" data-callnow="${t.id}">Call now</button>`);
        else if (firstInDept) a.push(`<button class="btn small go" data-callfirst="${t.id}">Call</button>`);
        else a.push(`<button class="btn small soft" data-pick="${t.id}" data-kind="call">Call out of turn</button>`);
        a.push(`<button class="btn small ghost" data-pick="${t.id}" data-kind="skip">Skip</button>`);
      }
      if (t.status === "called") a.push(`<button class="btn small go" data-set="done" data-id="${t.id}">Served</button>`, `<button class="btn small ghost" data-pick="${t.id}" data-kind="skip">Skip</button>`);
      if (t.status === "missed") a.push(`<button class="btn small soft" data-set="waiting" data-id="${t.id}">Back to queue</button>`);
      const q = t.status === "waiting" ? waitingIn(Store.state, t.dept) : null;
      if (t.status === "called" || t.status === "missed" || (q && q.length > 1 && q[q.length - 1].id !== t.id)) a.push(`<button class="btn small ghost" data-pick="${t.id}" data-kind="requeue" title="Send to the end of the queue">To end</button>`);
      if (DEPT[t.dept].help && (t.status === "waiting" || t.status === "called")) a.push(moveSelect(t));
      a.push(`<a class="btn small ghost" href="#verify-${t.id}" aria-label="Check slip ${t.code}">Slip</a>`);
      return a.join("");
    }
    function renderTable() {
      const s = Store.state, now = Date.now(), body = $("#qbody", root); if (!body) return;
      const urgentOpen = new Set(openAlerts(s).filter(a => a.tokenId).map(a => a.tokenId));
      const q = filt.q.trim().toLowerCase(), code = normCode(filt.q);
      let list = s.tokens.slice();
      if (filt.scope === "dept" && !q) list = list.filter(t => t.dept === dept);
      if (filt.status === "active" && !q) list = list.filter(t => t.status === "waiting" || t.status === "called");
      else if (filt.status !== "all" && filt.status !== "active") list = list.filter(t => t.status === filt.status);
      if (q) list = list.filter(t => (code && (t.code === code || t.movedFrom === code)) || t.code.toLowerCase().includes(q) || (t.name || "").toLowerCase().includes(q) || (/^\d{2,4}$/.test(q) && (t.phone || "").endsWith(q)));
      const rank = t => (t.status === "waiting" && urgentOpen.has(t.id)) ? 0 : t.status === "called" ? 1 : t.status === "waiting" ? 2 : 3;
      const qk = t => t.queuedAt || t.createdAt;
      list.sort((a, b) => rank(a) - rank(b) || (rank(a) === 3 ? b.createdAt - a.createdAt : qk(a) - qk(b)));
      $("#wcount", root).textContent = `${list.length} ${list.length === 1 ? "patient" : "patients"}${q ? " found in all departments" : ""}`;
      const firsts = new Set(DEPTS.map(d => (waitingIn(s, d.id)[0] || {}).id).filter(Boolean));
      if (!list.length) { body.innerHTML = `<tr><td colspan="7" class="empty">${q ? "No patient matches. Check the token number or try another word." : filt.status === "active" ? `No one is waiting in ${filt.scope === "dept" ? DEPT[dept].en : "any department"}. New patients appear here by themselves.` : "Nothing to show for this filter."}</td></tr>`; $("#more", root).innerHTML = ""; return; }
      body.innerHTML = list.slice(0, limit).map(t => {
        const urgent = t.status === "waiting" && urgentOpen.has(t.id), pos = t.status === "waiting" ? waitingIn(s, t.dept).indexOf(t) + 1 : 0;
        const waitedTo = t.calledAt || t.doneAt || now;
        return `<tr class="${urgent ? "urgent-row" : ""} ${t.status === "called" ? "called-row" : ""} ${pick.id === t.id ? "picking" : ""}">
          <td data-label="Token"><span class="tcode">${t.code}</span>${urgent ? '<span class="tpos hot">Pinned: urgent</span>' : pos ? `<span class="tpos">#${pos} in line</span>` : ""}</td>
          <td data-label="Patient"><span class="pname" title="${esc(t.name)}">${esc(protectName(t.name))}</span>${t.urgent ? ' <span class="tag urgent">Urgent</span>' : ""}${t.sample ? ' <span class="tag">Sample</span>' : ""}${t.assisted ? ' <span class="tag">Assisted</span>' : ""}<span class="pcomp">${esc(t.complaint || "No details")}</span></td>
          <td data-label="Department">${DEPT[t.dept].en}${t.movedFrom ? `<span class="pcomp">from ${esc(t.movedFrom)}</span>` : ""}</td>
          <td data-label="Registered" class="tnum">${clock(t.createdAt)}</td>
          <td data-label="Waiting" class="tnum">${mins(waitedTo - t.createdAt)} min</td>
          <td data-label="Status">${stBadge(t.status)}${t.skipReason ? `<span class="pcomp">${esc(SKIP_REASON[t.skipReason] || "")}</span>` : ""}${t.outOfTurn ? `<span class="pcomp">Out of turn: ${esc(REASON[t.outOfTurn] || "")}</span>` : ""}</td>
          <td class="tact"><div class="sact">${rowActions(t, urgent, firsts.has(t.id))}</div></td></tr>
          ${pick.id === t.id && !(currentIn(s, dept) && currentIn(s, dept).id === t.id) ? `<tr class="pickrow"><td colspan="7">${pickerHtml(t)}</td></tr>` : ""}`;
      }).join("");
      $("#more", root).innerHTML = list.length > limit ? `<button class="btn soft small" data-act="more">Show ${Math.min(40, list.length - limit)} more of ${list.length - limit}</button>` : "";
    }
    function renderAlerts() {
      const s = Store.state, open = openAlerts(s).sort((a, b) => (a.ackAt ? 1 : 0) - (b.ackAt ? 1 : 0) || b.createdAt - a.createdAt);
      const el = $("#alerts", root); if (!el) return;
      const sb = $("#sbu", root); if (sb) { sb.textContent = open.length || ""; sb.hidden = !open.length; }
      if (!open.length) { el.innerHTML = ""; return; }
      el.innerHTML = `<div class="card alerts"><div class="cardhead"><h2>${I.sos}Urgent requests <span class="tag urgent">${open.length} open</span></h2><span class="small muted">Staff decide what to do. The app only raises the flag.</span></div>
        <ul class="alist">${open.map(a => {
          const tk = a.tokenId ? s.tokens.find(t => t.id === a.tokenId) : null;
          const what = a.kind === "request" ? `Emergency help requested at <b>${esc(PLACE_EN(a.place))}</b>` : `Urgent words at registration: <b>${esc(a.code || "")}</b>${tk ? " · " + esc(protectName(tk.name)) : ""}`;
          const detail = [a.signs && a.signs.length ? a.signs.map(x => SIGN_EN[x] || x).join(", ") : "", a.note ? `“${esc(a.note)}”` : "", a.kind === "request" && a.code ? `Token ${esc(a.code)}` : ""].filter(Boolean).join(" · ");
          return `<li class="arow ${a.ackAt ? "acked" : "new"}"><div style="min-width:0"><p class="lt">${what}</p>${detail ? `<p class="ld">${detail}</p>` : ""}
            <p class="ld tnum">Received ${clock(a.createdAt)}${a.ackAt ? ` · seen ${clock(a.ackAt)}` : " · <b>not seen yet</b>"}</p></div>
            <div class="sact">${a.ackAt ? "" : `<button class="btn small danger" data-alert="ack" data-id="${a.id}">I’ve seen it</button>`}
              ${tk && tk.status === "waiting" ? `<button class="btn small go" data-callnow="${tk.id}">Call ${tk.code} now</button>` : ""}
              <button class="btn small ghost" data-alert="resolve" data-id="${a.id}">Resolved</button></div></li>`;
        }).join("")}</ul></div>`;
    }
    function render() {
      const s = Store.state;
      if (!Store.staff || !s.staff) {
        updateAlarm();
        if (ls.get("baari-pin")) { if (mode !== "wait") { mode = "wait"; root.innerHTML = `<div class="wrap skel"><div class="sk sk-h"></div><div class="sk-grid"><div class="sk sk-card"></div><div class="sk sk-card"></div><div class="sk sk-card"></div></div></div>`; } return; }
        if (mode !== "login") login();
        return;
      }
      if (mode !== "console") shell();
      const d = DEPT[dept], now = Date.now(), q = waitingIn(s, dept), cur = currentIn(s, dept);
      if (pick.id && !s.tokens.some(t => t.id === pick.id && (t.status === "waiting" || t.status === "called"))) pick = { id: null, kind: null, reason: null, note: "" };
      $("#ssync", root).innerHTML = syncChip();
      $("#deptsel", root).value = dept;
      $("#rolechip", root).textContent = Store.role === "admin" ? "Signed in: Admin" : "Signed in: Counter staff";
      $("#soundbtn", root).innerHTML = `${I.spk}<span>Alert sound: ${alarmOn ? "on" : "off"}</span>`;
      $("#sb-admin", root).hidden = Store.role !== "admin";
      $("#samplebar", root).hidden = !s.sample && !s.tokens.some(t => t.sample);
      $("#ssim", root).innerHTML = simBanner(s);
      const se = $("#serr", root); se.textContent = flash; se.hidden = !flash;
      renderAlerts(); updateAlarm();
      const open = openAlerts(s).length;
      const sc = (n, label, icon, cls) => `<div class="sumcard ${cls || ""}"><span class="sc-ico">${icon}</span><div><b class="tnum">${n}</b><span>${label}</span></div></div>`;
      $("#stats", root).innerHTML = sc(s.tokens.filter(t => t.status === "waiting").length, "Total waiting", I.clock) + sc(s.tokens.filter(t => t.status === "called").length, "Being served", svg('<path d="M5 12h14M13 6l6 6-6 6"/>'), "teal") + sc(s.tokens.filter(t => t.status === "done").length, "Completed today", I.check) + sc(open, "Urgent cases open", I.sos, open ? "hot" : "");
      const doc = (s.doctors || {})[dept] || { status: "available" };
      const docVal = doc.status === "available" ? "available" : `${doc.status}:${doc.mins || 0}`;
      const docOpts = [["available", "Available"], ["break:10", "On break · 10 min"], ["break:15", "On break · 15 min"], ["break:30", "On break · 30 min"], ["delayed:10", "Delayed · 10 min"], ["delayed:15", "Delayed · 15 min"], ["delayed:30", "Delayed · 30 min"], ["delayed:45", "Delayed · 45 min"]];
      const dl = docLine(s, dept, "en");
      const docSel = d.help ? "" : `<div class="docset"><span class="doc ${dl ? dl.cls : "ok"}"><i></i>${dl ? esc(dl.text) : ""}</span><label for="docsel" class="sr">Doctor availability</label><select id="docsel" class="sel small">${docOpts.map(([v, l]) => `<option value="${v}" ${v === docVal ? "selected" : ""}>${l}</option>`).join("")}${docOpts.some(o => o[0] === docVal) ? "" : `<option value="${docVal}" selected>${doc.status === "break" ? "On break" : "Delayed"} · ${doc.mins} min left</option>`}</select>
        <label for="docname" class="sr">Doctor on duty</label><input id="docname" class="sel small docname" maxlength="60" placeholder="Doctor on duty (name)" value="${esc(doc.name || (s.doctors[dept] || {}).name || "")}" autocomplete="off"></div>`;
      const typing = document.activeElement && document.activeElement.id === "docname" ? { v: document.activeElement.value, a: document.activeElement.selectionStart } : null;
      $("#ops-now", root).innerHTML = `<div class="now-l">
          <p class="eyebrow">Now serving · ${d.en} · ${d.room}${d.help ? "" : " · " + floorName(dept, "en")}</p>${d.help ? "" : `<p class="nowcrowd">${crowdBadge(s, dept, "en", { long: true })}<span class="small muted">· about ${Math.round(serviceStats(s, dept).avg * 10) / 10} min per patient (${serviceStats(s, dept).source === "history" ? `last ${serviceStats(s, dept).n} patients` : "default, no history yet"})</span></p>`}
          ${cur ? `<p class="now-code tnum">${cur.code}</p><p class="now-name">${esc(protectName(cur.name))} ${cur.urgent ? '<span class="tag urgent">Urgent</span>' : ""} ${cur.outOfTurn ? `<span class="tag">Out of turn: ${esc(REASON[cur.outOfTurn] || "")}</span>` : ""}</p><p class="muted">${esc(cur.complaint || "No details")} · called ${mins(now - cur.calledAt)} min ago</p>${d.help ? `<div class="prow">${moveSelect(cur)}</div>` : ""}`
               : `<p class="now-code idle">Nobody right now</p><p class="muted">Call the next patient when ${d.help ? "the desk" : "the doctor"} is free.</p>`}
          ${docSel}
          ${cur && pick.id === cur.id ? pickerHtml(cur) : ""}
        </div>
        <div class="now-actions"><button class="btn go big" data-act="next" ${q.length ? "" : "disabled"}>${q.length ? `Call next: ${q[0].code}` : "No one waiting"}</button>
          <div class="row"><button class="btn soft" data-act="done" ${cur ? "" : "disabled"}>Served</button><button class="btn ghost" ${cur ? `data-pick="${cur.id}" data-kind="skip"` : "disabled"}>Skip…</button><button class="btn ghost" ${cur ? `data-pick="${cur.id}" data-kind="requeue"` : "disabled"} title="Patient not here yet: send to the end of the queue">To end…</button></div>
          <p class="small muted" style="text-align:center">Press <kbd>N</kbd> to call next · ${q.length} waiting · about ${q.length ? queueEst(s, dept).m : 0} min</p></div>`;
      if (typing) { const di = $("#docname", root); if (di) { di.value = typing.v; di.focus(); try { di.setSelectionRange(typing.a, typing.a); } catch (e) {} } }
      renderTable();
      $("#log", root).innerHTML = s.log.length ? s.log.slice(0, 30).map(l => `<li><p class="lt tnum">${esc(l.code)} went before ${l.skipped} ${l.skipped === 1 ? "person" : "people"} · ${clock(l.t)}</p><p class="ld">${esc(REASON[l.reason] || l.reason)}${l.note ? ": " + esc(l.note) : ""}</p></li>`).join("") : `<li style="border:0;padding:0" class="ld">No out-of-turn calls yet.</li>`;
      const AU = { requeue: a => `${esc(a.code)} sent to the end of the queue (was ${esc(a.from)})`, doctor: a => `Doctor for ${esc(DEPT[a.dept] ? DEPT[a.dept].en : a.dept)} set to ${esc(a.name || "not set")}`, "demo-add": a => `Added ${a.count} demo patients`, "demo-clear": a => `Removed ${a.count} demo patients`, "sim-start": () => "Simulation started (10×)", "sim-pause": () => "Simulation paused", "sim-resume": () => "Simulation resumed", "sim-stop": () => "Simulation stopped" };
      $("#audit", root).innerHTML = (s.audit || []).length ? s.audit.slice(0, 20).map(a => `<li><p class="lt tnum">${(AU[a.action] || (() => esc(a.action)))(a)}</p><p class="ld">${a.by === "admin" ? "Admin" : "Counter staff"} · ${clock(a.t)}</p></li>`).join("") : `<li style="border:0;padding:0" class="ld">Nothing yet.</li>`;
      $("#smsnote", root).textContent = s.smsLive ? "Texts are sent with Twilio. Sample patients are never texted." : "Simulated. Messages are listed here, not sent. Add Twilio keys on the server to send real texts.";
      const st = { sent: "Sent", failed: "Failed", sending: "Sending", simulated: "Simulated" };
      $("#sms", root).innerHTML = s.sms.length ? s.sms.slice(0, 12).map(m => `<li class="${m.status === "failed" ? "failed" : ""}"><p class="lt tnum">To ${esc(m.to)} · ${clock(m.t)}<span class="st">${st[m.status] || ""}</span></p><p class="ld">${esc(m.text)}${m.error ? " (" + esc(m.error) + ")" : ""}</p></li>`).join("") : `<li style="border:0;padding:0" class="ld">No messages yet. Patients who give a number get a text when 3 or fewer people are ahead.</li>`;
      const admin = Store.role === "admin";
      $("#ctrls", root).innerHTML = (admin ? `<a class="btn small soft" href="#admin">Open dashboard</a>` : `<p class="small muted" style="width:100%">The dashboard, CSV export and reset need the admin PIN.</p>`)
        + (admin ? (resetAsk ? `<p class="small" style="width:100%">This removes every token for today on all screens.</p><button class="btn danger small" data-act="clear">Yes, start an empty day</button><button class="btn small ghost" data-act="sample">Load demo patients</button><button class="btn small ghost" data-act="noreset">Keep the queue</button>` : `<button class="btn small ghost" data-act="askreset">Reset the day…</button>`) : "");
    }
    async function act(path, body, msg) {
      try { flash = ""; const r = await Store.post(path, body, true); const m = typeof msg === "function" ? msg(r) : msg; if (m) toast(m); return r; }
      catch (x) {
        if (x.status === 401) { ls.del("baari-pin"); Store.staff = false; Store.role = null; login("Your PIN changed. Please sign in again."); return; }
        flash = x.message || "Couldn’t reach the server."; toast(flash, "err"); render();
      }
    }
    const onKey = e => {
      if (!document.body.contains(root)) { removeEventListener("keydown", onKey); return; }
      if (mode !== "console" || e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest("input,textarea,select"))) return;
      if (e.key === "n" || e.key === "N") { const b = root.querySelector('[data-act="next"]'); if (b && !b.disabled) { e.preventDefault(); b.click(); } }
    };
    addEventListener("keydown", onKey);
    root.addEventListener("input", e => { if (e.target.id === "pick-note") pick.note = e.target.value; });
    root.addEventListener("change", async e => {
      if (e.target.id === "docname") { await act("/api/staff/doctor", Object.assign({ dept, name: e.target.value }, (() => { const d0 = (Store.state.doctors || {})[dept] || { status: "available" }; return { status: d0.status, mins: d0.mins || 0 }; })()), "Doctor on duty updated. New slips show this name."); return; }
      if (e.target.id === "docsel") { const [status, m] = e.target.value.split(":"); await act("/api/staff/doctor", { dept, status, mins: Number(m) || 0 }, "Doctor status updated. Patients see it now."); }
      if (e.target.id === "deptsel") { dept = e.target.value; ls.set("baari-staff-dept", dept); pick = { id: null, kind: null, reason: null, note: "" }; render(); }
    });
    root.addEventListener("click", async e => {
      if (mode !== "console") return;
      ensureAudio();
      const j = e.target.closest("[data-jump]");
      if (j) { const el = $("#" + j.dataset.jump, root) || $("#ops-now", root); el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); if (j.dataset.jump === "ops-table") setTimeout(() => $("#s-q", root).focus(), 300); return; }
      const p = e.target.closest("[data-pick]");
      if (p) {
        const tk = Store.state.tokens.find(x => x.id === p.dataset.pick), kind = p.dataset.kind;
        pick = { id: p.dataset.pick, kind, reason: kind === "call" && tk && tk.urgent ? "emergency" : null, note: kind === "call" && tk && tk.urgent ? "Flagged urgent at registration: " + (tk.complaint || "").slice(0, 80) : "" };
        render(); const pn = $("#pick-note", root); if (pn) pn.closest(".picker").scrollIntoView({ block: "nearest" }); return;
      }
      const r = e.target.closest("[data-reason]");
      if (r) { pick.reason = r.dataset.reason; render(); return; }
      const al = e.target.closest("[data-alert]");
      if (al) { al.disabled = true; await act("/api/staff/alert", { id: al.dataset.id, action: al.dataset.alert }, al.dataset.alert === "ack" ? "Marked as seen. The time is recorded." : "Alert resolved."); return; }
      const cn = e.target.closest("[data-callnow]");
      if (cn) {
        const tk = Store.state.tokens.find(x => x.id === cn.dataset.callnow); if (!tk) return;
        cn.disabled = true; const q = waitingIn(Store.state, tk.dept), first = q[0] && q[0].id === tk.id;
        await act("/api/staff/call", { dept: tk.dept, tokenId: tk.id, reason: first ? undefined : "emergency", note: "Urgent flag: " + (tk.complaint || "").slice(0, 80) }, `${tk.code} called to ${DEPT[tk.dept].room}.`);
        return;
      }
      const cf = e.target.closest("[data-callfirst]");
      if (cf) { const tk = Store.state.tokens.find(x => x.id === cf.dataset.callfirst); if (!tk) return; cf.disabled = true; await act("/api/staff/call", { dept: tk.dept, tokenId: tk.id }, `${tk.code} called to ${DEPT[tk.dept].room}.`); return; }
      const st = e.target.closest("[data-set]");
      if (st) { st.disabled = true; await act("/api/staff/status", { tokenId: st.dataset.id, status: st.dataset.set }, rr => rr ? `${rr.code} is now ${statusName[rr.status].toLowerCase()}.` : ""); return; }
      const mv = e.target.closest("[data-move]");
      if (mv) { const sel = $("#mv-" + mv.dataset.move, root); mv.disabled = true; await act("/api/staff/move", { tokenId: mv.dataset.move, dept: sel.value }, rr => rr ? `Sent to ${DEPT[rr.dept].en} as ${rr.code}. They keep their arrival time.` : ""); return; }
      const a = e.target.closest("[data-act]"); if (!a || a.disabled) return;
      const k = a.dataset.act;
      if (k === "next") { a.disabled = true; await act("/api/staff/call", { dept }, r2 => r2 && r2.called ? `${r2.called} called to ${DEPT[dept].room}.` : ""); }
      else if (k === "done") await act("/api/staff/finish", { dept, status: "done" }, "Marked as served.");
      else if (k === "confirm") {
        const tk = Store.state.tokens.find(x => x.id === pick.id); const p2 = pick; pick = { id: null, kind: null, reason: null, note: "" };
        if (!tk) return render();
        if (p2.kind === "skip") await act("/api/staff/status", { tokenId: tk.id, status: "missed", reason: p2.reason }, `${tk.code} skipped: ${SKIP_REASON[p2.reason]}.`);
        else await act("/api/staff/call", { dept: tk.dept, tokenId: tk.id, reason: p2.reason, note: p2.note.trim() }, `${tk.code} called out of turn.`);
      }
      else if (k === "confirm-requeue") {
        const tk = Store.state.tokens.find(x => x.id === pick.id); pick = { id: null, kind: null, reason: null, note: "" };
        if (!tk) return render();
        await act("/api/staff/requeue", { tokenId: tk.id, from: a.dataset.from }, r => r ? `${r.code} is now number ${r.position} of ${r.waiting} in line.` : "");
      }
      else if (k === "scan") openScanner(t => { location.hash = "#verify-" + t.id; });
      else if (k === "cancel") { pick = { id: null, kind: null, reason: null, note: "" }; render(); }
      else if (k === "more") { limit += 40; renderTable(); }
      else if (k === "askreset") { resetAsk = true; render(); }
      else if (k === "noreset") { resetAsk = false; render(); }
      else if (k === "clear" || k === "sample") { resetAsk = false; await act("/api/staff/reset", { mode: k === "clear" ? "empty" : "sample" }, k === "clear" ? "Started an empty day." : "Demo patients loaded."); }
      else if (k === "sound") { alarmOn = !alarmOn; updateAlarm(); render(); toast(alarmOn ? "Alert sound on" : "Alert sound off"); }
      else if (k === "signout") { ls.del("baari-pin"); Store.staff = false; Store.role = null; location.reload(); }
    });
    render(); return render;
  }

  /* ---------- Hall display ---------- */
  function viewDisplay(root) {
    let last = null;
    root.innerHTML = `<section class="board">
      <header class="b-head"><div class="b-id"><svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#FFFFFF"/><circle cx="15" cy="15" r="7.5" fill="none" stroke="#0B5D44" stroke-width="3.4"/><path d="M19.6 19.6 25 25" stroke="#16A86A" stroke-width="3.6" stroke-linecap="round"/></svg><div><p class="b-brand">QueueSetu</p><p class="b-hosp">${esc(Store.state.hospital)} · OPD waiting hall</p></div></div>
        <div class="b-time"><p class="b-clock tnum" id="bclock"></p><p class="b-date" id="bdate"></p></div>
        <div class="b-ctrl"><button type="button" id="bsound">Turn on sound</button><button type="button" id="bfull">Full screen</button><a href="#home">Exit</a></div></header>
      <div class="b-emr" id="bemr" role="alert" hidden></div><div id="bsim"></div>
      <div class="b-body"><div class="b-grid" id="bgrid"></div>
        <aside class="b-side"><div class="b-qr"><div id="qr"></div><p class="b-qrt">Scan to get your token<br><span lang="hi">टोकन लेने के लिए स्कैन करें</span></p></div>
          <div class="b-ann" id="bann" aria-live="polite"></div>
          <div class="b-fair" id="bfair"></div></aside></div>
      <div class="b-ticker" id="ticker" aria-live="polite"></div></section>`;
    const qr = $("#qr", root), url = location.origin + location.pathname + "#patient";
    putQR(qr, url, 200);
    $("#bsound", root).onclick = e => { soundOn = !soundOn; if (soundOn) ensureAudio(); e.target.textContent = soundOn ? "Sound on" : "Turn on sound"; if (soundOn) chime(); };
    $("#bfull", root).onclick = () => { try { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); p && p.catch && p.catch(() => {}); } catch (e) {} };
    const ANN = [["Please keep your token slip ready.", "कृपया अपनी टोकन पर्ची तैयार रखें।"], ["Watch this screen or your phone for your number.", "अपना नंबर इस स्क्रीन या अपने फ़ोन पर देखें।"], ["Not sure where to go? Ask at the Help desk.", "पता नहीं कहाँ जाना है? हेल्प डेस्क पर पूछें।"], ["Elderly and disabled patients may be called first. Every such call is logged.", "बुज़ुर्ग और दिव्यांग मरीज़ों को पहले बुलाया जा सकता है। हर बार कारण दर्ज होता है।"]];
    let annI = 0;
    const ann = () => { const a = $("#bann", root); if (!a) return; const m = ANN[annI++ % ANN.length]; a.innerHTML = `<small>Announcement · सूचना</small><p>${m[0]}</p><p lang="hi">${m[1]}</p>`; };
    ann();
    const tick = () => { const c = $("#bclock", root), dd = $("#bdate", root), now = new Date(); if (c) c.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); if (dd) dd.textContent = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); if (now.getSeconds() % 12 === 0) ann(); };
    tick();
    const ci = setInterval(() => { if (!document.body.contains(root)) { clearInterval(ci); return; } tick(); }, 1000);
    function render() {
      const s = Store.state, cur = {};
      DEPTS.forEach(d => { const c = currentIn(s, d.id); cur[d.id] = c ? c.id : null; });
      const changed = last ? DEPTS.filter(d => cur[d.id] && cur[d.id] !== last[d.id]).map(d => d.id) : [];
      $("#bgrid", root).innerHTML = DEPTS.map(d => {
        const c = currentIn(s, d.id), q = waitingIn(s, d.id);
        return `<div class="b-card ${changed.includes(d.id) ? "flash" : ""}"><div class="b-dept"><h2>${d.en}</h2>${d.help ? "" : `<span>${d.room} · ${floorName(d.id, "en", true)}</span>`}</div>${d.help ? "" : `<div class="b-crowd">${crowdBadge(s, d.id, "en")}${s.doctors && s.doctors[d.id] && s.doctors[d.id].name ? `<span class="b-docname">${esc(s.doctors[d.id].name)}</span>` : ""}</div>`}<p class="b-dhi" lang="hi">${d.help ? d.hi : `${d.hi} · ${d.roomHi} · ${floorName(d.id, "hi", true)}`}</p>${(() => { const dl = docLine(s, d.id, "en"); return dl && dl.cls !== "ok" ? `<p class="b-doc ${dl.cls}">${esc(dl.text)}</p>` : ""; })()}
          <p class="b-nowl">${c ? (Date.now() - c.calledAt < 120000 ? '<span class="b-call calling"><i></i>Calling now · अभी बुलाया</span>' : '<span class="b-call">In consultation · जाँच चल रही है</span>') : "Now serving"}</p><div class="b-nowwrap"><p class="b-now ${c ? "" : "none"} ${changed.includes(d.id) ? "flip" : ""}">${c ? c.code : "Waiting to start"}</p></div>
          <div class="b-next">${q.length ? q.slice(0, 3).map(t => `<span>${t.code}</span>`).join("") + (q.length > 3 ? `<em>+${q.length - 3} more</em>` : "") : "<em>No one waiting</em>"}</div></div>`;
      }).join("");
      const bs = $("#bsim", root); if (bs) bs.innerHTML = simBanner(s);
      const em = $("#bemr", root);
      if (em) { em.hidden = !s.emergencyActive; em.innerHTML = s.emergencyActive ? `${I.sos}<div><b>Emergency team is responding. Please keep the corridors clear.</b><span lang="hi">आपातकालीन टीम काम कर रही है। कृपया गलियारे खाली रखें।</span></div>` : ""; }
      const outs = s.outOfTurnCount || 0, seen = s.tokens.filter(t => t.status === "done").length;
      $("#bfair", root).innerHTML = `<b>${outs}</b><p>out-of-turn ${outs === 1 ? "call" : "calls"} today. Each one has a reason in the log.</p><p style="margin-top:8px"><span style="color:var(--board-ink);font-weight:700" class="tnum">${seen}</span> patients seen today</p>${Store.connected ? "" : `<p style="color:var(--board-accent);font-weight:700">Reconnecting to the server…</p>`}`;
      const recent = s.tokens.filter(t => t.calledAt && t.status !== "waiting").sort((a, b) => b.calledAt - a.calledAt).slice(0, 5);
      const latest = recent[0];
      $("#ticker", root).innerHTML = latest
        ? `<small>Latest call</small><span class="tnum b-latest">${latest.code} → ${DEPT[latest.dept].help ? DEPT[latest.dept].en : DEPT[latest.dept].en + ", " + DEPT[latest.dept].room + ", " + floorName(latest.dept, "en")}</span><span lang="hi" style="color:var(--board-muted)">${DEPT[latest.dept].roomHi} में जाएँ</span><span class="b-recent tnum">${recent.slice(1).map(t => `<i>${t.code}</i>`).join("")}</span>`
        : `<small>Latest call</small><span>Waiting for the first patient</span>`;
      if (changed.length) { chime(); changed.forEach(id => { const t = s.tokens.find(x => x.id === cur[id]); if (t) announce(t); }); }
      last = cur;
    }
    render(); return render;
  }

  /* ---------- Hospital dashboard (staff only) ---------- */
  const istHourOf = ts => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date(ts))) % 24;
  const hourLabel = h => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;
  function viewAdmin(root) {
    function render() {
      const s = Store.state;
      if (s.staff && Store.role !== "admin") {
        root.innerHTML = `<section class="wrap"><div class="card login"><p class="eyebrow">Hospital dashboard</p><h1>Admins only</h1>
          <p class="muted">You are signed in as counter staff. Sign out of the staff console and sign in with the admin PIN to see the dashboard and export data.</p><a class="btn primary big" href="#staff">Back to the staff console</a></div></section>`;
        return;
      }
      if (!s.staff) {
        root.innerHTML = `<section class="wrap"><div class="card login"><p class="eyebrow">Hospital dashboard</p><h1>Staff only</h1>
          <p class="muted">Sign in on the staff console first. The dashboard uses the same PIN.</p><a class="btn primary big" href="#staff">Go to the staff console</a></div></section>`;
        return;
      }
      const now = Date.now(), T = s.tokens;
      const waiting = T.filter(t => t.status === "waiting"), seen = T.filter(t => t.status === "done"), missed = T.filter(t => t.status === "missed");
      const waitMin = t => (t.calledAt - t.createdAt) / 60000;
      const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
      const calledT = T.filter(t => t.calledAt);
      const longest = waiting.length ? mins(Math.max(...waiting.map(t => now - t.createdAt))) : 0;
      const consult = seen.filter(t => t.doneAt && t.calledAt).map(t => (t.doneAt - t.calledAt) / 60000);

      // arrivals by hour (India time)
      const counts = {}; T.forEach(t => { const h = istHourOf(t.createdAt); counts[h] = (counts[h] || 0) + 1; });
      const hs = Object.keys(counts).map(Number), hNow = istHourOf(now);
      const h0 = Math.min(hNow, ...hs), h1 = Math.max(hNow, ...hs), hours = [];
      for (let h = h0; h <= h1; h++) hours.push(h);
      const maxC = Math.max(1, ...hours.map(h => counts[h] || 0));
      const peak = hours.reduce((p, h) => (counts[h] || 0) > (counts[p] || 0) ? h : p, hours[0]);

      // per department
      const rows = DEPTS.map(d => {
        const all = T.filter(t => t.dept === d.id), c = all.filter(t => t.calledAt);
        return { d, waiting: all.filter(t => t.status === "waiting").length, seen: all.filter(t => t.status === "done").length, missed: all.filter(t => t.status === "missed").length,
          wait: avg(c.map(waitMin)), outs: (s.log || []).filter(l => l.dept === d.id).length, total: all.length };
      });
      const maxWait = Math.max(1, ...rows.map(r => r.wait));
      const worst = rows.slice().sort((a, b) => b.wait - a.wait)[0];

      // out-of-turn reasons
      const rc = {}; (s.log || []).forEach(l => { rc[l.reason] = (rc[l.reason] || 0) + 1; });
      const reasons = REASONS.map(r => ({ r, n: rc[r.id] || 0 })).filter(x => x.n).sort((a, b) => b.n - a.n);
      const maxR = Math.max(1, ...reasons.map(x => x.n));

      root.innerHTML = `<section class="wrap admin">
        <div class="stop"><div><p class="eyebrow">Hospital dashboard · ${esc(s.hospital)} · today</p><h1 class="display">OPD at a glance</h1></div>
          <div class="a-tools"><span class="syncchip ${s.ai ? "live" : ""}" title="${s.ai ? "Departments are suggested by Gemini" : "Set GEMINI_API_KEY on the server to turn on AI triage"}"><i></i>${s.ai ? "AI triage on" : "AI triage off · keyword rules"}</span>
          <button class="btn small ghost" id="csv">${DLD}<span>Export CSV</span></button></div></div>
        ${s.sample || T.some(t => t.sample) ? `<div class="samplebar"><span>Showing sample patients for the demo.</span></div>` : ""}
        ${simBanner(s)}
        <div class="a-kpis">
          <div class="kpi"><b>${T.length}</b><span>tokens issued today</span></div>
          <div class="kpi"><b>${seen.length}</b><span>patients seen</span></div>
          <div class="kpi"><b>${waiting.length}</b><span>waiting right now</span></div>
          <div class="kpi"><b>${avg(calledT.map(waitMin))}<small> min</small></b><span>average wait to be called</span></div>
          <div class="kpi"><b>${longest}<small> min</small></b><span>longest current wait</span></div>
          <div class="kpi"><b>${avg(consult)}<small> min</small></b><span>average consultation</span></div>
          <div class="kpi"><b>${(s.alerts || []).length}</b><span>emergency alerts today</span></div>
          <div class="kpi"><b>${(() => { const x = (s.alerts || []).filter(al => al.ackAt).map(al => (al.ackAt - al.createdAt) / 1000); return x.length ? Math.round(x.reduce((p, q) => p + q, 0) / x.length) : 0; })()}<small> sec</small></b><span>average time for staff to see an alert</span></div>
        </div>
        <div class="a-grid">
          <div class="card a-wide"><div class="cardhead"><h2>Arrivals by hour</h2><span class="muted small">Peak: <b>${hourLabel(peak)}</b>, ${counts[peak] || 0} patients</span></div>
            <div class="hbars" role="img" aria-label="Patients arriving each hour today">${hours.map(h => `<div class="hb ${h === peak ? "peak" : ""}"><span class="hv tnum">${counts[h] || 0}</span><span class="hbar" style="height:${Math.round(100 * (counts[h] || 0) / maxC)}%"></span><span class="hl">${hourLabel(h)}</span></div>`).join("")}</div>
            <p class="small muted">Use this to put more doctors on in the busiest hours.</p></div>
          <div class="card"><div class="cardhead"><h2>Wait to be called</h2><span class="muted small">average, minutes</span></div>
            <div class="hrows">${rows.map(r => `<div class="hrow"><span class="hn">${r.d.en}</span><div class="htrack"><span class="${r === worst && r.wait ? "warn" : ""}" style="width:${Math.round(100 * r.wait / maxWait)}%"></span></div><span class="hval tnum">${r.wait} min</span></div>`).join("")}</div>
            ${worst && worst.wait ? `<p class="small muted">${worst.d.en} has the longest wait today.</p>` : ""}</div>
          <div class="card"><div class="cardhead"><h2>Why people went out of turn</h2><span class="muted small">${(s.log || []).length} calls</span></div>
            ${reasons.length ? `<div class="hrows">${reasons.map(x => `<div class="hrow"><span class="hn">${x.r.en}</span><div class="htrack"><span class="amber" style="width:${Math.round(100 * x.n / maxR)}%"></span></div><span class="hval tnum">${x.n}</span></div>`).join("")}</div>`
              : `<p class="muted">No out-of-turn calls yet today.</p>`}
            <p class="small muted">Every skip has a reason, so misuse is easy to spot.</p></div>
          <div class="card a-wide"><div class="cardhead"><h2>By department</h2></div>
            <div style="overflow-x:auto"><table class="a-table"><thead><tr><th>Department</th><th>Room</th><th>Waiting</th><th>Seen</th><th>No-shows</th><th>Avg. wait</th><th>Out of turn</th><th>Crowding now</th><th>Per patient</th></tr></thead>
            <tbody>${rows.map(r => `<tr><td><b>${r.d.en}</b></td><td>${r.d.room}</td><td class="tnum">${r.waiting}</td><td class="tnum">${r.seen}</td><td class="tnum">${r.missed}</td><td class="tnum">${r.wait} min</td><td class="tnum">${r.outs}</td><td>${r.d.help ? "" : crowdBadge(s, r.d.id, "en")}</td><td class="tnum small">${(() => { const st = serviceStats(s, r.d.id); return `${st.avg} min · ${st.source === "history" ? `last ${st.n}` : "default"}`; })()}</td></tr>`).join("")}</tbody></table></div></div>
          ${demoPanel(s)}
        </div></section>`;

      wireDemoPanel(root, render);
      $("#csv", root).onclick = () => {
        const q = v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
        const tm = ts => ts ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
        const lines = [["Token", "Department", "Status", "Arrived", "Called", "Wait (min)", "Out of turn", "Urgent flag", "Registered by staff", "Demo data"].map(q).join(",")]
          .concat(T.map(t => [t.code, DEPT[t.dept].en, t.status, tm(t.createdAt), tm(t.calledAt), t.calledAt ? Math.round(waitMin(t)) : "", t.outOfTurn ? REASON[t.outOfTurn] : "", t.urgent ? "yes" : "", t.assisted ? "yes" : "", t.sample ? "yes" : ""].map(q).join(",")));
        const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `baari-opd-${s.date}.csv`;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      };
    }
    render(); return render;
  }

  /* ---------- Router ---------- */
  const VIEWS = {
    home: viewHome, patient: viewHub, register: r => viewFlow(r, "register"), status: r => viewFlow(r, "status"), track: r => viewFlow(r, "status"), assist: r => viewFlow(r, "assist"), queue: viewQueue,
    slip: viewSlip, find: viewFind, help: viewHelp, settings: viewSettings, staff: viewStaff, display: viewDisplay, admin: viewAdmin
  };
  let refresh = null;
  function navigate() {
    if (!Store.state) return; // still loading: init() renders when the data arrives
    const v = (location.hash || "").slice(1);
    /* Shared token link (#t-<id>), e.g. from an SMS: follow that token on this phone */
    const shared = /^t-([a-f0-9]{16})$/i.exec(v);
    if (shared) {
      const t = Store.state.tokens.find(x => x.id === shared[1]);
      if (t) trackToken(t);
      else setTimeout(() => toast(L3(getLang(), "यह टोकन आज की सूची में नहीं मिला।", "This token isn’t in today’s list.", "एह् टोकन अज्जै दी लिस्ट च नेईं लब्भा।"), "err"), 300);
      location.replace("#status"); return;
    }
    const verify = /^verify-([a-f0-9]{8,32})$/.exec(v);
    const name = verify ? "verify" : (VIEWS[v] ? v : "home");
    document.body.dataset.view = name;
    try { speechSynthesis.cancel(); } catch (e) {}
    closeSOS(); closeAllSheets();
    const mb = $("#menubtn"), mn = $("#mainnav"); if (mb && mn) { mb.setAttribute("aria-expanded", "false"); mn.classList.remove("open"); document.body.classList.remove("menu-open"); }
    const navName = ["register", "status", "track", "slip", "find", "help", "queue", "settings"].includes(name) ? "patient" : name === "assist" ? "staff" : name;
    document.querySelectorAll("[data-nav]").forEach(a => { const on = a.dataset.nav === navName; a.classList.toggle("active", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const old = $("#app"), app = old.cloneNode(false); old.replaceWith(app);
    applyNav();
    app.classList.add("page-in");
    refresh = verify ? viewVerify(app, verify[1]) : VIEWS[name](app);
    applyNav(); updateAlarm();
    window.scrollTo(0, 0);
    const h = app.querySelector("h1"); if (h && name !== "home") { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    maybeLangPicker();
  }
  Store.on(() => { refresh && refresh(); updateAlarm(); });
  setInterval(() => { refresh && refresh(); }, 20000);
  addEventListener("hashchange", navigate);
  if (ls.get("baari-lang")) setLang(getLang()); else document.documentElement.lang = "hi";
  applyDisplay();
  mountSOS(); wireNav(); applyNav();
  Store.init().then(navigate).catch(e => {
    console.error(e);
    $("#app").innerHTML = `<p class="loading">Couldn’t reach the QueueSetu server. Check that it’s running and that you’re online, then reload the page.</p>`;
  });
})();
