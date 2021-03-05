import { Component, OnInit, Output, EventEmitter } from '@angular/core';
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
import  helptext  from '../../../helptext/apps/apps';

interface SelectOption {
	label: string, 
	value: string, 
}

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss']
})
export class CatalogComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  public catalogApps = [];
  public filteredCatalogApps = [];
  public filterString = '';

  private dialogRef: any;
  private poolList: SelectOption[] = [];
  private selectedPool: string = '';
  public settingsEvent: Subject<CoreEvent>;
  private kubernetesForm: KubernetesSettingsComponent;
  private chartReleaseForm: ChartReleaseAddComponent;
  private refreshForm: Subscription;
  private refreshTable: Subscription;
  protected utils: CommonUtils;

  public choosePool: DialogFormConfiguration = {
    title: helptext.choosePool.title,
    fieldConfig: [{
      type: 'select',
      name: 'pools',
      placeholder: helptext.choosePool.placeholder,
      required: true,
      options: this.poolList
    }],
    method_ws: 'kubernetes.update',
    saveButtonText: helptext.choosePool.action,
    customSubmit: this.doPoolSelect,
    parent: this,
  }

  constructor(private dialogService: DialogService, private appLoaderService: AppLoaderService,
    private mdDialog: MatDialog, private translate: TranslateService, protected ws: WebSocketService,
    private router: Router, private core: CoreService, private modalService: ModalService,
    private appService: ApplicationsService, private sysGeneralService: SystemGeneralService) {
      this.utils = new CommonUtils();
    }

  ngOnInit(): void {
    this.appService.getAllCatalogItems().subscribe(res => {
      res.forEach(catalog => {
        for (let i in catalog.trains.charts) {  
          let item = catalog.trains.charts[i];
          let versions = item.versions;
          let latest, latestDetails;

          let sorted_version_labels = Object.keys(versions);
          sorted_version_labels.sort(this.utils.versionCompare);

          latest = sorted_version_labels[0];
          latestDetails = versions[latest];

          let catalogItem = {
            name: item.name,
            catalog: {
              id: catalog.id,
              label: catalog.label,
            },
            icon_url: item.icon_url? item.icon_url : '/assets/images/ix-original.png',
            latest_version: item.versions[latest].human_version,
            info: latestDetails.app_readme,
            schema: item.versions[latest].schema,
          }
          this.catalogApps.push(catalogItem);
        }
      });
      this.filerApps();
    })
    
    this.checkForConfiguredPool();
    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });

    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.updateTab.emit({name: 'SwitchTab', value: '1'});
    })
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
    }
  }


  refreshToolbarMenus() {
    this.updateTab.emit({name: 'UpdateToolbarPoolOption', value: !!this.selectedPool});
  }

  refreshForms() {
    this.kubernetesForm = new KubernetesSettingsComponent(this.ws, this.appLoaderService, this.dialogService,this.modalService, this.appService);
    this.chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
  }

  checkForConfiguredPool() {
    this.appService.getKubernetesConfig().subscribe(res => {
      if (!res.pool) {
        this.selectPool();
      } else {
        this.selectedPool = res.pool;
      }
      this.refreshToolbarMenus();
    })
  }

  selectPool() {
    this.appService.getPoolList().subscribe(res => {
      if (res.length === 0) {
        this.dialogService.confirm(helptext.noPool.title, helptext.noPool.message, true, 
          helptext.noPool.action).subscribe(res => {
            if (res) {
              this.router.navigate(['storage', 'manager']);
            }
          })
      } else {
        this.poolList.length = 0;
        res.forEach(pool => {
          this.poolList.push({label: pool.name, value: pool.name})
        })
        this.dialogService.dialogForm(this.choosePool, true);
      }
    })
  }

  doUnsetPool() {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.choosePool.jobTitle) }, disableClose: true});
    this.dialogRef.componentInstance.setCall('kubernetes.update', [{pool: null}]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogService.closeAllDialogs();
      this.selectedPool = null;
      this.refreshToolbarMenus();
      this.translate.get(helptext.choosePool.unsetPool).subscribe(msg => {
        this.dialogService.Info(helptext.choosePool.success, msg,
          '500px', 'info', true);
      })
    });

    this.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(self, err, this.dialogService);
    })
  }

  doPoolSelect(entityDialog: any) {
    const self = entityDialog.parent;
    const pool = entityDialog.formGroup.controls['pools'].value;
    self.dialogRef = self.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.choosePool.jobTitle) }, disableClose: true});
    self.dialogRef.componentInstance.setCall('kubernetes.update', [{pool: pool}]);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe((res) => {
      self.selectedPool = pool;
      self.refreshToolbarMenus();
      self.dialogService.closeAllDialogs();
      self.translate.get(helptext.choosePool.message).subscribe(msg => {
        self.dialogService.Info(helptext.choosePool.success, msg + res.result.pool,
          '500px', 'info', true);
      })
    });
    self.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(self, err, self.dialogService);
    })
  }

  doInstall(name: string) {
    const catalogApp = this.catalogApps.find(app => app.name==name);
    if (catalogApp && catalogApp.name != 'ix-chart') {
      const chartWizardComponent = new ChartWizardComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      chartWizardComponent.parseSchema(catalogApp);
      this.modalService.open('slide-in-form', chartWizardComponent);
    } else {
      const chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      chartReleaseForm.parseSchema(catalogApp);
      this.modalService.open('slide-in-form', chartReleaseForm);
    }
  }

  filerApps() {
    if (this.filterString) {
      this.filteredCatalogApps = this.catalogApps.filter(app => app.name.toLowerCase().indexOf(this.filterString.toLocaleLowerCase()) > -1);
    } else {
      this.filteredCatalogApps = this.catalogApps;
    }

    this.filteredCatalogApps = this.filteredCatalogApps.filter(app => app.name !== 'ix-chart');
  }
  
}
