/* QueueSetu server: one live OPD queue shared by patient phones, the staff console and the hall display. */
const path = require("path");
const fs = require("fs");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");
const S = require("./public/shared.js");

/* ---------- Settings (environment variables) ---------- */
const PORT = Number(process.env.PORT) || 3000;
const STAFF_PIN = String(process.env.STAFF_PIN || "1234");
const ADMIN_PIN = String(process.env.ADMIN_PIN || "4321");
if (!/^\d{4,12}$/.test(STAFF_PIN) || !/^\d{4,12}$/.test(ADMIN_PIN)) console.warn("Warning: STAFF_PIN and ADMIN_PIN should be 4 to 12 digits. The login box only accepts numbers.");
const HOSPITAL = process.env.HOSPITAL_NAME || "Demo District Hospital";
const SEED_SAMPLE = (process.env.SEED_SAMPLE || "true") !== "false";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "state.json");
const TW = { sid: process.env.TWILIO_ACCOUNT_SID, token: process.env.TWILIO_AUTH_TOKEN, from: process.env.TWILIO_FROM };
const SMS_LIVE = Boolean(TW.sid && TW.token && TW.from);
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const AI_ON = Boolean(GEMINI_KEY);
const DEMO_MODE = (process.env.DEMO_MODE || "true") !== "false"; // demo and simulation controls for admins
const HELP_DESK_PHONE = /^[0-9+\- ]{6,16}$/.test(process.env.HELP_DESK_PHONE || "") ? process.env.HELP_DESK_PHONE : null;

/* "MED:Dr. A. Gupta,ORT:Dr. S. Khajuria" → { MED: "Dr. A. Gupta", ... } */
function pairs(v) {
  const out = {};
  String(v || "").split(",").map(x => x.split(":").map(y => y.trim())).forEach(([k, val]) => { if (k && val) out[k.toUpperCase()] = val; });
  return out;
}
/* Waiting time and crowding settings. Defaults live in public/shared.js (DEFAULTS). */
function readConfig() {
  const c = {};
  const hist = Number(process.env.WAIT_HISTORY); if (hist >= 1 && hist <= 50) c.history = Math.round(hist);
  const fb = {}; Object.entries(pairs(process.env.FALLBACK_MINUTES)).forEach(([d, m]) => { const n = Number(m); if (S.DEPT[d] && n > 0 && n <= 60) fb[d] = n; });
  if (Object.keys(fb).length) c.fallback = fb;
  // CROWD_THRESHOLDS="moderate:20/6,high:45/12,critical:90/20" → minutes of wait / people waiting
  const cr = {}; Object.entries(pairs(process.env.CROWD_THRESHOLDS)).forEach(([k, v]) => {
    const key = k.toLowerCase(), [w, p] = String(v).split("/").map(Number);
    if (["moderate", "high", "critical"].includes(key) && w > 0 && p > 0) cr[key] = { wait: w, people: p };
  });
  if (Object.keys(cr).length) c.crowd = Object.assign({}, S.DEFAULTS.crowd, cr);
  return c;
}
const CONFIG = readConfig();
/* Doctor on duty for each queue. Set DOCTORS for real use; the sample names only appear in demo mode. */
const ROSTER = pairs(process.env.DOCTORS);
const SAMPLE_DOCTORS = { MED: "Dr. Rakesh Gupta", ORT: "Dr. Sameer Khajuria", PAE: "Dr. Neha Bali", GYN: "Dr. Anita Sharma", EYE: "Dr. Imran Wani", SKN: "Dr. Priya Mahajan" };
const DOCTORS_ARE_SAMPLE = !Object.keys(ROSTER).length && SEED_SAMPLE;
const BASE_ROSTER = Object.keys(ROSTER).length ? ROSTER : SEED_SAMPLE ? SAMPLE_DOCTORS : {};

/* Emergency numbers shown to patients. 112 (national emergency) and 108 (ambulance) are India-wide.
   Add the hospital’s own verified number with HOSPITAL_EMERGENCY_PHONE. Format for EMERGENCY_CONTACTS: "112:National emergency,108:Ambulance". */
const KNOWN_HI = { "112": "राष्ट्रीय आपातकालीन नंबर", "108": "एम्बुलेंस", "102": "मातृ एवं शिशु एम्बुलेंस" };
const KNOWN_DOI = { "112": "राष्ट्री एमरजेंसी नंबर", "108": "एम्बुलेंस", "102": "मां-बच्चा एम्बुलेंस" };
const CONTACTS = String(process.env.EMERGENCY_CONTACTS || "112:National emergency,108:Ambulance").split(",")
  .map(x => x.split(":").map(y => y.trim())).filter(([n]) => /^[0-9+\- ]{3,16}$/.test(n || ""))
  .map(([number, label]) => ({ number, en: label || number, hi: KNOWN_HI[number] || label || number, doi: KNOWN_DOI[number] || label || number }));
if (process.env.HOSPITAL_EMERGENCY_PHONE && /^[0-9+\- ]{6,16}$/.test(process.env.HOSPITAL_EMERGENCY_PHONE))
  CONTACTS.unshift({ number: process.env.HOSPITAL_EMERGENCY_PHONE, en: "Hospital emergency desk", hi: "अस्पताल इमरजेंसी डेस्क", doi: "अस्पताल एमरजेंसी डेस्क" });

const SIGNS = ["chest", "breath", "faint", "bleeding", "injury", "stroke", "seizure", "burn", "poison", "other"];
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const uid = () => crypto.randomBytes(8).toString("hex");
const mask = p => { const d = String(p || "").replace(/\D/g, ""); return d.length >= 4 ? "•••• " + d.slice(-4) : ""; };
const normName = n => String(n || "").toLowerCase().replace(/\s+/g, " ").trim();

