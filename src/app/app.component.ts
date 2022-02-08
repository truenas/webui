import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title, DomSanitizer } from '@angular/platform-browser';
import {
  Router, NavigationEnd, NavigationCancel,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { customSvgIcons } from 'app/core/classes/custom-icons';
import { SystemProfileService } from 'app/services/system-profile.service';
import { ThemeService } from 'app/services/theme/theme.service';
import productText from './helptext/product';
import { SystemGeneralService } from './services';
import { WebSocketService } from './services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  appTitle = 'TrueNAS';
  protected accountUserResource = 'account/users/1';

  constructor(
    public title: Title,
    private router: Router,
    public snackBar: MatSnackBar,
    private ws: WebSocketService,
    public themeservice: ThemeService,
    public domSanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    private sysGeneralService: SystemGeneralService,
    // TODO: Keep or do proper refactoring.
    // Currently our code relies for SysInfo to be emitted by SystemProfileService constructor.
    private sysInfo: SystemProfileService,
  ) {
    this.matIconRegistry.addSvgIconSetInNamespace(
      'mdi',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/iconfont/mdi/mdi.svg'),
    );

    for (const [name, path] of Object.entries(customSvgIcons)) {
      this.matIconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl(path));
    }

    const product = productText.product.trim();
    this.title.setTitle(product + ' - ' + window.location.hostname);
    const darkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let path;
    if (window.localStorage.product_type) {
      const cachedType = window.localStorage['product_type'].toLowerCase();
      path = 'assets/images/truenas_' + cachedType + '_favicon.png';
      if (darkScheme) {
        path = 'assets/images/truenas_' + cachedType + '_ondark_favicon.png';
      }
    } else {
      this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
        path = 'assets/images/truenas_' + res.toLowerCase() + '_favicon.png';
        if (darkScheme) {
          path = 'assets/images/truenas_' + res.toLowerCase() + '_ondark_favicon.png';
        }
      });
    }
    this.setFavicon(path);

    if (this.detectBrowser('Safari')) {
      document.body.className += ' safari-platform';
    }

    router.events.pipe(untilDestroyed(this)).subscribe((s) => {
      // save currenturl
      if (s instanceof NavigationEnd) {
        if (this.ws.loggedIn && s.url !== '/sessions/signin') {
          sessionStorage.currentUrl = s.url;
        }
      }

      if (s instanceof NavigationCancel) {
        const params = new URLSearchParams(s.url.split('#')[1]);
        const isEmbedded = params.get('embedded');

        if (isEmbedded) {
          document.body.className += ' embedding-active';
        }
      }
    });

    this.router.errorHandler = (err: Error) => {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;

      if (chunkFailedMessage.test(err.message)) {
        window.location.reload(true);
      }
      console.error(err);
    };
  }

  private setFavicon(str: string): void {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link['rel'] = 'icon';
    link['type'] = 'image/png';
    link['href'] = str;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  private detectBrowser(name: string): boolean {
    const appName = navigator.appName;
    const ua = navigator.userAgent;
    let temp;
    const browserVersion = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (browserVersion && (temp = ua.match(/version\/([\.\d]+)/i)) !== null) browserVersion[2] = temp[1];
    const browserName = browserVersion ? browserVersion[1] : appName;

    return name === browserName;
  }
}
