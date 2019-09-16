import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { URLSearchParams, } from '@angular/http';
import { FlexLayoutModule } from '@angular/flex-layout';

import { ThemeService } from 'app/services/theme/theme.service';
import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MatSnackBar } from '@angular/material';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
import { ApiService } from 'app/core/services/api.service';
import { AnimationService } from 'app/core/services/animation.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { DataService } from 'app/core/services/data.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { WebSocketService } from './services/ws.service';
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry } from "@angular/material/icon";
import { ChartDataUtilsService } from 'app/core/services/chart-data-utils.service'; // <-- Use this globally so we can run as web worker

import productText from './helptext/product';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  appTitle = 'FreeNAS';
  protected accountUserResource: string = 'account/users/1';
  protected user: any;

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

    this.matIconRegistry.addSvgIconSetInNamespace(
      "mdi",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/iconfont/mdi/mdi.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "jail_icon",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/jail_icon.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "ha_disabled",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/ha_disabled.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "ha_enabled",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/ha_enabled.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "ha_reconnecting",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/ha_reconnecting.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "truenas_logomark",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/truenas_logomark.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "truenas_logotype",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/truenas_logotype.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "truenas_logo_full",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/truenas_logo_full.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "freenas_logomark",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/logo.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "freenas_logotype",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/logo-text.svg")
    );
    this.matIconRegistry.addSvgIcon(
      "freenas_logo_full",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/customicons/logo-full.svg")
    );


    const product = productText.product.trim();
    this.title.setTitle(product + ' - ' + window.location.hostname);
    if (product === "FreeNAS") {
      this.setFavicon("assets/images/favicon-96x96.png");
    } else {
      this.setFavicon("assets/images/TrueNAS_favicon.png");
    }

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
