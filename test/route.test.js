/* Routing across three floors, with and without "Avoid stairs". Run: npm test */
const test = require("node:test");
const assert = require("node:assert/strict");
const S = require("../public/shared.js");
const rooms = Object.keys(S.PLACES).filter(k => !S.PLACES[k].kind);

test("every place can reach every other place, with stairs and without", () => {
  for (const a of rooms) for (const b of rooms) for (const avoidStairs of [false, true]) {
    const r = S.route(a, b, { avoidStairs });
    assert.ok(r.ok, `${a}→${b} avoidStairs=${avoidStairs}`);
    assert.ok(r.steps.length > 0);
    for (const s of r.steps) for (const l of ["en", "hi", "doi"]) assert.ok(s[l] && s[l].length > 3, `${a}→${b} missing ${l}`);
  }
});

test("Avoid stairs removes stair paths before the route is worked out", () => {
  for (const a of rooms) for (const b of rooms) {
    const r = S.route(a, b, { avoidStairs: true });
    assert.equal(r.usesStairs, false, `${a}→${b} used stairs`);
    assert.ok(!r.steps.some(s => /stairs/i.test(s.en) && !/no stairs/i.test(s.en)), `${a}→${b} mentions stairs`);
  }
});

test("floor changes: stairs when allowed, a lift when stairs are avoided", () => {
  const withStairs = S.route("GATE", "GYN");
  assert.ok(withStairs.usesStairs);
  assert.deepEqual(withStairs.legs.map(l => l.floor), [0, 2]);
  assert.ok(withStairs.steps.some(s => s.en === "Take the stairs up to the Second floor."));
  const noStairs = S.route("GATE", "GYN", { avoidStairs: true });
  assert.ok(!noStairs.usesStairs && noStairs.usesLift);
  assert.ok(noStairs.steps.some(s => s.en === "Take Lift B up to the Second floor."));
});

test("Lift A does not reach the Second floor: First → Second without stairs goes down Lift A and up Lift B", () => {
  const r = S.route("EYE", "GYN", { avoidStairs: true });
  assert.deepEqual(r.legs.map(l => l.floor), [1, 0, 2]);
  const lifts = r.steps.filter(s => s.kind === "lift").map(s => s.en);
  assert.deepEqual(lifts, ["Take Lift A down to the Ground floor.", "Take Lift B up to the Second floor."]);
  const stairs = S.route("EYE", "GYN");
  assert.deepEqual(stairs.legs.map(l => l.floor), [1, 2], "with stairs it is one flight up");
});

test("same floor: no floor change, one map", () => {
  const r = S.route("REG", "MED");
  assert.equal(r.legs.length, 1); assert.equal(r.usesStairs, false); assert.equal(r.usesLift, false);
});

test("map points stay inside the 400 × 312 plan on every floor", () => {
  for (const a of rooms) for (const b of rooms) for (const l of S.route(a, b, { avoidStairs: a < b }).legs)
    for (const [x, y] of l.points) assert.ok(x >= 0 && x <= 400 && y >= 0 && y <= 312, `${a}→${b} ${x},${y}`);
});

test("every department has a floor, and floor names exist in all languages", () => {
  for (const d of S.CLINICS) { assert.ok(S.PLACES[d.id], d.id); for (const l of ["en", "hi", "doi"]) assert.ok(S.floorName(d.id, l)); }
  assert.equal(S.floorName("ORT", "en"), "First floor");
  assert.equal(S.floorName("GYN", "en", true), "Floor 2");
});
