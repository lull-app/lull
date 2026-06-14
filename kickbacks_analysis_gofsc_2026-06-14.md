# Kickbacks.ai — Vollanalyse + Lull GOFSC Business Case
Stand: 2026-06-14 | Nächste Session: Implementierung

---

## 1. KICKBACKS.AI — VOLLANALYSE (A–Z)

### Produkt

**Core Idea:** Ersetzt die zufälligen Spinner-Verben ("Discombobulating…") in Claude Code & Codex durch eine gesponserte Textzeile. 50% des Ad-Revenue geht an den Entwickler.

**Tagline:** "Get paid for waiting." / "Built for people who watch spinners professionally."

**CTA:** "🤑 Install the VS Code extension $40.45/mo" (das ist die angezeigte Earning-Estimation)

---

### 4 Surfaces (wie sie es bauen)

| Surface | Wo | Technische Methode |
|---|---|---|
| **Spinner Overlay** | Claude Code VS Code Panel | Patcht `webview/index.js` der Claude Code Extension — findet Verb-Array `["Discombobulating","Flibbertigibbeting",...]`, injiziert JS-Block der DOM überschreibt |
| **Thinking-Shimmer** | Codex VS Code Panel | Gleicher Patch-Ansatz |
| **Status-Bar Line** | Claude Code Terminal CLI | Patcht `~/.claude/settings.json` → `statusLine` = ihr MJS-Script das Ad holt + anzeigt |
| **Spinner Verb** | Claude Code Terminal CLI (≥2.1.143) | Patcht `~/.claude/settings.json` → `spinnerVerbs: [adText]` überschreibt die Verb-Liste |

**Kritischer Fund:** Der CLI-Surface braucht KEIN PTY-Wrapping — sie patchen direkt `~/.claude/settings.json`. Claude Code liest diese Datei und zeigt dann ihren Text als Spinner-Verb.

---

### Revenue Model

- **Min-Bid:** $1 pro Block = 1.000 Impressions (5-Sekunden-Viewability)
- **Klicks:** 50× den Impression-Preis (Klick = 50 Impressions)
- **Auction:** English ascending — höchstes Gebot served first
- **Dev-Share:** 50% des Net-Revenue
- **Payout:** Monatlich via Stripe, $10 Minimum, nach Tax-Dokumentation

**Live-Inventory heute (aus Competitor-Research):**

| # | Kampagne | CPM | Status |
|---|---|---|---|
| 1 | Nscale | $20.00 | LIVE |
| 2 | Aikido | $15.01 | LIVE |
| 3 | box | $15.00 | LIVE |
| 4+ | Synorb, shieldcn, Rove Travel, ... | $10–15 | LIVE/QUEUED |
| CatchAll | 78.000 Impressions gekauft | $10 | QUEUED |

**Dev-Earning-Estimate auf ihrer HP:** $40.45/mo

---

### Technische Architektur

**VS Code Extension:**
- `adapters/claude-code/adapter.ts` → Webview-Patch (findet Verb-Array via Anchors, injiziert Block)
- `adapters/claude-cli/adapter.ts` → Settings-Patch (`spinnerVerbs` + `statusLine`)
- `adapters/codex/adapter.ts` → Codex-Patch
- `activity/logTail.ts` → liest Claude Code's JSONL-Transcript (`~/.claude/projects/.../session.jsonl`) um echte AI-Aktivität zu detektieren
- `auth/` → Google Sign-In, OS-Keychain für Token
- `metrics/` → Impression/View/Click-Telemetry (loopback HTTP, idempotent)
- `killswitch/` → Server-controlled Off-Switch
- `statusbar.ts` → zeigt "Kickbacks ($0.42 today · $7.11)" in VS Code Status Bar

**Settings-Patch für CLI (`~/.claude/settings.json`):**
```json
{
  "spinnerVerbs": ["Linear — issue tracking that's actually fast ↗"],
  "statusLine": { "type": "command", "command": "~/.vibe-ads/vibe-ads-statusline.mjs" }
}
```
→ Claude Code liest `spinnerVerbs` und nutzt diese statt der eingebauten Liste  
→ `statusLine` = Custom-Script das Earnings anzeigt

**Fraud Prevention:**
- 5-Sekunden Viewability-Pflicht
- UUID-Dedup (1 Account pro Device)
- Salted IP-Hash (nie raw IP gespeichert)
- Activity Caps
- Bidirektionales Monitoring (viele Accounts hinter 1 IP + 1 Account über viele IPs)
- Haiku/Loop-Farm Detection

**Privacy:**
- Kein Code, kein Prompt, kein Filename gesammelt
- Lokales Session-File-Reading nur für Timing (nichts gesendet)
- IP: transient, nur für Rate-Limiting/Fraud
- Payment: Stripe (keine Card-Details bei KB gespeichert)
- **ABER:** erfordert Google Sign-In oder Magic Link → Email + Name bekannt

**Lizenz:** Source-Available (NICHT Open Source) — © 2026 ShiftKeys Inc. Lesen erlaubt, nutzen/kopieren verboten.

---

### Schwächen

1. **Fragile Webview-Patch** → bricht bei jedem Claude Code Update (riesiger Backup/Restore-Komplex nötig)
2. **50% Rev-Share** → niedrig für Devs
3. **Google Auth Pflicht** → Privacy-Problem, Onboarding-Friction
4. **Non-Dev-Advertiser** (Rove Travel, Orleans Shoes) → Brand-Safety-Risk
5. **Text-Only** → keine Logos, keine visuelle Differenzierung für Advertiser
6. **Source-Available, nicht Open Source** → Community-Moat fehlt
7. **Keine Targeting-Kontrolle** → Advertiser kriegen Random-Mix

---

### Marktdaten (VS Code Marketplace, Stand 2026-06-15)
- **Installs:** 13.933
- **Rating:** ~2.5 Sterne
- **Leaderboard aktuell:** LEER ("No bids yet — be the first to claim the spinner") — Bids könnten gecleant worden sein oder Inventory gerade erschöpft

### Terms of Service (Key-Daten)
- Rev-Share: 50% des **Net**-Revenue (nach operational expenses) — nicht Gross
- Payout: $10 Minimum, monatlich via Stripe Connect
- Viewability: mind. 5 Sekunden consecutive, human-initiated
- Liability Cap: max($100 oder amounts paid)
- Verbot: Reverse Engineering, Multi-Account, Automated Clicks, Cap Circumvention
- Letzte Änderung: June 10, 2026 (v1.1)

### CLI-Surface — Technische Details (vollständig)

**Ad-Delivery Pipeline für CLI:**
1. Extension schreibt Ad-Text nach `~/.vibe-ads/cli-ad.json` (mit Timestamp, 10-Min-Freshness)
2. `spinnerVerbs` in `~/.claude/settings.json` → Claude Code nutzt den Ad-Text als Spinner-Verb
3. `statusLine: { type: "command", command: "~/.vibe-ads/vibe-ads-statusline.mjs" }` → Script läuft bei jeder Statusline-Abfrage
4. `statusline.mjs` liest `cli-ad.json`, druckt Ad-Text mit **OSC 8 Hyperlink** (klickbarer URL im Terminal!)

**CLI Activity Detection:**
- Liest `~/.claude/projects/**/*.jsonl` Transcript-Files
- Sucht Transcript mit `entrypoint: "cli"` Tag (neu seit CC 2.1.143)
- Fallback: neuester ungetaggter Transcript (ältere CC-Versionen)
- IGNORIERT: `entrypoint: "claude-vscode"` (VS Code Panel, anderer Surface)

**Impression-Billing (Events):**
```
impression_rendered → impression_viewable (nach 5s) → view_tick (alle 5s) → view_threshold_met (nach 15s kumulativ)
```
- Shared Cooldown Bucket per (user, ad) — kein Double-Billing über Surfaces
- `click` = eigener Event, 50× Impression-Wert

**Chain-Capture:** Wenn User bereits ein `statusLine`-Script hatte → ihr Script läuft UNTER dem Ad-Script, nicht stattdessen (Stack, nicht Replace)

---

## 2. LULL — GOFSC ANALYSE

### 🔭 G — Red-Team / Widersprüche

**Lull's Competitor-Doc war falsch:**
- Kickbacks ist NICHT Open Source → Lull's MIT-Vorteil ist größer als gedacht
- Kickbacks hat 4 Surfaces, nicht "VS Code only" → Lull hat nur 1 von 4

