import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import {
  ActivatedRoute, Router,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject, map,
} from 'rxjs';
import { ixChartApp, chartsTrain, officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  pageTitle$ = new BehaviorSubject('Category');
  apps$ = this.applicationsStore.filteredApps$;
  isLoading$ = this.applicationsStore.isLoading$;
  customAppDisabled$ = this.applicationsStore.selectedPool$.pipe(map((pool) => !pool));

  readonly customIxChartApp = ixChartApp;
  readonly chartsTrain = chartsTrain;
  readonly officialCatalog = officialCatalog;

  constructor(
    private layoutService: LayoutService,
    private applicationsStore: AvailableAppsStore,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const category = this.route.snapshot.params.category as string;
    this.applicationsStore.appsCategories$.pipe(
      untilDestroyed(this),
    ).subscribe((categories) => {
      if (categories.includes(category)) {
        this.pageTitle$.next(category.replace(/-/g, ' '));
        this.applicationsStore.applyFilters({
          categories: [category],
          catalogs: [],
          sort: null,
        });
        this.cdr.markForCheck();
      } else {
        this.router.navigate(['/apps', 'available']);
      }
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.applicationsStore.resetFilters();
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
