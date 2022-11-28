import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { filter } from 'rxjs/operators';
import { RoutePartsService, RoutePart } from 'app/services/route-parts/route-parts.service';

@UntilDestroy()
@Component({
  selector: 'ix-breadcrumb',
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
    let breadcrumbs = this.routePartsService.routeParts.sort((a, b) => {
      return a.ngUrl.length - b.ngUrl.length;
    });

    breadcrumbs = _.uniqBy(breadcrumbs, 'title');
    breadcrumbs = _.uniqBy(breadcrumbs, 'url');

    breadcrumbs = breadcrumbs.filter((routePart) => {
      routePart.ngUrl = routePart.ngUrl.filter((item) => item !== '');
      return routePart.breadcrumb;
    });

    return breadcrumbs;
  }
}
