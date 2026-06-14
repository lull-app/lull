import * as vscode from 'vscode';
import { spawnSync } from 'child_process';

// AI tool process names to watch for
const AI_PROCESSES = ['claude', 'codex', 'cursor', 'windsurf', 'codeium', 'copilot'];

export type OnStateChange = (active: boolean) => void;

function isAiProcessRunning(): boolean {
  try {
    const result = spawnSync('ps', ['aux'], { timeout: 500, encoding: 'utf8' });
    if (result.status !== 0 || !result.stdout) return false;
    const lower = (result.stdout as string).toLowerCase();
    return AI_PROCESSES.some(p => lower.includes(p));
  } catch {
    return false;
  }
}

export function createDetector(onChange: OnStateChange): vscode.Disposable {
  let lastState = false;
  let timer: NodeJS.Timeout | undefined;

  function check() {
    const active = isAiProcessRunning();
    if (active !== lastState) {
      lastState = active;
      onChange(active);
    }
  }

  // Poll every 2s (process check is heavier than tab label check)
  timer = setInterval(check, 2000);
  // Also check immediately on window focus
  const disposables: vscode.Disposable[] = [
    vscode.window.onDidChangeWindowState(s => { if (s.focused) check(); }),
    { dispose: () => { if (timer) clearInterval(timer); } },
  ];

  return vscode.Disposable.from(...disposables);
}
