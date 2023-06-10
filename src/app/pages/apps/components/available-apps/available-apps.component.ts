import {
  AfterViewInit, ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import {
  Router, RouterEvent, NavigationSkipped,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, filter, map } from 'rxjs';
import { ixChartApp, chartsTrain, officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppsByCategory, AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements AfterViewInit, OnInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  showViewMoreButton$ = this.applicationsStore.filterValues$.pipe(
    map((appsFilter) => !appsFilter.sort && !appsFilter.categories.length),
  );
  isFilterOrSearch$ = combineLatest([
    this.applicationsStore.searchQuery$,
    this.applicationsStore.isFilterApplied$,
  ]).pipe(
    map(([searchQuery, isFilterApplied]) => {
      return !!searchQuery || isFilterApplied;
    }),
  );
  customAppDisabled$ = this.applicationsStore.selectedPool$.pipe(
    map((pool) => !pool),
  );
  isLoading$ = this.applicationsStore.isLoading$;

  readonly customIxChartApp = ixChartApp;
  readonly chartsTrain = chartsTrain;
  readonly officialCatalog = officialCatalog;

  constructor(
    private layoutService: LayoutService,
    protected applicationsStore: AvailableAppsStore,
    private router: Router,
  ) { }

  ngOnInit(): void {
    // For clicking the breadcrumbs link to this page
    this.router.events.pipe(
      filter((event: RouterEvent) => event instanceof NavigationSkipped),
      untilDestroyed(this),
    ).subscribe(() => {
      if (this.router.url.endsWith('/apps/available')) {
        this.applicationsStore.resetFilters();
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

  changeSearchQuery(query: string): void {
    this.applicationsStore.applySearchQuery(query);
  }

  applyCategoryFilter(category: string): void {
    this.applicationsStore.applyFilters({
      categories: [category],
      catalogs: [],
      sort: null,
    });
  }

  openCategoryView(category: string): void {
    this.applyCategoryFilter(category);
    this.router.navigate(['/apps', 'available', category]);
  }
}
