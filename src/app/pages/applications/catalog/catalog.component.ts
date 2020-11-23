import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
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
    private router: Router) { }

  ngOnInit(): void {
    this.ws.call('kubernetes.config').subscribe(res => {
      if (!res.pool) {
        this.selectPool();
      }
    })
  }

  selectPool() {
    this.ws.call('pool.query').subscribe(res => {
      if (res.length === 0) {
        this.dialogService.confirm(helptext.noPool.title, helptext.noPool.message, true, 
          helptext.noPool.action).subscribe(res => {
            if (res) {
              this.router.navigate(['storage', 'manager']);
            }
          })
      } else {
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

    self.dialogRef = self.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.choosePool.jobTitle) }, disableClose: true});
    self.dialogRef.componentInstance.setCall('kubernetes.update', [{pool: pool}]);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe((res) => {
      self.dialogService.closeAllDialogs();
      this.translate.get(helptext.choosePool.message).subscribe(msg => {
        self.dialogService.Info(helptext.choosePool.success, res.result.pool + msg);
      })
    });
    self.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(self, err, self.dialogService);
      console.log(err)
    })
  }

  doInstall(release_name: string, version: string, train='test', catalog='OFFICIAL') {
    console.log(release_name, version)
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
      new EntityUtils().handleWSError(this, err, this.dialogService);
    })
  }
}
