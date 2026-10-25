/* Runs every browser test against its own fresh server (sample data on, temporary data file).
   Needs Playwright:  npm i -D playwright && npx playwright install chromium
   Optional: CHROMIUM=/path/to/chromium  SHOTS=/folder/for/screenshots */
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path"), os = require("node:os"), fs = require("node:fs");
const TESTS = ["core-flows.js", "live-sync.js", "offline.js", "dogri.js", "features.js"];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  let failed = 0, passed = 0;
  for (const [i, file] of TESTS.entries()) {
    const port = 3500 + i, data = path.join(os.tmpdir(), `baari-browser-${process.pid}-${i}.json`);
    try { fs.unlinkSync(data); } catch (e) {}
    const srv = spawn(process.execPath, [path.join(__dirname, "..", "..", "server.js")], { env: Object.assign({}, process.env, { PORT: String(port), DATA_FILE: data, SEED_SAMPLE: "true", STAFF_PIN: "1234", ADMIN_PIN: "4321", DEMO_MODE: "true" }), stdio: "ignore" });
    for (let k = 0; k < 50; k++) { try { await fetch(`http://localhost:${port}/healthz`); break; } catch (e) { await sleep(100); } }
    const r = spawnSync(process.execPath, [path.join(__dirname, file), `http://localhost:${port}/`], { encoding: "utf8", timeout: 600000 });
    srv.kill(); try { fs.unlinkSync(data); } catch (e) {}
    const out = (r.stdout || "") + (r.stderr || "");
    const p = (out.match(/^PASS /gm) || []).length, f = (out.match(/^FAIL /gm) || []).length;
    passed += p; failed += f + (r.status && !f ? 1 : 0);
    console.log(`\n== ${file}: ${p} passed, ${f} failed${r.status ? " (exit " + r.status + ")" : ""}`);
    out.split("\n").filter(l => /^FAIL |Error/.test(l)).forEach(l => console.log("  " + l));
  }
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
