import {
  Component, OnInit, Output, EventEmitter, OnDestroy, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import {
  chartsTrain, ixChartApp, officialCatalog, appImagePlaceholder,
} from 'app/constants/catalog.constants';
import { CommonUtils } from 'app/core/classes/common-utils';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEvent, ApplicationUserEventName } from 'app/interfaces/application.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { ApplicationToolbarControl } from 'app/pages/applications/application-toolbar-control.enum';
import { ChartWizardComponent } from 'app/pages/applications/forms/chart-wizard.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService, WebSocketService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from '../applications.service';
import { CatalogSummaryDialogComponent } from '../dialogs/catalog-summary/catalog-summary-dialog.component';

interface CatalogSyncJob {
  id: number;
  name: string;
  progress: number;
}

@UntilDestroy()
@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss', 'catalog.component.scss'],
})
export class CatalogComponent implements OnInit, OnDestroy {
  @Input() selectedPool: string;
  @Output() updateTab: EventEmitter<ApplicationUserEvent> = new EventEmitter();

  catalogApps: CatalogApp[] = [];
  catalogNames: string[] = [];
  filteredCatalogNames: string[] = [];
  filteredCatalogApps: CatalogApp[] = [];
  filterString = '';
  catalogSyncJobs: CatalogSyncJob[] = [];

  jobsSubscription: Subscription;

  protected utils: CommonUtils;
  imagePlaceholder = appImagePlaceholder;
  private noAvailableCatalog = true;
  isLoading = false;
  emptyPageConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: helptext.catalogMessage.loading,
  };

  readonly officialCatalog = officialCatalog;

  constructor(
    private dialogService: DialogService,
    private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog,
    private ws: WebSocketService,
    private modalService: ModalService,
    private appService: ApplicationsService,
  ) {
    this.utils = new CommonUtils();
  }

  ngOnInit(): void {
    this.loadCatalogs();

    this.jobsSubscription = this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      const catalogSyncJob = this.catalogSyncJobs.find((job) => job.id == event.fields.id);
      if (catalogSyncJob) {
        catalogSyncJob.progress = event.fields.progress.percent;
        if (event.fields.state == JobState.Success) {
          this.catalogSyncJobs = this.catalogSyncJobs.filter((job) => job.id !== catalogSyncJob.id);
          this.loadCatalogs();
        } else if (event.fields.state == JobState.Failed) {
          this.catalogSyncJobs = this.catalogSyncJobs.filter((job) => job.id !== catalogSyncJob.id);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.jobsSubscription) {
      this.ws.unsubscribe(this.jobsSubscription);
    }
  }

  loadCatalogs(): void {
    this.catalogNames = [];
    this.catalogApps = [];
    this.isLoading = true;
    this.showLoadStatus(EmptyType.Loading);
    this.catalogSyncJobs = [];

    this.appService.getAllCatalogItems().pipe(untilDestroyed(this)).subscribe((catalogs) => {
      this.noAvailableCatalog = true;
      this.catalogApps = [];
      this.catalogNames = [];
      catalogs.forEach((catalog) => {
        if (!catalog.cached) {
          if (catalog.caching_job) {
            this.catalogSyncJobs.push({
              id: catalog.caching_job.id,
              name: catalog.label,
              progress: catalog.caching_job.progress.percent,
            });
          }
          return;
        }

        if (!catalog.error) {
          this.noAvailableCatalog = false;
          this.catalogNames.push(catalog.label);
          catalog.preferred_trains.forEach((train) => {
            for (const i in catalog.trains[train]) {
              const item = catalog.trains[train][i];

              const catalogItem = { ...item } as CatalogApp;
              catalogItem.catalog = {
                id: catalog.id,
                label: catalog.label,
                train,
              };
              this.catalogApps.push(catalogItem);
            }
          });
        }
      });

      this.refreshToolbarMenus();
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

  onToolbarAction(evt: CoreEvent): void {
    if (evt.data.event_control === ApplicationToolbarControl.Filter) {
      this.filterString = evt.data.filter;
      this.filterApps();
    } else if (evt.data.event_control === ApplicationToolbarControl.RefreshAll) {
      this.syncAll();
    } else if (evt.data.event_control === ApplicationToolbarControl.Catalogs) {
      this.filteredCatalogNames = evt.data.catalogs.map((catalog: Option) => catalog.value);

      this.filterApps();
    }
  }

  refreshToolbarMenus(): void {
    this.updateTab.emit({ name: ApplicationUserEventName.CatalogToolbarChanged, catalogNames: this.catalogNames });
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

        const chartWizard = this.modalService.openInSlideIn(ChartWizardComponent);
        chartWizard.setCatalogApp(catalogAppInfo);
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
    dialogRef.componentInstance.openJobsManagerOnClose = true;
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.loadCatalogs();
    });
  }

  trackByApp(_: number, app: CatalogApp): string {
    return `${app.name} - ${app.catalog.id}`;
  }
}
