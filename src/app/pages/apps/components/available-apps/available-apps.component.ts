import {
  AfterViewInit, ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import {
  Router, RouterEvent, NavigationSkipped,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, combineLatest, filter, map,
} from 'rxjs';
import { ixChartApp, chartsTrain, officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsByCategory, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements AfterViewInit, OnInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

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
  customAppDisabled$ = this.kubernetesStore.selectedPool$.pipe(
    map((pool) => !pool),
  );
  isLoading$ = this.applicationsStore.isLoading$;

  readonly customIxChartApp = ixChartApp;
  readonly chartsTrain = chartsTrain;
  readonly officialCatalog = officialCatalog;

  constructor(
    private layoutService: LayoutService,
    protected applicationsStore: AppsStore,
    protected appsFilterStore: AppsFilterStore,
    private router: Router,
    protected kubernetesStore: KubernetesStore,
  ) { }

  ngOnInit(): void {
    // For clicking the breadcrumbs link to this page
    this.router.events.pipe(
      filter((event: RouterEvent) => event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.router.url.endsWith('/apps/available')) {
        this.appsFilterStore.resetFilters();
      }
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }

  trackByAppSectionTitle(_: number, appSection: AppsByCategory): string {
    return `${appSection.title}`;
  }

  applyCategoryFilter(category: string): void {
    this.appsFilterStore.applyFilters({
      categories: [category],
      catalogs: [],
      sort: null,
    });
  }
}
