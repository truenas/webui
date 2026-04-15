import { NavigationError } from '@angular/router';

const chunkFailedPattern = /Loading chunk \d+ failed|(?:failed|error)\s.*dynamically imported module/i;
export const chunkReloadKey = 'chunk-reload-attempted';
const reloadGuardMs = 30_000;

export function handleChunkLoadError(error: NavigationError, window: Window): void {
  if (!chunkFailedPattern.test(String(error.error))) {
    console.error(error);
    return;
  }

  try {
    const lastAttempt = Number(window.sessionStorage.getItem(chunkReloadKey));
    const now = Date.now();
    if (!lastAttempt || now - lastAttempt > reloadGuardMs) {
      window.sessionStorage.setItem(chunkReloadKey, String(now));
      window.location.reload();
    } else {
      window.sessionStorage.removeItem(chunkReloadKey);
      window.document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
          <div style="text-align:center">
            <p>The application has been updated.</p>
            <a href="javascript:location.reload()">Click here to refresh</a>
          </div>
        </div>
      `;
    }
  } catch {
    window.location.reload();
  }
}
