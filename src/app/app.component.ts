import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { URLSearchParams } from '@angular/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ThemeService } from 'app/services/theme/theme.service';

import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MatSnackBar } from '@angular/material';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
import { ApiService } from 'app/core/services/api.service';
import { AnimationService } from 'app/core/services/animation.service';
import { InteractionManagerService } from 'app/core/services/interaction-manager.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { WebSocketService } from './services/ws.service';
import { DomSanitizer } from "@angular/platform-browser";
import { MatIconRegistry } from "@angular/material/icon";
//import { ChartDataUtilsService } from 'app/core/services/chart-data-utils.service'; // <-- Use this globally so we can run as web worker

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
    public domSanitizer: DomSanitizer,
    public matIconRegistry: MatIconRegistry,
    /*public chartDataUtils: ChartDataUtilsService*/) {

    this.matIconRegistry.addSvgIconSetInNamespace(
      "mdi",
      this.domSanitizer.bypassSecurityTrustResourceUrl("assets/iconfont/mdi/mdi.svg")
    );
    this.title.setTitle('FreeNAS - ' + window.location.hostname);

    if (this.detectBrowser("Safari")) {
      document.body.className += " safari-platform";
    }

    router.events.subscribe(s => {
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
