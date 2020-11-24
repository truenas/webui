import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { WebSocketService, DialogService } from '../../../services/index';
import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['../applications.component.scss']
})
export class CatalogComponent implements OnInit {
  @Input() catalogApps: any[];
  private dialogRef: any;
  private poolList = [];
  private selectedPool = '';
  public settingsEvent: Subject<CoreEvent>;

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

  constructor(private ws: WebSocketService, private dialogService: DialogService,
    private mdDialog: MatDialog, private translate: TranslateService,
    private router: Router, private core: CoreService) { }

  ngOnInit(): void {
    this.checkForConfiguredPool();

    this.settingsEvent = new Subject();
    this.settingsEvent.subscribe((evt: CoreEvent) => {
      console.log(evt)
      this.selectPool();
    })
 
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.settingsEvent,
        controls: [
          {
            name: 'settings',
            label: helptext.settings,
            type: 'button',
          }
        ]
      }
    };

    this.core.emit({name:"GlobalActions", data: settingsConfig, sender: this});
  }

  

  checkForConfiguredPool() {
    this.ws.call('kubernetes.config').subscribe(res => {
      console.log(res)
      if (!res.pool) {
        this.selectPool();
      } else {
        this.selectedPool = res.pool;
      }
    })
  }

  selectPool() {
    // this.poolList = [];
    this.ws.call('pool.query').subscribe(res => {
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

    console.log(self.selectedPool)
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
        console.log(err)
      })
    }
  }

  doInstall(release_name: string, version: string, train='test', catalog='OFFICIAL') {
    console.log(release_name, version)
    this.translate.get(helptext.install.msg1).subscribe(msg1 => {
      this.translate.get(helptext.install.msg2).subscribe(msg2 => {
        this.dialogService.confirm(helptext.install.title, msg1 + release_name + msg2 + 
          this.selectedPool).subscribe(res => {
          if (res) {
            let payload = {
              release_name: release_name,
              version: version,
              train: train,
              catalog: catalog,
              item: 'ix-chart'
            }
        
            this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
              helptext.installing) }, disableClose: true});
            this.dialogRef.componentInstance.setCall('chart.release.create', [payload]);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.subscribe((res) => {
              this.dialogService.closeAllDialogs();
              // We should go to chart tab(?) and refresh
              console.log(res);
            });
            this.dialogRef.componentInstance.failure.subscribe((err) => {
              // new EntityUtils().handleWSError(this, err, this.dialogService);
            })
          }
    
        })
      })
    })



  }
}