/* ---------- State ---------- */
function emptyState() {
  return { v: 3, date: today(), rev: 0, sample: false, counters: {}, tokens: [], log: [], sms: [], alerts: [], doctors: {}, audit: [], sim: null, demoKeys: [] };
}
function normalize(s) {
  s.counters = s.counters || {}; s.tokens = s.tokens || []; s.log = s.log || []; s.sms = s.sms || [];
  s.alerts = s.alerts || []; s.doctors = s.doctors || {}; s.audit = s.audit || []; s.demoKeys = s.demoKeys || [];
  if (s.sim && s.sim.running) s.sim = null; // a restart always stops the simulation
  return s;
}

const SAMPLE_NAMES = ["Ramesh Kumar", "Sunita Devi", "Mohd. Aslam", "Kamla Sharma", "Rajinder Singh", "Pooja Gupta", "Anil Bhat", "Shabnam Begum", "Vikram Jamwal", "Neelam Kumari", "Harbans Lal", "Rekha Thakur", "Arjun Manhas", "Fatima Bano", "Kuldeep Raina", "Asha Rani", "Manoj Sharma", "Parveen Akhter", "Sanjay Dogra", "Meena Devi", "Tarsem Lal", "Ritu Slathia", "Bashir Ahmed", "Jyoti Verma", "Gopal Das", "Simran Kaur", "Iqbal Hussain", "Santosh Kumari", "Deepak Choudhary", "Nisha Pandita", "Om Prakash", "Shazia Mir", "Balwant Singh", "Kiran Bala", "Tariq Lone"];
const SAMPLE_COMPLAINTS = { MED: ["Fever for 3 days", "Stomach pain", "Cough and cold", "BP check", "Sugar check", "Weakness and dizziness", "Headache", "Vomiting since morning"], ORT: ["Knee pain", "Back pain", "Wrist sprain", "Shoulder pain"], PAE: ["Child has fever", "Vaccination", "Child has cough"], GYN: ["Pregnancy check-up", "Pregnancy check-up, 7th month", "Irregular periods"], EYE: ["Blurry vision", "Red, watery eyes"], SKN: ["Itching rash", "Skin allergy"], HLP: ["Not sure which department", "Needs help with the form", "Lost the old slip"] };

function istHour(t = Date.now()) {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(t)).split(":").map(Number);
  return (h % 24) + m / 60;
}
function sampleState() {
  const s = emptyState(); s.sample = true;
  const now = Date.now(); let ni = 0;
  // OPD opened at 9:00 India time (shown as at least 2 and at most 8 hours of history)
  const span = Math.min(8, Math.max(2, istHour(now) - 9)) * 3600000;
  const open = now - span;
  // dept: [seen so far, being seen, waiting]
  const plan = { MED: [34, 1, 7], ORT: [14, 1, 3], PAE: [16, 1, 2], GYN: [9, 0, 2], EYE: [12, 1, 1], SKN: [8, 0, 2], HLP: [6, 1, 1] };
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [d, [done, called, waiting]] of Object.entries(plan)) {
    const avg = S.DEPT[d].avg, cl = SAMPLE_COMPLAINTS[d];
    const total = done + called + waiting;
    const doneWindow = Math.max(span - 45 * 60000, 30 * 60000);
    let num = 0, lastCall = open;
    for (let i = 0; i < total; i++) {
      num++;
      const status = i < done ? "done" : (i < done + called ? "called" : "waiting");
      let createdAt;
      if (i < done + called) { const f = (i + rnd() * 0.6) / (done + called); createdAt = open + doneWindow * (1 - Math.pow(1 - f, 1.5)); }
      else createdAt = now - (total - i) * avg * 60000 * 0.9 - 2 * 60000;
      const t = { id: uid(), dept: d, num, code: S.code(d, num), name: SAMPLE_NAMES[ni++ % SAMPLE_NAMES.length], complaint: cl[i % cl.length], lang: i % 3 ? "hi" : "en", phone: i % 2 ? "98765" + String(10000 + i * 37).slice(-5) : "", status, createdAt: Math.round(createdAt), sample: true };
      t.sms = Boolean(t.phone);
      if (status === "called") t.calledAt = now - 2 * 60000;
      if (status === "done") {
        t.calledAt = Math.round(Math.max(createdAt + (12 + rnd() * 45) * 60000, lastCall + avg * 60000 * 0.8));
        if (t.calledAt > now - 8 * 60000) t.calledAt = now - (8 + (done - i)) * 60000;
        t.doneAt = t.calledAt + avg * 60000 * (0.7 + rnd() * 0.6);
        lastCall = t.calledAt;
        if (rnd() < 0.05) t.status = "missed";
      }
      s.tokens.push(t);
    }
    s.counters[d] = num;
  }
  s.tokens.sort((x, y) => x.createdAt - y.createdAt);
  const pickDone = d => { const c = s.tokens.filter(t => t.dept === d && t.status === "done"); return c[Math.floor(rnd() * c.length)]; };
  [["MED", "elderly", "Age 81, came with a walker"], ["ORT", "emergency", "Suspected fracture after a fall"], ["MED", "emergency", "Chest pain, sent on to Emergency"],
   ["GYN", "pregnant", "Dizzy, 8th month"], ["MED", "elderly", "Age 78, alone"], ["EYE", "report", "Only showing test reports"], ["PAE", "disability", "Child in a wheelchair"], ["MED", "report", "Report review"]]
    .forEach(([d, reason, note]) => { const t = pickDone(d); if (!t) return; t.outOfTurn = reason; s.log.push({ id: uid(), t: t.calledAt, code: t.code, dept: d, reason, note, skipped: 1 + Math.floor(rnd() * 3), sample: true }); });
  s.tokens.forEach(t => { if (t.calledAt && S.DEPT[t.dept] && !S.DEPT[t.dept].help) t.doctor = BASE_ROSTER[t.dept] || null; if (t.doneAt) t.svcMs = t.doneAt - t.calledAt; });
  s.log.sort((x, y) => y.t - x.t);
  // Earlier today: one handled emergency request (sample)
  const at = now - 70 * 60000;
  s.alerts.push({ id: uid(), kind: "request", place: "HALL", signs: ["faint"], note: "", tokenId: null, code: null, dept: null, createdAt: at, ackAt: at + 40000, resolvedAt: at + 6 * 60000, sample: true });
  // Doctor status (sample): Eye running late, Skin doctor on a short break
  s.doctors.EYE = { status: "delayed", mins: 15, until: now + 15 * 60000, at: now };
  s.doctors.SKN = { status: "break", mins: 10, until: now + 10 * 60000, at: now };
  for (const d of Object.keys(plan)) nearSms(s, d);
  return s;
}

