import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chain } from 'lodash';
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
    return chain(this.routePartsService.routeParts)
      .sort((a, b) => a.ngUrl.length - b.ngUrl.length)
      .uniqBy('url')
      .filter((routePart) => {
        routePart.ngUrl = routePart.ngUrl.filter((item) => item !== '');
        if (routePart.url === this.router.url) {
          return false;
        }
        return Boolean(routePart.breadcrumb);
      })
      .value();
  }
}