**Technische Risiken:**
- Webview-Patch (Surface 1/2) = Maintenance-Hölle. Jedes CC-Update bricht es. Kickbacks hat 200+ Zeilen nur für Backup/Restore-Safety. Das ist ihr Moat UND ihre Achillesferse.
- Settings-Patch (Surface 3/4) ist viel einfacher und stabiler. CC ändert `spinnerVerbs`-API selten.
- Lull's `onDidWriteTerminalData`-Detector: funktioniert nur wenn Claude im VS Code Terminal läuft. Die meisten Devs laufen Claude im externen Terminal → Detection schlägt fehl.

**Business-Risiken:**
- Kickbacks ist bereits live mit echten Advertisern ($20 CPM Nscale) → Zeitdruck
- CatchAll hat 78.000 Impressions gekauft → Nachfrage ist real, Inventory ist knapp
- $40.45/mo Earning-Claim auf der HP → das ist ihr Key-CTA, Lull braucht Gegenzahl

---

### 🧠 O — Strategie

**Lull's echte Differenzierung (priorisiert):**

1. **70% vs 50% Rev-Share** → einziger Zahlen-Vorteil, klar kommunizierbar
2. **Anonym vs Google-Auth** → "Wir wissen nicht wer du bist" ist starkes Privacy-Statement
3. **MIT Open Source** → Community-Moat, Vertrauen, Forkability
4. **Visual Card** → Logo + Tagline + CTA statt Plain-Text → höheres Advertiser-CPM möglich
5. **70% → Dev-Earning: ~$56.63/mo** (statt Kickbacks $40.45) → besserer CTA-Claim

**Surface-Priorität für Lull:**

| Prio | Surface | Aufwand | Methode |
|---|---|---|---|
| 🔥 1 | CLI `spinnerVerbs` | Klein | `~/.claude/settings.json` patchen |
| 🔥 2 | CLI `statusLine` | Klein | MJS-Script in `~/.vibe-ads/` deployen |
| ⚡ 3 | VS Code Status Bar | DONE ✅ | Bereits gebaut |
| 🏗 4 | Webview-Patch (VS Code Panel) | Groß + fragil | Kickbacks-Ansatz nachbauen |

**Entscheidung:** Surface 4 (Webview-Patch) bewusst für Phase 2 lassen. First: CLI-Surfaces + stabiler Status Bar. Das reicht für Demo + Outreach.

---

### 🚀 F — Positioning & Narrative

**Lull's Story:**

> "Kickbacks nimmt 50% und kennt deinen Google-Account.  
> Wir zahlen 70% und wissen nicht wer du bist."

**Landing Page Headline-Option:**
> "Get paid more. Stay anonymous."  
> "70% of ad revenue. Zero signup required."

**Advertiser-Pitch:**
> "Dieselbe Audience wie Kickbacks — aber mit Logo, Tagline und echtem CTA. Nicht nur Text."

**Founding-500 Hook:**
> "Erste 500 Devs: 80% permanent. Für immer."

---

### 🐜 S — Was Lull jetzt hat vs was fehlt

**✅ Fertig:**
- VS Code Extension (VSIX 0.1.0)
- Status Bar Ad (Surface 3 — funktioniert)
- Demo Ads (5 Demo-Advertisers)
- Detection via Terminal-Data-Watcher
- `Simulate AI call` Command zum Testen

**❌ Fehlt für vollständige Demo:**
- `spinnerVerbs`-Patch für Claude CLI (Surface 4) → simpelster Quick-Win
- `statusLine`-Script für Claude CLI (Surface 3b)
- Backend (Ad-Delivery API, Impression-Counter, Advertiser-Portal, Dev-Dashboard)
- Auth (anonym UUID — haben wir schon; aber kein echtes Dev-Dashboard)
- Outreach (5 Pilot-Advertiser noch nicht angeschrieben — fällig seit heute)

---

## 3. PREMORTEM — LULL BUSINESS CASE

### Was kann schiefgehen?

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Kickbacks dominiert Marketplace bevor Lull live ist | Hoch | Hoch | Direkt-Distribution (.vsix + GitHub) — kein Marketplace-Kampf |
| Anthropic ändert `spinnerVerbs`-API | Mittel | Mittel | Restore-Logik bauen wie KB; degradiert gracefully zu Status Bar |
| Kein Advertiser-Commitment vor Build | Hoch | Fatal | Phase 0: ERST 1 Advertiser mit $500 Commitment, DANN bauen |
| Non-Dev-Advertiser verschmutzen Inventory | Mittel | Mittel | Self-Serve Portal mit Dev-SaaS-Fokus; kein Open Bidding für alles |
| Dev-Backlash gegen Ads in der IDE | Mittel | Mittel | Open Source + Privacy-Manifest + 80% Founding-Share = Vertrauen |
| Impression-Farming | Mittel | Mittel | UUID-Dedup + Cooldown (bereits in KB-Analyse gesehen) |
| Lull wird nie fertig weil kein Backend | Hoch | Hoch | Backend Phase 1: minimal (Ad-JSON-File + Stripe-Link reicht für Pilot) |

---

## 4. IMPLEMENTIERUNGS-PLAN (ab morgen)

### Phase 0 — Diese Woche (Demand First)

**Ziel: 1 Advertiser mit $500 Commitment BEVOR Backend gebaut wird**

- [ ] `spinnerVerbs`-Patch implementieren (Prio 1, ~2h)
  - Schreib-/Restore-Funktion für `~/.claude/settings.json`
  - Command: `Lull: Enable CLI spinner` / `Lull: Disable CLI spinner`
  - Test: `claude "test"` → sieht man die Ad als Spinner-Text?
- [ ] Demo aufnehmen: Status Bar + CLI Spinner gleichzeitig
- [ ] `[Dein Name]` in `outreach_mail.md` ersetzen
- [ ] 5 Pilot-Advertiser anschreiben (bereits vorbereitet in `outreach_contacts.md`)

### Phase 1 — KW 26 (Backend Minimal)

- [ ] Ad-Delivery: JSON-File auf Vercel (statisch) reicht für Pilot
- [ ] Impression-Counter: einfache Supabase-Tabelle
- [ ] Dev-Dashboard: Earnings-Anzeige (kann erst mal statisch sein)
- [ ] `statusLine`-Script für Claude CLI (Surface 3b)

### Phase 2 — KW 27+ (Wenn Advertiser committet)

- [ ] Webview-Patch (Surface 1/2) — Parity mit Kickbacks im VS Code Panel
- [ ] Self-Serve Advertiser-Portal
- [ ] Real-Time Bidding
- [ ] Founding-500 Badge

---

## 5. ZAHLEN FÜR OUTREACH

**Dev-Earning Claim für Lull:**
- Kickbacks: $40.45/mo bei 50%
- Lull: $56.63/mo bei 70% (gleiche CPM-Basis)
- Founding-500: $65.00/mo bei 80%

**Advertiser-Pitch:**
- $1 Min-Bid = 1.000 Impressions
- 2M aktive AI-Tool-Devs (Cursor + Claude Code + Codex + Windsurf)
- CPM Real-Range: $10–20 (kickbacks.ai Markt bewiesen)
- Clicks: 50× Impression-Wert

---

## 6. TECHNISCHE ENTSCHEIDUNG: WEBVIEW-PATCH JA/NEIN?

**Argumente DAFÜR:**
- Parity mit Kickbacks Surface 1 (das ist die sichtbarste Surface)
- Höhere Advertiser-CPM (sichtbarer als Status Bar)
- Demo ist beeindruckender

**Argumente DAGEGEN:**
- Maintenance-Hölle (CC updated sich häufig)
- 200+ Zeilen Backup/Restore-Logic nötig
- Rechtliches Graugebiet (fremde Extension patchen)
- Lull's Differenzierung ist NICHT "auch Webview-Patch" sondern bessere Terms + Open Source

**Entscheidung: NEIN für Phase 0+1. Revisit wenn Advertiser committet.**

---

## 7. KICKBACKS VOLLBILD — FLOWS & MISSING PIECES (nachgeholt)

### User-Dashboard (`/me`)
- Sign-in: **Google, Apple, Email/Magic Link**
- Zeigt: credited events, payout status, recent activity
- Kein separates `/advertise` — Advertiser-Form direkt auf der HP eingebettet

