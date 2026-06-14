# Lull — Paid for the pause

> Earn while AI thinks. One quiet sponsor card during every AI wait state. You keep 70%.

**[Install free →](https://github.com/lull-app/lull/releases)**

---

## What it does

Lull shows a single, non-intrusive sponsor card in the VS Code / Cursor sidebar during AI generation wait states (Claude, Codex, etc.). When the AI responds, the card disappears. You earn 70% of the ad revenue — paid in USDC or via Stripe.

## Install

1. Download `lull-0.1.0.vsix` from [Releases](https://github.com/lull-app/lull/releases)
2. In VS Code / Cursor: `Extensions → ⋯ → Install from VSIX…`
3. Click the Lull icon in the Activity Bar

**Why not the Marketplace?** VS Code Marketplace policy prohibits ad-based extensions. We distribute directly so the model stays yours.

## Privacy

Lull never reads your prompts, code, or AI responses.

The only data sent:
- Anonymous UUID (generated locally, resettable anytime)
- Impression count + timestamp

No prompt tracking. No code access. No keystroke logging. Every claim is verifiable — read the source.

`Lull: Reset my ID` in the Command Palette to generate a new UUID at any time.

## Commands

| Command | What it does |
|---|---|
| `Lull: Simulate AI call (show ad)` | Preview an ad card |
| `Lull: Simulate idle state` | Return to idle |
| `Lull: Reset my ID` | Generate a new anonymous ID |

## For advertisers

Reach senior developers during high-focus AI work sessions. Logo, tagline, and CTA — not a text string.

→ **[Start a $500 pilot](mailto:lull.extension@gmail.com?subject=Lull%20Advertising%20Inquiry)**

## Build from source

```bash
cd packages/extension
npm install
npm run build      # outputs dist/extension.js
npm run package    # outputs lull-x.x.x.vsix
```

## License

MIT — read, fork, verify.
