import {
  Component, OnInit, Output, EventEmitter, AfterViewInit, ViewChild, TemplateRef, OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Subscription } from 'rxjs';
import {
  chartsTrain, ixChartApp, officialCatalog, appImagePlaceholder,
} from 'app/constants/catalog.constants';
import { JobState } from 'app/enums/job-state.enum';
import { capitalizeFirstLetter } from 'app/helpers/text.helpers';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { Option } from 'app/interfaces/option.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ControlConfig, ToolbarOption } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { CommonAppsToolbarButtonsComponent } from 'app/pages/applications/common-apps-toolbar-buttons/common-apps-toolbar-buttons.component';
import { CatalogSummaryDialogComponent } from 'app/pages/applications/dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form/chart-form.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { ModalService } from 'app/services/modal.service';

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
export class CatalogComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() updateTab = new EventEmitter();

  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
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

  jobsSubscription: Subscription;

  imagePlaceholder = appImagePlaceholder;
  private noAvailableCatalog = true;
  isLoading = false;
  emptyPageConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: helptext.catalogMessage.loading,
  };

  catalogMenu: ControlConfig;

  readonly officialCatalog = officialCatalog;

  constructor(
    private dialogService: DialogService,
    private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog,
    private translate: TranslateService,
    private ws: WebSocketService,
    private router: Router,
    private modalService: ModalService,
    private appService: ApplicationsService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadPoolSet();

    this.jobsSubscription = this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
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

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    if (this.jobsSubscription) {
      this.ws.unsubscribe(this.jobsSubscription);
    }
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

      this.catalogOptions = Array.from(catalogNames.values()).map((catalog) => {
        return { label: capitalizeFirstLetter(catalog), value: catalog };
      });
      this.selectedCatalogOptions = this.catalogOptions;
      this.setupCatalogMenu();

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

        const chartWizard = this.slideInService.open(ChartFormComponent, { wide: true });
        chartWizard.setChartCreate(catalogAppInfo);
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

  setupCatalogMenu(): void {
    this.catalogMenu = {
      label: helptext.catalogs,
      multiple: true,
      options: this.catalogOptions,
      value: this.selectedCatalogOptions,
      customTriggerValue: helptext.catalogs,
    };
  }

  onCatalogsSelectionChanged(selected: ToolbarOption[]): void {
    const catalogNames = selected.map((catalog) => catalog.value);
    if (!_.isEqual(this.filteredCatalogNames.sort(), catalogNames.sort())) {
      this.filteredCatalogNames = catalogNames as string[];
      this.filterApps();
    }
  }
}
