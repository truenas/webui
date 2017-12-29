import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, NavigationCancel, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { URLSearchParams, } from '@angular/http';

import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MdSnackBar } from '@angular/material';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
import { ApiService } from 'app/core/services/api.service';
import { TourService } from './services/tour.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TourService]
})
export class AppComponent implements OnInit {
  appTitle = 'FreeNAS Material UI';
  pageTitle = '';
  protected accountUserResource: string = 'account/users/1';
  protected user: any;

  constructor(public title: Title,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private routePartsService: RoutePartsService,
    public snackBar: MdSnackBar,
    private rest: RestService,
    private api: ApiService,
    private tour: TourService) {

    if (this.detectBrowser("Safari")) {
      document.body.className += " safari-platform";
    }

    router.events.subscribe(s => {
      if (s instanceof NavigationCancel) {
        let params = new URLSearchParams(s.url.split('#')[1]);
        let isEmbedded = params.get('embedded');

        if(isEmbedded) {
          document.body.className += " embedding-active";
        }
      }
    });
  }

  ngOnInit() {
    this.changePageTitle();
  }

  changePageTitle() {
    this.router.events.filter(event => event instanceof NavigationEnd).subscribe((routeChange) => {
      const routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
      if (!routeParts.length) {
        return this.title.setTitle(this.appTitle);
      }
      // Extract title from parts;
      this.pageTitle = routeParts
        .map((part) => part.title)
        .reduce((partA, partI) => { return `${partA} > ${partI}` });
      this.pageTitle += ` | ${this.appTitle}`;
      this.title.setTitle(this.pageTitle);
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
}
