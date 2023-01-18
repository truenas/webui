import {
  AfterViewInit, ChangeDetectionStrategy, Component, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ChartFormComponent } from 'app/pages/apps/components/chart-form/chart-form.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './available-apps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsComponent implements AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private layoutService: LayoutService,
    private loader: AppLoaderService,
    private appService: ApplicationsService,
    private slideIn: IxSlideInService,
  ) {}

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
}
