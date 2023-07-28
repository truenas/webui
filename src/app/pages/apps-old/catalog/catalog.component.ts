import {
  Component, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import _ from 'lodash';
import {
  chartsTrain, ixChartApp, officialCatalog, appImagePlaceholder,
} from 'app/constants/catalog.constants';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { capitalizeFirstLetter } from 'app/helpers/text.helpers';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ToolbarMenuOption } from 'app/modules/entity/entity-toolbar/components/toolbar-multimenu/toolbar-menu-option.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { CommonAppsToolbarButtonsComponent } from 'app/pages/apps-old/common-apps-toolbar-buttons/common-apps-toolbar-buttons.component';
import { CatalogSummaryDialogComponent } from 'app/pages/apps-old/dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartFormComponent } from 'app/pages/apps-old/forms/chart-form/chart-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { jobIndicatorPressed } from 'app/store/topbar/topbar.actions';

interface CatalogSyncJob {
  id: number;
  name: string;
  progress: number;
}

@UntilDestroy()
@Component({
  selector: 'ix-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss', 'catalog.component.scss'],
})
export class CatalogComponent implements OnInit {
  @ViewChild(CommonAppsToolbarButtonsComponent, { static: false })
  commonAppsToolbarButtons: CommonAppsToolbarButtonsComponent;

  catalogApps: CatalogApp[] = [];
  filteredCatalogNames: string[] = [];
  filteredCatalogApps: CatalogApp[] = [];
  filterString = '';
  catalogSyncJobs: CatalogSyncJob[] = [];
  selectedPool = '';
  catalogOptions: Option[] = [];
  selectedCatalogOptions: Option[] = [];

  imagePlaceholder = appImagePlaceholder;
  private noAvailableCatalog = true;
  isLoading = false;
  emptyPageConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: helptext.catalogMessage.loading,
  };

  readonly officialCatalog = officialCatalog;
  readonly helptext = helptext;

  constructor(
    private dialogService: DialogService,
    private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog,
    private ws: WebSocketService,
    private appService: ApplicationsService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadPoolSet();

    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      const catalogSyncJob = this.catalogSyncJobs.find((job) => job.id === event.fields.id);
      if (catalogSyncJob) {
        catalogSyncJob.progress = event.fields.progress.percent;
        if (event.fields.state === JobState.Success) {
          this.catalogSyncJobs = this.catalogSyncJobs.filter((job) => job.id !== catalogSyncJob.id);
          this.loadCatalogs();
        } else if (event.fields.state === JobState.Failed) {
          this.catalogSyncJobs = this.catalogSyncJobs.filter((job) => job.id !== catalogSyncJob.id);
        }
      }
    });
  }

  loadCatalogs(): void {
    this.catalogOptions = [];
    this.catalogApps = [];
    this.isLoading = true;
    this.showLoadStatus(EmptyType.Loading);
    this.catalogSyncJobs = [];
    const catalogNames = new Set<string>();

    this.appService.getAllCatalogItems().pipe(untilDestroyed(this)).subscribe((catalogs) => {
      this.noAvailableCatalog = true;
      this.catalogApps = [];
      catalogs.forEach((catalog) => {
        if (!catalog.cached && catalog.caching_job) {
          this.catalogSyncJobs.push({
            id: catalog.caching_job.id,
            name: catalog.label,
            progress: catalog.caching_job.progress.percent,
          });
          return;
        }

        if (!catalog.error) {
          this.noAvailableCatalog = false;
          catalogNames.add(catalog.label);
          catalog.preferred_trains.forEach((train) => {
            if (!catalog.trains[train]) {
              return;
            }

            Object.values(catalog.trains[train]).forEach((item) => {
              const catalogItem = { ...item } as CatalogApp;
              catalogItem.catalog = {
                id: catalog.id,
                label: catalog.label,
                train,
              };
              this.catalogApps.push(catalogItem);
            });
          });
        }
      });

      this.catalogOptions = Array.from(catalogNames.values()).map((catalog) => {
        return { label: capitalizeFirstLetter(catalog), value: catalog };
      });
      this.selectedCatalogOptions = this.catalogOptions;

      this.filterApps();
      this.isLoading = false;
    });
  }

  showLoadStatus(type: EmptyType): void {
    let title = '';
    let message;

    if (this.isLoading) {
      type = EmptyType.Loading;
    }

    switch (type) {
      case EmptyType.Loading:
        title = helptext.catalogMessage.loading;
        break;
      case EmptyType.NoPageData:
        if (this.noAvailableCatalog) {
          title = helptext.catalogMessage.no_catalog;
        } else {
          title = helptext.catalogMessage.no_application;
        }
        break;
      case EmptyType.NoSearchResults:
        title = helptext.catalogMessage.no_search_result;
        break;
    }

    this.emptyPageConf.type = type;
    this.emptyPageConf.title = title;
    this.emptyPageConf.message = message;
  }

  onSearch(query: string): void {
    this.filterString = query;
    this.filterApps();
  }

  loadPoolSet(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      this.selectedPool = config.pool || '';
    });
  }

  doInstall(name: string, catalog = officialCatalog, train = chartsTrain): void {
    this.appLoaderService.open();
    this.appService.getCatalogItem(name, catalog, train).pipe(untilDestroyed(this)).subscribe((catalogApp) => {
      this.appLoaderService.close();

      if (catalogApp) {
        const catalogAppInfo = { ...catalogApp } as CatalogApp;
        catalogAppInfo.catalog = {
          id: catalog,
          train,
        };
        catalogAppInfo.schema = catalogApp.versions[catalogApp.latest_version].schema;

        this.slideInService.open(
          ChartFormComponent,
          { wide: true, data: { catalogApp: catalogAppInfo } },
        );
      }
    });
  }

  filterApps(): void {
    this.filteredCatalogApps = this.catalogApps.filter((app) => {
      if (this.filterString && !app.name.toLowerCase().includes(this.filterString.toLocaleLowerCase())) {
        return false;
      }

      /**
       * Below is a special check to remove 'ix-chart' from the list of apps shown. 'ix-chart' is the same thing
       * as the button 'Launch Docker Image' in UI. Middleware advised UI to hide this option
       */
      if (app.name === ixChartApp) {
        return false;
      }

      return this.filteredCatalogNames.includes(app.catalog.label);
    });

    if (this.filteredCatalogApps.length === 0) {
      if (this.filterString) {
        this.showLoadStatus(EmptyType.NoSearchResults);
      } else {
        this.showLoadStatus(EmptyType.NoPageData);
      }
    }
  }

  showSummaryDialog(name: string, catalog = officialCatalog, train = chartsTrain): void {
    this.appLoaderService.open();
    this.appService.getCatalogItem(name, catalog, train).pipe(untilDestroyed(this)).subscribe((catalogApp) => {
      this.appLoaderService.close();
      if (catalogApp) {
        const catalogAppInfo = { ...catalogApp } as CatalogApp;
        catalogAppInfo.catalog = {
          label: catalog,
          train,
        };
        this.mdDialog.open(CatalogSummaryDialogComponent, {
          width: '470px',
          data: catalogAppInfo,
        });
      }
    });
  }

  syncAll(): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.loadCatalogs();
    });
    dialogRef
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store$.dispatch(jobIndicatorPressed());
      });
  }

  onCatalogsSelectionChanged(selected: ToolbarMenuOption[]): void {
    const catalogNames = selected.map((catalog) => catalog.value);
    if (!_.isEqual(this.filteredCatalogNames.sort(), catalogNames.sort())) {
      this.filteredCatalogNames = catalogNames as string[];
      this.filterApps();
    }
  }
}
