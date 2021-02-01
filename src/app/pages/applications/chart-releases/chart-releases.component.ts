import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import * as _ from 'lodash';

import { DialogService, SystemGeneralService } from '../../../services/index';
import { ApplicationsService } from '../applications.service';
import { ModalService } from '../../../services/modal.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { ChartReleaseEditComponent } from '../forms/chart-release-edit.component';
import { CommonUtils } from 'app/core/classes/common-utils';
import { ChartFormComponent } from '../forms/chart-form.component';
import { EmptyConfig, EmptyType } from '../../common/entity/entity-empty/entity-empty.component';
import  helptext  from '../../../helptext/apps/apps';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { BulkOptionsComponent } from '../forms/bulk-options.component';

@Component({
  selector: 'app-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss']
})
export class ChartReleasesComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  public chartItems = [];
  public filteredChartItems = [];
  public filterString = '';

  private dialogRef: any;
  public ixIcon = 'assets/images/ix-original.png';
  private rollbackChartName: string;
  private refreshTable: Subscription;

  protected utils: CommonUtils;
  private refreshForm: Subscription;
  public settingsEvent: Subject<CoreEvent>;
  public emptyPageConf: EmptyConfig = {
    type: EmptyType.loading,
    large: true,
    title: helptext.message.loading,
    button: {
      label: "View Catalog",
      action: this.viewCatalog.bind(this),
    }
  };

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

  constructor(private mdDialog: MatDialog,
    private dialogService: DialogService, private translate: TranslateService,
    private appService: ApplicationsService, private modalService: ModalService,
    private core: CoreService, private sysGeneralService: SystemGeneralService) { }

  ngOnInit(): void {
    this.utils = new CommonUtils();

    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.refreshChartReleases();
    });
  }

  onToolbarAction(evt: CoreEvent) {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.filerChartItems();
    } else if (evt.data.event_control == 'bulk') {
      this.bulkOptions();
    }
  }
  

  viewCatalog() {
    this.updateTab.emit({name: 'SwitchTab', value: '0'});
  }

  showLoadStatus(type: EmptyType) {
    let title = "";
    let message = undefined;

    switch (type) {
      case EmptyType.loading:
        title = helptext.message.loading;
        break;
      case EmptyType.first_use:
        title = helptext.message.not_configured;
        break;
      case EmptyType.no_page_data :
        title = helptext.message.no_installed;
        message = helptext.message.no_installed_message;
        break;
      case EmptyType.errors:
        title = helptext.message.not_running;
        break;
    }

    this.emptyPageConf.type = type;
    this.emptyPageConf.title = title;
    this.emptyPageConf.message = message;
  }

  refreshChartReleases() {
    this.showLoadStatus(EmptyType.loading);
    this.chartItems = [];
    this.filerChartItems();
    const checkTitle = setTimeout(() => {
        this.updateChartReleases();
    }, 1000);
  }

  updateChartReleases() {
    this.appService.getKubernetesConfig().subscribe(res => {
      if (!res.pool) {
        this.chartItems = [];
        this.showLoadStatus(EmptyType.first_use);
      } else {
        this.appService.getKubernetesServiceStarted().subscribe(res => {
          if (!res) {
            this.chartItems = [];
            this.showLoadStatus(EmptyType.errors);
          } else {
            this.appService.getChartReleases().subscribe(charts => {
              this.chartItems = [];
              
              charts.forEach(chart => {
                let chartObj = {
                  name: chart.name,
                  catalog: chart.catalog,
                  status: chart.status,
                  version: chart.chart_metadata.version,
                  latest_version: chart.chart_metadata.latest_chart_version,
                  description: chart.chart_metadata.description,
                  update: chart.update_available,
                  chart_name: chart.chart_metadata.name,
                  repository: chart.config.image.repository,
                  tag: chart.config.image.tag,
                  portal: chart.portals && chart.portals.web_portal ? chart.portals.web_portal[0] : '',
                  id: chart.chart_metadata.name,
                  icon: chart.chart_metadata.icon ? chart.chart_metadata.icon : this.ixIcon,
                  count: `${chart.pod_status.available}/${chart.pod_status.desired}`,
                  desired: chart.pod_status.desired,
                  history: !(_.isEmpty(chart.history)),
                };
        
                let ports = [];
                if (chart.used_ports) {
                  chart.used_ports.forEach(item => {
                    ports.push(`${item.port}\\${item.protocol}`)
                  })
                  chartObj['used_ports'] = ports.join(', ');
                  this.chartItems.push(chartObj);
                }  
              })
              
              if (this.chartItems.length == 0) {
                this.showLoadStatus(EmptyType.no_page_data );
              }

              this.filerChartItems();
            })
          }
        })
      }
    })
  }

  refreshStatus(name: string) {
    this.appService.getChartReleases(name).subscribe(res => {
      let item = this.chartItems.find(o => o.name === name);
      item.status = res[0].status;
      if (item.status === 'DEPLOYING') {
        setTimeout(() => {
          this.refreshStatus(name);
        }, 3000);
      }
    })
  }

  start(name: string) {
    this.appService.setReplicaCount(name, 1).subscribe(() => {
      this.refreshStatus(name);
    })
  }

  stop(name: string) {
    this.appService.setReplicaCount(name, 0).subscribe(() => {
      this.refreshStatus(name);
    })
  }

  portal(portal: string) {
    window.open(portal);
  }

  update(name: string) {
    this.translate.get(helptext.charts.upgrade_dialog.msg).subscribe(msg => {
      this.dialogService.confirm(helptext.charts.upgrade_dialog.title, msg + name + '?')
      .subscribe(res => {
        if (res) {
          this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
            helptext.charts.upgrade_dialog.job) }, disableClose: true});
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

  edit(name: string, id: string) {
    const catalogApp = this.chartItems.find(app => app.name==name && app.chart_name != 'ix-chart')
    if (catalogApp) {
      const chartFormComponent = new ChartFormComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      chartFormComponent.setTitle(catalogApp.chart_name);
      this.modalService.open('slide-in-form', chartFormComponent, name);
    } else {
      const chartReleaseForm = new ChartReleaseEditComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      this.modalService.open('slide-in-form', chartReleaseForm, name);
    }
  }

  onBulkAction(checkedItems: any[], actionName: string) {
    checkedItems.forEach(name => {
      switch (actionName) {
        case 'start':
          this.start(name);
          break;
        case 'stop':
          this.stop(name);
          break;
        case 'delete':
          this.delete(name);
          break;
      }
    });

    this.translate.get(helptext.bulkActions.finished).subscribe(msg => {
      this.dialogService.Info(helptext.choosePool.success, msg,
        '500px', 'info', true);
    })
  }

  bulkOptions() {
    const bulkOptionsForm = new BulkOptionsComponent(this.modalService, this.appService);
    bulkOptionsForm.setParent(this);

    this.modalService.open('slide-in-form', bulkOptionsForm, "Bulk Options");
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

  updateImage(image: string, tag: string) {
    this.translate.get(helptext.updateImageDialog.message).subscribe(msg => {
      this.dialogService.confirm(helptext.updateImageDialog.title, msg + image + '?', true).subscribe(res => {
        if (res) {
          this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
            helptext.charts.update_dialog.job) }, disableClose: true});
          this.dialogRef.componentInstance.setCall('container.image.pull', [{from_image: image,tag:tag}]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe(() => {
            this.dialogService.closeAllDialogs();
            this.dialogService.Info(helptext.updateImageDialog.success, helptext.updateImageDialog.successMsg,
               '300px', 'info', true);
            this.refreshChartReleases();
          });
          this.dialogRef.componentInstance.failure.subscribe((err) => {
            // new EntityUtils().handleWSError(this, err, this.dialogService);
          })
        }
      })
    })
  }

  filerChartItems() {
    if (this.filterString) {
      this.filteredChartItems = this.chartItems.filter(chart => chart.name.toLowerCase().indexOf(this.filterString.toLocaleLowerCase()) > -1);
    } else {
      this.filteredChartItems = this.chartItems;
    }

    this.updateTab.emit({name: 'UpdateToolbar', value: this.filteredChartItems.length > 0});
  }
}