### Onboarding-Flow (nach Install)
1. Extension installiert → Status Bar zeigt "Kickbacks: Sign in" (rot)
2. User klickt → Browser öffnet → Google/Apple/Email Auth
3. Token landet in `~/.kickbacks/auth.json` (0600 Permissions) + VS Code SecretStorage
4. Nach Sign-in: **Consent-Popup** erscheint einmalig:
   > *"Kickbacks shows subtle ads in the Claude Code spinner and splits 50/50 of every settled dollar back to you. Telemetry is opt-in. Continue?"*
   - Buttons: **Agree** / **Privacy Policy**
5. Nach Agree: Injection startet, Status Bar wird grün: `Kickbacks ($0.00 today · $0.00)`

### Auth-Technisch
- Browser-based OAuth (polling Loop alle 1.5s, Timeout 3min)
- Token-Persistence: `~/.kickbacks/auth.json` (universal) + OS-Keychain (macOS: Keychain, Windows: DPAPI, Linux: libsecret, Fallback: plaintext)
- Alte Tokens: `~/.vibe-ads/auth.json` (Vibe-Ads war der frühere Name)
- Single-Flight Guards gegen parallele Sign-In/Refresh-Races

### Commands (Palette)
- `Kickbacks: Sign in`
- `Kickbacks: Sign out`
- `Kickbacks: Restore Claude Code` (entfernt Patch)
- `Kickbacks: Status`
- `Kickbacks: Check for updates`
- Debug Menu (intern)

### Earnings-Model (technisch)
- API: `GET /v1/earnings` → `{ lifetimeUsd, todayUsd, cap? }`
- Cap: hourly + daily (Werte nicht veröffentlicht), bei Cap: roter Status-Bar-Pill mit Countdown
- Demo-Mode: Auch ohne Sign-in laufen echte Ads (Demo-Portfolio), Klicks öffnen echte URLs — Revenue geht aber an Demo-Bucket, nicht an User
- Self-Update: Extension updated sich selbst (`/v1/update`)

### Consent-Text (wörtlich — wichtig für Lull-Formulierung)
> "Kickbacks shows subtle ads in the Claude Code spinner and splits 50/50 of every settled dollar back to you. Telemetry is opt-in. Continue?"

### Frühere Namen
- War "Vibe-Ads" → umbenannt zu "Kickbacks" (Legacy-Keys `vibe-ads.*` noch im Code)

---

## 8. LULL LANDING PAGE KONZEPT (abgeleitet aus Analyse)

### Hero Section

**Headline:**
> "Get paid more. Stay anonymous."

**Sub:**
> "We turned 'Discombobulating…' into an ad marketplace — and give you 70% of every dollar."

**Before/After Demo (wie kickbacks, aber besser):**
```
Stock Claude Code:    ⠋ Discombobulating… (esc to interrupt)
With Kickbacks:       ⠋ Linear — issue tracking that's actually fast ↗ (esc to interrupt)
With Lull:            ⠋ ▲ Vercel · Deploy free →  ·  0.4s (esc to interrupt)
                          [LOGO] [NAME] [TAGLINE+CTA] [TIMER]
```
→ Lull hat Logo + visuellen Card — Kickbacks hat nur Text

**CTA:**
> "🤑 Install free · $56.63/mo"  ← vs kickbacks $40.45/mo (gleiche CPM-Basis, 70% statt 50%)

**Subtext:** "Works in VS Code + Terminal CLI · No account required to start"

---

### Differenzierungs-Section ("Why Lull?")

| | Kickbacks | **Lull** |
|---|---|---|
| Rev-Share | 50% (net) | **70% (80% Founding-500)** |
| Sign-in | Google required | **Anonymous — no account needed** |
| Source | Source-available | **MIT Open Source** |
| Ad Format | Text only | **Logo + Tagline + CTA** |
| You earn | $40.45/mo | **$56.63/mo** |

---

### Advertiser Section

**Headline:** "Reach 2M developers. While they wait."

**Format-Argument:**
> "Every other ad network gives you text. Lull gives you your logo, tagline, and a click-through — in the most-watched line in software."

**Bid Structure:** Gleich wie KB — $1 Min, 1.000 Impressions, Klicks = 50×

---

### Dev Trust Section

**3 Punkte:**
1. **Open Source** — Lies genau was auf deinem Rechner läuft. MIT-Lizenz, forkbar.
2. **Anonym** — Keine Email, kein Google-Account. UUID auf deinem Gerät.
3. **Vollständig reversibel** — Ein Command und dein Claude Code ist wieder original.

---

### Founding-500 Section

> "Erste 500 Devs kriegen **80% permanent**. Für immer.  
> Nicht für diesen Monat. Für immer."

CTA: "Claim your Founding spot →"

---

### FAQ (Lull-Version, abgeleitet aus KB-FAQ, aber besser)

**Q: Brauche ich einen Account?**
A: Nein. Lull arbeitet anonym mit einer UUID auf deinem Gerät. Kein Sign-in nötig um Ads anzuzeigen. (Optional: Account für Payout-Dashboard.)

**Q: Was wird gesammelt?**
A: Impression-Events, eine anonyme Geräte-UUID, Timestamps. Niemals: Code, Prompts, Dateinamen, IP-Adressen.

