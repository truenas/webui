import {
  Component, OnInit, Output, EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
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

interface SelectOption {
  label: string;
  value: string;
}

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
  private dialogRef: any;
  private poolList: SelectOption[] = [];
  private selectedPool = '';
  settingsEvent: Subject<CoreEvent>;
  private kubernetesForm: KubernetesSettingsComponent;
  private chartReleaseForm: ChartReleaseAddComponent;
  private refreshForm: Subscription;
  private refreshTable: Subscription;
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

  constructor(private dialogService: DialogService, private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog, private translate: TranslateService, protected ws: WebSocketService,
    private router: Router, private core: CoreService, private modalService: ModalService,
    private appService: ApplicationsService, private sysGeneralService: SystemGeneralService) {
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

  loadCatalogs() {
    this.appService.getAllCatalogItems().subscribe((res: any[]) => {
      this.catalogNames = [];
      this.catalogApps = [];
      res.forEach((catalog) => {
        this.catalogNames.push(catalog.label);
        catalog.preferred_trains.forEach((train: any) => {
          for (const i in catalog.trains[train]) {
            const item = catalog.trains[train][i];
            const versions = item.versions;

            const versionKeys: any[] = [];
            Object.keys(versions).forEach((versionKey) => {
              if (versions[versionKey].healthy) {
                versionKeys.push(versionKey);
              }
            });

            const sorted_version_labels = versionKeys.sort(this.utils.versionCompare);

            const latest = sorted_version_labels[0];
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
      this.filerApps();
    });
  }

  onToolbarAction(evt: CoreEvent) {
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
    } else if (evt.data.event_control == 'launch' && evt.data.launch) {
      this.doInstall('ix-chart');
    } else if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.filerApps();
    } else if (evt.data.event_control == 'refresh_all') {
      this.syncAll();
    } else if (evt.data.event_control == 'catalogs') {
      this.filteredCatalogNames = [];
      evt.data.catalogs.forEach((catalog: any) => {
        if (catalog) {
          this.filteredCatalogNames.push(catalog.value);
        }
      });

      this.filerApps();
    }
  }

  refreshToolbarMenus() {
    this.updateTab.emit({ name: 'catalogToolbarChanged', value: !!this.selectedPool, catalogNames: this.catalogNames });
  }

  refreshForms() {
    this.kubernetesForm = new KubernetesSettingsComponent(this.ws, this.appLoaderService, this.dialogService, this.modalService, this.appService);
    this.chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
  }

  checkForConfiguredPool() {
    this.appService.getKubernetesConfig().subscribe((res) => {
      if (!res.pool) {
        this.selectPool();
      } else {
        this.selectedPool = res.pool;
      }
      this.refreshToolbarMenus();
    });
  }

  selectPool() {
    this.appService.getPoolList().subscribe((res) => {
      if (res.length === 0) {
        this.dialogService.confirm(helptext.noPool.title, helptext.noPool.message, true,
          helptext.noPool.action).subscribe((res: any) => {
          if (res) {
            this.router.navigate(['storage', 'manager']);
          }
        });
      } else {
        this.poolList.length = 0;
        res.forEach((pool: any) => {
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

  doUnsetPool() {
    this.dialogService.confirm(helptext.choosePool.unsetPool.confirm.title, helptext.choosePool.unsetPool.confirm.message, true,
      helptext.choosePool.unsetPool.confirm.button).subscribe((res: boolean) => {
      if (res) {
        this.dialogRef = this.mdDialog.open(EntityJobComponent, {
          data: {
            title: (
              helptext.choosePool.jobTitle),
          },
          disableClose: true,
        });
        this.dialogRef.componentInstance.setCall('kubernetes.update', [{ pool: null }]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe(() => {
          this.dialogService.closeAllDialogs();
          this.selectedPool = null;
          this.refreshToolbarMenus();
          this.translate.get(helptext.choosePool.unsetPool.label).subscribe((msg) => {
            this.dialogService.Info(helptext.choosePool.success, msg,
              '500px', 'info', true);
          });
        });

        this.dialogRef.componentInstance.failure.subscribe((err: any) => {
          new EntityUtils().handleWSError(self, err, this.dialogService);
        });
      }
    });
  }

  doPoolSelect(entityDialog: any) {
    const self = entityDialog.parent;
    const pool = entityDialog.formGroup.controls['pools'].value;
    self.dialogRef = self.mdDialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext.choosePool.jobTitle),
      },
      disableClose: true,
    });
    self.dialogRef.componentInstance.setCall('kubernetes.update', [{ pool }]);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe((res: any) => {
      self.selectedPool = pool;
      self.refreshToolbarMenus();
      self.dialogService.closeAllDialogs();
      self.translate.get(helptext.choosePool.message).subscribe((msg: string) => {
        self.dialogService.Info(helptext.choosePool.success, msg + res.result.pool,
          '500px', 'info', true);
      });
    });
    self.dialogRef.componentInstance.failure.subscribe((err: string) => {
      new EntityUtils().handleWSError(self, err, self.dialogService);
    });
  }

  doInstall(name: string, catalog = 'OFFICIAL', train = 'charts') {
    const catalogApp = this.catalogApps.find((app) => app.name == name && app.catalog.id == catalog && app.catalog.train == train);
    if (catalogApp && catalogApp.name != 'ix-chart') {
      const chartWizardComponent = new ChartWizardComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
      chartWizardComponent.setCatalogApp(catalogApp);
      this.modalService.open('slide-in-form', chartWizardComponent);
    } else {
      const chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog, this.dialogService, this.modalService, this.appService);
      chartReleaseForm.parseSchema(catalogApp);
      this.modalService.open('slide-in-form', chartReleaseForm);
    }
  }

  filerApps() {
    if (this.filterString) {
      this.filteredCatalogApps = this.catalogApps.filter((app) => app.name.toLowerCase().indexOf(this.filterString.toLocaleLowerCase()) > -1);
    } else {
      this.filteredCatalogApps = this.catalogApps;
    }

    if (this.filteredCatalogNames.length > 0) {
      this.filteredCatalogApps = this.filteredCatalogApps.filter((app) => this.filteredCatalogNames.includes(app.catalog.label));
    }

    this.filteredCatalogApps = this.filteredCatalogApps.filter((app) => app.name !== 'ix-chart');
  }

  showSummaryDialog(name: string, catalog = 'OFFICIAL', train = 'charts') {
    const catalogApp = this.catalogApps.find((app) => app.name == name && app.catalog.id == catalog && app.catalog.train == train);
    if (catalogApp) {
      const dialogRef = this.mdDialog.open(CatalogSummaryDialog, {
        width: '470px',
        data: catalogApp,
        disableClose: false,
      });
    }
  }

  syncAll() {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext.installing),
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall('catalog.sync_all');
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.loadCatalogs();
    });
  }
}
