/* Shared by the server (Node) and the browser: hospital setup and queue rules. */
(function (root) {
  const DEPTS = [
    { id: "MED", prefix: "M", en: "Medicine", hi: "मेडिसिन", room: "Room 12", roomHi: "कमरा 12", doi: "मेडिसिन", roomDoi: "कमरा 12", avg: 5 },
    { id: "ORT", prefix: "O", en: "Orthopaedics", hi: "हड्डी रोग", room: "Room 7", roomHi: "कमरा 7", doi: "हड्डियें दा बिभाग", roomDoi: "कमरा 7", avg: 6 },
    { id: "PAE", prefix: "P", en: "Paediatrics", hi: "बाल रोग", room: "Room 3", roomHi: "कमरा 3", doi: "बच्चें दा बिभाग", roomDoi: "कमरा 3", avg: 5 },
    { id: "GYN", prefix: "G", en: "Gynaecology", hi: "स्त्री रोग", room: "Room 9", roomHi: "कमरा 9", doi: "जनानियें दा बिभाग", roomDoi: "कमरा 9", avg: 7 },
    { id: "EYE", prefix: "E", en: "Eye", hi: "नेत्र रोग", room: "Room 15", roomHi: "कमरा 15", doi: "अक्खीं दा बिभाग", roomDoi: "कमरा 15", avg: 4 },
    { id: "SKN", prefix: "S", en: "Skin", hi: "त्वचा रोग", room: "Room 18", roomHi: "कमरा 18", doi: "चमड़ी दा बिभाग", roomDoi: "कमरा 18", avg: 4 },
    { id: "HLP", prefix: "H", en: "Help desk", hi: "हेल्प डेस्क", room: "Help desk", roomHi: "हेल्प डेस्क", doi: "हेल्प डेस्क", roomDoi: "हेल्प डेस्क", avg: 3, help: true }
  ];
  const CLINICS = DEPTS.filter(d => !d.help);
  const DEPT = Object.fromEntries(DEPTS.map(d => [d.id, d]));

  const REASONS = [
    { id: "emergency", en: "Emergency" },
    { id: "elderly", en: "Elderly (75+)" },
    { id: "pregnant", en: "Pregnant, unwell" },
    { id: "disability", en: "Disability" },
    { id: "report", en: "Report review only" },
    { id: "doctor", en: "Doctor’s request" }
  ];
  const REASON = Object.fromEntries(REASONS.map(r => [r.id, r.en]));
  const SKIP_REASONS = [
    { id: "absent", en: "Not present when called" }, { id: "left", en: "Left the hospital" },
    { id: "other_dept", en: "Needs another department" }, { id: "duplicate", en: "Duplicate registration" }, { id: "other", en: "Other" }
  ];
  const SKIP_REASON = Object.fromEntries(SKIP_REASONS.map(r => [r.id, r.en]));

  /* Rule-based routing from what the patient says (Hindi, Hinglish, English). */
  const ROUTES = [
    ["PAE", ["बच्चे", "bachch", "बच्च", "baby", "child", "shishu", "शिशु", "beta ", "beti", "vaccin", "टीका", "teeka"]],
    ["GYN", ["गर्भ", "माहवारी", "pregnan", "garbh", "गर्भ", "period", "mahwari", "माहवारी", "delivery", "prasav", "प्रसव"]],
    ["ORT", ["हड्डी", "जोड़", "कमर दा दर्द", "गोड्ड", "मोच", "haddi", "हड्डी", "fracture", "joint", "jod", "जोड़", "ghutn", "घुटन", "kamar", "कमर", "back pain", "moch", "मोच", "knee", "sprain", "plaster", "shoulder", "कंधा"]],
    ["EYE", ["अक्ख", "अक्खीं", "नज़र", "ऐनक", "aankh", "aakh", "आँख", "आंख", "eye", "chashm", "चश्म", "vision", "dhundh", "धुंध"]],
    ["SKN", ["चमड़ी", "खारश", "दाने", "एलर्जी", "kharish", "khujli", "खुजली", "skin", "twacha", "त्वचा", "rash", "daane", "दाने", "allerg", "itch"]]
  ];

  const code = (d, n) => DEPT[d].prefix + "-" + String(n).padStart(2, "0");
  function suggestDept(text) {
    const t = " " + String(text || "").toLowerCase() + " ";
    for (const [d, keys] of ROUTES) if (keys.some(k => t.includes(k))) return d;
    return "MED";
  }
  /* Place in line: arrival time, or the time staff sent the patient to the end of the queue. */
  const queueKey = t => t.queuedAt || t.createdAt;
  const waitingIn = (s, d) => s.tokens.filter(t => t.dept === d && t.status === "waiting")
    .sort((a, b) => queueKey(a) - queueKey(b) || a.num - b.num);
  const currentIn = (s, d) => s.tokens.filter(t => t.dept === d && t.status === "called")
    .sort((a, b) => b.calledAt - a.calledAt)[0] || null;
  const aheadOf = (s, t) => waitingIn(s, t.dept).findIndex(x => x.id === t.id);
  /* Doctor status adds to the wait: on break or delayed by N minutes. */
  function docDelay(s, d) {
    const doc = s.doctors && s.doctors[d];
    if (!doc || doc.status === "available") return 0;
    const left = doc.until ? Math.max(0, Math.round((doc.until - Date.now()) / 60000)) : (doc.mins || 0);
    return left;
  }
  /* ---------- Waiting time ----------
     Defaults the hospital can change (server env vars, sent to every screen as state.config). */
  const DEFAULTS = {
    history: 10,                         // use the last N completed patients of the same queue
    validMin: 0.5, validMax: 90,         // ignore service times outside this range (minutes): mistakes, not consultations
    fallback: Object.fromEntries(DEPTS.map(d => [d.id, d.avg])), // minutes per patient when a queue has no history yet
    crowd: { moderate: { wait: 20, people: 6 }, high: { wait: 45, people: 12 }, critical: { wait: 90, people: 20 } }
  };
  const cfg = s => {
    const c = (s && s.config) || {};
    return { history: c.history || DEFAULTS.history, validMin: c.validMin || DEFAULTS.validMin, validMax: c.validMax || DEFAULTS.validMax,
      fallback: Object.assign({}, DEFAULTS.fallback, c.fallback || {}), crowd: Object.assign({}, DEFAULTS.crowd, c.crowd || {}) };
  };
  /* Average consultation length from the last 10 completed patients of this queue (one doctor per department). */
  function serviceStats(s, d) {
    if (s.service && s.service[d]) return s.service[d]; // already worked out by the server
    const c = cfg(s), fb = Number(c.fallback[d]) || (DEPT[d] ? DEPT[d].avg : 5);
    const recent = (s.tokens || [])
      .filter(t => t.dept === d && t.status === "done" && t.calledAt && t.doneAt)
      .map(t => ({ at: t.doneAt, min: (t.svcMs != null ? t.svcMs : t.doneAt - t.calledAt) / 60000 }))
      .filter(x => Number.isFinite(x.min) && x.min >= c.validMin && x.min <= c.validMax)
      .sort((a, b) => b.at - a.at)
      .slice(0, c.history);
    if (!recent.length) return { avg: fb, n: 0, source: "fallback" };
    const avg = recent.reduce((a, x) => a + x.min, 0) / recent.length;
    return { avg: Math.round(avg * 10) / 10, n: recent.length, source: "history" };
  }
  /* Minutes left for the patient being seen now: average minus time already spent, at least 1. */
  function remainingNow(s, d, avg, now) {
    const cur = currentIn(s, d);
    if (!cur || !cur.calledAt) return 0;
    const spent = Math.max(0, ((now || Date.now()) - cur.calledAt) / 60000);
    return Math.max(1, avg - spent);
  }
  /* Rounded the way people say it: exact under 10 minutes, then to the nearest 5. */
  const roundWait = m => m < 10 ? Math.max(1, Math.round(m)) : Math.round(m / 5) * 5;
  function estMin(s, t, now) {
    const a = aheadOf(s, t);
    if (a < 0) return 0;
    const { avg } = serviceStats(s, t.dept);
    return roundWait(a * avg + remainingNow(s, t.dept, avg, now) + docDelay(s, t.dept));
  }
  function queueEst(s, d, now) {
    const n = waitingIn(s, d).length, { avg } = serviceStats(s, d);
    return { n, m: roundWait(n * avg + remainingNow(s, d, avg, now) + docDelay(s, d)) };
  }

  /* ---------- Overcrowding: low, moderate, high, critical ---------- */
  const CROWD_LEVELS = ["low", "moderate", "high", "critical"];
  function crowdLevel(s, d, now) {
    const { n, m } = queueEst(s, d, now), th = cfg(s).crowd;
    const over = k => (th[k] && (m >= th[k].wait || n >= th[k].people));
    const level = over("critical") ? "critical" : over("high") ? "high" : over("moderate") ? "moderate" : "low";
    return { level, n, m };
  }

  /* Possible emergencies: flag them, never diagnose. */
  const URGENT = ["chest pain", "seene", "सीने", "chhati", "छाती", "saans", "सांस", "साँस", "breath", "behosh", "बेहोश", "unconscious", "faint", "bleeding", "khoon", "खून", "stroke", "lakwa", "लकवा", "accident", "दुर्घटना", "burn", "jal gaya", "जल गया", "seizure", "fits", "daura", "दौरा", "poison", "zeher", "ज़हर", "जहर", "snake", "saanp", "सांप", "छाती च दर्द", "छाती च दर्द", "साह्", "साह् नेईं", "बेहोश", "खून बगा", "खून बग", "लकवा", "हादसा", "सड़ी गे", "दौरा पौना", "जैह्र", "सप्प"];
  function rulesTriage(text) {
    const t = " " + String(text || "").toLowerCase() + " ";
    const urgentWord = URGENT.find(k => t.includes(k)) || null;
    const words = String(text || "").split(/[\s,.;:!?।]+/).filter(Boolean);
    const said = k => words.find(w => w.toLowerCase().includes(k.trim())) || k.trim();
    let dept = "MED", word = null;
    for (const [d, keys] of ROUTES) { const k = keys.find(x => t.includes(x)); if (k) { dept = d; word = said(k); break; } }
    return {
      dept, urgent: Boolean(urgentWord), source: "rules",
      why_en: urgentWord ? `“${said(urgentWord)}” can be an emergency.` : word ? `Based on the word “${word}”.` : "General complaints go to Medicine.",
      why_hi: urgentWord ? `“${said(urgentWord)}” आपातकालीन हो सकता है।` : word ? `“${word}” शब्द के आधार पर।` : "सामान्य तकलीफ़ के लिए मेडिसिन।",
      why_doi: urgentWord ? `“${said(urgentWord)}” एमरजेंसी होई सकदी ऐ।` : word ? `“${word}” शब्द दे आधार पर।` : "आम तकलीफें आस्तै मेडिसिन।"
    };
  }

  /* ---------- Sample hospital: three floors (configurable) ----------
     Units: 400 × 312 per floor. Ground floor: entrance, registration, help desk, waiting hall, emergency, pharmacy, lab,
     Medicine and Paediatrics. First floor: Orthopaedics, Eye, Skin. Second floor: Gynaecology.
     One staircase joins all three floors. Lift A stops at Ground and First only. Lift B stops at Ground and Second only,
     so "Avoid stairs" between the First and Second floor goes down Lift A and up Lift B.
     Replace FLOORS, PLACES, NODES, EDGES and LINKS with the hospital's own plan. */
  const FLOORS = [
    { en: "Ground floor", hi: "भूतल (ग्राउंड फ़्लोर)", doi: "थल्ली मंजल (ग्राउंड फ्लोर)", short: { en: "Ground", hi: "भूतल", doi: "थल्ली मंजल" } },
    { en: "First floor", hi: "पहली मंज़िल", doi: "पैह्ली मंजल", short: { en: "Floor 1", hi: "पहली मंज़िल", doi: "पैह्ली मंजल" } },
    { en: "Second floor", hi: "दूसरी मंज़िल", doi: "दूई मंजल", short: { en: "Floor 2", hi: "दूसरी मंज़िल", doi: "दूई मंजल" } }
  ];
  const PLACES = {
    GATE: { floor: 0, en: "the main gate", hi: "मुख्य गेट", doi: "मेन गेट", label: "Main gate", door: [200, 296], at: "GATE" },
    REG:  { floor: 0, en: "Registration", hi: "रजिस्ट्रेशन काउंटर", doi: "रजिस्ट्रेशन काउंटर", label: "Registration", rect: [132, 236, 56, 30], door: [188, 251], at: "S251" },
    HLP:  { floor: 0, en: "the Help desk", hi: "हेल्प डेस्क", doi: "हेल्प डेस्क", label: "Help desk", rect: [132, 196, 56, 32], door: [188, 212], at: "S212" },
    HALL: { floor: 0, en: "the waiting hall", hi: "वेटिंग हॉल", doi: "वेटिंग हॉल", label: "Waiting hall", sub: "Hall display", rect: [216, 196, 164, 74], door: [216, 232], at: "S232" },
    EMR:  { floor: 0, en: "Emergency", hi: "इमरजेंसी", doi: "एमरजेंसी (Casualty)", label: "Emergency", sub: "24 × 7", rect: [20, 250, 100, 40], door: [120, 272], at: "E120" },
    MED:  { floor: 0, en: "Room 12 (Medicine)", hi: "कमरा 12 (मेडिसिन)", doi: "कमरा 12 (मेडिसिन)", label: "Room 12", sub: "Medicine", rect: [20, 12, 100, 52], door: [70, 64], at: "U70" },
    PHA:  { floor: 0, en: "the pharmacy", hi: "दवा काउंटर", doi: "दुआई काउंटर", label: "Pharmacy", rect: [130, 12, 60, 52], door: [160, 64], at: "U160" },
    LAB:  { floor: 0, en: "the lab", hi: "लैब", doi: "लैब", label: "Lab", rect: [216, 98, 56, 66], door: [244, 164], at: "L244" },
    PAE:  { floor: 0, en: "Room 3 (Paediatrics)", hi: "कमरा 3 (बाल रोग)", doi: "कमरा 3 (बच्चे)", label: "Room 3", sub: "Paediatrics", rect: [20, 196, 100, 44], door: [70, 196], at: "L70" },
    ORT:  { floor: 1, en: "Room 7 (Orthopaedics)", hi: "कमरा 7 (हड्डी रोग)", doi: "कमरा 7 (हड्डियां)", label: "Room 7", sub: "Orthopaedics", rect: [20, 12, 100, 52], door: [70, 64], at: "F1_U70" },
    EYE:  { floor: 1, en: "Room 15 (Eye)", hi: "कमरा 15 (नेत्र रोग)", doi: "कमरा 15 (अक्खीं)", label: "Room 15", sub: "Eye", rect: [130, 12, 66, 52], door: [163, 64], at: "F1_U163" },
    SKN:  { floor: 1, en: "Room 18 (Skin)", hi: "कमरा 18 (त्वचा रोग)", doi: "कमरा 18 (चमड़ी)", label: "Room 18", sub: "Skin", rect: [20, 98, 100, 66], door: [70, 164], at: "F1_L70" },
    GYN:  { floor: 2, en: "Room 9 (Gynaecology)", hi: "कमरा 9 (स्त्री रोग)", doi: "कमरा 9 (जनानियां)", label: "Room 9", sub: "Gynaecology", rect: [20, 12, 100, 52], door: [70, 64], at: "F2_U70" },
    // Stairs and lifts, one entry per floor they stop at
    ST0: { floor: 0, kind: "stairs", en: "the stairs", hi: "सीढ़ियाँ", doi: "पौड़ियां", label: "Stairs", rect: [210, 12, 40, 52], door: [230, 64], at: "U230" },
    ST1: { floor: 1, kind: "stairs", en: "the stairs", hi: "सीढ़ियाँ", doi: "पौड़ियां", label: "Stairs", rect: [210, 12, 40, 52], door: [230, 64], at: "F1_U230" },
    ST2: { floor: 2, kind: "stairs", en: "the stairs", hi: "सीढ़ियाँ", doi: "पौड़ियां", label: "Stairs", rect: [210, 12, 40, 52], door: [230, 64], at: "F2_U230" },
    LA0: { floor: 0, kind: "lift", lift: "A", en: "Lift A", hi: "लिफ़्ट A", doi: "लिफ्ट A", label: "Lift A", rect: [258, 12, 40, 52], door: [278, 64], at: "U278" },
    LA1: { floor: 1, kind: "lift", lift: "A", en: "Lift A", hi: "लिफ़्ट A", doi: "लिफ्ट A", label: "Lift A", rect: [258, 12, 40, 52], door: [278, 64], at: "F1_U278" },
    LB0: { floor: 0, kind: "lift", lift: "B", en: "Lift B", hi: "लिफ़्ट B", doi: "लिफ्ट B", label: "Lift B", rect: [306, 12, 74, 52], door: [343, 64], at: "U343" },
    LB2: { floor: 2, kind: "lift", lift: "B", en: "Lift B", hi: "लिफ़्ट B", doi: "लिफ्ट B", label: "Lift B", rect: [306, 12, 74, 52], door: [343, 64], at: "F2_U343" }
  };
  /* Lift shafts drawn greyed out on floors where that lift does not stop */
  const NO_STOP = { 1: [{ label: "Lift B", rect: [306, 12, 74, 52] }], 2: [{ label: "Lift A", rect: [258, 12, 40, 52] }] };
  const CORRIDORS = { 0: "M200 300 V80 M40 80 H362 M40 180 H290 M200 272 H120", 1: "M40 80 H300 M200 80 V180 M40 180 H200", 2: "M40 80 H362" };
  const PLACE_HI_LABEL = { GATE: "मुख्य गेट", REG: "रजिस्ट्रेशन", HLP: "हेल्प डेस्क", HALL: "वेटिंग हॉल", EMR: "इमरजेंसी", PHA: "दवा काउंटर", LAB: "लैब", ST0: "सीढ़ियाँ", ST1: "सीढ़ियाँ", ST2: "सीढ़ियाँ", LA0: "लिफ़्ट A", LA1: "लिफ़्ट A", LB0: "लिफ़्ट B", LB2: "लिफ़्ट B" };
  const NODES = {
    GATE: [200, 296], S272: [200, 272], S251: [200, 251], S232: [200, 232], S212: [200, 212], S180: [200, 180], S80: [200, 80],
    U70: [70, 80], U160: [160, 80], U230: [230, 80], U278: [278, 80], U343: [343, 80],
    L70: [70, 180], L244: [244, 180], E120: [120, 272],
    F1_U70: [70, 80], F1_U163: [163, 80], F1_S80: [200, 80], F1_U230: [230, 80], F1_U278: [278, 80], F1_S180: [200, 180], F1_L70: [70, 180],
    F2_U70: [70, 80], F2_S80: [200, 80], F2_U230: [230, 80], F2_U343: [343, 80]
  };
  const EDGES = [["GATE", "S272"], ["S272", "S251"], ["S251", "S232"], ["S232", "S212"], ["S212", "S180"], ["S180", "S80"],
    ["U70", "U160"], ["U160", "S80"], ["S80", "U230"], ["U230", "U278"], ["U278", "U343"],
    ["L70", "S180"], ["S180", "L244"], ["S272", "E120"],
    ["F1_U70", "F1_U163"], ["F1_U163", "F1_S80"], ["F1_S80", "F1_U230"], ["F1_U230", "F1_U278"], ["F1_S80", "F1_S180"], ["F1_S180", "F1_L70"],
    ["F2_U70", "F2_S80"], ["F2_S80", "F2_U230"], ["F2_U230", "F2_U343"]];
  /* Between floors: [from place, to place, kind, cost in metres-equivalent]. Lifts cost more (waiting) but have no steps. */
  const LINKS = [["ST0", "ST1", "stairs", 60], ["ST1", "ST2", "stairs", 60], ["LA0", "LA1", "lift", 90], ["LB0", "LB2", "lift", 110]];
  const floorOf = n => { const m = /^F(\d)_/.exec(n); return m ? Number(m[1]) : 0; };
  const ADJ = {}; // walking only, per floor
  EDGES.forEach(([a, b]) => { (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a); });
  const VADJ = {}; // between floors
  LINKS.forEach(([pa, pb, kind, cost]) => { const a = PLACES[pa].at, b = PLACES[pb].at; (VADJ[a] = VADJ[a] || []).push({ v: b, kind, cost, from: pa, to: pb }); (VADJ[b] = VADJ[b] || []).push({ v: a, kind, cost, from: pb, to: pa }); });
  const MAP = { places: PLACES, nodes: NODES, edges: EDGES, links: LINKS, floors: FLOORS, corridors: CORRIDORS, noStop: NO_STOP, gate: NODES.GATE };
  const LANDMARKS = ["REG", "HALL", "HLP", "PHA", "LAB"];
  const placeAt = (node, kindOnly) => Object.keys(PLACES).find(k => PLACES[k].at === node && (!kindOnly || PLACES[k].kind));

  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  /* Dijkstra. opts.vertical: allow stairs and lifts; opts.avoidStairs: stair links are removed before the search. */
  function shortest(from, to, opts = {}) {
    const ids = Object.keys(NODES), D = {}, prev = {}, todo = new Set(ids);
    ids.forEach(n => { D[n] = Infinity; }); D[from] = 0;
    while (todo.size) {
      let u = null; todo.forEach(n => { if (u === null || D[n] < D[u]) u = n; });
      todo.delete(u); if (u === to || D[u] === Infinity) break;
      (ADJ[u] || []).forEach(v => { const alt = D[u] + dist(NODES[u], NODES[v]); if (alt < D[v]) { D[v] = alt; prev[v] = u; } });
      if (opts.vertical) (VADJ[u] || []).forEach(e => { if (opts.avoidStairs && e.kind === "stairs") return; const alt = D[u] + e.cost; if (alt < D[e.v]) { D[e.v] = alt; prev[e.v] = u; } });
    }
    if (D[to] === Infinity) return null;
    const path = []; for (let n = to; n; n = prev[n]) { path.unshift(n); if (n === from) break; }
    return path[0] === from ? path : null;
  }
  const head = (a, b) => [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
  const sideOf = (h, v) => (h[0] * v[1] - h[1] * v[0]) > 0 ? "right" : "left"; // screen y points down
  const SIDE_HI = { left: "बाएँ", right: "दाएँ" }, SIDE_DOI = { left: "खब्बे", right: "सज्जे" };
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  function cornerLabel(node, h) {
    const along = h[0] === 0, n = String(node || "").replace(/^F\d_/, ""), upper = floorOf(String(node || "")) > 0;
    if (n === "S80") return along && !upper ? { en: "at the end of the main hallway", hi: "मुख्य गलियारे के आखिर में", doi: "मुक्ख गलियारे दे अखीर च" } : { en: "at the main hallway", hi: "मुख्य गलियारे पर", doi: "मुक्ख गलियारे पर" };
    if (n === "S180") return along && !upper ? { en: "at the first crossing corridor", hi: "पहले गलियारे पर", doi: "पैह्ले गलियारे पर" } : { en: "at the lower corridor", hi: "नीचे वाले गलियारे पर", doi: "थल्ले आह्ले गलियारे पर" };
    if (n === "S272") return along ? { en: "at the first turning", hi: "पहले मोड़ पर", doi: "पैह्ले मोड़ पर" } : { en: "at the main hallway", hi: "मुख्य गलियारे पर", doi: "मुक्ख गलियारे पर" };
    return { en: "at the corridor", hi: "गलियारे पर", doi: "गलियारे पर" };
  }
  /* Walking directions between two places on the same floor. */
  function floorRoute(fromId, toId, startAt) {
    const A = PLACES[fromId] || PLACES.GATE, B = PLACES[toId];
    const nodePath = shortest(A.at, B.at) || [A.at];
    const pts = [{ p: A.door, n: null }].concat(nodePath.map(n => ({ p: NODES[n], n })), [{ p: B.door, n: null }])
      .filter((x, i, arr) => i === 0 || dist(x.p, arr[i - 1].p) > 0.5);
    // segments, merged when they keep the same heading
    const segs = [];
    for (let i = 1; i < pts.length; i++) {
      const h = head(pts[i - 1].p, pts[i].p), last = segs[segs.length - 1];
      if (last && last.h[0] === h[0] && last.h[1] === h[1]) { last.via.push(last.end); last.end = pts[i].n; last.b = pts[i].p; }
      else segs.push({ a: pts[i - 1].p, b: pts[i].p, h, start: pts[i - 1].n, end: pts[i].n, via: [] });
    }
    const exiting = fromId !== "GATE" && segs.length && segs[0].start === null;
    const entering = segs.length && segs[segs.length - 1].end === null && segs.length > (exiting ? 1 : 0);
    const corr = segs.slice(exiting ? 1 : 0, entering ? segs.length - 1 : segs.length);
    const steps = [];
    if (fromId === "GATE") steps.push({ en: "Enter through the main gate.", hi: "मुख्य गेट से अंदर आएँ।", doi: "मेन गेट थमां अंदर आओ।" });
    else if (exiting && corr.length && A.kind === "stairs") { const d = sideOf(segs[0].h, corr[0].h); steps.push({ en: `Leave the stairs and turn ${d}.`, hi: `सीढ़ियों से निकलकर ${SIDE_HI[d]} मुड़ें।`, doi: `पौड़ियें थमां निकलियै ${SIDE_DOI[d]} पासै मुड़ो।` }); }
    else if (exiting && corr.length) { const d = sideOf(segs[0].h, corr[0].h); steps.push({ en: `Come out of ${A.en} and turn ${d}.`, hi: `${A.hi} से बाहर निकलकर ${SIDE_HI[d]} मुड़ें।`, doi: `${A.doi} थमां बाह्र निकलियै ${SIDE_DOI[d]} पासै मुड़ो।` }); }
    else if (!startAt) steps.push({ en: `Start at ${A.en}.`, hi: `${A.hi} से शुरू करें।`, doi: `${A.doi} थमां शुरू करो।` });
    corr.forEach((sg, i) => {
      const passed = sg.via.map(n => Object.keys(PLACES).find(k => PLACES[k].at === n && LANDMARKS.includes(k) && k !== fromId && k !== toId)).filter(Boolean).slice(0, 2)
        .map(k => ({ k, side: sideOf(sg.h, head(NODES[PLACES[k].at], PLACES[k].door)) }));
      const next = corr[i + 1];
      let en = "Walk straight", hi = "सीधे चलें", doi = "सिद्धे चलो";
      if (passed.length) {
        en += " past " + passed.map(x => `${PLACES[x.k].en} (on your ${x.side})`).join(" and ");
        hi += "। रास्ते में " + passed.map(x => `${PLACES[x.k].hi} आपके ${SIDE_HI[x.side]} हाथ पर`).join(" और ") + " रहेगा";
        doi += "। रस्ते च " + passed.map(x => `${PLACES[x.k].doi} तुंदे ${SIDE_DOI[x.side]} पासै`).join(", ") + " औग";
      }
      if (next) { const d = sideOf(sg.h, next.h), c = cornerLabel(sg.end, sg.h); en += `, then turn ${d} ${c.en}`; hi += `। फिर ${c.hi} ${SIDE_HI[d]} मुड़ें`; doi += `। फ्ही ${c.doi} ${SIDE_DOI[d]} पासै मुड़ो`; }
      steps.push({ en: en + ".", hi: hi + "।", doi: doi + "।" });
    });
    const lastH = corr.length ? corr[corr.length - 1].h : (segs[0] ? segs[0].h : [0, -1]);
    const deadEnd = (ADJ[B.at] || []).length === 1;
    const plain = steps.length > 1 && steps[steps.length - 1].en === "Walk straight." ? steps.pop() : null;
    const pre = plain ? { en: "Walk straight. ", hi: "सीधे चलें। ", doi: "सिद्धे चलो। " } : { en: "", hi: "", doi: "" };
    if (entering) {
      const d = sideOf(lastH, segs[segs.length - 1].h);
      steps.push({ en: `${pre.en}${cap(B.en)} ${B.kind === "stairs" ? "are" : "is"} ${deadEnd ? "at the end, " : ""}on your ${d}.`, hi: `${pre.hi}${B.hi} ${deadEnd ? "आखिर में, " : ""}आपके ${SIDE_HI[d]} हाथ पर ${B.kind === "stairs" ? "हैं" : "है"}।`, doi: `${pre.doi}${B.doi} ${deadEnd ? "अखीर च, " : ""}तुंदे ${SIDE_DOI[d]} पासै ${B.kind === "stairs" ? "न" : "ऐ"}।` });
    } else steps.push({ en: `${pre.en}${cap(B.en)} ${B.kind === "stairs" ? "are" : "is"} at the end of this corridor.`, hi: `${pre.hi}${B.hi} इसी गलियारे के आखिर में ${B.kind === "stairs" ? "हैं" : "है"}।`, doi: `${pre.doi}${B.doi} इस गलियारे दे अखीर च ${B.kind === "stairs" ? "न" : "ऐ"}।` });
    return { points: pts.map(x => x.p), steps };
  }
  /* A move between floors, in plain words */
  function floorStep(kind, via, fromFloor, toFloor) {
    const F = FLOORS[toFloor], up = toFloor > fromFloor, P = PLACES[via];
    if (kind === "stairs") return { kind, en: `Take the stairs ${up ? "up" : "down"} to the ${F.en}.`, hi: `सीढ़ियों से ${up ? "ऊपर" : "नीचे"} ${F.hi} पर जाएँ।`, doi: `पौड़ियां ${up ? "चढ़ियै" : "उतरियै"} ${F.doi} पर जाओ।` };
    return { kind, en: `Take ${P.en} ${up ? "up" : "down"} to the ${F.en}.`, hi: `${P.hi} से ${F.hi} पर जाएँ।`, doi: `${P.doi} कन्नै ${F.doi} पर जाओ।` };
  }
  /* Route between two places, across floors. opts.avoidStairs removes stair links before the route is worked out.
     Returns: legs (one per floor walked, with map points), steps in Hindi, English and Dogri, and ok=false if no route exists. */
  function route(fromId, toId, opts = {}) {
    const A = PLACES[fromId] || PLACES.GATE, B = PLACES[toId];
    const from = PLACES[fromId] ? fromId : "GATE";
    if (!B) return { ok: false, points: [], steps: [], legs: [], usesStairs: false };
    if (from === toId) return { ok: true, points: [A.door], legs: [{ floor: A.floor, from, to: toId, points: [A.door] }], steps: [{ en: `You are at ${B.en}.`, hi: `आप ${B.hi} पर हैं।`, doi: `तुस ${B.doi} कोल ओ।` }], usesStairs: false };
    const path = shortest(A.at, B.at, { vertical: true, avoidStairs: Boolean(opts.avoidStairs) });
    if (!path) return { ok: false, points: [], legs: [], usesStairs: false, steps: [{ en: "There is no step-free route to this place. Please ask at the Help desk for a wheelchair or someone to guide you.", hi: "यहाँ तक बिना सीढ़ी का रास्ता नहीं है। कृपया हेल्प डेस्क से व्हीलचेयर या साथ चलने वाले के लिए कहें।", doi: "इत्थै तक बिना पौड़ी दा रस्ता नेईं ऐ। किरपा करियै हेल्प डेस्क थमां व्हीलचेयर जां कुसै साथी आस्तै आखो।" }] };
    // Split the node path into walks on one floor, joined by stairs or lifts
    const hops = []; let legStart = from, legStartNode = path[0];
    for (let i = 1; i < path.length; i++) {
      const e = (VADJ[path[i - 1]] || []).find(x => x.v === path[i]);
      if (!e) continue;
      hops.push({ fromPlace: legStart, toPlace: e.from, kind: e.kind, via: e.from, nextPlace: e.to, fromFloor: floorOf(path[i - 1]), toFloor: floorOf(path[i]) });
      legStart = e.to; legStartNode = path[i];
    }
    const legs = [], steps = [];
    let cur = from, first = true;
    const walk = (a, b) => {
      if (a === b) return;
      const r = floorRoute(a, b, !first);
      legs.push({ floor: PLACES[a].floor, from: a, to: b, points: r.points });
      steps.push(...r.steps); first = false;
    };
    for (let i = 0; i < hops.length; i++) {
      const h = hops[i];
      walk(cur, h.toPlace);
      // merge stairs or lift rides that continue straight on (Ground → First → Second)
      let j = i, last = hops[i];
      while (hops[j + 1] && hops[j + 1].kind === h.kind && hops[j + 1].fromPlace === hops[j].nextPlace && hops[j + 1].via.slice(0, 2) === h.via.slice(0, 2)) { j++; last = hops[j]; }
      steps.push(floorStep(h.kind, h.via, h.fromFloor, last.toFloor));
      cur = last.nextPlace; i = j; first = false;
    }
    walk(cur, toId);
    if (!legs.length) legs.push({ floor: B.floor, from: cur, to: toId, points: [B.door] });
    return { ok: true, points: legs[0].points, legs, steps, usesStairs: hops.some(h => h.kind === "stairs"), usesLift: hops.some(h => h.kind === "lift"), floors: [...new Set(legs.map(l => l.floor))] };
  }
  const floorName = (placeOrDept, lang, short) => { const p = PLACES[placeOrDept]; if (!p) return ""; const F = FLOORS[p.floor]; return short ? F.short[lang] || F.short.en : F[lang] || F.en; };

  const api = { DEPTS, DEPT, CLINICS, REASONS, REASON, SKIP_REASONS, SKIP_REASON, ROUTES, URGENT, MAP, PLACES, PLACE_HI_LABEL, FLOORS, floorName, DEFAULTS, CROWD_LEVELS, cfg, code, suggestDept, rulesTriage, route, docDelay, waitingIn, currentIn, aheadOf, serviceStats, roundWait, estMin, queueEst, crowdLevel };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BaariShared = api;
})(typeof self !== "undefined" ? self : this);
