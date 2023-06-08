import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, TemplateRef, ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';
import { ixChartApp, chartsTrain, officialCatalog } from 'app/constants/catalog.constants';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { LayoutService } from 'app/services/layout.service';

@Component({
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryViewComponent implements AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  apps$ = this.applicationsStore.availableApps$.pipe(
    map((apps) => {
      this.category = this.route.snapshot.paramMap.get('category');
      this.pageTitle$.next(this.category);
      return apps.filter((app) => app.categories.includes(this.category.toLocaleLowerCase()));
    }),
  );
  pageTitle$ = new BehaviorSubject('Category');
  isLoading$ = this.applicationsStore.isLoading$;
  customAppDisabled$ = this.applicationsStore.selectedPool$.pipe(
    map((pool) => !pool),
  );
  category: string;

  readonly customIxChartApp = ixChartApp;
  readonly chartsTrain = chartsTrain;
  readonly officialCatalog = officialCatalog;

  constructor(
    private layoutService: LayoutService,
    private applicationsStore: AvailableAppsStore,
    private route: ActivatedRoute,
  ) {
    // this.category = this.route.snapshot.paramMap.get('category');
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