function load() {
  try {
    const s = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (s && s.date === today() && Array.isArray(s.tokens)) return normalize(s);
  } catch (e) { /* no saved state yet */ }
  return SEED_SAMPLE ? sampleState() : emptyState();
}
function save() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) { console.error("Could not save state:", e.message); }
}

let state = load();
let pendingSms = [];

/* ---------- Queue actions ---------- */
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
function queueSms(s, t, text) {
  const live = SMS_LIVE && !t.sample;
  const m = { id: uid(), t: Date.now(), to: t.phone, code: t.code, text, status: live ? "sending" : "simulated" };
  s.sms.unshift(m);
  s.sms = s.sms.slice(0, 60);
  if (live) pendingSms.push(m.id);
}
function nearSms(s, d) {
  S.waitingIn(s, d).forEach((t, i) => {
    if (i < 3 && t.phone && t.sms && !t.smsNear) {
      t.smsNear = true;
      queueSms(s, t, `QueueSetu: Token ${t.code}, your turn is close (${i === 0 ? "you are next" : i + " ahead"}). ${S.DEPT[d].help ? "Help desk" : S.DEPT[d].en + ", " + S.DEPT[d].room + ", " + S.floorName(d, "en")}.`);
    }
  });
}
function findDuplicate(s, name, phone) {
  const n = normName(name);
  return s.tokens.find(t => (t.status === "waiting" || t.status === "called") && normName(t.name) === n && (t.phone || "") === (phone || ""));
}
function actRegister(s, f) {
  const n = (s.counters[f.dept] || 0) + 1; s.counters[f.dept] = n;
  const t = { id: uid(), dept: f.dept, num: n, code: S.code(f.dept, n), name: f.name, phone: f.phone, complaint: f.complaint, lang: f.lang, sms: Boolean(f.phone && f.sms), urgent: Boolean(f.urgent), assisted: Boolean(f.assisted), status: "waiting", createdAt: Date.now() };
  s.tokens.push(t);
  if (t.urgent) s.alerts.unshift({ id: uid(), kind: "symptoms", place: "REG", signs: [], note: f.complaint, tokenId: t.id, code: t.code, dept: t.dept, createdAt: t.createdAt, ackAt: null, resolvedAt: null });
  nearSms(s, f.dept);
  return t;
}
function doctorName(s, d) {
  if (!S.DEPT[d] || S.DEPT[d].help) return null;
  return (s.doctors[d] && s.doctors[d].name) || BASE_ROSTER[d] || null;
}
function closeService(t, status) { // records how long the consultation took, for the waiting-time average
  t.status = status; t.doneAt = Date.now();
  if (t.calledAt && t.svcMs == null) t.svcMs = t.doneAt - t.calledAt;
}
function audit(s, entry) { s.audit.unshift(Object.assign({ id: uid(), t: Date.now() }, entry)); s.audit = s.audit.slice(0, 300); }
function resolveTokenAlerts(s, tokenId) {
  const now = Date.now();
  s.alerts.forEach(a => { if (a.tokenId === tokenId && !a.resolvedAt) { a.ackAt = a.ackAt || now; a.resolvedAt = now; } });
}
function actCall(s, d, tokenId, reason, note) {
  const q = S.waitingIn(s, d);
  const t = tokenId ? q.find(x => x.id === tokenId) : q[0];
  if (!t) return null;
  const pos = q.indexOf(t);
  if (pos > 0 && !S.REASON[reason]) throw httpError(400, "An out-of-turn call needs a reason.");
  const cur = S.currentIn(s, d);
  if (cur) closeService(cur, "done");
  if (pos > 0) {
    s.log.unshift({ id: uid(), t: Date.now(), code: t.code, dept: d, reason, note: note || "", skipped: pos });
    s.log = s.log.slice(0, 200);
    t.outOfTurn = reason;
  }
  t.status = "called"; t.calledAt = Date.now(); t.doctor = doctorName(s, d); t.svcMs = null; t.simDue = null;
  if (t.urgent) resolveTokenAlerts(s, t.id);
  if (t.phone && t.sms && !t.smsTurn) { t.smsTurn = true; queueSms(s, t, `QueueSetu: Token ${t.code}, it’s your turn now. Please go to ${S.DEPT[d].room}${S.DEPT[d].help ? "" : ", " + S.floorName(d, "en")}.`); }
  nearSms(s, d);
  return t.code;
}
function actFinish(s, d, status, reason) {
  const cur = S.currentIn(s, d);
  if (status === "missed" && !S.SKIP_REASON[reason]) throw httpError(400, "Choose a reason for skipping.");
  if (cur) { if (status === "missed") { cur.status = status; cur.doneAt = Date.now(); cur.skipReason = reason; } else closeService(cur, "done"); }
}
function actSetStatus(s, tokenId, status, reason) {
  if (status === "missed" && !S.SKIP_REASON[reason]) throw httpError(400, "Choose a reason for skipping.");
  const t = s.tokens.find(x => x.id === tokenId);
  if (!t) throw httpError(404, "Token not found in today’s list.");
  const allowed = { done: ["called"], missed: ["waiting", "called"], waiting: ["missed", "called"] };
  if (!allowed[status] || !allowed[status].includes(t.status)) throw httpError(409, `A ${t.status} token can’t be marked ${status}.`);
  t.status = status;
  if (status === "missed") t.skipReason = reason;
  if (status === "waiting") { t.calledAt = null; t.doneAt = null; t.smsTurn = false; t.skipReason = null; }
  else if (status === "done") { t.status = "called"; closeService(t, "done"); }
  else t.doneAt = Date.now();
  nearSms(s, t.dept);
  return t;
}
function actMove(s, tokenId, dept) {
  const t = s.tokens.find(x => x.id === tokenId);
  if (!t) throw httpError(404, "Token not found in today’s list.");
  if (!["waiting", "called"].includes(t.status)) throw httpError(409, "Only a waiting or current patient can be sent to a department.");
  if (!S.DEPT[dept] || S.DEPT[dept].help || dept === t.dept) throw httpError(400, "Choose a different clinic.");
  const n = (s.counters[dept] || 0) + 1; s.counters[dept] = n;
  t.movedFrom = t.code; t.dept = dept; t.num = n; t.code = S.code(dept, n);
  t.status = "waiting"; t.calledAt = null; t.smsNear = false; t.smsTurn = false; // keeps the original arrival time, so their place is fair
  nearSms(s, dept);
  return t;
}
/* Send to end of queue (staff only). The token keeps its number, history and audit trail. */
function actRequeue(s, tokenId, from, role) {
  const t = s.tokens.find(x => x.id === tokenId);
  if (!t) throw httpError(404, "Token not found in today’s list.");
  if (from && from !== t.status) throw httpError(409, `This token is now ${t.status}. Refresh and try again.`);
  if (!["waiting", "called", "missed"].includes(t.status)) throw httpError(409, `A ${t.status} token can’t be sent to the end of the queue.`);
  const q = S.waitingIn(s, t.dept);
  if (t.status === "waiting" && q[q.length - 1] === t) throw httpError(409, `${t.code} is already at the end of the queue.`);
  const prev = t.status, posBefore = q.indexOf(t);
  t.status = "waiting"; t.queuedAt = Date.now(); t.requeues = (t.requeues || 0) + 1;
  t.calledAt = null; t.doneAt = null; t.svcMs = null; t.smsNear = false; t.smsTurn = false; t.skipReason = null; t.simDue = null;
  audit(s, { action: "requeue", tokenId: t.id, code: t.code, dept: t.dept, from: prev, posBefore, by: role, sample: Boolean(t.sample) });
  nearSms(s, t.dept);
  return t;
}
function expireDoctors(s) {
  let changed = false; const now = Date.now();
  Object.entries(s.doctors).forEach(([d, doc]) => { if (doc.status !== "available" && doc.until && doc.until <= now) { s.doctors[d] = { status: "available", mins: 0, until: null, at: now, name: doc.name || null }; changed = true; } });
  return changed;
}

