import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, tap,
} from 'rxjs';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { LayoutService } from 'app/services/layout.service';

interface AppSection {
  title: string;
  totalApps: number;
  apps$: BehaviorSubject<AvailableApp[]>;
  category: string;
}

@UntilDestroy()
@Component({
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  apps: AvailableApp[] = [];
  filteredApps: AvailableApp[] = [];
  filters: AppsFiltersValues = undefined;
  searchQuery = '';
  isFilterOrSearch = false;
  isLoading = false;

  appliedFilters = false;

  allRecommendedApps: AvailableApp[] = [];
  allNewAndUpdatedApps: AvailableApp[] = [];
  sliceAmount = 6;
  appSections: AppSection[] = [];

  recommendedApps$ = new BehaviorSubject<AvailableApp[]>([]);
  newAndUpdatedApps$ = new BehaviorSubject<AvailableApp[]>([]);

  constructor(
    private layoutService: LayoutService,
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }

  trackByAppSectionTitle(_: number, appSection: AppSection): string {
    return `${appSection.title}`;
  }

  changeFilters(filters: AppsFiltersValues): void {
    this.filters = filters;
    this.appliedFilters = true;
    this.loadApplications(filters);
  }

  changeSearchQuery(query: string): void {
    this.searchQuery = query;
    this.filterApps(this.apps);
  }

  private loadApplications(filters?: AppsFiltersValues): void {
    this.isLoading = true;
    let appCall$: Observable<AvailableApp[]>;
    if (filters) {
      if (filters.categories.includes('latest')) {
        filters.categories = filters.categories.filter((category) => category !== 'latest');
        appCall$ = this.appService.getLatestApps(filters);
      } else {
        appCall$ = this.appService.getAvailableApps(filters);
      }
    } else {
      appCall$ = this.appService.getLatestApps().pipe(
        tap((latestApps) => {
          this.allNewAndUpdatedApps = latestApps;
        }),
        switchMap(() => this.appService.getAvailableApps()),
      );
    }

    combineLatest([
      appCall$,
      this.appService.getAllAppsCategories(),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([apps, appCategories]) => {
        this.apps = apps;
        this.filterApps(apps);
        this.setupApps(apps, appCategories);

        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  private filterApps(apps: AvailableApp[]): void {
    this.isFilterOrSearch = !!this.searchQuery || !!this.filters;
    this.filteredApps = apps.filter((app) => app.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  private setupApps(apps: AvailableApp[], appCategories: string[]): void {
    this.allRecommendedApps = apps.filter((app) => app.recommended);
    this.recommendedApps$.next(this.allRecommendedApps.slice(0, this.sliceAmount));
    this.newAndUpdatedApps$.next(this.allNewAndUpdatedApps.slice(0, this.sliceAmount));

    this.appSections = [];
    this.appSections.push(
      {
        title: this.translate.instant('Recommended Apps'),
        apps$: this.recommendedApps$,
        totalApps: this.allRecommendedApps.length,
        category: 'recommended',
      },

    );

    if (!this.filters?.categories?.includes('latest')) {
      // If this filter is applied, that means every app is already latest one so showing
      // the new and updated category is not required
      this.appSections.push({
        title: this.translate.instant('New & Updated Apps'),
        apps$: this.newAndUpdatedApps$,
        totalApps: this.allNewAndUpdatedApps.length,
        category: 'latest',
      });
    }

    appCategories.forEach((category) => {
      const categorizedApps = apps.filter((app) => app.categories.some((appCategory) => appCategory === category));

      this.appSections.push(
        {
          title: category,
          apps$: new BehaviorSubject(categorizedApps.slice(0, this.sliceAmount)),
          totalApps: categorizedApps.length,
          // TODO: Implement logic to show all apps page per category
          category,
        },
      );
    });

    this.cdr.markForCheck();
  }

  applyCategoryFilter(category: string): void {
    this.changeFilters({
      categories: [category],
      catalogs: [],
      sort: AppsFiltersSort.Name,
    });
  }
}
