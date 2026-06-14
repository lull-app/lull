import * as vscode from 'vscode';
import { AdViewProvider } from './adPanel';
import { createDetector } from './detector';
import { getOrCreateUuid, resetUuid, sendImpression } from './tracker';
import { fetchAd, nextDemoAd } from './ads';

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  const provider = new AdViewProvider(ctx.extensionUri);
  ctx.subscriptions.push(
    vscode.window.registerWebviewViewProvider(AdViewProvider.viewId, provider)
  );

  ctx.subscriptions.push(
    vscode.commands.registerCommand('lull.resetId', () => {
      resetUuid(ctx);
      vscode.window.showInformationMessage('Lull: your anonymous ID has been reset.');
    }),
    vscode.commands.registerCommand('lull.simulateAd', async () => {
      const ad = nextDemoAd();
      provider.showAd(ad);
    }),
    vscode.commands.registerCommand('lull.simulateIdle', () => {
      provider.hideAd();
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
      provider.showAd(ad);
      if (url) sendImpression(url, uuid);
    } else {
      provider.hideAd();
    }
  });

  ctx.subscriptions.push(detector);
}

export function deactivate(): void {}
