import {
  Component, OnInit, Output, EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  chartsTrain, ixChartApp, officialCatalog, appImagePlaceholder,
} from 'app/constants/catalog.constants';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEventName } from 'app/interfaces/application.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { ApplicationTab } from 'app/pages/applications/application-tab.enum';
import { ApplicationToolbarControl } from 'app/pages/applications/application-toolbar-control.enum';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { CatalogSummaryDialogComponent } from 'app/pages/applications/dialogs/catalog-summary/catalog-summary-dialog.component';
import { ChartWizardComponent } from 'app/pages/applications/forms/chart-wizard.component';
import { KubernetesSettingsComponent } from 'app/pages/applications/kubernetes-settings/kubernetes-settings.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';

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
export class CatalogComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  catalogApps: CatalogApp[] = [];
  catalogNames: string[] = [];
  filteredCatalogNames: string[] = [];
  filteredCatalogApps: CatalogApp[] = [];
  filterString = '';
  catalogSyncJobs: CatalogSyncJob[] = [];
  selectedPool = '';
  private poolList: Option[] = [];

  imagePlaceholder = appImagePlaceholder;
  private noAvailableCatalog = true;
  isLoading = false;
  emptyPageConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: helptext.catalogMessage.loading,
  };

  readonly officialCatalog = officialCatalog;

  choosePool: DialogFormConfiguration = {
    title: helptext.choosePool.title,
    fieldConfig: [
      {
        type: 'select',
        name: 'pools',
        placeholder: helptext.choosePool.placeholder,
        required: true,
        options: this.poolList,
      },
      {
        type: 'checkbox',
        name: 'migrateApplications',
        placeholder: helptext.choosePool.migrateApplications,
      },
    ],
    method_ws: 'kubernetes.update',
    saveButtonText: helptext.choosePool.action,
    customSubmit: (entityForm) => this.doPoolSelect(entityForm),
  };

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
  ) {}

  ngOnInit(): void {
    this.loadCatalogs();
    this.checkForConfiguredPool();

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
    this.catalogNames = [];
    this.catalogApps = [];
    this.isLoading = true;
    this.showLoadStatus(EmptyType.Loading);
    this.catalogSyncJobs = [];

    this.appService.getAllCatalogItems().pipe(untilDestroyed(this)).subscribe((catalogs) => {
      this.noAvailableCatalog = true;
      this.catalogApps = [];
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
    if (evt.data.event_control === ApplicationToolbarControl.Settings && evt.data.settings) {
      switch (evt.data.settings.value) {
        case 'select_pool':
          this.selectPool();
          return;
        case 'advanced_settings':
          this.slideInService.open(KubernetesSettingsComponent);
          break;
        case 'unset_pool':
          this.doUnsetPool();
          break;
      }
    } else if (evt.data.event_control === ApplicationToolbarControl.Launch) {
      this.doInstall(ixChartApp);
    } else if (evt.data.event_control === ApplicationToolbarControl.Filter) {
      this.filterString = evt.data.filter;
      this.filterApps();
    } else if (evt.data.event_control === ApplicationToolbarControl.RefreshAll) {
      this.syncAll();
    } else if (evt.data.event_control === ApplicationToolbarControl.Catalogs) {
      const catalogNames = evt.data.catalogs.map((catalog: Option) => catalog.value);
      if (!_.isEqual(this.filteredCatalogNames.sort(), catalogNames.sort())) {
        this.filteredCatalogNames = catalogNames;
        this.filterApps();
      }
    }
  }

  refreshToolbarMenus(): void {
    this.updateTab.emit({
      name: ApplicationUserEventName.CatalogToolbarChanged,
      value: Boolean(this.selectedPool),
      catalogNames: this.catalogNames,
    });
  }

  checkForConfiguredPool(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.selectPool();
        this.updateTab.emit({ name: ApplicationUserEventName.SwitchTab, value: ApplicationTab.AvailableApps });
      } else {
        this.selectedPool = config.pool;
      }
      this.refreshToolbarMenus();
    });
  }

  selectPool(): void {
    this.appService.getPoolList().pipe(untilDestroyed(this)).subscribe((pools) => {
      if (pools.length === 0) {
        this.dialogService.confirm({
          title: helptext.noPool.title,
          message: helptext.noPool.message,
          hideCheckBox: true,
          buttonMsg: helptext.noPool.action,
        }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
          if (!confirmed) {
            return;
          }
          this.router.navigate(['storage', 'manager']);
        });
      } else {
        this.poolList.length = 0;
        pools.forEach((pool) => {
          this.poolList.push({ label: pool.name, value: pool.name });
        });

        const migrateField = this.choosePool.fieldConfig.find((config) => config.name === 'migrateApplications');
        if (this.selectedPool) {
          this.choosePool.fieldConfig[0].value = this.selectedPool;
          migrateField.isHidden = false;
        } else {
          delete this.choosePool.fieldConfig[0].value;
          migrateField.isHidden = true;
        }

        this.dialogService.dialogForm(this.choosePool, true);
      }
    });
  }

  doUnsetPool(): void {
    this.dialogService.confirm({
      title: helptext.choosePool.unsetPool.confirm.title,
      message: helptext.choosePool.unsetPool.confirm.message,
      hideCheckBox: true,
      buttonMsg: helptext.choosePool.unsetPool.confirm.button,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      const dialogRef = this.mdDialog.open(EntityJobComponent, {
        data: {
          title: helptext.choosePool.jobTitle,
        },
        disableClose: true,
      });
      dialogRef.componentInstance.setCall('kubernetes.update', [{ pool: null }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogService.closeAllDialogs();
        this.selectedPool = null;
        this.refreshToolbarMenus();
        this.dialogService.info(
          helptext.choosePool.success,
          this.translate.instant(helptext.choosePool.unsetPool.label),
          '500px',
          'info',
          true,
        );
      });

      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      });
    });
  }

  doPoolSelect(entityDialog: EntityDialogComponent): void {
    const pool = entityDialog.formGroup.controls['pools'].value;
    const migrateApplications = entityDialog.formGroup.controls['migrateApplications'].value;
    this.dialogService.closeAllDialogs();
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.choosePool.jobTitle,
      },
    });
    dialogRef.componentInstance.setCall('kubernetes.update', [{
      pool,
      migrate_applications: migrateApplications,
    }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((res: Job<KubernetesConfig>) => {
      this.selectedPool = pool;
      this.refreshToolbarMenus();
      this.dialogService.closeAllDialogs();
      this.dialogService.info(
        helptext.choosePool.success,
        this.translate.instant(helptext.choosePool.message) + res.result.pool,
        '500px',
        'info',
        true,
      );
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
}
