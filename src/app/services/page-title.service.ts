import { Injectable } from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RoutePartsService } from 'app/services/route-parts/route-parts.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  title$ = new BehaviorSubject('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private routePartsService: RoutePartsService,
  ) {
    this.observeRouteChanges();
  }

  /**
   * Sets page title manually.
   * Will be valid until next page navigation.
   */
  setTitle(title: string): void {
    this.title$.next(title);
  }

  private observeRouteChanges(): void {
    const routeParts = this.routePartsService.generateRouteParts(this.route.snapshot);
    if (routeParts.length > 0) {
      this.title$.next(routeParts[0]?.title || '');
    }
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      untilDestroyed(this),
    ).subscribe(() => {
      const routeParts = this.routePartsService.generateRouteParts(this.route.snapshot);
      this.title$.next(routeParts[0]?.title || '');
    });
  }
}
