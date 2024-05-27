import { Inject, Injectable } from '@angular/core';
import { WINDOW } from 'app/helpers/window.helper';

/**
 * Avoid using if possible.
 */
@Injectable({
  providedIn: 'root',
})
export class DetectBrowserService {
  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}

  isMacOs(): boolean {
    return this.window.navigator.userAgent.includes('Macintosh');
  }

  matchesBrowser(name: string): boolean {
    const appName = this.window.navigator.appName;
    const ua = this.window.navigator.userAgent;
    const browserVersion = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    const versionMatch = ua.match(/version\/([.\d]+)/i);
    if (browserVersion && versionMatch !== null) {
      browserVersion[2] = versionMatch[1];
    }
    const browserName = browserVersion ? browserVersion[1] : appName;

    return name === browserName;
  }
}
