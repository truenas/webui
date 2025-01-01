import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
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
  hasNewIndicator$ = new BehaviorSubject(false);

  constructor(
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
    this.emitTitleFromRoute();
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      untilDestroyed(this),
    ).subscribe(() => {
      this.emitTitleFromRoute();
    });
  }

  emitTitleFromRoute(): void {
    const breadcrumbs = this.routePartsService.routeParts;
    if (breadcrumbs && breadcrumbs.length > 0) {
      this.title$.next(breadcrumbs[breadcrumbs.length - 1].title || '');
      this.hasNewIndicator$.next(breadcrumbs.some((breadcrumb) => breadcrumb.isNew));
    }
  }
}