/* ---------- Views: patients and the hall never receive names, phones or complaints ---------- */
function doctorsView() {
  const out = {};
  S.DEPTS.forEach(d => { const doc = state.doctors[d.id] || { status: "available" }; out[d.id] = { status: doc.status, mins: S.docDelay(state, d.id), until: doc.until || null, name: doctorName(state, d.id) }; });
  return out;
}
function publicView() {
  return {
    hospital: HOSPITAL, date: state.date, rev: state.rev, sample: state.sample, smsLive: SMS_LIVE, ai: AI_ON, staff: false, serverTime: Date.now(),
    contacts: CONTACTS, doctors: doctorsView(), doctorsSample: DOCTORS_ARE_SAMPLE, helpPhone: HELP_DESK_PHONE,
    config: CONFIG, service: serviceView(), demoMode: DEMO_MODE, sim: simView(),
    tokens: state.tokens.map(t => ({ id: t.id, dept: t.dept, num: t.num, code: t.code, status: t.status, createdAt: t.createdAt, queuedAt: t.queuedAt || null, calledAt: t.calledAt || null, outOfTurn: t.outOfTurn || null, doctor: t.doctor || null })),
    outOfTurnCount: state.log.length,
    emergencyActive: state.alerts.filter(a => a.kind === "request" && !a.resolvedAt).length // a count only, never details
  };
}
function staffView() {
  return {
    ...publicView(), staff: true,
    tokens: state.tokens.map(t => ({ id: t.id, dept: t.dept, num: t.num, code: t.code, status: t.status, createdAt: t.createdAt, queuedAt: t.queuedAt || null, requeues: t.requeues || 0, calledAt: t.calledAt || null, outOfTurn: t.outOfTurn || null, doneAt: t.doneAt || null, svcMs: t.svcMs == null ? null : t.svcMs, doctor: t.doctor || null, demo: Boolean(t.demo), simulated: Boolean(t.simDue), urgent: Boolean(t.urgent), assisted: Boolean(t.assisted), movedFrom: t.movedFrom || null, skipReason: t.skipReason || null, sample: Boolean(t.sample), name: t.name, complaint: t.complaint, lang: t.lang, phone: mask(t.phone), sms: t.sms })),
    log: state.log, audit: state.audit.slice(0, 80),
    alerts: state.alerts.slice(0, 60),
    sms: state.sms.slice(0, 20).map(m => ({ id: m.id, t: m.t, to: mask(m.to), code: m.code, text: m.text, status: m.status, error: m.error || "" }))
  };
}
/* ---------- Demo data and the 10x simulation (admins only, DEMO_MODE) ----------
   Demo patients are marked sample: true. They are never texted, and removing them never touches real patients.
   The simulation runs its own clock at 10x and only ever calls or finishes demo patients. If a real patient
   is next in a queue, the simulation leaves that queue to staff. The server clock is never changed. */
