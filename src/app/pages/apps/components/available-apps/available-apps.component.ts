import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ChartFormComponent } from 'app/pages/apps/components/chart-form/chart-form.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

interface AppSection {
  title: string;
  totalApps: number;
  apps$: BehaviorSubject<CatalogApp[]>;
  fetchMore?: () => void;
}

@UntilDestroy()
@Component({
  templateUrl: './available-apps.component.html',
  styleUrls: ['./available-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  apps: CatalogApp[] = [];
  allRecommendedApps: CatalogApp[] = [];
  allNewAndUpdatedApps: CatalogApp[] = [];
  sliceAmount = 6;
  appSections: AppSection[] = [];

  recommendedApps$ = new BehaviorSubject<CatalogApp[]>([]);
  newAndUpdatedApps$ = new BehaviorSubject<CatalogApp[]>([]);

  constructor(
    private layoutService: LayoutService,
    private loader: AppLoaderService,
    private appService: ApplicationsService,
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onCustomAppPressed(): void {
    this.loader.open();
    this.appService.getCatalogItem(ixChartApp, officialCatalog, chartsTrain)
      .pipe(untilDestroyed(this))
      .subscribe((catalogApp) => {
        this.loader.close();

        const catalogAppInfo = {
          ...catalogApp,
          catalog: {
            id: officialCatalog,
            train: chartsTrain,
          },
          schema: catalogApp.versions[catalogApp.latest_version].schema,
        } as CatalogApp;
        const chartWizard = this.slideIn.open(ChartFormComponent, { wide: true });
        chartWizard.setChartCreate(catalogAppInfo);
      });
  }

  onSettingsPressed(): void {

  }

  trackByAppId(_: number, app: CatalogApp): string {
    return `${app.catalog.id}-${app.catalog.train}-${app.name}`;
  }

  trackByAppSectionTitle(_: number, appSection: AppSection): string {
    return `${appSection.title}`;
  }

  private loadApplications(): void {
    this.loader.open();

    combineLatest([this.appService.getAllApps(), this.appService.getAllAppsCategories()])
      .pipe(untilDestroyed(this))
      .subscribe(([apps, appCategories]) => {
        this.setupApps(apps, appCategories);
        this.loader.close();
        this.cdr.markForCheck();
      });
  }

  private setupApps(apps: CatalogApp[], appCategories: string[]): void {
    this.apps = apps;

    this.allRecommendedApps = this.apps.filter((app) => app.recommended);
    this.allNewAndUpdatedApps = this.apps
      .sort((a, b) => new Date(a.last_update).getTime() - new Date(b.last_update).getTime());

    this.recommendedApps$.next(this.allRecommendedApps.slice(0, this.sliceAmount));
    this.newAndUpdatedApps$.next(this.allNewAndUpdatedApps.slice(0, this.sliceAmount));

    this.appSections.push(
      {
        title: this.translate.instant('Recommended Apps'),
        apps$: this.recommendedApps$,
        totalApps: this.allNewAndUpdatedApps.length,
        fetchMore: () => this.recommendedApps$.next(this.allRecommendedApps),
      },
      {
        title: this.translate.instant('New & Updated Apps'),
        apps$: this.newAndUpdatedApps$,
        totalApps: this.sliceAmount,
      },
    );

    appCategories.forEach((category) => {
      const categorizedApps = this.apps.filter((app) => app.categories.some((appCategory) => appCategory === category));

      this.appSections.push(
        {
          title: category,
          apps$: new BehaviorSubject(categorizedApps.slice(0, this.sliceAmount)),
          totalApps: categorizedApps.length,
          // TODO: Implement logic to show all apps page per category
          fetchMore: () => {},
        },
      );
    });

    this.cdr.markForCheck();
  }
}
