import { Component, OnInit } from '@angular/core';
import {
  Router, NavigationEnd, ActivatedRoute,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { PseudoRouteChangeEvent } from 'app/interfaces/events/pseudo-route-change-event.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { LocaleService } from 'app/services/locale.service';
import { RoutePartsService, RoutePart } from 'app/services/route-parts/route-parts.service';

@UntilDestroy()
@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  routeParts: RoutePart[];
  isEnabled = true;
  constructor(private router: Router,
    private routePartsService: RoutePartsService,
    private activeRoute: ActivatedRoute,
    private core: CoreService,
    private localeService: LocaleService) { }

  ngOnInit(): void {
  // must be running once to get breadcrumbs
    this.routeParts = this.routePartsService.routeParts;
    // generate url from parts
    this.routeParts.reverse().map((item, i) => {
      // prepend / to first part
      if (i === 0) {
        item.url = `/${item.url}`;
        if (!item['toplevel']) {
          item.disabled = true;
        }
        return item;
      }
      // prepend previous part to current part
      item.url = `${this.routeParts[i - 1].url}/${item.url}`;
      return item;
    });

    // only execute when routechange
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        untilDestroyed(this),
      ).subscribe(() => {
        this.routeParts = this.routePartsService.routeParts;
        // generate url from parts
        this.routeParts.reverse().map((item, i) => {
          // prepend / to first part
          if (i === 0) {
            item.url = `/${item.url}`;
            if (!item['toplevel']) {
              item.disabled = true;
            }
            return item;
          }
          // prepend previous part to current part
          item.url = `${this.routeParts[i - 1].url}/${item.url}`;
          return item;
        });
      });

    // Pseudo routing events (for reports page)
    this.core.register({ observerClass: this, eventName: 'PseudoRouteChange' }).pipe(
      untilDestroyed(this),
    ).subscribe((evt: PseudoRouteChangeEvent) => {
      this.routeParts = evt.data;
      // generate url from parts
      this.routeParts.map((item, i) => {
        // prepend / to first part
        if (i === 0) {
          item.url = `/${item.url}`;
          item.disabled = true;
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });
  }
}
