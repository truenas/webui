import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { WebSocketService, DialogService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { ChartReleaseSettingsComponent } from '../forms/chart-release-settings.component';

import  helptext  from '../../../helptext/apps/apps';

@Component({
  selector: 'app-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss']
})
export class ChartReleasesComponent implements OnInit {
  public chartItems = [];
  private dialogRef: any;
  public tempIcon = '/assets/images/ix-original.png';
  private rollbackChartName: string;
  private chartReleaseForm: ChartReleaseSettingsComponent;
  private refreshTable: Subscription;
  private refreshForm: Subscription;

  public rollBackChart: DialogFormConfiguration = {
    title: helptext.charts.rollback_dialog.title,
    fieldConfig: [{
      type: 'input',
      name: 'item_version',
      placeholder: helptext.charts.rollback_dialog.version.placeholder,
      tooltip: helptext.charts.rollback_dialog.version.tooltip,
      required: true
    },{
      type: 'checkbox',
      name: 'rollback_snapshot',
      placeholder: helptext.charts.rollback_dialog.snapshot.placeholder,
      tooltip: helptext.charts.rollback_dialog.snapshot.tooltip
    },{
      type: 'checkbox',
      name: 'force',
      placeholder: helptext.charts.rollback_dialog.force.placeholder,
      tooltip: helptext.charts.rollback_dialog.force.tooltip
    }],
    method_ws: 'chart.release.rollback',
    saveButtonText: helptext.charts.rollback_dialog.action,
    customSubmit: this.doRollback,
    parent: this,
  }

  constructor(private ws: WebSocketService, private mdDialog: MatDialog,
    private dialogService: DialogService, private translate: TranslateService,
    private appService: ApplicationsService, private modalService: ModalService) { }

  ngOnInit(): void {
    this.refreshChartReleases();
    // this.ws.call('chart.release.query', [[['name', '=', 'plex2']]]).subscribe(res => {
    //   console.log(res)
    // }) 
    this.refreshForms();
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.refreshChartReleases();
    })
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
  }

  refreshForms() {
    this.chartReleaseForm = new ChartReleaseSettingsComponent(this.mdDialog,this.dialogService,this.modalService);
  }

  refreshChartReleases() {
    this.ws.call('chart.release.query').subscribe(charts => {
      console.log(charts)
      this.chartItems = [];
      charts.forEach(chart => {
        let chartObj = {
          name: chart.name,
          catalog: chart.catalog,
          train: chart.catalog_train,
          status: chart.status,
          first_deployed: chart.info.first_deployed, 
          version: chart.chart_metadata.version,
          description: chart.chart_metadata.description,
          update: chart.update_available,
          repository: chart.config.image.repository
        }
        let ports = [];
        chart.used_ports.forEach(item => {
          ports.push(`${item.port}\\${item.protocol}`)
        })
        chartObj['used_ports'] = ports.join(', ');
        this.chartItems.push(chartObj);
        
      })
      console.log(this.chartItems)
    })
  }

  refreshStatus(name: string) {
    this.ws.call('chart.release.query', [[['name', '=', name]]]).subscribe(res => {
      console.log(res);
      let item = this.chartItems.find(o => o.name === name);
      item.status = res[0].status;
      if (item.status === 'DEPLOYING') {
        setTimeout(() => {
          console.log('yo')
          this.refreshStatus(name);
        }, 3000);
      }
    })
  }

  start(name: string) {
    console.log(name);
    this.ws.call('chart.release.scale', [name, { replica_count: 1}]).subscribe(res => {
      this.refreshStatus(name);
    })
  }

  stop(name: string) {
    this.ws.call('chart.release.scale', [name, { replica_count: 0}]).subscribe(res => {
      this.refreshStatus(name);
    })
  }

  portal(name: string) {
    // this.ws.call('chart.release.query', [[], {"extra": {"retrieve_resources": true}}]).subscribe(res => {
    //   console.log(res)
    // })
    this.ws.call('chart.release.pod_console_choices', [name]).subscribe(res => {
      console.log(res)
    })
  }

  update(name: string) {
    this.translate.get(helptext.charts.update_dialog.msg).subscribe(msg => {
      this.dialogService.confirm(helptext.charts.update_dialog.title, msg + name + '?')
      .subscribe(res => {
        if (res) {
          this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
            helptext.charts.update_dialog.job) }, disableClose: true});
          this.dialogRef.componentInstance.setCall('chart.release.upgrade', [name]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((res) => {
            this.dialogService.closeAllDialogs();
          });
          this.dialogRef.componentInstance.failure.subscribe((err) => {
            // new EntityUtils().handleWSError(this, err, this.dialogService);
          })
        }
      })
    })
  }

  rollback(name: string) {
    this.rollbackChartName = name;
    this.dialogService.dialogForm(this.rollBackChart, true);
  }

  doRollback(entityDialog: any) {
    const self = entityDialog.parent;
    const form = entityDialog.formGroup.controls;
    const payload = {
      item_version: form['item_version'].value,
      rollback_snapshot: form['rollback_snapshot'].value,
      force: form['force'].value
    }
    self.dialogRef = self.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.charts.rollback_dialog.job) }, disableClose: true});
    self.dialogRef.componentInstance.setCall('chart.release.rollback', [self.rollbackChartName, payload]);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe((res) => {
      self.dialogService.closeAllDialogs();
    });
    self.dialogRef.componentInstance.failure.subscribe((err) => {
      // new EntityUtils().handleWSError(self, err, self.dialogService);
    })

  }

  edit(name: string) {
    console.log('edit ' + name)
    this.modalService.open('slide-in-form', this.chartReleaseForm, name);
  }

  delete(name: string) {
    this.translate.get(helptext.charts.delete_dialog.msg).subscribe(msg => {
      this.dialogService.confirm(helptext.charts.delete_dialog.title, msg + name + '?')
      .subscribe(res => {
        if (res) {
          this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
            helptext.charts.delete_dialog.job) }, disableClose: true});
          this.dialogRef.componentInstance.setCall('chart.release.delete', [name]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((res) => {
            this.dialogService.closeAllDialogs();
            this.refreshChartReleases();
          });
          this.dialogRef.componentInstance.failure.subscribe((err) => {
            // new EntityUtils().handleWSError(this, err, this.dialogService);
          })
        }
      })
    })
  }

  getConsoleChoices(x) {
    this.ws.call('chart.release.pod_console_choices', [x]).subscribe(res => {
      console.log(res)
    })
  }
 }
