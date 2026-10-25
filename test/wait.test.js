/* Unit tests for waiting time and crowding (public/shared.js). Run: npm test */
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../public/shared.js");

const MIN = 60000, NOW = 1_700_000_000_000;
let seq = 0;
function tok(dept, status, extra = {}) { seq++; return Object.assign({ id: "t" + seq, dept, num: seq, code: dept[0] + "-" + seq, status, createdAt: NOW - 3600000 + seq * 1000 }, extra); }
function done(dept, minutes, endedMinAgo) { const doneAt = NOW - endedMinAgo * MIN; return tok(dept, "done", { calledAt: doneAt - minutes * MIN, doneAt }); }

test("no history: uses the configured fallback for that department", () => {
  const s = { tokens: [] };
  assert.deepEqual(S.serviceStats(s, "MED"), { avg: S.DEPT.MED.avg, n: 0, source: "fallback" });
  assert.equal(S.serviceStats({ tokens: [], config: { fallback: { MED: 9 } } }, "MED").avg, 9);
});

test("uses only the last 10 completed patients of the same queue", () => {
  const tokens = [];
  for (let i = 0; i < 10; i++) tokens.push(done("MED", 4, i + 1));     // 10 recent, 4 min each
  for (let i = 0; i < 5; i++) tokens.push(done("MED", 30, 100 + i));   // older, must be ignored
  tokens.push(done("ORT", 60, 1));                                     // other doctor, must be ignored
  const r = S.serviceStats({ tokens }, "MED");
  assert.equal(r.n, 10); assert.equal(r.avg, 4); assert.equal(r.source, "history");
});

test("fewer than 10 records: uses what exists", () => {
  const r = S.serviceStats({ tokens: [done("EYE", 3, 1), done("EYE", 5, 2)] }, "EYE");
  assert.equal(r.n, 2); assert.equal(r.avg, 4);
});

test("ignores invalid records: missing times, negative, absurdly long, skipped patients", () => {
  const tokens = [done("SKN", 6, 1), done("SKN", -2, 2), done("SKN", 400, 3), tok("SKN", "done", { calledAt: null, doneAt: NOW }),
    tok("SKN", "missed", { calledAt: NOW - 5 * MIN, doneAt: NOW - MIN }), tok("SKN", "done", { calledAt: NOW - MIN, doneAt: NOW, svcMs: 0 })];
  const r = S.serviceStats({ tokens }, "SKN");
  assert.equal(r.n, 1); assert.equal(r.avg, 6);
});

test("svcMs (simulated or recorded duration) wins over timestamps", () => {
  const t = done("PAE", 1, 1); t.svcMs = 8 * MIN;
  assert.equal(S.serviceStats({ tokens: [t] }, "PAE").avg, 8);
});

test("estimate = people ahead × average + time left for the current patient", () => {
  const tokens = [];
  for (let i = 0; i < 10; i++) tokens.push(done("MED", 5, i + 2));
  tokens.push(tok("MED", "called", { calledAt: NOW - 2 * MIN }));     // 3 min left
  const w = []; for (let i = 0; i < 4; i++) { const t = tok("MED", "waiting"); w.push(t); tokens.push(t); }
  const s = { tokens };
  assert.equal(S.estMin(s, w[0], NOW), 3);          // first in line: only the current patient's remaining time
  assert.equal(S.estMin(s, w[3], NOW), 20);         // 3 ahead × 5 + 3 = 18 → rounded to 20
  assert.equal(S.estMin(s, tok("MED", "done"), NOW), 0); // not waiting
});

test("current patient over time: assume at least 1 minute left, never negative", () => {
  const tokens = [done("EYE", 4, 1), tok("EYE", "called", { calledAt: NOW - 30 * MIN }), tok("EYE", "waiting")];
  assert.equal(S.estMin({ tokens }, tokens[2], NOW), 1);
});

test("doctor delay adds to the wait", () => {
  const tokens = [tok("ORT", "waiting")];
  const s = { tokens, doctors: { ORT: { status: "delayed", mins: 15 } } };
  assert.equal(S.estMin(s, tokens[0], NOW), 15);
});

test("send to end of queue: queuedAt moves the patient behind later arrivals", () => {
  const a = tok("GYN", "waiting"), b = tok("GYN", "waiting"), c = tok("GYN", "waiting");
  const s = { tokens: [a, b, c] };
  assert.deepEqual(S.waitingIn(s, "GYN").map(t => t.id), [a.id, b.id, c.id]);
  a.queuedAt = c.createdAt + 1000;
  assert.deepEqual(S.waitingIn(s, "GYN").map(t => t.id), [b.id, c.id, a.id]);
  assert.equal(S.aheadOf(s, a), 2);
});

test("crowding levels follow the thresholds, and they are configurable", () => {
  const mk = n => ({ tokens: Array.from({ length: n }, () => tok("MED", "waiting")) });
  assert.equal(S.crowdLevel(mk(1), "MED", NOW).level, "low");
  assert.equal(S.crowdLevel(mk(6), "MED", NOW).level, "moderate");
  assert.equal(S.crowdLevel(mk(12), "MED", NOW).level, "high");
  assert.equal(S.crowdLevel(mk(20), "MED", NOW).level, "critical");
  const strict = Object.assign(mk(3), { config: { crowd: { moderate: { wait: 999, people: 2 }, high: { wait: 999, people: 3 }, critical: { wait: 999, people: 50 } } } });
  assert.equal(S.crowdLevel(strict, "MED", NOW).level, "high");
});

test("rounding is human: exact below 10 minutes, nearest 5 above", () => {
  assert.equal(S.roundWait(0.2), 1); assert.equal(S.roundWait(7.4), 7); assert.equal(S.roundWait(23), 25); assert.equal(S.roundWait(41), 40);
});