const DEMO_SPLIT = ["MED", "MED", "MED", "MED", "MED", "MED", "ORT", "ORT", "ORT", "PAE", "PAE", "PAE", "GYN", "GYN", "GYN", "EYE", "EYE", "SKN", "SKN", "HLP"];
let demoSeq = 0;
function makeDemo(s, d, at) {
  const n = (s.counters[d] || 0) + 1; s.counters[d] = n;
  const cl = SAMPLE_COMPLAINTS[d];
  const t = { id: uid(), dept: d, num: n, code: S.code(d, n), name: SAMPLE_NAMES[(demoSeq++ * 7) % SAMPLE_NAMES.length] + " (demo)", complaint: cl[demoSeq % cl.length], lang: demoSeq % 3 ? "hi" : "en", phone: "", sms: false, status: "waiting", createdAt: at || Date.now(), sample: true, demo: true };
  s.tokens.push(t);
  return t;
}
function simNow(m) { return m ? m.base + (m.running && !m.paused ? (Date.now() - m.realAt) * m.speed : 0) : null; }
function simView() {
  const m = state.sim;
  if (!m || !m.running) return { running: false };
  return { running: true, paused: m.paused, speed: m.speed, simNow: simNow(m), startedAt: m.startedAt, served: m.served, arrived: m.arrived };
}
function simDuration(d) { const avg = Number((CONFIG.fallback || {})[d]) || S.DEPT[d].avg; return Math.round(avg * (0.6 + Math.random() * 0.8) * 60000); }
function simTick() {
  const m = state.sim;
  if (!m || !m.running || m.paused) return;
  const now = simNow(m); let changed = false;
  for (const d of S.DEPTS.map(x => x.id)) {
    const doc = state.doctors[d];
    if (doc && doc.status === "break") continue; // the doctor is away: nothing moves
    let cur = S.currentIn(state, d);
    if (cur && !cur.sample) continue; // a real patient is with the doctor: staff finish them
    if (cur && cur.simDue == null) { cur.simDur = simDuration(d); cur.simDue = now + cur.simDur; }
    if (cur && now >= cur.simDue) {
      cur.status = "done"; cur.doneAt = Date.now(); cur.svcMs = cur.simDur; cur.simDue = null; m.served++; changed = true; cur = null;
    }
    if (!cur) {
      const next = S.waitingIn(state, d)[0];
      if (next && next.sample) { // never calls a real patient
        next.status = "called"; next.calledAt = Date.now(); next.doctor = doctorName(state, d); next.svcMs = null;
        next.simDur = simDuration(d); next.simDue = now + next.simDur; changed = true;
      }
    }
  }
  // New demo arrivals: about one every 4 simulated minutes
  if (Math.random() < 1 / 24 && state.tokens.filter(t => t.sample && t.status === "waiting").length < 120) {
    makeDemo(state, DEMO_SPLIT[Math.floor(Math.random() * DEMO_SPLIT.length)]); m.arrived++; changed = true;
  }
  if (changed) { state.rev += 1; save(); broadcast(); }
}
setInterval(simTick, 1000);

/* Average consultation time per queue from the last N completed patients (shared.js serviceStats). */
function serviceView() {
  const base = { tokens: state.tokens, config: CONFIG };
  return Object.fromEntries(S.DEPTS.map(d => [d.id, S.serviceStats(base, d.id)]));
}
const alertStatus = a => ({ id: a.id, status: a.resolvedAt ? "resolved" : a.ackAt ? "acknowledged" : "open", createdAt: a.createdAt, ackAt: a.ackAt, resolvedAt: a.resolvedAt });

/* ---------- Server ---------- */
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "10kb" }));
// The service worker must never be cached by the browser, or app updates would stall on phones.
app.get("/sw.js", (req, res) => { res.set("Cache-Control", "no-cache"); res.set("Service-Worker-Allowed", "/"); res.sendFile(path.join(__dirname, "public", "sw.js")); });
app.get("/manifest.webmanifest", (req, res) => { res.type("application/manifest+json"); res.sendFile(path.join(__dirname, "public", "manifest.webmanifest")); });
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.get("/vendor/qrcode.js", (req, res) => res.sendFile(require.resolve("qrcode-generator/qrcode.js")));
app.get("/vendor/jsqr.js", (req, res) => res.sendFile(require.resolve("jsqr/dist/jsQR.js")));

function broadcast() {
  io.to("public").emit("state", publicView());
  io.to("staff").emit("state", staffView());
}
function ensureDay() {
  if (state.date !== today()) {
    const rev = state.rev + 1;
    state = SEED_SAMPLE ? sampleState() : emptyState();
    state.rev = rev; save(); broadcast();
  }
}
function mutate(fn) {
  ensureDay();
  const result = fn(state);
  state.rev += 1;
  save(); broadcast(); flushSms();
  return result;
}

