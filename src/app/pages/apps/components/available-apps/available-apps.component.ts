import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import {
  Router, NavigationSkipped,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, combineLatest, filter, map,
} from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { availableAppsElements } from 'app/pages/apps/components/available-apps/available-apps.elements';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps',
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements OnInit {
  protected readonly searchableElements = availableAppsElements;

  showViewMoreButton$: Observable<boolean> = this.appsFilterStore.filterValues$.pipe(
    map((appsFilter) => {
      return !appsFilter.sort && !appsFilter.categories.length;
    }),
  );

  isFilterOrSearch$: Observable<boolean> = combineLatest([
    this.appsFilterStore.searchQuery$,
    this.appsFilterStore.isFilterApplied$,
  ]).pipe(
    map(([searchQuery, isFilterApplied]) => {
      return !!searchQuery || isFilterApplied;
    }),
  );
  isLoading$ = this.applicationsStore.isLoading$;
  isFiltering$ = this.appsFilterStore.isFiltering$;

  constructor(
    protected router: Router,
    protected applicationsStore: AppsStore,
    protected appsFilterStore: AppsFilterStore,
  ) { }

  ngOnInit(): void {
    // For clicking the breadcrumbs link to this page
    this.router.events.pipe(
      filter((event) => event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.router.url.endsWith('/apps/available')) {
        this.appsFilterStore.resetFilters();
      }
    });
  }

  trackByAppId(_: number, app: AvailableApp): string {
    return `${app.train}-${app.name}`;
  }
}
