# QueueSetu: smart OPD registration, queue and navigation

**Problem:** at government hospitals, patients guard their place in the OPD line because the line is their only proof of a turn. Many can't find the right room, and the queue has no way to put emergencies first.
**QueueSetu** ("queue bridge": a bridge between the patient and the doctor's room) gives every patient a token they can watch move, step-by-step directions to their room, and an Emergency button on every screen. Staff get a live queue where urgent cases are pinned to the top.

Built for HackCache ’26 by Team EL Dorado (Aadhya Sharma, Mohit Sharma, Sujal Singh Saini). Track: Reimagining Government.

**Live demo:** https://queuesetu.onrender.com
The app runs on Render's free plan. If nobody has opened it for a while, **the first load can take up to a minute** while the server wakes up. After that it is fast. Staff and admin PINs are shared with the judges in the submission form.

**Who it's for:** elderly and first-time patients, people with basic phones or low digital literacy, Hindi and Dogri speakers, OPD counter staff, and hospital managers.

## Screens

| Link | Screen | What it does |
|---|---|---|
| `/#patient` | Patient home | Six big buttons: Get a token, Check my turn, Find a department, I have my slip, Emergency help, Help desk. Hindi by default. English and Dogri one tap away. Install button when the phone offers it. |
| `/#register` | Registration | One screen in three steps: name, problem (voice or symptom buttons), and department picture cards. "Not sure? Ask the Help Desk" sits at the end. Shows a confirmation, then the token. |
| `/#status` | My turn | Token slip: position in line, wait estimate, doctor status, "Get ready" alert at 3 ahead, "It's your turn" screen, map and directions, Listen, Save, Print. |
| `/#slip` | I have my slip | Type the token number (M-27, m27 and "M 27" all work). It shows the room, the route from where you are, and lets you track that token. |
| `/#find` | Find a department | Pick any room, the lab, pharmacy, Help desk or Emergency. Shows the route and directions from a starting point you choose. |
| `/#help` | Help desk | Where it is, the route to it, and a button to join the Help desk queue. |
| Emergency button | Every patient screen | Signs to watch for, 112 and 108 call buttons, and **Alert staff now**, which sends the location and signs to the staff screen. The patient then sees when staff have seen the alert. |
| `/#staff` | Staff console (PIN) | Urgent alerts pinned at the top with a repeating sound until someone taps **I've seen it**. Call next (shortcut **N**), served, skip, back to queue, out-of-turn calls with a reason, doctor status, search and filters, and sending Help desk patients to a clinic. |
| `/#assist` | Assisted registration (PIN) | Staff register a patient on their behalf, then print or save the slip. |
| `/#display` | Hall display | Who is being seen now and who is next for each department, doctor delays and breaks, a flip animation and Hindi announcement for each call, and a QR code to join. |
| `/#admin` | Dashboard (admin PIN) | Arrivals by hour, waits by department, out-of-turn reasons, emergency alert counts and time to acknowledge, a table by department, and CSV export. |
| `/#settings` | Settings | High contrast, text size (small, medium, large), language, alerts, reset. |
| `/#verify-<id>` | Slip check | Opens when the slip's QR code is scanned. The public sees only that the slip is valid. Signed-in staff also see the name and complaint. |

## How emergencies are handled

- **The app never decides who is urgent.** It raises a flag. Staff decide, and qualified medical staff assess.
- A flag is raised when a patient types or says red-flag words (chest pain, trouble breathing, bleeding and similar), or presses **Emergency help → Alert staff now**.
- Flags appear at the top of every staff console, with a repeating alarm and "URGENT" in the browser tab until someone taps **I've seen it**. When the alert was received, seen and resolved is all recorded.
- An urgent patient in the queue is **pinned above the line** with a **Call now** button. Calling them logs the out-of-turn reason as "Emergency".
- The patient is told to go to Emergency now, shown the route, and given 112 and 108 to call from their own phone. **QueueSetu never claims to have called anyone.**
- Repeated taps from the same phone within 5 minutes create one alert, not many.

## Design decisions

- **Hindi first, English and Dogri one tap away.** The switch at the top shows each language in its own script: EN / हिं / डो. All patient text, buttons, departments, places, directions, alerts and emergency signs come in all three. The hall display uses English and Hindi only, so it stays readable from across the hall. Common hospital words patients already know stay as they are (OPD, SMS, BP).
- **Picture cards, not drop-downs.** Each department card has an icon, its room and plain words ("Bones, joints, back pain").
- **"Not sure? Ask the Help Desk"** joins a real Help desk queue. Staff there send the patient on to a clinic, and the patient keeps their original arrival time so they don't lose their place.
- **Read aloud, large text, SMS** for low literacy, poor eyesight and basic phones. Big buttons (at least 44 px), keyboard access, screen-reader labels and live regions throughout.
- **Three-floor sample hospital with "Avoid stairs".** Ground floor: entrance, registration, Help desk, waiting hall, Emergency, pharmacy, lab, Medicine and Paediatrics. First floor: Orthopaedics, Eye, Skin. Second floor: Gynaecology. One staircase joins all floors. **Lift A stops only at Ground and First; Lift B only at Ground and Second.** Routes are worked out on a corridor graph in `public/shared.js`; directions name landmarks ("past Registration on your left") and floor changes ("Take Lift B up to the Second floor").

## How the wait is calculated

Each department has one doctor, so each department is one queue.

1. Take the **last 10 completed patients of that queue** (fewer if fewer exist). A completed patient's consultation time is `finished − called`, recorded by the server when staff press Served or call the next patient.
2. Ignore bad records: missing times, under 0.5 minutes or over 90 minutes, skipped patients, and other departments.
3. Average them. If there is no usable history, use the **fallback** for that department (Medicine 5, Orthopaedics 6, Paediatrics 5, Gynaecology 7, Eye 4, Skin 4, Help desk 3 minutes).
4. Estimate = `people ahead × average` + time left for the patient being seen now (`average − minutes already spent`, at least 1) + the doctor's remaining break or delay.
5. Shown the way people say it: exact under 10 minutes, then to the nearest 5 ("Approximately 25 minutes"), always labelled as an estimate, never as an appointment time.

The code is `serviceStats`, `estMin` and `queueEst` in `public/shared.js`, used by both the server and the browser. Tests: `test/wait.test.js`.

Change it with `WAIT_HISTORY` (how many patients, default 10) and `FALLBACK_MINUTES` (for example `MED:6,EYE:3`).

## The ten upgrades (v1.2)

| # | Feature | Where | How it works |
|---|---|---|---|
| 1 | **Doctor's name on the slip** | Token screen, printed slip, saved slip image, staff slip check | The slip lists hospital, token, doctor, department and room, issue date and time, estimated wait, status and what to do, plus the QR code. The doctor is the one on duty for that queue (`DOCTORS`, or typed by staff in the console). When the patient is called, the server stamps the doctor who actually saw them on the token. If no doctor is set, the slip says "Doctor will be confirmed at the room". It never invents a name. |
| 2 | **Crowding colours** | Home and Queue pages, department cards when registering, Find a department, hall display, staff console, dashboard | Low (green), Moderate (yellow), High (orange), Critical (red). Worked out from the people waiting and the estimated wait (`crowdLevel` in `shared.js`). Each badge has words and 1 to 4 bars, so it never relies on colour. Updates live on every queue change. |
| 3 | **I'm lost** | A button on every patient screen and a big button on the patient home | Opens a simple guide: how to get a token, what the token number means, how to check the wait, where the doctor is, the way to your room or the Help desk, a Help desk phone if set, and "Go to the start screen". It never changes or cancels the token. |
| 4 | **Wait from the last 10 patients** | Everywhere a wait is shown | See "How the wait is calculated" above. The staff console and dashboard show the minutes per patient and how many records it came from. |
| 5 | **First-visit language picker** | First time a phone opens any patient screen | Hindi, English and Dogri, each written in its own script. Saved on the phone. Changeable any time from the top bar or Settings. Names, token numbers and doctor names are never translated. |
| 6 | **Browser alerts** | Token screen and Settings | Explained first, then asked only when the patient taps "Turn on alerts". Alerts: token created, turn is close (3 ahead), it's your turn, and a big change in the wait (at most once every 10 minutes). Only the token number and room, never a name. Handles granted, blocked and unsupported browsers, and does not ask again after a "Block". |
| 7 | **Scan QR codes** | "I have my slip" page and the staff console | Camera starts only after the tap, with a live preview and a Stop button. Also "Scan from a photo" and typed token numbers. The scanned code must be a QueueSetu slip link (`#verify-` and a 16-character random id) or a token number. Slip links are checked with the server (`/api/verify/:id`) before anything is shown. The public sees no personal details; staff with a PIN also see the name and complaint. Uses the browser's built-in `BarcodeDetector` when it exists, otherwise `jsQR`. |
| 8 | **Settings** | `#settings`, gear button on every patient screen | High contrast (black on white, thick borders, strong focus ring) and text size Small, Medium (default) or Large. Saved on the phone, with Reset to default. Also language and alerts. |
| 9 | **Send to end of queue** | Staff console: "To end" on a waiting, called or skipped patient | Staff only (the PIN is checked on the server). Asks for confirmation and says how much longer the wait may be. The token keeps its number and history; the server sets a new place-in-line time. Refuses served tokens, a patient already last, and stale screens (if the token changed since the screen was drawn, it returns 409). Every use is in the Activity log with the role and time. Patients can't do this themselves, because the app can't prove who owns a token. |
| 10 | **Demo controls** | Dashboard (admin PIN), only when `DEMO_MODE` is on | **Add 20 patients**: 20 demo patients across departments, marked "Sample", never texted. Each click carries a one-time key, so a double click adds one batch, not two. **Remove demo data** deletes only demo and sample records. **Run time 10× faster** starts a separate simulated clock at 10× (pause, resume, stop and reset). The simulation calls and finishes demo patients by itself with realistic consultation times, which feeds the last-10 average. It never calls a real patient: if a real patient is next in a queue, it leaves that queue to staff. The server clock is never changed. |

### Crowding thresholds

A queue is at a level when **either** the wait **or** the number of people reaches it:

| Level | Wait (minutes) | People waiting |
|---|---|---|
| Moderate | 20 | 6 |
| High | 45 | 12 |
| Critical | 90 | 20 |

Change them with `CROWD_THRESHOLDS`, for example `moderate:15/5,high:40/10,critical:80/18` (minutes/people).

### Browser alerts: what works and what doesn't

- Alerts are shown by the page itself (through the service worker), so they work while the page is open or in the background on the phone.
- **They do not arrive when the browser is fully closed.** That needs Web Push (VAPID keys and a push service), which is not set up. We don't claim otherwise. SMS (Twilio) is the channel for patients who close the browser.
- iPhone: alerts only work after "Add to Home Screen" (iOS 16.4+).
- To test: open your token, tap "Turn on alerts", allow. Then call patients from the staff console until 3 are ahead.

### Send token by SMS (no provider needed)

- The token screen has a **Send SMS** button. It opens the phone's own SMS app with the token, department, room, floor, hospital and a live link already written, in the patient's language. The patient picks who to send it to: their own number, or a family member waiting outside.
- The live link (`/#t-<id>`) opens that token on the other phone, with live status, wait and directions. The id is the same random 16-character id used on the slip, so it can't be guessed.
- **Copy** puts the same text on the clipboard for WhatsApp or anything else.
- It costs nothing and needs no SMS account. It is not automatic: for automatic "3 ahead" and "your turn" texts, add Twilio keys (below).
- On a laptop the SMS button may do nothing or open Phone Link. Test it on a phone, using the Render link, so the live link works on the other phone too.

### Testing QR scanning

- Camera access needs `localhost` or `https`. On a phone, use the Render link.
- Open `#slip` → "Scan the QR code on my slip" → Start camera → point at the QR on a token screen or a printed slip.
- No camera (or a laptop in a venue)? Use "Scan from a photo" with a screenshot of a slip, or type the token number.
- Staff: "Scan slip" in the console opens the slip check with the name and complaint.

### Demo mode

`DEMO_MODE=true` (default) shows the demo panel to admins on the dashboard. Set `DEMO_MODE=false` for real use: the panel disappears and the API refuses demo calls with 403. Sample data in the morning is separate: `SEED_SAMPLE`.

## Works on a weak connection

QueueSetu is an installable app (PWA). After the first visit, the app itself is saved on the phone.

- **Opens with no signal.** `public/sw.js` keeps the app files on the phone. Live queue data is never cached by the service worker. The app keeps its own last copy and says so: "You're offline. Your place in the queue may be out of date. Last updated 2 minutes ago."
- **Registration with no signal.** If the phone is offline when the patient presses the green button, the form is kept on the phone and shown as **Waiting to be confirmed**, with no token number yet (we never invent one). As soon as the connection is back, QueueSetu sends it by itself and the real token appears. Sending the same form twice gives the same token, not two.
- **Install button** on the patient home and in the footer. It only appears when the phone offers installing (Chrome and Edge on Android and desktop). On iPhone: Share → Add to Home Screen.
- Needs https or `localhost`. A phone opening your laptop's Wi-Fi address over plain http gets the app, but not the offline part. Render gives you https.

**Test it yourself (Chrome):**
1. Open the site, go to `#patient`, then reload once.
2. DevTools → Application → Service workers: "baari" is activated. Manifest shows the name and icons.
3. Network tab → set **Offline**. Reload. The patient home still opens, with the offline warning.
4. Still offline, register a patient. You see "Waiting to be confirmed".
5. Set Network back to **No throttling**. Within a few seconds the real token appears.
6. Lighthouse → "Progressive Web App" or "Installable" check passes.

## Dogri

- **Why Dogri and not Tamil:** the add-on gives Tamil as an example ("Add [Tamil] as a third language"). We chose Dogri, the language of Jammu, where this hackathon is hosted and where our user Kamla lives. Dogri is one of India's 22 scheduled languages and is rarely supported by apps. Adding Tamil or any other language is one more set of text strings, with no code changes.
- Every patient screen, the Emergency sheet, directions, map labels and the slip image are in Dogri (Devanagari) when डो is chosen. Language code `doi`.
- No browser has a Dogri speech model. Voice typing listens in Hindi, and **Listen** reads Dogri text with a Hindi voice. Both are understandable because the script is the same, but they are not true Dogri speech.
- The hall display stays in English and Hindi so it fits one screen and reads from a distance.
- **Have a native Dogri speaker review the text before the demo or real use.** It was written carefully, but not checked by a native speaker. All Dogri strings sit next to the Hindi and English ones (`doi:` keys and the third argument of `L3(...)` in `app.js`, and `doi` in `shared.js`).
- Adding another language (Urdu, Punjabi): add a key next to `hi`/`en`/`doi` in each string table and extend `LANGS` and `L3` in `app.js`. Urdu also needs right-to-left layout.

## Run it on your laptop

You need [Node.js 18 or newer](https://nodejs.org). There is no database to set up and no build step: the server is Node.js with Express and Socket.IO, and the browser code is plain JavaScript served from `public/`.

```bash
npm install
npm start          # or: npm run dev (restarts on changes)
```

Open http://localhost:3000.
- Staff PIN **1234**, admin PIN **4321**. Set your own with `STAFF_PIN` and `ADMIN_PIN`. PINs are numbers only (the login box accepts digits only).
- In Windows PowerShell: `$env:STAFF_PIN="2580"; $env:ADMIN_PIN="9876"; npm start`

## Tests

```bash
npm test                  # unit and API tests (Node's built-in test runner, no extra install)
npm i -D playwright && npx playwright install chromium
npm run test:browser      # browser tests: core flows, live sync, offline, Dogri, and the 10 new features
```

- `test/route.test.js`: every route on every floor, with and without stairs; Lift A skipping a floor; map points inside the plan.
- `test/wait.test.js`: last-10 average, fallbacks, invalid records, current patient, doctor delay, send-to-end ordering, crowding thresholds, rounding.
- `test/api.test.js`: starts a real server with a temporary data file. Doctor on the slip, recorded consultation times, send to end (auth, order, audit, stale screen, served token, two staff at once), demo add (idempotent) and clear (keeps real patients), the 10× clock and that it never touches real patients.
- `test/browser/`: each test gets its own fresh server. `run-all.js` starts them.

Production build: there is nothing to compile. Deploy the folder as it is (`npm install --omit=dev && npm start`).

## Put it online for free (Render)

1. Push this folder to GitHub, without `node_modules` and `data`.
2. On https://render.com, choose **New > Blueprint** and pick the repo. Render reads `render.yaml`.
3. Set `STAFF_PIN` and `ADMIN_PIN` when asked.
4. Open the site a couple of minutes before the demo. The free plan sleeps when idle.

## Settings (environment variables)

| Name | Default | What it does |
|---|---|---|
| `STAFF_PIN` / `ADMIN_PIN` | `1234` / `4321` | Counter staff run the queue. Admins also see the dashboard, export CSV and reset the day. |
| `HOSPITAL_NAME` | `Demo District Hospital` | Shown on every screen |
| `EMERGENCY_CONTACTS` | `112:National emergency,108:Ambulance` | Numbers on the Emergency sheet, as `number:label` separated by commas |
| `HOSPITAL_EMERGENCY_PHONE` | not set | The hospital's own verified emergency desk number, shown first |
| `SEED_SAMPLE` | `true` | Loads demo patients each morning. **Set to `false` for real use.** Demo records are marked "Sample" and are never texted. |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | not set / `gemini-2.5-flash` | AI department suggestions. Without a key, keyword rules are used. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | not set | Real SMS. Without them, texts are listed in the staff outbox only. |
| `DATA_FILE` | `data/state.json` | Where the queue is saved |
| `DOCTORS` | not set | Doctor on duty per queue, for example `MED:Dr. A. Gupta,ORT:Dr. S. Khajuria`. Staff can also type it in the console. Without it, sample names are used only when `SEED_SAMPLE` is on. |
| `HELP_DESK_PHONE` | not set | Shown in "I'm lost" as a call button |
| `WAIT_HISTORY` | `10` | How many recent patients the wait average uses |
| `FALLBACK_MINUTES` | department defaults | Minutes per patient when a queue has no history, for example `MED:6,EYE:3` |
| `CROWD_THRESHOLDS` | `moderate:20/6,high:45/12,critical:90/20` | Crowding levels, minutes/people |
| `DEMO_MODE` | `true` | Demo patients and the 10× simulation for admins. **Set to `false` for real use.** |

Copy `.env.example` for a full list. The app reads real environment variables; it does not load `.env` files by itself (on Render, set them in the dashboard).

Secrets stay on the server. Nothing in `public/` contains a key.

## Navigation: floors and "Avoid stairs"

- Built for patients like Kamla, 62, who walks slowly and avoids stairs. One switch, **Avoid stairs (lifts only)**, sits on every map and in Settings, and is remembered on the phone.
- With it on, **stair links are removed from the graph before the route is worked out** (`route(from, to, { avoidStairs: true })` in `shared.js`), so the answer can never contain stairs. With it off, the shortest route is used, which may take the stairs.
- Because Lift A doesn't reach the Second floor, going from Eye (First floor) to Gynaecology (Second floor) without stairs means Lift A down to the Ground floor, then Lift B up. The map shows one plan per floor, numbered in order, and greys out lifts that don't stop on that floor.
- If no step-free route exists (for example, if a lift is removed from the plan), the app says so and sends the patient to the Help desk for a wheelchair or a guide. It never shows a route with stairs instead.
- The floor is on the slip, the token screen, the hall display, Find a department, the staff console and the SMS.
- Tests: `test/route.test.js` checks every pair of places with and without stairs.
- Your own hospital: edit `FLOORS`, `PLACES`, `NODES`, `EDGES` and `LINKS` in `shared.js`.

## Do you need a database?

**Not for the hackathon.** QueueSetu keeps today's queue in one JSON file (`data/state.json`), written safely after every change. There is no dataset to download either: no Kaggle data is needed, because the queue is created live by patients and staff, and demo patients are generated by the server.

**For a real hospital, yes:**
- Render's free plan wipes the file when the service restarts, so a long-running deployment needs a persistent disk or a database.
- Move to PostgreSQL (Render, Supabase or Neon all have free tiers) for history across days, reports, and several servers at once.
- Tables: `tokens`, `alerts`, `audit_log`, `doctors_on_duty`, `sms_outbox`. Queue changes run in a transaction with a row lock on the department.

## How it's built

```
 Patient phones ─┐                          ┌─ Staff console / Dashboard (PIN, roles)
                 ├── HTTPS + Socket.IO ── Node.js + Express ── data/state.json
 Hall display ───┘     (live updates)       ├─ Gemini (optional)   └─ Twilio SMS (optional)
```

- `server.js`: API, validation, roles, rate limits, duplicate checks, emergency alerts, doctor status, saving to disk.
- `public/shared.js`: departments, triage words, the three-floor plan, route finding (with Avoid stairs) and directions, wait estimate. Used by both server and browser.
- `public/app.js`: all screens. `public/styles.css`: the look. `public/sw.js` and `public/manifest.webmanifest`: offline app and install.
- `test/`: unit and API tests (`npm test`), and browser tests in `test/browser/`.
- `.env.example`: every setting with its default.
- **Privacy:** patient phones and the hall display receive only token numbers. Names, complaints, phone numbers (masked) and alerts go only to signed-in staff.

### API

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/api/state` | anyone | Today's queue: token numbers, doctor status, emergency numbers |
| POST | `/api/tokens` | anyone | Register: `{name, complaint, dept, phone, sms, lang: hi, en or doi}`. Returns the existing token if this name and phone already have one today. |
| POST | `/api/triage` | anyone | Suggest a department: `{text}` → `{dept, urgent, why_en, why_hi, why_ta, source}` |
| POST | `/api/emergency` | anyone | `{clientId, place, signs[], tokenId?}` → alert id and status |
| GET | `/api/emergency/:id` | anyone | Status only: open, acknowledged or resolved, with times |
| POST | `/api/staff/login` | staff | `{pin}` → `{role}` |
| GET | `/api/staff/state` | staff | Full queue, alerts, log, SMS outbox |
| POST | `/api/staff/register` | staff | Assisted registration |
| POST | `/api/staff/call` | staff | Call next `{dept}`, or out of turn `{dept, tokenId, reason, note}` |
| POST | `/api/staff/finish` | staff | Current patient served or no-show |
| POST | `/api/staff/status` | staff | `{tokenId, status}`: served, skipped, or back to waiting |
| POST | `/api/staff/move` | staff | Send a Help desk patient to a clinic: `{tokenId, dept}` |
| POST | `/api/staff/doctor` | staff | `{dept, status: available, break or delayed, mins}` |
| POST | `/api/staff/alert` | staff | `{id, action: "ack" or "resolve"}` |
| POST | `/api/staff/reset` | admin | Start an empty day, or load demo patients |
| GET | `/api/verify/:id` | anyone (more for staff) | Slip check after a QR scan: token, department, status, doctor. With a staff PIN also name and complaint. |
| POST | `/api/staff/requeue` | staff | Send to end of queue: `{tokenId, from}` where `from` is the status the screen showed. 409 if it changed. |
| POST | `/api/staff/doctor` | staff | Also takes `name` for the doctor on duty |
| POST | `/api/admin/demo/add` | admin, demo mode | `{key}` adds 20 demo patients. Same key twice adds nothing. |
| POST | `/api/admin/demo/clear` | admin, demo mode | Removes demo and sample records only |
| POST | `/api/admin/sim` | admin, demo mode | `{action: start, pause, resume or stop}` |

`GET /api/state` now also has `service` (average minutes per patient and how many records), `config` (thresholds), `doctors[dept].name`, `sim` and `demoMode`.

## Demo script (3 minutes)

1. **Patient home (20 s):** open `#patient` on a phone. Six big buttons, Hindi by default. *Solves: patients don't know where to start.*
2. **Register (40 s):** type or say "seene mein dard". The red warning appears with the Emergency button. Change it to "ghutne mein dard", and Orthopaedics is picked. Get the token and show the confirmation. *Solves: hard forms and wrong departments.*
3. **Staff and board (40 s):** the urgent patient is pinned on the staff console with an alarm. Tap "I've seen it", then "Call now". Press **N** a few times. The phone shows "Get ready, only 3 ahead", and the hall display flips and announces in Hindi. Set the doctor to "Delayed 15 min" and the phone updates. *Solves: invisible queues, and emergencies stuck in line.*
4. **I have my slip, avoid stairs (30 s):** this is Kamla, who avoids stairs. On another phone, enter an Orthopaedics or Gynaecology token number (or scan the slip), choose "Waiting hall" as the start, and show the route with the stairs. Tick **Avoid stairs**: the route switches to the lift and the map shows each floor. Tap **Listen**. *Solves: patients lost between the slip and the room.*
5. **Emergency (20 s):** tap Emergency, then "Alert staff now". It appears on the staff screen, and the phone shows when staff have seen it. *Solves: emergencies that go unnoticed.*
6. **Dashboard (30 s):** sign in with the admin PIN and open `#admin`. Show the peak hour, the longest-wait department and out-of-turn reasons, then export CSV. *Solves: managers can't see overcrowding.*

**If you have one more minute:** on the dashboard press **Add 20 patients** and watch the crowding badges on the hall display turn orange, then **Start 10× simulation** and let the queue move by itself. On a phone, open **I'm lost** and **Settings → Large + High contrast**.

## Live demo: what could go wrong, and how to avoid it

| Risk | What you'd see | How to avoid it |
|---|---|---|
| Render free plan is asleep | First load takes 30 to 60 seconds | Open the site 5 minutes before you present, and keep a tab open |
| Venue Wi-Fi blocks websockets | "Reconnecting…" on every screen | Socket.IO falls back to polling by itself. Keep a phone hotspot ready for the laptop |
| Phone can't open `localhost` | Blank page on the phone | Use the Render link, or the laptop's Wi-Fi address (`http://192.168.x.x:3000`) on the same network |
| Old data from rehearsals | Odd token numbers, extra alerts | Admin dashboard → reset the day with demo patients, just before you start |
| Staff PIN typed wrong on stage | "Wrong PIN" | Sign in on the staff laptop before the demo starts |
| No sound on the hall display | Silent calls | Click **Turn on sound** once on the display. Browsers block sound until a click |
| Voice input fails | Mic button shows an error | Needs Chrome or Edge, https and mic permission. Type instead and say voice works on phones |
| Fonts blocked on venue network | Plainer fonts | Nothing breaks. System fonts take over |
| Offline demo shows old app | Changes not visible after a redeploy | Reload twice, or DevTools → Application → "Update on reload" |
| Rate limit during rehearsal | "Too many tokens from this device" | Restart the server, or use another phone. Limits reset after 10 minutes |
| Laptop battery or screen sleep | Display goes dark mid-demo | Plug in, and turn off sleep for the session |

**Backup plan:** a screen recording of the full 3-minute flow on a USB stick and in Drive, and a local copy on the laptop where `npm install` has already run, so `npm start` works with no internet (phones join over the laptop's hotspot).

## What's real and what's simulated

| Real | Simulated or limited |
|---|---|
| Registration, unique tokens, live queue on every device, saved to disk | Departments, rooms, floor plan and demo patients are sample data (`SEED_SAMPLE=true`) |
| Emergency alerts with acknowledgement, pinning, alarm and timestamps | Emergency numbers dial from the patient's own phone. QueueSetu doesn't call anyone. |
| Voice input in Hindi and English (Chrome or Edge, over https) | Dogri voice uses the Hindi model. Browsers have no Dogri speech model. |
| Read aloud in Hindi, English and Dogri (Dogri is read with a Hindi voice) | Automatic SMS only goes out once Twilio keys are added. "Send SMS" from the token screen works without them. |
| Staff and admin roles, server-side validation, rate limits | One shared PIN per role. A real hospital needs individual staff logins. |
| Doctor names come from `DOCTORS` or staff | The names in demo mode are made up and only appear when `SEED_SAMPLE` is on |
| 10× simulation moves demo patients for real on every screen | It only exists in demo mode. Turn it off with `DEMO_MODE=false` |
| Slip with QR, print, save as image, and a public check page | No link to hospital records (HMIS, ABHA) |
| Dashboard and CSV export | The free Render plan resets saved data when it restarts. Use a persistent disk or a database for real use. |

## Not finished, and why

- **Urdu and Punjabi:** not added. Urdu needs right-to-left layout.
- **Dogri review:** needs a native speaker's check before real use.
- **Staff screens** stay in English. They're used by trained staff at the counter.
- **Background push alerts** (when the browser is fully closed) need Web Push with VAPID keys. Not built.
- **Patients sending themselves to the end of the queue:** not allowed, because there is no patient login. Staff do it.
- **Storage:** one JSON file, written atomically after each change. Node handles one request at a time, so queue changes don't interleave, but there are no database transactions. A real hospital should move to PostgreSQL with row locks.
- **Real hospital floor plan:** the sample three-floor plan is configurable in `shared.js` (`FLOORS`, `PLACES`, `NODES`, `EDGES`, `LINKS`).

## Next steps

1. Link to ABHA and hospital records, so returning patients skip registration.
2. Voice calls (IVR) for patients with no phone.
3. Individual staff accounts, and a database such as PostgreSQL in place of the JSON file.
4. Background sync so offline registrations are sent even after the tab is closed, and Dogri.
