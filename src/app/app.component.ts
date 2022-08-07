import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot,
} from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';

import { ThemeService } from 'app/services/theme/theme.service';
import { RoutePartsService } from './services/route-parts/route-parts.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
import { ApiService } from 'app/core/services/api.service';
import { AnimationService } from 'app/core/services/animation.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { DataService } from 'app/core/services/data.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { WebSocketService } from './services/ws.service';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { ChartDataUtilsService } from 'app/core/services/chart-data-utils.service'; // <-- Use this globally so we can run as web worker
import { customSvgIcons } from 'app/core/classes/custom-icons';

import productText from './helptext/product';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  appTitle = 'TrueNAS';
  protected accountUserResource = 'account/users/1';
  protected user: any;
  product_type = '';

  constructor(public title: Title,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private routePartsService: RoutePartsService,
    public snackBar: MatSnackBar,
    private ws: WebSocketService,
    private rest: RestService,
    private api: ApiService,
    private animations: AnimationService,
    private ims: InteractionManagerService,
    private core: CoreService,
    public preferencesService: PreferencesService,
    public themeservice: ThemeService,
    public cache: DataService,
    public domSanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    public chartDataUtils: ChartDataUtilsService) {
    this.matIconRegistry.addSvgIconSetInNamespace('mdi',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/iconfont/mdi/mdi.svg'));

    for (const [name, path] of Object.entries(customSvgIcons)) {
      this.matIconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl(path));
    }

    const product = productText.product.trim();
    this.title.setTitle(product + ' - ' + window.location.hostname);
    if (window.localStorage.product_type) {
      const cachedType = window.localStorage['product_type'].toLowerCase();
      const path = 'assets/images/truenas_' + cachedType + '_favicon.png';
      this.setFavicon(path);
    } else {
      ws.call('system.product_type').subscribe((res) => {
        const path = 'assets/images/truenas_' + res.toLowerCase() + '_favicon.png';
        this.setFavicon(path);
      });
    }

    if (this.detectBrowser('Safari')) {
      document.body.className += ' safari-platform';
    }

    router.events.subscribe((event) => {
      // save currenturl
      if (event instanceof NavigationEnd) {
        const navigation = this.router.getCurrentNavigation();
        const skipLocationChange = navigation && navigation.extras && navigation.extras.skipLocationChange;
        if (this.ws.loggedIn && event.url != '/sessions/signin' && !skipLocationChange) {
          sessionStorage.currentUrl = event.url;
        }
      }

      if (this.themeservice.globalPreview) {
        // Only for globally applied theme preview
        this.globalPreviewControl();
      }
      if (event instanceof NavigationCancel) {
        const params = new URLSearchParams(event.url.split('#')[1]);
        const isEmbedded = params.get('embedded');

        if (isEmbedded) {
          document.body.className += ' embedding-active';
        }
      }
    });

    this.router.errorHandler = function (err: any) {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;

      if (chunkFailedMessage.test(err.message)) {
        window.location.reload(true);
      }
      console.error(err);
    };
  }

  private setFavicon(str) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link['rel'] = 'icon';
    link['type'] = 'image/png';
    // link.sizes = "16x16";
    link['href'] = str;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  private detectBrowser(name) {
    const N = navigator.appName;
    const UA = navigator.userAgent;
    let temp;
    const browserVersion = UA.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (browserVersion && (temp = UA.match(/version\/([\.\d]+)/i)) != null) browserVersion[2] = temp[1];
    const browserName = browserVersion ? browserVersion[1] : N;

    if (name == browserName) return true;
    return false;
  }

  private globalPreviewControl() {
    const snackBarRef = this.snackBar.open('Custom theme Global Preview engaged', 'Back to form');
    snackBarRef.onAction().subscribe(() => {
      this.router.navigate(['ui-preferences', 'create-theme']);
    });

    if (this.router.url === '/ui-preferences/create-theme' || this.router.url === '/ui-preferences/edit-theme') {
      snackBarRef.dismiss();
    }
  }
}
