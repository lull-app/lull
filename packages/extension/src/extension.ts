import * as vscode from 'vscode';
import { AdViewProvider } from './adPanel';
import { createDetector } from './detector';
import { LullStatusBar } from './statusBar';
import { getOrCreateUuid, resetUuid, sendImpression } from './tracker';
import { fetchAd, nextDemoAd } from './ads';

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  // Earnings dashboard panel (sidebar)
  const provider = new AdViewProvider(ctx.extensionUri);
  ctx.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AdViewProvider.viewId, provider)
  );

  // Status bar ad placement
  const statusBar = new LullStatusBar(url => {
    vscode.env.openExternal(vscode.Uri.parse(url));
  });
  ctx.subscriptions.push(statusBar);

  ctx.subscriptions.push(
    vscode.commands.registerCommand('lull.openAdUrl', () => statusBar.openCurrentUrl()),
    vscode.commands.registerCommand('lull.resetId', () => {
      resetUuid(ctx);
      vscode.window.showInformationMessage('Lull: your anonymous ID has been reset.');
    }),
    vscode.commands.registerCommand('lull.simulateAd', async () => {
      const ad = nextDemoAd();
      statusBar.showAd(ad);
      provider.recordImpression(ad);
    }),
    vscode.commands.registerCommand('lull.simulateIdle', () => {
      statusBar.hideAd();
    })
  );

  const uuid = getOrCreateUuid(ctx);
  const backendUrl = () => vscode.workspace.getConfiguration('lull').get<string>('backendUrl', '');
  const enabled = () => vscode.workspace.getConfiguration('lull').get<boolean>('enabled', true);

  const detector = createDetector(async (active) => {
    if (!enabled()) return;
    if (active) {
      const url = backendUrl();
      const ad = url ? (await fetchAd(url) ?? nextDemoAd()) : nextDemoAd();
      statusBar.showAd(ad);
      provider.recordImpression(ad);
      if (url) sendImpression(url, uuid);
    } else {
      statusBar.hideAd();
    }
  });

  ctx.subscriptions.push(detector);
}

export function deactivate(): void {}
