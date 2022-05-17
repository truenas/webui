import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { filter } from 'rxjs/operators';
import { RoutePartsService, RoutePart } from 'app/services/route-parts/route-parts.service';

@UntilDestroy()
@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  breadcrumbs: RoutePart[];
  constructor(
    private router: Router,
    private routePartsService: RoutePartsService,
  ) { }

  ngOnInit(): void {
    this.breadcrumbs = this.getBreadcrumbs();

    // only execute when routechange
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        untilDestroyed(this),
      ).subscribe(() => {
        this.breadcrumbs = this.getBreadcrumbs();
      });
  }

  private getBreadcrumbs(): RoutePart[] {
    let breadcrumbs = this.routePartsService.routeParts;
    // uniq by url
    breadcrumbs = _.uniqBy(breadcrumbs, 'url');
    // uniq by title
    breadcrumbs = _.uniqBy(breadcrumbs, 'title');

    breadcrumbs = breadcrumbs.filter((routePart) => {
      // filters main menu routers that has sub menus
      // Credentials Page
      if (routePart.url === '/credentials') {
        return false;
      }
      // System Settings Page
      if (routePart.url === '/system') {
        return false;
      }
      // Reporting Page
      if (routePart.url === '/reportsdashboard') {
        return false;
      }

      if (!routePart.breadcrumb) {
        return false;
      }
      return true;
    });

    return breadcrumbs;
  }
}
