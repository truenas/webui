import {
  Component, OnInit, Output, EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { Option } from 'app/interfaces/option.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { Subject, Subscription } from 'rxjs';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { DialogService, WebSocketService, SystemGeneralService } from '../../../services/index';
import { ModalService } from '../../../services/modal.service';
import { ApplicationsService } from '../applications.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { KubernetesSettingsComponent } from '../forms/kubernetes-settings.component';
import { ChartReleaseAddComponent } from '../forms/chart-release-add.component';
import { ChartFormComponent } from '../forms/chart-form.component';
import { ChartWizardComponent } from '../forms/chart-wizard.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import helptext from '../../../helptext/apps/apps';
import { CatalogSummaryDialog } from '../dialogs/catalog-summary/catalog-summary-dialog.component';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss'],
})
export class CatalogComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  catalogApps: any[] = [];
  catalogNames: string[] = [];
  filteredCatalogNames: string[] = [];
  filteredCatalogApps: any[] = [];
  filterString = '';
  private poolList: Option[] = [];
  private selectedPool = '';
  settingsEvent: Subject<CoreEvent>;
  private kubernetesForm: KubernetesSettingsComponent;
  private chartReleaseForm: ChartReleaseAddComponent;
  private refreshForm: Subscription;
  protected utils: CommonUtils;

  choosePool: DialogFormConfiguration = {
    title: helptext.choosePool.title,
    fieldConfig: [{
      type: 'select',
      name: 'pools',
      placeholder: helptext.choosePool.placeholder,
      required: true,
      options: this.poolList,
    }],
    method_ws: 'kubernetes.update',
    saveButtonText: helptext.choosePool.action,
    customSubmit: this.doPoolSelect,
    parent: this,
  };

  constructor(
    private dialogService: DialogService,
    private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog,
    private translate: TranslateService,
    private ws: WebSocketService,
    private router: Router,
    private core: CoreService,
    private modalService: ModalService,
    private appService: ApplicationsService,
  ) {
    this.utils = new CommonUtils();
  }

  ngOnInit(): void {
    this.loadCatalogs();
    this.checkForConfiguredPool();
    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
  }

  loadCatalogs(): void {
    this.appService.getAllCatalogItems().subscribe((catalogs) => {
      this.catalogNames = [];
      this.catalogApps = [];
      catalogs.forEach((catalog) => {
        this.catalogNames.push(catalog.label);
        catalog.preferred_trains.forEach((train) => {
          for (const i in catalog.trains[train]) {
            const item = catalog.trains[train][i];
            const versions = item.versions;
            const versionKeys = Object.keys(versions).filter((versionKey) => versions[versionKey].healthy);

            const latest = versionKeys.sort(this.utils.versionCompare)[0];
            const latestDetails = versions[latest];

            const catalogItem = {
              name: item.name,
              catalog: {
                id: catalog.id,
                label: catalog.label,
                train,
              },
              icon_url: item.icon_url ? item.icon_url : '/assets/images/ix-original.png',
              latest_version: latestDetails.human_version,
              info: latestDetails.app_readme,
              categories: item.categories,
              healthy: item.healthy,
              versions: item.versions,
              schema: latestDetails.schema,
            };
            this.catalogApps.push(catalogItem);
          }
        });
      });
      this.refreshToolbarMenus();
      this.filterApps();
    });
  }

  onToolbarAction(evt: CoreEvent): void {
    if (evt.data.event_control == 'settings' && evt.data.settings) {
      switch (evt.data.settings.value) {
        case 'select_pool':
          return this.selectPool();
        case 'advanced_settings':
          this.modalService.open('slide-in-form', this.kubernetesForm);
          break;
        case 'unset_pool':
          this.doUnsetPool();
          break;
      }
    } else if (evt.data.event_control == 'launch') {
      this.doInstall(ixChartApp);
    } else if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.filterApps();
    } else if (evt.data.event_control == 'refresh_all') {
      this.syncAll();
    } else if (evt.data.event_control == 'catalogs') {
      this.filteredCatalogNames = evt.data.catalogs.map((catalog: any) => catalog.value);

      this.filterApps();
    }
  }

  refreshToolbarMenus(): void {
    this.updateTab.emit({ name: 'catalogToolbarChanged', value: Boolean(this.selectedPool), catalogNames: this.catalogNames });
  }

  refreshForms(): void {
    this.kubernetesForm = new KubernetesSettingsComponent(this.ws, this.appLoaderService, this.dialogService, this.modalService, this.appService);
    this.chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
  }

  checkForConfiguredPool(): void {
    this.appService.getKubernetesConfig().subscribe((config) => {
      if (!config.pool) {
        this.selectPool();
      } else {
        this.selectedPool = config.pool;
      }
      this.refreshToolbarMenus();
    });
  }

  selectPool(): void {
    this.appService.getPoolList().subscribe((pools) => {
      if (pools.length === 0) {
        this.dialogService.confirm({
          title: helptext.noPool.title,
          message: helptext.noPool.message,
          hideCheckBox: true,
          buttonMsg: helptext.noPool.action,
        }).subscribe((confirmed) => {
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
        if (this.selectedPool) {
          this.choosePool.fieldConfig[0].value = this.selectedPool;
        } else {
          delete this.choosePool.fieldConfig[0].value;
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
    }).subscribe((confirmed) => {
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
      dialogRef.componentInstance.success.subscribe(() => {
        this.dialogService.closeAllDialogs();
        this.selectedPool = null;
        this.refreshToolbarMenus();
        this.translate.get(helptext.choosePool.unsetPool.label).subscribe((msg) => {
          this.dialogService.Info(helptext.choosePool.success, msg,
            '500px', 'info', true);
        });
      });

      dialogRef.componentInstance.failure.subscribe((err: any) => {
        new EntityUtils().handleWSError(self, err, this.dialogService);
      });
    });
  }

  doPoolSelect(entityDialog: EntityDialogComponent<this>): void {
    const self = entityDialog.parent;
    const pool = entityDialog.formGroup.controls['pools'].value;
    const dialogRef = self.mdDialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext.choosePool.jobTitle),
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('kubernetes.update', [{ pool }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe((res: any) => {
      self.selectedPool = pool;
      self.refreshToolbarMenus();
      self.dialogService.closeAllDialogs();
      self.translate.get(helptext.choosePool.message).subscribe((msg: string) => {
        self.dialogService.Info(helptext.choosePool.success, msg + res.result.pool,
          '500px', 'info', true);
      });
    });
    dialogRef.componentInstance.failure.subscribe((err: string) => {
      new EntityUtils().handleWSError(self, err, self.dialogService);
    });
  }

  doInstall(name: string, catalog = officialCatalog, train = chartsTrain): void {
    const catalogApp = this.catalogApps.find((app) => app.name == name && app.catalog.id == catalog && app.catalog.train == train);
    if (catalogApp && catalogApp.name != ixChartApp) {
      const chartWizardComponent = new ChartWizardComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
      chartWizardComponent.setCatalogApp(catalogApp);
      this.modalService.open('slide-in-form', chartWizardComponent);
    } else {
      const chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
      chartReleaseForm.parseSchema(catalogApp);
      this.modalService.open('slide-in-form', chartReleaseForm);
    }
  }

  filterApps(): void {
    if (this.filterString) {
      this.filteredCatalogApps = this.catalogApps.filter((app) => app.name.toLowerCase().indexOf(this.filterString.toLocaleLowerCase()) > -1);
    } else {
      this.filteredCatalogApps = this.catalogApps;
    }

    this.filteredCatalogApps = this.filteredCatalogApps.filter((app) =>
      this.filteredCatalogNames.includes(app.catalog.label) && app.name !== ixChartApp);
  }

  showSummaryDialog(name: string, catalog = officialCatalog, train = chartsTrain): void {
    const catalogApp = this.catalogApps.find((app) => app.name == name && app.catalog.id == catalog && app.catalog.train == train);
    if (!catalogApp) {
      return;
    }

    this.mdDialog.open(CatalogSummaryDialog, {
      width: '470px',
      data: catalogApp,
      disableClose: false,
    });
  }

  syncAll(): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.installing,
      },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.loadCatalogs();
    });
  }
}
