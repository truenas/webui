import { Injectable, inject } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

/**
 * Avoid using if possible.
 */
@Injectable({
  providedIn: 'root',
})
export class DetectBrowserService {
  private window = inject<Window>(WINDOW);


  isMacOs(): boolean {
    return this.window.navigator.userAgent.includes('Macintosh');
  }

  matchesBrowser(name: string): boolean {
    const ua = this.window.navigator.userAgent;
    const browserVersion = /(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i.exec(ua);
    const versionMatch = /version\/([.\d]+)/i.exec(ua);
    if (browserVersion && versionMatch !== null) {
      browserVersion[2] = versionMatch[1];
    }
    const browserName = browserVersion ? browserVersion[1] : '';

    return name === browserName;
  }
}
