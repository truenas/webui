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
import { DialogService } from '../../../services/index';
import { ModalService } from '../../../services/modal.service';
import { ApplicationsService } from '../applications.service';

import { KubernetesSettingsComponent } from '../forms/kubernetes-settings.component';
import { ChartReleaseAddComponent } from '../forms/chart-release-add.component';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss']
})
export class CatalogComponent implements OnInit {
  @Output() switchTab = new EventEmitter<string>();

  public catalogApps = [];
  private dialogRef: any;
  private poolList = [];
  private selectedPool = '';
  public settingsEvent: Subject<CoreEvent>;
  private kubernetesForm: KubernetesSettingsComponent;
  private chartReleaseForm: ChartReleaseAddComponent;
  private refreshForm: Subscription;
  private refreshTable: Subscription;

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

  constructor(private dialogService: DialogService,
    private mdDialog: MatDialog, private translate: TranslateService,
    private router: Router, private core: CoreService, private modalService: ModalService,
    private appService: ApplicationsService) { }

  ngOnInit(): void {
    this.appService.getAllCatalogItems().subscribe(res => {
      if (Object.keys(res[0].trains.charts).length > 0) {
        for (let i in res[0].trains.charts) {  // may eventually add the test train too
          let item = res[0].trains.charts[i];
          let versions = item.versions;
          let latest, latestDetails;
  
          for (let j in versions) {
            latest = (Object.keys(versions)[0]);
            latestDetails = versions[Object.keys(versions)[0]];
          }
  
          let catalogItem = {
            name: item.name,
            icon_url: item.icon_url? item.icon_url : '/assets/images/ix-original.png',
            latest_version: latest,
            info: latestDetails.app_readme
          }
          this.catalogApps.push(catalogItem);
        }
      }
    })
    
    this.checkForConfiguredPool();
    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });

    this.settingsEvent = new Subject();
    this.settingsEvent.subscribe((evt: CoreEvent) => {
      if (evt.data.settings) {
        switch (evt.data.settings.value) {
          case 'select_pool':
            return this.selectPool();
          
          case 'advanced_settings':
            this.modalService.open('slide-in-form', this.kubernetesForm);
            break;
        }
      } else if (evt.data.launch) {
        this.doInstall();
      }

    })

    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.settingsEvent,
        controls: [
          {
            name: 'settings',
            label: helptext.settings,
            type: 'menu',
            options: [
              { label: helptext.choose, value: 'select_pool' }, 
              { label: helptext.advanced, value: 'advanced_settings' }, 
            ]
          },
          {
            name: 'launch',
            label: helptext.launch,
            type: 'button',
            color: 'primary',
            value: 'launch'
          }
        ]
      }
    };

    this.core.emit({name:"GlobalActions", data: settingsConfig, sender: this});

    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.switchTab.emit('1');
    })
  }

  refreshForms() {
    this.kubernetesForm = new KubernetesSettingsComponent(this.modalService, this.appService);
    this.chartReleaseForm = new ChartReleaseAddComponent(this.mdDialog,this.dialogService,this.modalService);
  }

  checkForConfiguredPool() {
    this.appService.getKubernetesConfig().subscribe(res => {
      if (!res.pool) {
        this.selectPool();
      } else {
        this.selectedPool = res.pool;
      }
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

  doPoolSelect(entityDialog: any) {
    const self = entityDialog.parent;
    const pool = entityDialog.formGroup.controls['pools'].value;

    if (!self.selectedPool) {
      self.selectPool();
    } else { 
      self.dialogRef = self.mdDialog.open(EntityJobComponent, { data: { 'title': (
        helptext.choosePool.jobTitle) }, disableClose: true});
      self.dialogRef.componentInstance.setCall('kubernetes.update', [{pool: pool}]);
      self.dialogRef.componentInstance.submit();
      self.dialogRef.componentInstance.success.subscribe((res) => {
        self.selectedPool = pool;
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
  }

  // doInstall(release_name: string, version: string, train='test', catalog='OFFICIAL') {
  //   this.translate.get(helptext.install.msg1).subscribe(msg1 => {
  //     this.translate.get(helptext.install.msg2).subscribe(msg2 => {
  //       this.dialogService.confirm(helptext.install.title, msg1 + release_name + msg2 + 
  //         this.selectedPool).subscribe(res => {
  //         if (res) {
  //           let payload = {
  //             release_name: release_name,
  //             version: version,
  //             train: train,
  //             catalog: catalog,
  //             item: release_name
  //           }
        

  //         }
    
  //       })
  //     })
  //   })
  // }

  doInstall() {
    this.modalService.open('slide-in-form', this.chartReleaseForm);
  }
}
