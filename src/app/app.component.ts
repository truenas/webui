import { Component, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationCancel, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  isAuthenticated = false;
  constructor(
    public title: Title,
    private router: Router,
    private authService: AuthService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.authService.isAuthenticated$.pipe(untilDestroyed(this)).subscribe((isAuthenticated) => {
      this.isAuthenticated = isAuthenticated;
    });
    this.title.setTitle('TrueNAS - ' + this.window.location.hostname);

    this.setFavicon(this.window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (this.detectBrowser('Safari')) {
      document.body.className += ' safari-platform';
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
      this.setFavicon(event.matches);
    });

    this.router.events.pipe(untilDestroyed(this)).subscribe((event) => {
      // save currenturl
      if (event instanceof NavigationEnd) {
        const navigation = this.router.getCurrentNavigation();
        if (this.isAuthenticated && event.url !== '/sessions/signin' && !navigation?.extras?.skipLocationChange) {
          this.window.sessionStorage.setItem('redirectUrl', event.url);
        }
      }

      if (event instanceof NavigationCancel) {
        const params = new URLSearchParams(event.url.split('#')[1]);
        const isEmbedded = params.get('embedded');

        if (isEmbedded) {
          document.body.className += ' embedding-active';
        }
      }
    });

    this.router.errorHandler = (err: Error) => {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;

      if (chunkFailedMessage.test(err.message)) {
        this.window.location.reload();
      }
      console.error(err);
    };
  }

  private setFavicon(isDarkMode: boolean): void {
    let path = 'assets/images/truenas_scale_favicon.png';
    if (isDarkMode) {
      path = 'assets/images/truenas_scale_ondark_favicon.png';
    }

    const existingLinkElement = document.querySelector('link[rel=icon]');

    if (existingLinkElement) {
      (existingLinkElement as unknown as { href: string }).href = path;
    } else {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = path;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  private detectBrowser(name: string): boolean {
    const appName = navigator.appName;
    const ua = navigator.userAgent;
    const browserVersion = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    const versionMatch = ua.match(/version\/([.\d]+)/i);
    if (browserVersion && versionMatch !== null) {
      browserVersion[2] = versionMatch[1];
    }
    const browserName = browserVersion ? browserVersion[1] : appName;

    return name === browserName;
  }
}
