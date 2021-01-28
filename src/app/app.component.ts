import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { FlexLayoutModule } from '@angular/flex-layout';

import { ThemeService } from 'app/services/theme/theme.service';
import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MatSnackBar } from '@angular/material/snack-bar';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
import { ApiService } from 'app/core/services/api.service';
import { AnimationService } from 'app/core/services/animation.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { DataService } from 'app/core/services/data.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { SystemGeneralService } from './services';
import { WebSocketService } from './services/ws.service';
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry } from "@angular/material/icon";
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
  protected accountUserResource: string = 'account/users/1';
  protected user: any;
  public product_type: string = '';

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
    public chartDataUtils: ChartDataUtilsService,
    private sysGeneralService: SystemGeneralService) {
   
    this.matIconRegistry.addSvgIconSetInNamespace("mdi",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/iconfont/mdi/mdi.svg")
    );
    
    for(const [name, path] of Object.entries(customSvgIcons)) {
      this.matIconRegistry.addSvgIcon(name, this.domSanitizer.bypassSecurityTrustResourceUrl(path));  
    }

    const product = productText.product.trim();
    this.title.setTitle(product + ' - ' + window.location.hostname);
    const darkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let path;
    if(window.localStorage.product_type){
      let cachedType = window.localStorage['product_type'].toLowerCase();
      path = "assets/images/truenas_" + cachedType + "_favicon.png";
      if (darkScheme) {
        path = "assets/images/truenas_" + cachedType + "_ondark" + "_favicon.png";
      }
    } else {
      this.sysGeneralService.getProductType.subscribe((res) => {
        path = "assets/images/truenas_" + res.toLowerCase() + "_favicon.png";
        if (darkScheme) {
          path = "assets/images/truenas_" + res.toLowerCase() + "_ondark" + "_favicon.png";
        }
      });
    }
    this.setFavicon(path);

    if (this.detectBrowser("Safari")) {
      document.body.className += " safari-platform";
    }

    router.events.subscribe(s => {
      // save currenturl
      if (s instanceof NavigationEnd) {
        if (this.ws.loggedIn && s.url != '/sessions/signin'){
          sessionStorage.currentUrl = s.url;
        }
      }

      if(this.themeservice.globalPreview){
        // Only for globally applied theme preview
        this.globalPreviewControl();
      }
      if (s instanceof NavigationCancel) {
        let params = new URLSearchParams(s.url.split('#')[1]);
        let isEmbedded = params.get('embedded');

        if(isEmbedded) {
          document.body.className += " embedding-active";
        }
      }
    });

    this.router.errorHandler = function (err:any) {
      const chunkFailedMessage = /Loading chunk [\d]+ failed/;

      if (chunkFailedMessage.test(err.message)) {
        window.location.reload(true);
      }
      console.error(err);
    }
  }

  private setFavicon(str) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement("link")
      link['rel'] = "icon";
      link['type'] = "image/png";
      // link.sizes = "16x16";
      link['href'] = str;
      document.getElementsByTagName('head')[0].appendChild(link);
  }

  private detectBrowser(name){
    let N = navigator.appName;
    let UA = navigator.userAgent;
    let temp;
    let browserVersion = UA.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if(browserVersion && (temp = UA.match(/version\/([\.\d]+)/i))!= null)
      browserVersion[2]= temp[1];
    let browserName = browserVersion? browserVersion[1]: N;

    if(name == browserName) return true;
    else return false;
  }

  private globalPreviewControl(){
    let snackBarRef = this.snackBar.open('Custom theme Global Preview engaged','Back to form');
    snackBarRef.onAction().subscribe(()=> {
      this.router.navigate(['ui-preferences','create-theme']);
    });

    if(this.router.url === '/ui-preferences/create-theme' || this.router.url === '/ui-preferences/edit-theme'){
      snackBarRef.dismiss();
    }
  }
}