**Q: Wann bekomme ich bezahlt?**
A: Monatlich, ab $5 Minimum (vs. KB's $10). Via USDC (on-chain) oder Stripe.

**Q: Was passiert wenn Claude Code updated?**
A: Wir haben ein automatisches Restore-System. Dein Claude Code läuft immer original weiter — Lull patcht nur wenn du es willst.

---

## 9. NACHGEHOLTE FINDINGS (komplett)

### Advertiser Bid-Flow (vollständig)

**Formular-Felder (Reihenfolge):**
1. **Email** — Pflichtfeld
2. **Ad line** — 3–60 Zeichen (Live-Counter "0/60"), Pflicht
3. **Destination URL** — https://, Pflicht
4. **Brand name** — optional, "shown on leaderboard"
5. **Brand icon** — optional, PNG/JPG/WebP ≤64KB, Drag-and-drop
6. **☐ Show me on the public leaderboard** — Checkbox
7. **Bid per block** — Min $1.00, "sets queue priority"
8. **Number of blocks** — "1,000 views each"

**Preisberechnung live:** "1 block at $5.00 = 1,000 views = **$5.00**"

**Checkout:** Button "Checkout now on Bid Market" → externer Redirect (vermutlich Stripe). Kein Account nötig um zu bieten — nur Email.

**Für Lull:** Gleiche Einfachheit anstreben. Email → Ad-Text → URL → Bid → Stripe. Lull-Plus: Icon/Logo ist Pflichtfeld (nicht optional) → zwingt Advertiser zur visuellen Qualität.

---

### Codex-Adapter (technisch)

**Grundsätzlich anders als Claude Code:**
- Claude Code Patch: überschreibt Verb-Array + injiziert Block DER in die CC-Webview DOM schreibt
- Codex Patch: injiziert Block als erste Statement der `ThinkingShimmer`-Funktion — ABER: returned immer `undefined` damit React's Component vollständig unberührt läuft
- Ad-Rendering: eigenes DOM-Element an `<body>` appended, AUSSERHALB React's Roots
- Warum: React reconciler würde jede Mutation im React-Tree beim nächsten Re-render rauswerfen ("the finnicky no-render")
- CSP: Codex-Webview blockt loopback-Fetch → Telemetrie/Billing geht nicht; Klick-URL funktioniert (VS Code öffnet extern, CSP-exempt)
- View-Threshold: 15s kumulativ (server-overridable)

**Für Lull:** Codex-Surface = Phase 2. Gleiches Prinzip wie Claude Code möglich.

---

### Ad-Rotation (wie mehrere Kampagnen served werden)

**System:**
- Backend gibt Queue zurück (`/v1/portfolio` → `{ ad, ads[], rotationIntervalMs, ttlMs }`)
- Extension draint Queue lokal, re-fetcht wenn leer
- Rotation nach `rotationIntervalMs` (server-authoritative)
- `onAdApplied`-Callback feuert nach jedem Apply → CLI-Sync refresht sofort (kein 60s Warten)

**Spezialfälle:**
- Demo→Real Swap bei Sign-in: `force=true` Re-apply auch bei gleicher adId (weil Real-Token sich von Demo-Token unterscheidet)
- Kill-Switch: Rotation wird geblockt (`canPatch()` Gate)
- Sign-out: Queue + Refs gecleart, Demo-Ads geladen
- Epoch-Guard: In-Flight-Fetch aus alter Epoch wird verworfen (verhindert Demo-Ads über Real-Ads)

**Für Lull:** Queue-Ansatz übernehmen. Einfachste Version: JSON-File auf Vercel mit Ad-Liste, Extension picked random/sequentiell.

---

## 10. FINALE FINDINGS (alle nachgeholt)

### statusBarAd.ts — Status Bar Mechanismus (vollständig)

- Poll: **alle 1s**
- Ad zeigt max **60s kontinuierlich** (AD_SHOW_MAX_MS), dann **20s Pause** (AD_REST_MS) → dann Earnings-Display
- Activity-Detection: LogTail liest CC-Transcript (`done=false` = thinking)
- CLI-Activity: cliTail (nur wenn VS Code-Fenster focused ist)
- **Demo-Ads NICHT in Status Bar** — bleibt rot "Sign in" solange nicht eingeloggt
- 6s Hold nach Ad-Ende → dann zurück auf Earnings-Display
- View-Tick alle 5s, suspend-safe (Gap max 2× Poll-Interval)
- Token-Freshening: übernimmt neue Session-Tokens ohne angezeigte Ad zu wechseln
- Impression-Events: `impression_rendered` → `view_tick` (alle 5s) → `impression_viewable` (beim Ende)

### fleetSignals.ts — Fleet Signals

**Was es ist:** Backend piggybackt Kill-Verdict + Earnings-Balances auf Portfolio/Metrics-Responses → spart ~60% Backend-Traffic (kein separater Killswitch/Earnings-Poll nötig solange Daten frisch sind, Freshness: 90s)

### desyncDetector.ts — Desync-Erkennung

**Problem:** Patch ist auf Disk, aber Overlay rendert nicht (VS Code hat alten Webview-Module gecacht)  
**Eskalations-Leiter:**
1. Cycle Patch (re-mint File-Identity → VS Code re-evaluiert Modul)
2. Reload Window
3. Toast-Notification  
Log-Throttle: max 1× alle 5min

### readme_extension.md — User-facing Doku (vollständig)

**Status Bar States:**
| State | Bedeutung |
|---|---|
| *Kickbacks: Sign in* | Nicht eingeloggt. Klick = Auth. |
| *Kickbacks ($0.42 today · $7.11)* | Eingeloggt und verdienend |
| *Kickbacks: Off* | Manuell deaktiviert |
| *Kickbacks incompatible* | CC-Version nicht supported |
| *Kickbacks offline* | Backend nicht erreichbar |
| *Kickbacks killed* | Remote Kill-Switch aktiv |
| *⚠ Kickbacks: RELOAD to earn money* | Update braucht Reload |

**Cap-Warning (2. roter Pill):** `🕐 Hourly cap · 42m` oder `⚠ Daily cap · 6h 12m`

**Demo-Mode:** Vor Sign-in laufen echte Ads als Preview → KEINE Earnings. "Those preview impressions don't earn you anything; sign in to start earning your share."

**CLI Spinner Verb:** "refreshes when you start a new claude session" — d.h. `spinnerVerbs` wird einmal geschrieben, gilt für alle neuen Sessions.

**Chain-Capture:** "If you already use a custom status line (a HUD), it is kept: the ad renders on the line above it" — bestätigt.

### aikickbacks.com — Zweiter Konkurrent

- Auch 50% Dev-Share
- 5s Viewability
- Privacy-First Messaging
- CTAs: "Start earning" (Devs) + "Reserve inventory" (Advertiser)
- Früh-Stage, keine technischen Details, Waitlist
- Noch keine Live-Inventory → nicht valide

**Für Lull:** aikickbacks ist kein echtes Threat-Level. Kickbacks.ai ist der einzige relevante Konkurrent.

### HN-Thread

Rate-Limited (429) — nicht verfügbar.

### Live-Leaderboard (Stand jetzt)

**Leer.** "No bids yet — be the first to claim the spinner."

→ Entweder Inventory gecleart, Advertisers haben nicht erneuert, oder die Plattform hat Momentum-Delle. Unser Competitor-Doc (12.06.) hatte $20 CPM Bids aktiv — das war vor 3 Tagen. Möglichkeit: schnelle Erschöpfung + keine Erneuerung = Demand da aber nicht sustained.

**Für Lull:** Leeres Leaderboard = Chance. Erster Advertiser auf Lull wird sofort #1.

### test/ — 80+ Test-Files (Scope-Übersicht)

Zeigt was KB als kritisch ansieht:
- `backup-safety.test.ts` — Backup/Restore Integrität
- `incident-guards.test.ts` — bekannte Incidents abgesichert
- `audit-deferred-xfail.test.ts` — bewusst deferred Audits
- `e2e.test.ts` — End-to-End
- `killEnforcement.test.ts` — Kill-Switch
- `cc-spinner-detect.test.ts` — Spinner-Detection
- `cli-statusline.test.ts` — CLI Surface

**Für Lull:** Backup-Safety und Restore sind Pflicht. KB hat dafür ~10 Tests.

---

## 11. LETZTE FINDINGS (vollständig)

### servingGate.ts — Serving Gate

3 Inputs → 1 Verdict:
1. **Kill-Posture:** `clear` / `confirmed` (200 von /v1/killswitch) / `offline` (nicht erreichbar)
2. **User-Toggle:** Manuell disable/enable
3. **Crash-Canary:** Session-scoped Suspension nach Crash

**Verdicts:** `write` (normal) / `freeze` (offline oder canary — kein Schreiben, kein Restore) / `restore` (kill confirmed oder user-disabled)

→ **Für Lull:** gleiche 3-State-Logik übernehmen. `freeze` ist wichtig — WLAN-Blip darf nicht das Settings.json churnen.

### modes.ts — Modes via Sentinel-Files

Alle Modi via Dateipräsenz in `~/.vibe-ads/`:
- `webview.off` → Webview-Surface aus
- `cli.off` → CLI-Surface aus
- `banner.mode` → Banner-Override (server/on/off)

→ **Für Lull:** `~/.lull/` Ordner, gleiche Sentinel-File-Pattern.

### capWarning.ts — Cap-Warning Pill

**Zweites** Status-Bar-Item (Priority 999, rechts vom Earnings-Item bei 1000):
- `$(clock) Hourly cap · 42m` (Tooltip: "Hourly earning cap reached ($10/hr). Earning resumes…")
- `$(warning) Daily cap · 6h12m` (Tooltip: "Daily earning cap reached ($X). Resumes at 00:00 UTC…")
- Rot (#f85149), Klick öffnet Menu

→ **Für Lull:** Cap-Pill als Phase-2-Feature. Erstmal kein Cap kommunizieren.

### GitHub Issues — GOLDMINE (Stand 2026-06-15)

**Top-Bugs (aktiv, ungelöst):**

| Issue | Problem | Relevanz für Lull |
|---|---|---|
| #100, #99, #105 | "Kickbacks incompatible (unknown)" — massenweise gemeldet | **Lull's settings-patch umgeht das komplett** |
| #97 | Uninstall lässt VIBE-ADS-Code in Claude Code — gefährlicher Bug | Restore-Safety ist Pflicht bei Lull |
| #93 | `stripJsonc` korrupt bei Kommas in String-Values → Settings.json-Datenverlust | **Kritisch: Lull's JSONC-Parser muss das fixen** |
| #83 | Non-atomische Patch-Writes → Codex-Shim-Korruption | Atomische Writes Pflicht |
| #94 | IPv6 Loopback (`[::1]`) wird als non-loopback klassifiziert | Edge-case für Lull |
| #86 | Security Issues (unspecified) | Security-Audit vor Launch |
| #104 | "Urgent Security & Revenue Impact Audit" | Zeigt: Sicherheit ist Schwachstelle |

**Feature-Requests (ungelöst — Lull-Chancen):**

| Issue | Request | Lull-Chance |
|---|---|---|
| #101 | **Standalone CLI für Warp/iTerm2/Ghostty/tmux/SSH** | **Biggest gap: terminal-only users ohne VS Code** |
| #82 | Mehr CLIs (nicht nur Claude Code + Codex) | Opencode, Gemini CLI etc. |
| #81, #95 | **Opencode-Support** | Wachsendes Tool, niemand hat's |
| #87 | **Open VSX veröffentlichen** (für Cursor/Windsurf-User ohne MS-Marketplace) | Lull: direkt als .vsix → kein Marketplace nötig |

**Geo/Payment-Probleme (Indien-Block):**

| Issue | Problem |
|---|---|
| #103 | Indian Developer Account gesperrt |
| #102 | Stripe Connect Express für Indien nicht verfügbar |
| #85 | Feature Request: Razorpay (Indien) |
| #78 | Sign-in funktioniert nur mit Google (Apple/Email broken) |

→ **Für Lull:** USDC-Payout (bereits geplant) löst das. Keine Stripe-Connect-Abhängigkeit.

### HN-Thread
Rate-limited (429) — nicht zugänglich.

### Twitter/X
402 Payment Required — nicht zugänglich ohne Auth.

---

## 12. LULL COMPETITIVE ADVANTAGES (finales Update nach allen Findings)

| Problem bei Kickbacks | Lull-Lösung |
|---|---|
| "incompatible (unknown)" — häufigster Bug | Settings-Patch statt Webview-Patch → keine CC-Version-Abhängigkeit |
| Indien gesperrt (Stripe Connect) | USDC on-chain + kein Geo-Lock |
| Nur Google Sign-in | Anonym (UUID) — kein Sign-in nötig |
| Uninstall lässt Patch-Code | Atomischer Restore mit SHA-Verify |
| JSONC-Parser-Bug (#93) | Eigener getesteter Parser |
| Kein Warp/iTerm2/SSH-Support | Phase-2: Standalone CLI Script |
| Kein Opencode-Support | Phase-2: `spinnerVerbs`-äquivalent für Opencode |
| Nicht auf Open VSX | Direkt .vsix = kein Marketplace nötig |
| 50% Dev-Share | 70% (80% Founding-500) |
| Text-Only Ads | Visual Card mit Logo |
| Source-Available | MIT Open Source |

---

## 13. FINALE 5 FINDINGS

### "Bid Market" — Was ist es?
JavaScript-gesteuerter Checkout — keine sichtbare URL im HTML. Button triggert wahrscheinlich dynamisch Stripe Checkout via JS. Kein separates Tool, kein separater Domain. Einfach Stripe.

### reassert.ts — Reassert-Logik

**`shouldReassert()`:** `haveAd && !killed` — simpel. Reapplied Patch auf Interval solange gesund.

**`desyncDecision()`:** Tiered Escalation wenn Patch on disk aber Overlay silent:
- Gate: CC muss aktiv sein (Transcript < 120s alt)
- Patience: 5 Minuten Stille nötig vor Escalation
- Ladder: `cycle` → `reload` → `toast` (30min Cooldown)
- Defer: während aktivem CC-Turn (Sub-Agent läuft) → keine disruptive Aktion

### registry.ts — Adapter-Registry

**REGISTRY (Precedence-Reihenfolge):**
1. `claude-code` → sucht `anthropic.claude-code-*/webview/index.js`
2. `codex` → sucht `openai.chatgpt-*/webview/assets/thinking-shimmer-*.js`

**Roots (alle gecheckt):** `.vscode`, `.vscode-insiders`, `.vscode-server`, `.vscode-server-insiders`, `.cursor`, `.cursor-server`

**Env-Overrides** (autoritativ): `KICKBACKS_CC_TARGET`, `KICKBACKS_CODEX_TARGET`

→ **Für Lull:** gleiche Root-Liste. Env-Override für Testing.

### esbuild.mjs — Build-Config

- Single Entrypoint: `src/extension.ts` → `dist/extension.js` (CJS, Node18, external: vscode)
- Build-Flags via `.env`: `KICKBACKS_DEVELOPER`, `KICKBACKS_CODEX`, `KICKBACKS_VERBOSE`, `KICKBACKS_TEST_HOOKS`
- **Raw Assets (nicht gebundelt, separat kopiert):**
  - `block.asset.js` (Claude Code Injection)
  - `statusline.asset.mjs` (CLI Statusline Script)
  - `codex/block.asset.js` (Codex Injection)
  - `codex-cli/wrapper.cmd.asset` + `wrapper.sh.asset` ← **NEU: Codex CLI Wrapper!**
- Build-Timestamp wird ins Bundle gebacken
- `readme_extension.md` → `dist/README.md` (für VSIX Details-Pane)

→ **Für Lull:** gleiche Struktur, simpler (kein Codex initial, kein Codex-CLI)

### NEUFUND: Codex-CLI Adapter
`src/adapters/codex-cli/` existiert — Shell-Wrapper für Codex CLI (`.sh` + `.cmd`). Eigener Surface. Wir hatten das nicht auf dem Radar.

---

## 14. OFFENE FRAGEN → BEANTWORTET (2026-06-15)

1. ✅ `spinnerVerbs` supported: Claude Code **2.1.177** (brauchen ≥2.1.143)
2. ✅ Version gecheckt: `2.1.177`
3. ⏳ Outreach: noch nicht gesendet (morgen Phase 0 → erst Patch demo → dann senden)
4. ⏳ Landing Page CTA: noch kein "$XX/mo" Claim

**WICHTIG — settings.json hat bereits statusLine:**
```json
"statusLine": { "type": "command", "command": "bash /Users/doctordon/.claude/statusline-command.sh" }
```
→ Lull-Patch muss bestehenden `statusLine`-Wert **backup + restore** (nicht blind überschreiben)
→ `spinnerVerbs` noch nicht gesetzt → sauberes Slate

**Fazit: Alles komplett. Analyse vollständig. Bereit für Implementierung.**

---

## 15. KOMPLETTER KONKURRENZ-ÜBERBLICK (Stand 2026-06-15) — GOFSC

### aikickbacks.com — Vollanalyse

**Status:** Waitlist / Early Access — KEIN Live-Produkt

**Tagline:** "Get paid for waiting." (identisch mit KB — Copy-Paste)

**Hero:** "Your coding agent already shows a status line while it thinks. We turn that unused wait state into a tiny sponsored message and split the revenue with you."

**How it works:**
1. Opt in — per developer, fully opt-in
2. One line appears — during a real wait, status line names a sponsor
3. It counts when viewable — after 5-second view, 50% share earned

**Format:**
- Always one line, fits status row or not served (no wrap, no media)
- Only during real wait — ad disappears when result lands
- "Relevant, not noise" — built for developer-tool sponsors

**Zahlen:**
- 50% developer rev-share
- 5-second view window
- 0 Daten-Zugriff auf Code/Prompts/Completions

**Privacy-Claim:**
- Nutzt nur: Sichtbarkeitsstatus, aggregierte Messungen, Opt-in-Status
- Nie: Source code, files, repositories, Prompts, Completions, Chat-Content
- "AI Kickbacks does not need code, prompts, completions, files, or AI conversations to measure a sponsored wait-state line."

**CTA:** "Start earning" (Developer) / "Reserve inventory" (Advertiser)

**Was sie NICHT haben:**
- Kein GitHub (404)
- Kein Team sichtbar
- Kein CPM-Pricing public
- Kein Live-Inventory
- Kein Payout-Info
- Kein Installationsguide
- Keine Tech-Architektur-Details

**Threat-Level:** ⚠️ NIEDRIG — Waitlist, 50% (= KB-Klon), kein Produkt. Würde nur dann relevant wenn sie schnell Live gehen und Advertiser-Beziehungen aufbauen.

---

### llmads.ai — TOT

DNS resolves nicht. Domainregistrierung vermutlich abgelaufen oder nie live gegangen. Kein echter Konkurrent.

---

### IdleAds.dev — NEUER HAUPTKONKURRENT ⚠️⚠️⚠️

**Launched:** 2026-06-14 (Privacy Policy Datum) — **GESTERN** — gleicher Tag wie wir das analysiert haben

**Tagline:** "Get paid while it thinks. One sponsor line in the spinner. 70% goes to you."

**Status:** LIVE, aber 0 Developer, 0 Impressions, 0 CTR

**Surfaces:** Claude Code, Codex, VS Code

#### Technische Architektur (KRITISCH)

**"Zero editor patching"** — das ist ihre Kern-Differenzierung zu KB:

Aus Privacy Policy: Das Client nutzt **Claude Code Lifecycle Hooks**:
- `UserPromptSubmit` — detect wenn User Prompt abschickt
- `PostToolUse` — detect nach jedem Tool-Call
- `Stop` — detect wenn AI fertig

→ Sie lesen **keine JSONL-Transcripts**, patchen **keine `webview/index.js`**, patchen **keine `settings.json` spinnerVerbs** (oder tun es zusätzlich — unklar)
→ **Signed logs** — adressiert direkt die KB-Sicherheitslücke aus HN

Aktivitäts-Daten die gesammelt werden:
- Timestamps + Lifecycle-Hook-Event-Namen + Random-Session-Nonce
- VS Code Extension: on-screen time wenn Editor fokussiert + Ad sichtbar
- Random Device-ID (nicht von Hardware abgeleitet)
- OS + CPU-Arch, Salted IP-Hash, Country bei Request-Time

#### Revenue Model
- **70% Developer Rev-Share** (= Lull Standard; KB: 50%)
- Payout-Minimum: **$5** (KB: $10 — IdleAds ist zugänglicher)
- Payment: **DodoPayments** (nicht Stripe!) → PayPal, Wise, UPI → **India/global-friendly** ← ein Lull-Differenzierungspunkt teilweise neutralisiert
- Auth: Google Sign-In ODER E-Mail Magic Link (anonymer als KB, aber nicht UUID-anonym wie Lull)

#### Advertiser-Features
- **Country-Targeting** (neu! KB und KB-Klon haben kein Targeting)
- Surface-Targeting (Claude Code vs Codex vs VS Code)
- Second-Price Auction (GSP) — gleich wie KB
- Prepaid Balance, Auto-Reload optional
- Verbotene Inhalte: Malware, Crypto-Scams, Adult, Hate, Impersonation
- DodoPayments als Payment Processor

#### Live-Inventory (Beispiel-Ads im Demo)
- AI-VOLVE: $5.00/1k CPM
- IDLEADS (Eigenwerbung): $2.00/1k CPM

#### Payout-Details
- Clearing: Pending → Payable nach Settlement-Hold (Fraud-Detection)
- Tax: W-9/W-8 erforderlich vor Payout
- Disputed invalid traffic → Clawback möglich

#### Was sie NICHT haben (Lull-Vorteile bleiben)
- ❌ Kein GitHub / Open Source (Lull: MIT)
- ❌ Google/E-Mail Auth erforderlich (Lull: Anonymous UUID)
- ❌ Text-only (Lull: Visual Card mit Logo)
- ❌ 0 User, 0 Impressions → keine Traction
- ❌ Kein Founding-500 Angebot (80%)

---

### HN-Thread Goldgrube (2026-06-12)

**Thread:** "Kickbacks.ai – Get Paid for Waiting" — 17 points, 11 comments (HN ID: 48493940)

**Key Comment #1 — devtoolsguides (Praxis-Test):**
> "Set this up today and ran it for ~3 hours. First session: 407 impression events, $4.43 earned (~$0.011/impression). Payouts aren't open yet (Stripe integration is coming but no date given). No real advertisers yet — they're bootstrapping their own ad inventory."

→ **$0.011/impression = $11 CPM** (mit eigenem bootstrapped inventory)

**Key Comment #2 — insapio (Live-Markt-Daten):**
> "943.1 imps/min, Top bid: $111.00/CPM, Serving floor: $31.00/CPM, Open interest: $1,506, Imps in book: 38.6K"

→ **$111 CPM Top-Bid** ist extremer Ausreißer (wahrscheinlich Test-Bid). Serving floor bei $31 = das ist der echte Boden.

**Key Comment #3 — dupontcyborg (Security-Attack-Vector):**
> "The extension polls for updated every 90 seconds and has no digital signature verification... So get a bunch of people to install and issue a malicious update and within 90 seconds, your entire user base has it?"

→ **IdleAds hat das direkt mit "signed logs + zero editor patching" adressiert.**
→ **Für Lull:** eigene Architektur muss das auch adressieren.

**Key Comment #4 — codepeekr (Erwähnt IdleAds):**
> "you can also try https://IdleAds.dev which pays 70% and has more surface area where you can integrate."
> "https://IdleAds.dev is structurally built differently so it's not possible [to do the malicious update attack]"

→ codepeekr = wahrscheinlich IdleAds-Gründer der guerrilla-marketed in KB's HN-Thread

---

### insapio.com — 3rd-Party-Analytics-Tool (kein Konkurrent)

**Produkt:** Echtzeit-Markt-Terminal für KB's Spinner-Ad-Auktion.

**Was es zeigt:**
- Aktuelle Gebote, verbleibende Impressionen, Serving-Status (minütlich gesampelt)
- Gebots-Kalkulator: Top-Platz vs Rotation vs Value-Queue Strategie
- Burndown-Analyse: Marktgeschwindigkeit + wann Positionen frei werden
- Fair-Value-Signal: Gebot vs VWAP
- Risikobewertung: Volatilitätsmodell für Overbid-Wahrscheinlichkeit

**Preis:** $12.99/mo oder $7.99/mo (jährlich, -38%)

**Disclaimer:** "All metrics, projections, and signals are statistical estimates — no guarantees."

**Live-Daten aus dem HN-Comment (insapio-Author):**
- 943.1 imps/min
- Top Bid: $111.00/CPM
- Serving Floor: $31.00/CPM
- Open Interest: $1,506
- Imps in Book: 38.6K

**Für Lull:** Ecosystem-Signal — wenn KB groß genug ist dass jemand dafür ein $13/mo-Tool baut, ist der Markt real. Zeigt auch: Advertiser wollen Transparenz und Tools. Lull-Dashboard könnte das on-platform integrieren (kein externes Tool nötig).

---

### GOFSC — Vollbild Konkurrenz

#### 🔭 Gemini-Red-Team-Findings

1. **IdleAds ist der gefährlichste Konkurrent** — launched gleichzeitig, 70% (= Lull), DodoPayments (global), Hooks-Architektur (technisch sauberer als spinnerVerbs). Race to 0→1 User beginnt JETZT.
2. **codepeekr guerrilla-marketed IdleAds direkt in KB's HN-Thread** — aggressives Go-To-Market, nicht schüchtern
3. **Space wird in 2 Wochen voll sein** — KB (50%, live), aikickbacks (50%, waitlist), IdleAds (70%, live seit gestern), Lull (80%, MVP). Advertiser werden sich für 1-2 Plattformen entscheiden.
4. **Hooks-Approach vs spinnerVerbs**: IdleAds nutzt Claude Code Lifecycle Hooks → kein settings.json-Patch nötig → stabiler, kein Restore-Problem. Lull sollte das ebenfalls evaluieren.
5. **Lull hat noch keinen User** — jede Woche Delay ist Marktanteil den IdleAds gewinnt

#### 🧠 Opus-Strategische-Positionierung

Lull hat 3 echte Differenzierungspunkte die kein Konkurrent hat:
1. **80% Founding-500** — IdleAds stoppt bei 70%, KB bei 50%. 80% ist aggressivster Offer im Markt.
2. **MIT Open Source** — KB: Source-Available. aikickbacks: unbekannt. IdleAds: closed. Lull ist der einzige echte Open-Source-Player.
3. **Visual Card** — alle anderen: text-only, 1 Zeile, max 60 Zeichen. Lull: Logo + Tagline + CTA = bessere Advertiser-Conversion.

Anonym-UUID ist noch ein Punkt aber IdleAds hat E-Mail-Magic-Link = fast anonym. Schwächerer Differenzierungspunkt geworden.

**Strategie-Empfehlung:** Founding-500 + Open Source als Kern-Messaging. Advertiser-Seite mit Visual Card angreifen (höhere CTR = höherer CPM = bessere Dev-Earnings).

#### 🚀 Fable-Synthese

**Lull's HP-Message jetzt:**
> "4 players. One is closed. Three take more than half.  
> Lull gives you 80% — and shows the world exactly how."

Founding-500 + MIT = die zwei Dinge die kein Konkurrent matchen kann. Das ist der Angriffspunkt.

**Für IdleAds:** Ihre Arch (Hooks) ist sauberer als spinnerVerbs. Lull sollte Hooks-Approach EVALUIEREN bevor wir spinnerVerbs implementieren — vielleicht ist das der bessere Weg.

---

### AKTUALISIERTE KONKURRENZ-TABELLE (vollständig)

| | kickbacks.ai | aikickbacks.com | IdleAds.dev | **Lull** |
|---|---|---|---|---|
| Status | LIVE (13k installs) | Waitlist | LIVE (0 user) | MVP (0 user) |
| Dev-Share | 50% | 50% | 70% | **80% (Founding-500)** |
| Open Source | Source-Available | Nein | Nein | **MIT** |
| Format | Text, 1 Zeile | Text, 1 Zeile | Text, 1 Zeile | **Visual Card** |
| Auth | Google (Pflicht) | Unbekannt | Google/E-Mail | **Anonymous UUID** |
| Payment | Stripe (India ❌) | Unbekannt | DodoPayments (global ✅) | USDC (on-chain) |
| Payout-Min | $10 | Unbekannt | $5 | TBD |
| Arch | settings.json + Webview-Patch | Unbekannt | Lifecycle Hooks | settings.json (Phase 0) |
| Country-Targeting | Nein | Nein | **Ja** | TBD |
| Surfaces | CC CLI+VS Code, Codex | CC CLI | CC, Codex, VS Code | CC CLI (Phase 0) |
| Distribution | VS Code Marketplace ⚠️ | Unbekannt | VS Code + CLI | Direkt .vsix + GitHub |

### KRITISCHE IMPLIKATION FÜR LULL

**IdleAds' Hooks-Architektur evaluieren:**

IdleAds nutzt `UserPromptSubmit`, `PostToolUse`, `Stop` Hooks statt spinnerVerbs-Patch. Das bedeutet:
- Kein settings.json-Edit nötig
- Kein Backup/Restore-Problem
- Sauberere Detektion (echte AI-Aktivität, nicht nur Spinner-Text)
- Kompatibel mit ALLEN Claude Code Versionen (nicht nur ≥2.1.143)

**Für Lull Phase 0:** Prüfen ob Claude Code Hooks statt spinnerVerbs die bessere Impl ist. 2h mehr Aufwand, aber stabiler.

**DodoPayments als Alternative zu USDC evaluieren:**
IdleAds nutzt DodoPayments → globale Abdeckung ohne Crypto. USDC bleibt Lulls Differenzierungspunkt für Devs die keine KYC wollen — aber DodoPayments zeigt dass man India/global auch ohne Blockchain lösen kann.

---

## 16. GOFSC — VOLLSYNTHESE: BESTES PRODUKT + BESTE HP (alle 4 Player)

Stand 2026-06-15 · Basiert auf: KB (A-Z), aikickbacks, IdleAds, insapio, HN-Threads, GitHub Issues

---

### 🔭 G — Gemini Red-Team: Was ist jetzt anders?

**Lage-Update nach IdleAds:**

1. **"70%" ist nicht mehr Lulls Alleinstellungsmerkmal** — IdleAds hat auch 70%. Lull muss mit **80% Founding-500** führen, nicht 70%.

2. **"Anonym" ist abgeschwächt** — IdleAds hat E-Mail Magic Link (kein Google-Zwang). Immer noch ein Vorteil für Lull (echter UUID-Anonym-Ansatz), aber kein K.O.-Argument mehr.

3. **"DodoPayments"** — IdleAds hat das India-Problem auch gelöst, ohne Crypto. Lull's USDC ist trotzdem differenziert (kein KYC, keine Bank), aber nicht mehr allein.

4. **"Visual Card" ist jetzt der einzige Format-Differenzierungspunkt** den kein Konkurrent hat. KB: Text. aikickbacks: Text. IdleAds: Text. Alle 3.

5. **MIT Open Source** — absolut einzigartig. Keiner der 3 ist Open Source.

6. **HN Security-Concern über KB** — "no digital signature verification, polls every 90 seconds" — Lull muss das in der HP-Sprache adressieren: "Open source — lies was läuft."

7. **IdleAds Guerrilla-Taktik** (codepeekr in KB's HN-Thread) zeigt: Dieser Markt ist aggressiv, schnell, no-holds-barred.

8. **Earning-Recalculation:**
   - KB-Basis: $40.45/mo bei 50% → impliziert $80.90/mo Gross per Dev
   - IdleAds bei 70% der gleichen Basis: **$56.63/mo** (= unser alter Claim)
   - Lull Founding-500 bei 80%: **$64.72/mo**
   - Lull Standard bei 70%: **$56.63/mo** (= IdleAds = nicht differenziert)
   - → **CTA-Claim muss $64.72/mo sein (Founding-500), nicht $56.63**

---

### 🧠 O — Opus: Produkt-Architektur — Beste Entscheidungen

#### Architektur: Hooks ÜBER spinnerVerbs

IdleAds beweist: Claude Code Lifecycle Hooks (`UserPromptSubmit`, `PostToolUse`, `Stop`) funktionieren als Activity-Signal. Das ist besser als spinnerVerbs weil:
- Keine settings.json-Modifikation → kein Backup/Restore-Problem
- Kein Versions-Gate (funktioniert mit allen CC-Versionen)
- Echte AI-Aktivitäts-Detektion, nicht nur Spinner-Text
- "Zero editor patching" als Trust-Signal nutzbar

**Empfehlung Phase 0:** Hooks als primärer Surface. spinnerVerbs zusätzlich für Terminal-Sichtbarkeit.

**Claude Code Hook-File** (`.claude/hooks.json` oder `~/.claude/settings.json` `hooks`-Key):
```json
{
  "hooks": {
    "UserPromptSubmit": [{"type":"command","command":"~/.lull/hooks/activity.sh start"}],
    "PostToolUse":      [{"type":"command","command":"~/.lull/hooks/activity.sh tool"}],
    "Stop":             [{"type":"command","command":"~/.lull/hooks/activity.sh stop"}]
  }
}
```
→ activity.sh signalisiert Lull: AI ist busy → ad zeigen; AI ist idle → ad verstecken.

#### Targeting: Country-Targeting ab Phase 1

IdleAds hat es, KB nicht. Für Advertiser massiver Vorteil. Lull-Phase-1: Supabase-Row mit `country_code` pro Impression → Advertiser kann Filter setzen.

#### Payout-Minimum: $5

KB: $10. IdleAds: $5. Lull: $5 (oder weniger). Psychologisch wichtig — erster Payout kommt schneller.

#### Payment-Mix: USDC + DodoPayments

USDC als Kern-Differenzierungspunkt (kein KYC, echte Decentralization-Story). DodoPayments als Fallback für Devs ohne Crypto-Wallet. Beides anbieten.

#### Visual Card: Pflicht-Felder für Advertiser

Alle 3 Konkurrenten lassen Advertiser text-only submittieren. Lull: Icon/Logo Pflichtfeld + max 60-Zeichen-Tagline + CTA-URL Pflicht. Dadurch automatisch höhere Ad-Qualität → höheres CTR → höheres CPM → bessere Dev-Earnings.

---

### 🚀 F — Fable: Beste HP — Copy + Struktur

#### Kernproblem mit allen Konkurrenten-Headlines

| Konkurrent | Hero |
|---|---|
| kickbacks.ai | "Get paid for waiting." |
| aikickbacks.com | "Get paid for waiting." (Copy-Paste!) |
| IdleAds.dev | "Get paid while it thinks." |

Alle 3 kämpfen um denselben Satz. Lull darf **nicht** in diese Schublade. Lull hat 2 echte Unique-Claims die kein anderer hat: **80% + Open Source**. Das ist der Angriffspunkt.

#### Hero (Lull — Final)

**Headline:**
> "80% is yours. The code is open."

**Sub:**
> "Everyone else takes half — or more. Lull gives you 80% for life if you're in the first 500. And we show you exactly what runs on your machine."

**Before/After — das visuelle Argument:**
```
kickbacks / IdleAds:   ⠋  Linear — issue tracking ↗          (esc to interrupt)
                                    ↑ text. just text.

Lull:                  ⠋  [▲] Vercel  Deploy free →  +$0.0011  (esc to interrupt)
                                    ↑ logo. tagline. click. earnings.
```

**CTA:**
> `Install free  ·  First 500 devs: 80% forever →`

---

#### Nav

```
Lull    [How it works]  [For Advertisers]  [GitHub →]    [Install free →]
```

---

#### Section 2: How it works (3 Schritte — klar)

```
①  Install          →   One command. No account required.
②  Code normally    →   When Claude thinks, Lull shows one sponsored line.
③  Get paid         →   80% of every validated impression. Monthly. In your wallet.
```

---

#### Section 3: The Visual Difference (einzigartig — kein Konkurrent hat das)

**Headline:** "One line. But not just text."

Visuelle Demo-Card direkt auf der HP (animated):

```
┌─────────────────────────────────────────────────────┐
│  ⠋ [▲] Vercel   Deploy to production for free →    │
│                                         +$0.0014    │
└─────────────────────────────────────────────────────┘
```

vs.

```
⠋  Vercel — deploy to production for free ↗
```

**Subtext:** "Logo. Tagline. Click. Your competitors show text. Lull shows a brand."

---

#### Section 4: Zahlen (4-Player-Vergleich — jetzt vollständig)

**Headline:** "The math is simple."

| | KB | aikickbacks | IdleAds | **Lull** |
|---|---|---|---|---|
| Dev share | 50% | 50% | 70% | **80% (Founding-500)** |
| You earn/mo | ~$41 | — | ~$57 | **~$65** |
| Open source | ❌ | ❌ | ❌ | ✅ MIT |
| Account needed | Google req'd | ? | Email/Google | **Zero** |
| Ad format | text | text | text | **Logo + CTA** |
| Global payout | Stripe ❌ | ? | DodoPayments | **USDC on-chain** |

**CTA unter der Tabelle:** "500 Founding spots. 80% forever. [Claim yours →]"

---

#### Section 5: Founding-500 — der FOMO-Block

**Headline:** "500 spots. Then it's gone."

> "The first 500 developers who install Lull keep 80% permanently.  
> Not this month. Not this year. **Forever.**  
> [XXX/500 claimed]"

**Progress-Bar:** `████████░░░░░░░░░░░░  [XXX/500]`

**CTA:** "Claim your Founding spot →"

---

#### Section 6: Trust — für die skeptischen Devs

**Headline:** "Read what runs on your machine."

Drei Spalten:
```
[MIT Open Source]          [Anonymous by default]      [Fully reversible]
Lies den Code.             Keine Email. Kein Google.   Ein Command und du bist
Fork ihn. Audit ihn.       UUID auf deinem Gerät.      zurück auf original.
                           Optional: Account für
                           Payout-Dashboard.
```

**Sub:** "We read exactly one thing: whether Claude is thinking right now. Nothing else leaves your machine."

**Link:** "[Read the source →](github.com/lull-app/lull)"

---

#### Section 7: Für Advertiser

**Headline:** "Reach 2M developers. While they wait."

**Sub:** "The most-watched line in software. And the only network that shows your logo."

3-Punkte:
1. **Logo-First** — Your brand, not just a URL. Every developer sees your icon while Claude generates.
2. **High-intent moment** — They're waiting on a result. Calm, focused, receptive.
3. **Dev-native only** — We reject travel brands. Your ad runs next to engineers, not tourists.

**Ad-Format-Preview (für Advertiser):**
```
[Your Logo]  [Your Tagline — 60 chars max]  [CTA text] →
```

**CTA:** "[Advertise on Lull →]" (Form: Email + Ad-Text + Logo + URL + Bid)

---

#### Section 8: FAQ

**Q: Do I need an account?**
A: No. Lull works anonymously with a UUID generated on your device. Sign up only when you want to withdraw.

**Q: What data do you collect?**
A: Whether Claude is thinking right now. A random device UUID. Impression timestamps. That's it. Never: your code, prompts, file names, or IP addresses. [Read the source →]

**Q: When do I get paid?**
A: Monthly, minimum $5. Via USDC (on-chain, no KYC) or bank transfer.

**Q: What if Claude Code updates and breaks the extension?**
A: Lull uses Claude Code's official hooks — not editor patching. There's nothing to break.

**Q: How is this different from Kickbacks?**
A: 80% vs 50% rev-share. Open source vs closed. Logo cards vs plain text. No Google login required. You do the math.

**Q: What's the Founding-500?**
A: The first 500 developers who install Lull lock in 80% revenue share forever. Once those spots are gone, the standard rate is 70%.

---

#### Footer

```
Lull  ·  MIT License  ·  GitHub  ·  Privacy  ·  hello@lull.app
"Built for people who watch spinners professionally."
```

---

### 🐜 S — Sonnet Synthese: Priorisierte Implementierungs-Roadmap

#### Was jetzt sofort gebaut werden muss (Race gegen IdleAds)

**IdleAds hat 0 User. Lull hat 0 User. Wer zuerst 100 erreicht, bekommt die HN-Show-Story.**

| Priorität | Task | Zeit | Impact |
|---|---|---|---|
| P0 | Hooks-basierter Activity-Detector (`activity.sh`) | 2h | Sauberste Arch |
| P0 | spinnerVerbs-Patch zusätzlich für Terminal-Sichtbarkeit | 1h | Sofort sichtbar |
| P0 | Founding-500 Counter auf HP + Live-Update | 1h | FOMO-Engine |
| P0 | $64.72/mo CTA statt $56.63 (80% Basis) | 15min | Richtige Zahl |
| P1 | Visual Card Demo auf HP animiert | 2h | Einziger Differenzierungspunkt |
| P1 | 4-Player-Vergleichstabelle auf HP | 1h | KB+aikickbacks+IdleAds+Lull |
| P1 | Trust-Section: "Read the source" Link | 30min | Skeptiker-Killer |
| P2 | Advertiser-Form (Email + Logo + Ad-Text + Bid) | 4h | Revenue-Gate |
| P2 | Country-Targeting für Advertiser | 3h | IdleAds-Feature parieren |

#### Copy-Stealing-Erlaubnis (was von jedem Konkurrent gut ist)

| Von | Stehlen | Warum |
|---|---|---|
| KB | "Built for people who watch spinners professionally" | Beste Tagline im Space |
| KB | Before/After Demo (Stock vs. With Ad) | Zeigt Value sofort |
| KB | Leaderboard live Advertiser-Bids | Social Proof für Advertiser |
| aikickbacks | "A quiet handshake" — Framing | Beschreibt das Produkt perfekt |
| aikickbacks | Privacy-Posture-Section | "What we never touch" Liste |
| IdleAds | "Stop thinking for free." — Scroll-Outro | Starker Abschluss-CTA |
| IdleAds | Spinner-Verb-Marquee als HP-Element | Visuell stark, kennt jeder CC-User |
| IdleAds | Self-Ad im Live-Ticker | Zeigt Produkt in Aktion |
| insapio | Live-Leaderboard-Idee | Real-time social proof für Advertiser |

#### Was KEINER der Konkurrenten hat — Lull-Only

1. **Logo/Visual Card** — alle text-only
2. **MIT Open Source** — alle closed
3. **80% Founding-500** — höchste Rev-Share im Markt, zeitlich limitiert
4. **UUID anonym (kein Sign-in für Devs)** — KB: Google-Pflicht, IdleAds: E-Mail/Google
5. **USDC (kein KYC)** — KB: Stripe, IdleAds: DodoPayments (benötigt Account)

#### HP-Struktur Final (Reihenfolge optimiert für Conversion)

```
1. NAV          — Lull | How it works | For Advertisers | GitHub | [Install →]
2. HERO         — "80% is yours. The code is open." + Before/After + CTA
3. VISUAL DIFF  — The only network that shows your logo. (animated card demo)
4. HOW IT WORKS — 3 Schritte
5. ZAHLEN       — 4-Player-Tabelle + "$64.72/mo" Claim
6. FOUNDING-500 — Progress-Bar + FOMO + CTA
7. TRUST        — Open Source + Anonymous + Reversible
8. ADVERTISER   — Reach 2M devs. Logo-first. Dev-native.
9. FAQ          — 6 Fragen
10. FOOTER      — MIT | GitHub | Privacy | hello@lull.app
                  "Built for people who watch spinners professionally."
```

---

### FINALE ENTSCHEIDUNGEN

| Frage | Entscheidung | Begründung |
|---|---|---|
| Hooks vs spinnerVerbs? | **Beide** — Hooks für Activity-Signal, spinnerVerbs für Terminal-Sichtbarkeit | Sauberste Arch + maximale Sichtbarkeit |
| CTA Earning-Claim? | **$64.72/mo** (80% Founding-500 Basis) | Richtige Zahl, differenziert vs IdleAds $56.63 |
| HP Hero? | **"80% is yours. The code is open."** | Einziger Claim den kein Konkurrent matchen kann |
| Auth? | **Zero für Devs**, optional für Payout | Härtester Differenzierungspunkt vs. alle 3 |
| Payment? | **USDC primary + DodoPayments fallback** | Maximale Abdeckung + Crypto-Story |
| Country-Targeting? | **Phase 1** | IdleAds hat es, KB nicht — Advertiser-Feature |
| Open Source? | **MIT, sofort** | Stärkster Trust-Beweis im Markt |
