import {
  Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { CommonUtils } from 'app/core/classes/common-utils';
import { CoreService } from 'app/core/services/core-service/core.service';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEvent, ApplicationUserEventName } from 'app/interfaces/application.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { Option } from 'app/interfaces/option.interface';
import { ApplicationTab } from 'app/pages/applications/application-tab.enum';
import { ApplicationToolbarControl } from 'app/pages/applications/application-toolbar-control.enum';
import { ChartWizardComponent } from 'app/pages/applications/forms/chart-wizard.component';
import { KubernetesSettingsComponent } from 'app/pages/applications/kubernetes-settings/kubernetes-settings.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from './applications.service';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';
import { ManageCatalogsComponent } from './manage-catalogs/manage-catalogs.component';

@UntilDestroy()
@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ApplicationsComponent implements OnInit, AfterViewInit {
  @ViewChild(ChartReleasesComponent, { static: false }) private chartTab: ChartReleasesComponent;
  @ViewChild(CatalogComponent, { static: false }) private catalogTab: CatalogComponent;
  @ViewChild(ManageCatalogsComponent, { static: false }) private manageCatalogTab: ManageCatalogsComponent;
  @ViewChild(DockerImagesComponent, { static: false }) private dockerImagesTab: DockerImagesComponent;
  selectedTab = ApplicationTab.InstalledApps;
  isSelectedOneMore = false;
  isSelectedAll = false;
  selectedPool: string = null;
  private poolList: Option[] = [];
  settingsEvent$: Subject<CoreEvent>;
  filterString = '';
  toolbarConfig: ToolbarConfig;
  catalogOptions: Option[] = [];
  selectedCatalogOptions: Option[] = [];
  protected utils: CommonUtils;

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
    private appService: ApplicationsService,
    private core: CoreService,
    private router: Router,
    private modalService: ModalService,
    private appLoaderService: AppLoaderService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private mdDialog: MatDialog,
    private translate: TranslateService,
  ) {
    this.utils = new CommonUtils();
  }

  ngOnInit(): void {
    this.setupToolbar();
    this.checkForConfiguredPool();

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTab();
    });
  }

  ngAfterViewInit(): void {
    this.refreshTab();
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == ApplicationToolbarControl.Filter) {
        this.filterString = evt.data.filter;
      } else if (evt.data.event_control === ApplicationToolbarControl.Settings && evt.data.settings) {
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
        this.launchDocker(ixChartApp);
      }

      switch (this.selectedTab) {
        case ApplicationTab.InstalledApps:
          this.chartTab.onToolbarAction(evt);
          break;
        case ApplicationTab.Catalogs:
          this.manageCatalogTab.onToolbarAction(evt);
          break;
        case ApplicationTab.AvailableApps:
          this.catalogTab.onToolbarAction(evt);
          break;
        case ApplicationTab.DockerImages:
          this.dockerImagesTab.onToolbarAction(evt);
      }
    });

    const controls = [
      {
        name: ApplicationToolbarControl.Filter,
        type: 'input',
        value: this.filterString,
      },
    ];

    const toolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  updateToolbar(): void {
    this.toolbarConfig.controls.splice(1);
    const search = this.toolbarConfig.controls[0];

    switch (this.selectedTab) {
      case ApplicationTab.InstalledApps:
        search.placeholder = helptext.installedPlaceholder;
        const bulk = {
          name: 'bulk',
          label: helptext.bulkActions.title,
          type: 'menu',
          options: helptext.bulkActions.options,
        };
        if (this.isSelectedAll) {
          bulk.options[0].label = helptext.bulkActions.unSelectAll;
        } else {
          bulk.options[0].label = helptext.bulkActions.selectAll;
        }
        bulk.options.forEach((option) => {
          if (option.value != 'select_all') {
            option.disabled = !this.isSelectedOneMore;
          }
        });
        this.toolbarConfig.controls.push(bulk);
        break;
      case ApplicationTab.AvailableApps:
        search.placeholder = helptext.availablePlaceholder;
        this.toolbarConfig.controls.push({
          name: ApplicationToolbarControl.RefreshAll,
          label: helptext.refresh,
          type: 'button',
          color: 'secondary',
          value: 'refresh_all',
        });

        this.toolbarConfig.controls.push({
          type: 'multimenu',
          name: ApplicationToolbarControl.Catalogs,
          label: helptext.catalogs,
          disabled: false,
          multiple: true,
          options: this.catalogOptions,
          value: this.selectedCatalogOptions,
          customTriggerValue: helptext.catalogs,
        });
        break;
      case ApplicationTab.Catalogs:
        search.placeholder = helptext.catalogPlaceholder;
        this.toolbarConfig.controls.push({
          name: ApplicationToolbarControl.RefreshCatalogs,
          label: helptext.refresh,
          type: 'button',
          color: 'secondary',
          value: 'refresh_catalogs',
        });
        this.toolbarConfig.controls.push({
          name: ApplicationToolbarControl.AddCatalog,
          label: helptext.addCatalog,
          type: 'button',
          color: 'secondary',
          value: 'add_catalog',
        });
        break;
      case ApplicationTab.DockerImages:
        search.placeholder = helptext.dockerPlaceholder;
        this.toolbarConfig.controls.push({
          name: ApplicationToolbarControl.PullImage,
          label: helptext.pullImage,
          type: 'button',
          color: 'secondary',
          value: 'pull_image',
        });
        break;
    }

    const setting = {
      name: ApplicationToolbarControl.Settings,
      label: helptext.settings,
      type: 'menu',
      options: [
        { label: helptext.choose as string, value: 'select_pool' },
        { label: helptext.advanced as string, value: 'advanced_settings' },
      ],
    };

    if (this.selectedPool) {
      if (setting.options.length == 2) {
        const unsetOption = {
          label: helptext.unset_pool,
          value: 'unset_pool',
        };
        setting.options.push(unsetOption);
      }
    } else if (setting.options.length == 3) {
      setting.options = setting.options.filter((ctl) => ctl.label !== helptext.unset_pool);
    }
    this.toolbarConfig.controls.push(setting);

    this.toolbarConfig.controls.push({
      name: ApplicationToolbarControl.Launch,
      label: helptext.launch,
      type: 'button',
      color: 'primary',
      value: 'launch',
      disabled: !this.selectedPool,
    });

    this.toolbarConfig.target.next({ name: 'UpdateControls', data: this.toolbarConfig.controls });
  }

  updateTab(evt: ApplicationUserEvent): void {
    if (evt.name == ApplicationUserEventName.SwitchTab) {
      this.selectedTab = evt.value as ApplicationTab;
    } else if (evt.name == ApplicationUserEventName.UpdateToolbar) {
      this.isSelectedOneMore = evt.value as boolean;
      this.isSelectedAll = evt.isSelectedAll;
      this.updateToolbar();
    } else if (evt.name == ApplicationUserEventName.CatalogToolbarChanged) {
      this.catalogOptions = evt.catalogNames.map((catalogName: string) => ({
        label: this.utils.capitalizeFirstLetter(catalogName),
        value: catalogName,
      }));
      this.selectedCatalogOptions = this.catalogOptions;

      this.updateToolbar();
    }
  }

  refreshTab(): void {
    this.updateToolbar();
    if (this.selectedTab === ApplicationTab.InstalledApps) {
      this.chartTab.refreshChartReleases();
    } else if (this.selectedTab === ApplicationTab.AvailableApps) {
      this.catalogTab.loadCatalogs();
    } else if (this.selectedTab === ApplicationTab.Catalogs) {
      this.manageCatalogTab.refresh();
    } else if (this.selectedTab == ApplicationTab.DockerImages) {
      this.dockerImagesTab.refresh();
    }
  }

  onTabSelected(event: MatTabChangeEvent): void {
    this.selectedTab = event.index;
    this.clearToolbarFilter();
    this.refreshTab();
  }

  private clearToolbarFilter(): void {
    this.settingsEvent$.next({
      name: 'ToolbarChanged',
      data: {
        event_control: 'filter',
        filter: '',
      },
    });

    const updatedControls = this.toolbarConfig.controls.map((control) => {
      if (control.name !== ApplicationToolbarControl.Filter) {
        return control;
      }

      return {
        ...control,
        value: '',
      };
    });

    this.toolbarConfig.target.next({ name: 'UpdateControls', data: updatedControls });
  }

  checkForConfiguredPool(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.selectPool();
        // this.updateTab.emit({ name: ApplicationUserEventName.SwitchTab, value: ApplicationTab.AvailableApps });
      } else {
        this.selectedPool = config.pool;
      }
      this.refreshTab();
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
        this.refreshTab();
        // this.refreshToolbarMenus();
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
      this.refreshTab();
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

  launchDocker(name: string, catalog = officialCatalog, train = chartsTrain): void {
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
}
