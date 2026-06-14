# Lull — _HOT (Stand 2026-06-15, 22:50)

## Status
Extension VSIX 0.1.0 fertig (StatusBar läuft). Vollanalyse aller 4 Konkurrenten komplett. Bereit für P0-Build.

## MORGEN STARTEN: P0-Build-Reihenfolge

### 1. Hooks-Activity-Detector (~2h) ← ZUERST
Claude Code Lifecycle Hooks als primärer Activity-Signal:
```json
~/.claude/settings.json → "hooks":
  UserPromptSubmit → ~/.lull/hooks/activity.sh start
  PostToolUse      → ~/.lull/hooks/activity.sh tool
  Stop             → ~/.lull/hooks/activity.sh stop
```
activity.sh schreibt Timestamp-File → Extension pollt → wenn "busy": Ad zeigen

**Vorteil vs. spinnerVerbs:** Kein settings.json-Edit Problem, alle CC-Versionen, "zero editor patching" Trust-Story.

### 2. spinnerVerbs-Patch (~1h) ← ZUSÄTZLICH für Terminal-Sichtbarkeit
```json
~/.claude/settings.json → "spinnerVerbs": ["[Ad-Text]"]
```
- JSONC-tolerant lesen/schreiben
- Bestehenden `statusLine` NICHT überschreiben (bereits belegt mit session_start_briefing)
- Backup + Restore bei Uninstall
- Claude Code Version: 2.1.177 ✅ (≥2.1.143 nötig)

### 3. HP-CTA updaten (15min) ← QUICK WIN
- `landing/index.html`: Earning-Claim auf **$64.72/mo** (80% Founding-500-Basis)
- Hero: `"80% is yours. The code is open."`
- Founding-500 Counter einbauen

### 4. Demo aufnehmen (~30min)
- Hooks-Aktivität + spinnerVerbs gleichzeitig
- Visual Card im StatusBar
- Screen Recording für Advertiser-Outreach

### 5. Outreach (nach Demo)
- `[Dein Name]` in `outreach_mail.md` einsetzen
- 5 Pilot-Advertiser anschreiben (`outreach_contacts.md`)
- Ziel: 1 Advertiser, $500 Commitment BEVOR Backend gebaut wird

---

## Lull vs. Konkurrenz — Finales Bild

| | KB | aikickbacks | IdleAds | **Lull** |
|---|---|---|---|---|
| Dev-Share | 50% | 50% | 70% | **80% Founding-500** |
| Du verdienst | ~$41/mo | — | ~$57/mo | **~$65/mo** |
| Open Source | ❌ | ❌ | ❌ | ✅ MIT |
| Auth | Google | ? | E-Mail/Google | **Zero — UUID** |
| Ad-Format | Text | Text | Text | **Visual Card** |
| Payout global | Stripe ❌ | ? | DodoPayments | USDC |
| Status | 13k installs | Waitlist | 0 User | 0 User |

**Race:** IdleAds launched 2026-06-14 — gleicher Tag. Beide bei 0 Usern. Wer zuerst 100 hat, gewinnt die HN-Story.

## HP-Hero FINAL

- **Headline:** "80% is yours. The code is open."
- **Sub:** "Everyone else takes half. Lull gives 80% for life — first 500 devs."
- **CTA:** "Install free · First 500 devs: 80% forever →"
- **Earning-Claim:** $64.72/mo (80%-Basis, nicht $56.63)
- **Scroll-Outro:** "Stop thinking for free." (von IdleAds gestohlen — gut)

## Architektur-Entscheidung

**Hooks primary + spinnerVerbs secondary** — beide bauen:
- Hooks = sauber, kein settings.json-Problem, alle CC-Versionen
- spinnerVerbs = terminale Sichtbarkeit, sofort erkennbar

## Kritischer Find heute
IdleAds.dev — NEUER HAUPTKONKURRENT, launched 2026-06-14:
- 70% Dev-Share (= Lull Standard)
- "Zero editor patching" via Lifecycle Hooks
- DodoPayments (global, inkl. India)
- Country-Targeting für Advertiser
- 0 User, 0 Impressions — Race ist offen

## Referenz
- Vollanalyse (16 Sektionen): `kickbacks_analysis_gofsc_2026-06-14.md`
- Konkurrenz-Research: `competitor_research_2026-06-12.md`
- Outreach: `outreach_contacts.md` + `outreach_mail.md`
- Extension: `packages/extension/`
- Landing: `landing/index.html`