/* Roles: counter staff (STAFF_PIN) run the queue; admins (ADMIN_PIN) also see the dashboard, export and reset. */
function same(a, b) { const x = Buffer.from(String(a || "")), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function roleOf(pin) { return same(pin, ADMIN_PIN) ? "admin" : same(pin, STAFF_PIN) ? "staff" : null; }
const need = level => (req, res, next) => {
  const role = roleOf(req.get("x-staff-pin"));
  if (!role) return res.status(401).json({ error: "Wrong staff PIN." });
  if (level === "admin" && role !== "admin") return res.status(403).json({ error: "Only an admin can do this." });
  req.role = role; next();
};

/* Simple per-IP limits so one device can’t flood the system. */
function limiter(max, minutes, message) {
  const hits = new Map();
  return (req, res, next) => {
    const ip = req.ip, now = Date.now();
    const list = (hits.get(ip) || []).filter(t => now - t < minutes * 60000);
    if (list.length >= max) return res.status(429).json({ error: message });
    list.push(now); hits.set(ip, list); next();
  };
}

async function flushSms() {
  const ids = pendingSms; pendingSms = [];
  for (const id of ids) {
    const m = state.sms.find(x => x.id === id);
    if (!m) continue;
    try {
      const body = new URLSearchParams({ To: "+91" + m.to, From: TW.from, Body: m.text });
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW.sid}/Messages.json`, {
        method: "POST",
        headers: { Authorization: "Basic " + Buffer.from(TW.sid + ":" + TW.token).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      if (r.ok) m.status = "sent";
      else { m.status = "failed"; m.error = ((await r.json().catch(() => ({}))).message || "HTTP " + r.status).slice(0, 160); }
    } catch (e) { m.status = "failed"; m.error = e.message.slice(0, 160); }
    save(); broadcast();
  }
}

function readRegistration(b) {
  const name = String(b.name || "").trim().replace(/\s+/g, " ").slice(0, 60);
  const complaint = String(b.complaint || "").trim().slice(0, 300);
  const dept = S.DEPT[b.dept] ? b.dept : S.suggestDept(complaint);
  const lang = ["en", "doi"].includes(b.lang) ? b.lang : "hi";
  const phone = String(b.phone || "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  if (name.length < 2) throw httpError(400, "Please enter a name.");
  if (phone && !/^[6-9]\d{9}$/.test(phone)) throw httpError(400, "The mobile number should have 10 digits.");
  const urgent = S.rulesTriage(complaint).urgent || b.urgent === true;
  return { name, complaint, dept, lang, phone, urgent, sms: Boolean(b.sms) };
}
const tokenReply = (t, duplicate) => ({ token: { id: t.id, code: t.code, dept: t.dept, phone: mask(t.phone), sms: t.sms, urgent: Boolean(t.urgent), createdAt: t.createdAt }, duplicate: Boolean(duplicate) });
function register(req, res, assisted) {
  const f = readRegistration(req.body || {});
  ensureDay();
  const dup = findDuplicate(state, f.name, f.phone);
  if (dup) return res.status(200).json(tokenReply(dup, true));
  const t = mutate(s => actRegister(s, Object.assign(f, { assisted })));
  res.status(201).json(tokenReply(t, false));
}

app.get("/healthz", (req, res) => res.json({ ok: true }));
app.get("/api/state", (req, res) => { ensureDay(); res.json(publicView()); });

app.post("/api/tokens", limiter(15, 10, "Too many tokens from this device. Please ask at the help desk."), (req, res, next) => {
  try { register(req, res, false); } catch (e) { next(e); }
});

/* Emergency help requests: recorded and shown to staff at once. They never contact 112 or 108 by themselves. */
app.post("/api/emergency", limiter(8, 10, "Too many alerts from this device. Please go to Emergency or ask anyone on staff."), (req, res, next) => {
  try {
    const b = req.body || {};
    const clientId = String(b.clientId || "").slice(0, 40);
    const place = S.PLACES[b.place] ? b.place : "GATE";
    const signs = (Array.isArray(b.signs) ? b.signs : []).filter(x => SIGNS.includes(x)).slice(0, 6);
    const tok = b.tokenId ? state.tokens.find(t => t.id === b.tokenId) : null;
    const now = Date.now();
    const dup = clientId && state.alerts.find(a => a.clientId === clientId && !a.resolvedAt && now - a.createdAt < 5 * 60000);
    if (dup) return res.json({ alert: alertStatus(dup), duplicate: true });
    const a = mutate(s => { const x = { id: uid(), kind: "request", clientId, place, signs, note: String(b.note || "").trim().slice(0, 140), tokenId: tok ? tok.id : null, code: tok ? tok.code : null, dept: tok ? tok.dept : null, createdAt: now, ackAt: null, resolvedAt: null }; s.alerts.unshift(x); s.alerts = s.alerts.slice(0, 200); return x; });
    res.status(201).json({ alert: alertStatus(a), duplicate: false });
  } catch (e) { next(e); }
});
/* Slip check after a QR scan. Slip ids are random (64-bit). The public gets only what the hall display shows;
   names and complaints need a staff PIN. */
app.get("/api/verify/:id", limiter(60, 1, "Too many checks. Wait a minute."), (req, res) => {
  const id = String(req.params.id || "");
  if (!/^[a-f0-9]{16}$/.test(id)) return res.status(400).json({ error: "Not a QueueSetu slip." });
  ensureDay();
  const t = state.tokens.find(x => x.id === id);
  if (!t) return res.status(404).json({ error: "This slip isn’t in today’s list." });
  const out = { id: t.id, code: t.code, dept: t.dept, status: t.status, createdAt: t.createdAt, doctor: t.doctor || doctorName(state, t.dept) };
  if (roleOf(req.get("x-staff-pin"))) Object.assign(out, { name: t.name, complaint: t.complaint, urgent: Boolean(t.urgent) });
  res.json({ valid: true, token: out });
});
app.get("/api/emergency/:id", (req, res) => {
  const a = state.alerts.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: "Alert not found." });
  res.json({ alert: alertStatus(a) });
});

/* Triage: Gemini when GEMINI_API_KEY is set, keyword rules otherwise. Routing only, never a diagnosis. */
async function aiTriage(text) {
  const prompt = `You route patients at an Indian government hospital OPD to one department.
Departments: MED (Medicine: fever, stomach, BP, sugar, cough, weakness, anything general), ORT (bones, joints, back, sprains, fractures), PAE (children under 14), GYN (pregnancy, periods, women's health), EYE (eyes), SKN (skin, rash, itching, allergy).
The patient's words may be in Hindi, Dogri, Punjabi, Urdu, English or a mix, in any script.
Set urgent to true only for a possible emergency: chest pain, trouble breathing, unconsciousness, heavy bleeding, signs of stroke, severe burns, poisoning or snake bite, seizures, serious injury.
Do not diagnose. Reply with JSON only: {"dept":"MED|ORT|PAE|GYN|EYE|SKN","urgent":true|false,"why_en":"one short plain sentence","why_hi":"the same in simple Hindi","why_doi":"the same in simple Dogri (Devanagari)"}.
Patient said: """${text.replace(/"""/g, "")}"""`;
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0 } })
    });
    if (!r.ok) throw new Error("Gemini HTTP " + r.status);
    const j = await r.json();
    const raw = j.candidates[0].content.parts.map(p => p.text || "").join("");
    const o = JSON.parse(raw.replace(/^```(json)?|```$/g, "").trim());
    if (!S.DEPT[o.dept] || S.DEPT[o.dept].help) throw new Error("Bad department from AI");
    return { dept: o.dept, urgent: o.urgent === true, why_en: String(o.why_en || "").slice(0, 160), why_hi: String(o.why_hi || "").slice(0, 160), why_doi: String(o.why_doi || "").slice(0, 160), source: "ai" };
  } finally { clearTimeout(timer); }
}
const triageLimit = new Map();
app.post("/api/triage", async (req, res) => {
  const ip = req.ip, now = Date.now();
  const list = (triageLimit.get(ip) || []).filter(t => now - t < 10 * 60000);
  const text = String((req.body || {}).text || "").trim().slice(0, 300);
  const rules = S.rulesTriage(text);
  if (!text || !AI_ON || list.length >= 60) return res.json(rules);
  list.push(now); triageLimit.set(ip, list);
  try {
    const ai = await aiTriage(text);
    ai.urgent = ai.urgent || rules.urgent; // a red-flag word always counts
    res.json(ai);
  } catch (e) { console.warn("AI triage failed, using rules:", e.message); res.json(rules); }
});

/* ---------- Staff ---------- */
app.post("/api/staff/login", limiter(20, 10, "Too many sign-in attempts. Wait a few minutes."), (req, res) => {
  const role = roleOf((req.body || {}).pin);
  if (!role) return res.status(401).json({ error: "Wrong staff PIN." });
  res.json({ ok: true, role });
});
app.get("/api/staff/state", need("staff"), (req, res) => { ensureDay(); res.json(staffView()); });
app.post("/api/staff/register", need("staff"), (req, res, next) => { try { register(req, res, true); } catch (e) { next(e); } });
app.post("/api/staff/call", need("staff"), (req, res, next) => {
  try {
    const { dept, tokenId, reason, note } = req.body || {};
    if (!S.DEPT[dept]) throw httpError(400, "Unknown department.");
    const called = mutate(s => actCall(s, dept, tokenId || null, reason, String(note || "").trim().slice(0, 140)));
    if (!called) throw httpError(409, "No one is waiting in this department.");
    res.json({ called });
  } catch (e) { next(e); }
});
app.post("/api/staff/finish", need("staff"), (req, res, next) => {
  try {
    const { dept, status, reason } = req.body || {};
    if (!S.DEPT[dept] || !["done", "missed"].includes(status)) throw httpError(400, "Bad request.");
    if (status === "missed" && !S.SKIP_REASON[reason]) throw httpError(400, "Choose a reason for skipping.");
    mutate(s => actFinish(s, dept, status, reason));
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.post("/api/staff/status", need("staff"), (req, res, next) => {
  try {
    const { tokenId, status, reason } = req.body || {};
    if (status === "missed" && !S.SKIP_REASON[reason]) throw httpError(400, "Choose a reason for skipping.");
    const t = mutate(s => actSetStatus(s, String(tokenId || ""), status, reason));
    res.json({ ok: true, code: t.code, status: t.status });
  } catch (e) { next(e); }
});
app.post("/api/staff/move", need("staff"), (req, res, next) => {
  try {
    const { tokenId, dept } = req.body || {};
    const t = mutate(s => actMove(s, String(tokenId || ""), dept));
    res.json({ ok: true, code: t.code, dept: t.dept });
  } catch (e) { next(e); }
});
app.post("/api/staff/doctor", need("staff"), (req, res, next) => {
  try {
    const { dept, status } = req.body || {};
    const name = (req.body || {}).name;
    if (name !== undefined && (typeof name !== "string" || name.trim().length > 60)) throw httpError(400, "Doctor name is too long.");
    const mins = Math.max(0, Math.min(180, Math.round(Number((req.body || {}).mins) || 0)));
    if (!S.DEPT[dept] || !["available", "break", "delayed"].includes(status)) throw httpError(400, "Bad request.");
    if (status !== "available" && !mins) throw httpError(400, "Choose how many minutes.");
    mutate(s => {
      const prev = s.doctors[dept] || {};
      const nm = name !== undefined ? name.trim().replace(/\s+/g, " ") || null : prev.name || null;
      s.doctors[dept] = { status, mins: status === "available" ? 0 : mins, until: status === "available" ? null : Date.now() + mins * 60000, at: Date.now(), name: nm };
      if (name !== undefined && nm !== (prev.name || null)) audit(s, { action: "doctor", dept, name: nm, by: req.role });
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});
app.post("/api/staff/alert", need("staff"), (req, res, next) => {
  try {
    const { id, action } = req.body || {};
    const a = state.alerts.find(x => x.id === id);
    if (!a) throw httpError(404, "Alert not found.");
    if (!["ack", "resolve"].includes(action)) throw httpError(400, "Bad request.");
    mutate(() => { const now = Date.now(); if (!a.ackAt) { a.ackAt = now; a.ackBy = req.role; } if (action === "resolve" && !a.resolvedAt) a.resolvedAt = now; });
    res.json({ alert: alertStatus(a) });
  } catch (e) { next(e); }
});
app.post("/api/staff/requeue", need("staff"), (req, res, next) => {
  try {
    const { tokenId, from } = req.body || {};
    const t = mutate(s => actRequeue(s, String(tokenId || ""), from ? String(from) : null, req.role));
    res.json({ ok: true, code: t.code, position: S.aheadOf(state, t) + 1, waiting: S.waitingIn(state, t.dept).length });
  } catch (e) { next(e); }
});
const demoOnly = (req, res, next) => DEMO_MODE ? next() : res.status(403).json({ error: "Demo controls are turned off on this server (DEMO_MODE=false)." });
app.post("/api/admin/demo/add", need("admin"), demoOnly, (req, res, next) => {
  try {
    const key = String((req.body || {}).key || "");
    if (!/^[a-z0-9-]{8,40}$/i.test(key)) throw httpError(400, "Missing request key.");
    if (state.demoKeys.some(k => k.key === key)) return res.json({ ok: true, added: 0, duplicate: true }); // same click sent twice
    if (state.tokens.filter(t => t.sample && t.status === "waiting").length + 20 > 150) throw httpError(409, "There are already many demo patients waiting. Remove demo data first.");
    const added = mutate(s => {
      const now = Date.now();
      const list = DEMO_SPLIT.map((d, i) => makeDemo(s, d, now - (DEMO_SPLIT.length - i) * 1000));
      s.demoKeys.unshift({ key, t: now }); s.demoKeys = s.demoKeys.slice(0, 50);
      audit(s, { action: "demo-add", count: list.length, by: req.role, sample: true });
      return list.length;
    });
    res.json({ ok: true, added, duplicate: false });
  } catch (e) { next(e); }
});
app.post("/api/admin/demo/clear", need("admin"), demoOnly, (req, res) => {
  const removed = mutate(s => {
    const before = s.tokens.length;
    s.tokens = s.tokens.filter(t => !t.sample);
    s.alerts = s.alerts.filter(a => !a.sample); s.log = s.log.filter(l => !l.sample); s.audit = s.audit.filter(a => !a.sample);
    s.sample = false; s.sim = null;
    audit(s, { action: "demo-clear", count: before - s.tokens.length, by: req.role });
    return before - s.tokens.length;
  });
  res.json({ ok: true, removed });
});
app.post("/api/admin/sim", need("admin"), demoOnly, (req, res, next) => {
  try {
    const action = (req.body || {}).action;
    mutate(s => {
      const m = s.sim && s.sim.running ? s.sim : null, now = Date.now();
      if (action === "start") { if (!m) s.sim = { running: true, paused: false, speed: 10, base: now, realAt: now, startedAt: now, served: 0, arrived: 0 }; }
      else if (action === "pause") { if (m && !m.paused) { m.base = simNow(m); m.paused = true; m.realAt = now; } }
      else if (action === "resume") { if (m && m.paused) { m.paused = false; m.realAt = now; } }
      else if (action === "stop") { s.sim = null; s.tokens.forEach(t => { t.simDue = null; }); }
      else throw httpError(400, "Unknown action.");
      audit(s, { action: "sim-" + action, by: req.role, sample: true });
    });
    res.json({ ok: true, sim: simView() });
  } catch (e) { next(e); }
});
app.post("/api/staff/reset", need("admin"), (req, res) => {
  const mode = (req.body || {}).mode === "sample" ? "sample" : "empty";
  const rev = state.rev;
  state = mode === "sample" ? sampleState() : emptyState();
  state.rev = rev + 1; save(); broadcast();
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  const status = err.status || (err.type === "entity.parse.failed" ? 400 : 500);
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? "Something went wrong on the server." : err.message });
});

io.on("connection", sock => {
  sock.join("public");
  sock.emit("state", publicView());
  sock.on("join", (msg, cb) => {
    const role = roleOf(msg && msg.pin);
    if (role) { sock.leave("public"); sock.join("staff"); sock.emit("state", staffView()); }
    if (typeof cb === "function") cb({ staff: Boolean(role), role });
  });
});

setInterval(() => { ensureDay(); if (expireDoctors(state)) { state.rev += 1; save(); broadcast(); } }, 30000);
save();
server.listen(PORT, () => {
  console.log(`QueueSetu is running on http://localhost:${PORT}`);
  console.log(`Staff PIN: ${STAFF_PIN === "1234" ? "1234 (default, set STAFF_PIN)" : "set"} · Admin PIN: ${ADMIN_PIN === "4321" ? "4321 (default, set ADMIN_PIN)" : "set"}`);
  console.log(`SMS: ${SMS_LIVE ? "sending with Twilio" : "simulated (add Twilio keys to send real texts)"}`);
  console.log(`AI triage: ${AI_ON ? "on (" + GEMINI_MODEL + ")" : "off, using keyword rules (set GEMINI_API_KEY to turn it on)"}`);
  console.log(`Demo controls: ${DEMO_MODE ? "on for admins (set DEMO_MODE=false to turn off)" : "off"} · Doctors: ${Object.keys(ROSTER).length ? "from DOCTORS" : SEED_SAMPLE ? "sample names (set DOCTORS)" : "not set"}`);
  console.log(`Emergency numbers shown: ${CONTACTS.map(c => c.number).join(", ")}`);
});
