import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

import { RoutePartsService } from "./services/route-parts/route-parts.service";
import { MdSnackBar } from '@angular/material';
import * as hopscotch from 'hopscotch';
import { RestService } from './services/rest.service';
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

  constructor(public title: Title,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private routePartsService: RoutePartsService,
    public snackBar: MdSnackBar,
    private rest: RestService,
    private tour: TourService) {}
    protected user: any;

  ngOnInit() {
    this.changePageTitle();
    this.getUserPreference().subscribe((res) => {
      this.user = res.data;
      let ShowTour = this.user.bsdusr_attributes.showTour;
      if (ShowTour) {
        setTimeout(() => {
          hopscotch.startTour(this.tour.startTour(this.router.url));
        }, 2000);
        this.user.bsdusr_attributes['showTour'] = false;
      }
    });
  }

  getUserPreference() {
    return this.rest.get(this.accountUserResource, {});
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
}
