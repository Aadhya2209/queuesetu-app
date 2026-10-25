/* API tests: starts a real server on a spare port with a temporary data file. Run: npm test */
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");

const PORT = 3400 + Math.floor(Math.random() * 400);
const BASE = `http://127.0.0.1:${PORT}`;
const DATA = path.join(os.tmpdir(), `baari-test-${process.pid}.json`);
let srv;
const STAFF = { "x-staff-pin": "1234" }, ADMIN = { "x-staff-pin": "4321" };
async function api(method, url, body, headers = {}) {
  const r = await fetch(BASE + url, { method, headers: Object.assign({ "Content-Type": "application/json" }, headers), body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const state = async () => (await api("GET", "/api/staff/state", null, STAFF)).body;
const sleep = ms => new Promise(r => setTimeout(r, ms));

test.before(async () => {
  try { fs.unlinkSync(DATA); } catch (e) {}
  srv = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { env: Object.assign({}, process.env, { PORT, DATA_FILE: DATA, SEED_SAMPLE: "false", DOCTORS: "MED:Dr. Test Medicine,ORT:Dr. Test Bones", STAFF_PIN: "1234", ADMIN_PIN: "4321", DEMO_MODE: "true" }), stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + "/healthz"); return; } catch (e) { await sleep(100); } }
  throw new Error("server did not start");
});
test.after(() => { srv && srv.kill(); try { fs.unlinkSync(DATA); } catch (e) {} });

test("token gets the doctor of its queue; called token keeps the doctor who saw it", async () => {
  const r = await api("POST", "/api/tokens", { name: "Real Patient One", dept: "MED", lang: "en" });
  assert.equal(r.status, 201);
  const pub = (await api("GET", "/api/state")).body;
  assert.equal(pub.doctors.MED.name, "Dr. Test Medicine");
  assert.equal(pub.doctors.PAE.name, null, "no doctor configured: no invented name");
  await api("POST", "/api/staff/call", { dept: "MED" }, STAFF);
  const t = (await api("GET", "/api/state")).body.tokens.find(x => x.id === r.body.token.id);
  assert.equal(t.status, "called"); assert.equal(t.doctor, "Dr. Test Medicine");
  assert.ok(!("name" in t) && !("phone" in t), "public state has no patient names or phones");
});

test("finishing a consultation records its duration for the waiting-time average", async () => {
  await api("POST", "/api/staff/finish", { dept: "MED", status: "done" }, STAFF);
  const s = await state();
  const d = s.tokens.find(t => t.dept === "MED" && t.status === "done");
  assert.ok(d.svcMs >= 0);
  assert.ok(s.service.MED && ["history", "fallback"].includes(s.service.MED.source));
});

test("send to end of queue: staff only, moves to the end, logged, rejects ineligible tokens", async () => {
  const ids = [];
  for (const n of ["Queue A", "Queue B", "Queue C"]) ids.push((await api("POST", "/api/tokens", { name: n, dept: "ORT", lang: "en" })).body.token.id);
  assert.equal((await api("POST", "/api/staff/requeue", { tokenId: ids[0] })).status, 401, "no PIN: refused");
  const ok = await api("POST", "/api/staff/requeue", { tokenId: ids[0], from: "waiting" }, STAFF);
  assert.equal(ok.status, 200); assert.equal(ok.body.position, 3);
  const s = await state();
  const order = s.tokens.filter(t => t.dept === "ORT" && t.status === "waiting").sort((a, b) => (a.queuedAt || a.createdAt) - (b.queuedAt || b.createdAt)).map(t => t.id);
  assert.deepEqual(order, [ids[1], ids[2], ids[0]]);
  assert.equal(s.tokens.filter(t => t.id === ids[0]).length, 1, "no duplicate entry");
  assert.equal(s.audit[0].action, "requeue"); assert.equal(s.audit[0].by, "staff");
  assert.equal((await api("POST", "/api/staff/requeue", { tokenId: ids[0], from: "waiting" }, STAFF)).status, 409, "already last");
  assert.equal((await api("POST", "/api/staff/requeue", { tokenId: ids[1], from: "called" }, STAFF)).status, 409, "stale screen: status changed");
  await api("POST", "/api/staff/call", { dept: "ORT" }, STAFF); await api("POST", "/api/staff/finish", { dept: "ORT", status: "done" }, STAFF);
  assert.equal((await api("POST", "/api/staff/requeue", { tokenId: ids[1] }, STAFF)).status, 409, "completed token refused");
  // Two staff press it at the same time: one wins, the other is told the screen is stale or it's already last
  const [x, y] = await Promise.all([api("POST", "/api/staff/requeue", { tokenId: ids[2], from: "waiting" }, STAFF), api("POST", "/api/staff/requeue", { tokenId: ids[2], from: "waiting" }, STAFF)]);
  assert.deepEqual([x.status, y.status].sort(), [200, 409]);
});

test("demo: add 20 is admin only, idempotent per click, and clearing keeps real patients", async () => {
  assert.equal((await api("POST", "/api/admin/demo/add", { key: "abcdefgh1" }, STAFF)).status, 403);
  const before = (await state()).tokens.filter(t => !t.sample).map(t => t.id).sort();
  const a = await api("POST", "/api/admin/demo/add", { key: "abcdefgh1" }, ADMIN);
  assert.equal(a.body.added, 20);
  const again = await api("POST", "/api/admin/demo/add", { key: "abcdefgh1" }, ADMIN);
  assert.equal(again.body.added, 0); assert.equal(again.body.duplicate, true);
  let s = await state();
  assert.equal(s.tokens.filter(t => t.sample).length, 20);
  assert.ok(s.tokens.filter(t => t.sample).every(t => /\(demo\)$/.test(t.name)));
  const c = await api("POST", "/api/admin/demo/clear", {}, ADMIN);
  assert.equal(c.body.removed, 20);
  s = await state();
  assert.deepEqual(s.tokens.map(t => t.id).sort(), before, "real patients untouched");
});

test("10x simulation: only moves demo patients, never real ones, and stops cleanly", async () => {
  await api("POST", "/api/admin/demo/add", { key: "simtest-001" }, ADMIN);
  const realWaiting = (await state()).tokens.filter(t => !t.sample && t.status === "waiting").map(t => t.id + t.status);
  const st = await api("POST", "/api/admin/sim", { action: "start" }, ADMIN);
  assert.equal(st.body.sim.running, true); assert.equal(st.body.sim.speed, 10);
  const t0 = Date.now(); await sleep(2500);
  let s = await state();
  const simElapsed = s.sim.simNow - st.body.sim.simNow, realElapsed = Date.now() - t0;
  assert.ok(simElapsed > realElapsed * 7, `sim clock runs ~10x (${simElapsed} vs ${realElapsed})`);
  assert.ok(s.tokens.some(t => t.sample && t.status === "called"), "demo patients called by the simulation");
  assert.deepEqual(s.tokens.filter(t => !t.sample && t.status === "waiting").map(t => t.id + t.status), realWaiting, "real patients untouched");
  assert.ok(s.tokens.filter(t => t.status === "called" && !t.sample).every(t => t.dept !== "ORT"), "no real patient called by the sim");
  await api("POST", "/api/admin/sim", { action: "pause" }, ADMIN);
  const p1 = (await state()).sim.simNow; await sleep(600); const p2 = (await state()).sim.simNow;
  assert.equal(p1, p2, "paused clock does not move");
  await api("POST", "/api/admin/sim", { action: "stop" }, ADMIN);
  assert.equal((await state()).sim.running, false);
  assert.ok(Math.abs((await api("GET", "/healthz")).status - 200) === 0);
});

test("crowding and service stats are sent to every screen", async () => {
  const pub = (await api("GET", "/api/state")).body;
  assert.ok(pub.service.MED.avg > 0);
  assert.ok(pub.demoMode === true && pub.sim && typeof pub.sim.running === "boolean");
});
