import { NavigationError } from '@angular/router';

const chunkFailedPattern = /Loading chunk \d+ failed|(?:Failed to fetch|error loading) dynamically imported module/i;
export const chunkReloadKey = 'chunk-reload-attempted';
const reloadGuardMs = 30_000;

let reloadedThisSession = false;

export function resetReloadedFlag(): void {
  reloadedThisSession = false;
}

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
      showFallbackPage(window);
    }
  } catch {
    if (!reloadedThisSession) {
      reloadedThisSession = true;
      window.location.reload();
    } else {
      showFallbackPage(window);
    }
  }
}

function showFallbackPage(window: Window): void {
  // Outside Angular DI context — translations are unavailable at this point.
  window.document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif">
      <div style="text-align:center">
        <p>The application has been updated.</p>
        <button id="chunk-reload-btn" style="background:none;border:none;color:blue;cursor:pointer;text-decoration:underline;font:inherit">
          Click here to refresh
        </button>
      </div>
    </div>
  `;
  window.document.getElementById('chunk-reload-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
}
