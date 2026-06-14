import * as vscode from 'vscode';
import { Ad } from './ads';

export class AdViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'lull.adView';
  private _view?: vscode.WebviewView;
  private _impressions = 0;
  private _earnings = 0;
  private _pendingAd?: Ad;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    this._view = view;
    view.webview.options = { enableScripts: true, localResourceRoots: [] };
    if (this._pendingAd) {
      this._view.webview.html = this._adHtml(this._pendingAd);
      this._pendingAd = undefined;
    } else {
      this._renderIdle();
    }
  }

  showAd(ad: Ad): void {
    if (!this._view) { this._pendingAd = ad; return; }
    this._impressions++;
    this._earnings += 0.015;
    this._view.webview.html = this._adHtml(ad);
  }

  hideAd(): void {
    if (!this._view) return;
    this._renderIdle();
  }

  private _renderIdle(): void {
    if (!this._view) return;
    this._view.webview.html = this._idleHtml();
  }

  private _adHtml(ad: Ad): string {
    const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(ad.color) ? ad.color : '#6ee7b7';
    const safeUrl = /^https?:\/\//i.test(ad.ctaUrl) ? escapeHtml(ad.ctaUrl) : '#';
    const safeLogo = escapeHtml(ad.logo);
    const r = parseInt(safeColor.slice(1,3),16);
    const g = parseInt(safeColor.slice(3,5),16);
    const b = parseInt(safeColor.slice(5,7),16);
    return `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
:root{--c:${safeColor};--cr:${r};--cg:${g};--cb:${b}}
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d0d10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;padding:12px;-webkit-font-smoothing:antialiased;color:#e2e2e2}
.wrap{animation:rise .35s cubic-bezier(.16,1,.3,1)}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.badge{font-size:9.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:#555;background:#161618;border:1px solid #222;padding:2px 8px;border-radius:20px}
.timer{font-size:10px;color:#444;background:#111;padding:2px 8px;border-radius:20px;font-variant-numeric:tabular-nums}
.card{background:linear-gradient(145deg,#131316,#0f0f12);border:1px solid #1f1f24;border-radius:14px;overflow:hidden}
.accent{height:2px;background:linear-gradient(90deg,rgba(${r},${g},${b},0),rgba(${r},${g},${b},.9),rgba(${r},${g},${b},0))}
.body{padding:14px}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.logo{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;flex-shrink:0;background:rgba(${r},${g},${b},.15);color:var(--c);border:1px solid rgba(${r},${g},${b},.25)}
.brandname{font-size:14px;font-weight:700;color:#ececec;letter-spacing:-.2px}
.tagline{font-size:12px;color:#777;line-height:1.55;margin-bottom:14px}
.cta{display:inline-flex;align-items:center;gap:5px;background:rgba(${r},${g},${b},.12);border:1px solid rgba(${r},${g},${b},.3);color:var(--c);font-weight:600;font-size:12px;padding:7px 14px;border-radius:8px;text-decoration:none;transition:background .15s,border-color .15s;cursor:pointer}
.cta:hover{background:rgba(${r},${g},${b},.22);border-color:rgba(${r},${g},${b},.5)}
.arrow{font-size:11px;opacity:.7}
.footer{margin-top:10px;font-size:9.5px;color:#333;text-align:right}
</style></head><body>
<div class="wrap">
  <div class="topbar"><span class="badge">Sponsored</span><span class="timer" id="t">15s</span></div>
  <div class="card">
    <div class="accent"></div>
    <div class="body">
      <div class="brand">
        <div class="logo">${safeLogo}</div>
        <div class="brandname">${escapeHtml(ad.name)}</div>
      </div>
      <div class="tagline">${escapeHtml(ad.tagline)}</div>
      <a class="cta" href="${safeUrl}">${escapeHtml(ad.ctaText)} <span class="arrow">→</span></a>
    </div>
  </div>
  <div class="footer">Ad · Lull</div>
</div>
<script>
let c=15;const t=document.getElementById('t');
const i=setInterval(()=>{c--;t.textContent=c+'s';if(c<=0)clearInterval(i);},1000);
</script>
</body></html>`;
  }

  private _idleHtml(): string {
    const e = this._earnings.toFixed(3);
    const imp = this._impressions;
    return `<!DOCTYPE html><html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0d0d10;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;padding:12px;-webkit-font-smoothing:antialiased;color:#e2e2e2}
.card{background:#111114;border:1px solid #1a1a1f;border-radius:12px;padding:12px 14px}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.amount{font-size:20px;font-weight:700;color:#6ee7b7;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
.dot{width:7px;height:7px;border-radius:50%;background:#6ee7b7;animation:pulse 2.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.8;transform:scale(1.15)}}
.row{display:flex;gap:12px}
.stat{flex:1;background:#0d0d10;border:1px solid #1a1a1f;border-radius:8px;padding:7px 9px}
.stat-n{font-size:13px;font-weight:600;color:#ccc}
.stat-l{font-size:9.5px;color:#444;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
.waiting{font-size:10px;color:#333;margin-top:8px;text-align:center}
</style></head><body>
<div class="card">
  <div class="top">
    <div class="amount">$${e}</div>
    <div class="dot"></div>
  </div>
  <div class="row">
    <div class="stat"><div class="stat-n">${imp}</div><div class="stat-l">Impressions</div></div>
    <div class="stat"><div class="stat-n">$${(imp * 0.015).toFixed(2)}</div><div class="stat-l">Earned</div></div>
  </div>
  <div class="waiting">waiting for AI activity…</div>
</div>
</body></html>`;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
