import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import * as _ from 'lodash';

import { DialogService, SystemGeneralService, WebSocketService } from '../../../services/index';
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
import { Router } from '@angular/router';
import { ChartEventsDialog } from '../dialogs/chart-events/chart-events-dialog.component';

@Component({
  selector: 'app-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss']
})

export class ChartReleasesComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  public filteredChartItems = [];
  public filterString = '';

  public chartItems = {};
  @Output() switchTab = new EventEmitter<string>();

  private dialogRef: any;
  public ixIcon = 'assets/images/ix-original.png';
  private rollbackChartName: string;
  private refreshTable: Subscription;

  protected utils: CommonUtils;
  private refreshForm: Subscription;
  public settingsEvent: Subject<CoreEvent>;
  private chartReleaseChangedListener: any;
  
  private selectedAppName: String;
  private podList = [];
  private podDetails = {};
 
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

  public choosePod: DialogFormConfiguration = {
    title: helptext.podConsole.choosePod.title,
    fieldConfig: [{
      type: 'select',
      name: 'pods',
      placeholder: helptext.podConsole.choosePod.placeholder,
      required: true,
    },{
      type: 'select',
      name: 'containers',
      placeholder: helptext.podConsole.chooseConatiner.placeholder,
      required: true,
    },{
      type: 'input',
      name: 'command',
      placeholder: helptext.podConsole.chooseCommand.placeholder,
      value: '/bin/bash'
    }],
    saveButtonText: helptext.podConsole.choosePod.action,
    customSubmit: this.doPodSelect,
    afterInit: this.afterShellDialogInit,
    parent: this,
  }

  constructor(private mdDialog: MatDialog,
    private dialogService: DialogService, private translate: TranslateService,
    private appService: ApplicationsService, private modalService: ModalService,
    private sysGeneralService: SystemGeneralService, private router: Router,
    private core: CoreService, protected ws: WebSocketService
  ) { }

  ngOnInit(): void {
    this.utils = new CommonUtils();

    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.refreshChartReleases();
    });

    this.addChartReleaseChangedEventListner();
  }

  ngOnDestroy() {
    if (this.chartReleaseChangedListener) {
      this.ws.unsubscribe(this.chartReleaseChangedListener);
    }
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

  getChartItems() {
    return Object.values(this.chartItems);
  }
  
  addChartReleaseChangedEventListner() {
    this.chartReleaseChangedListener = this.ws.subscribe("chart.release.query").subscribe((evt) => {
      const app = this.chartItems[evt.id];
      
      if (app && evt && evt.fields) {
        app.status = evt.fields.status;
        app.count = `${evt.fields.pod_status.available}/${evt.fields.pod_status.desired}`;
      }
    });
  }

  refreshChartReleases() {
    this.showLoadStatus(EmptyType.loading);
    this.chartItems = {};
    this.filerChartItems();
    const checkTitle = setTimeout(() => {
        this.updateChartReleases();
    }, 1000);
  }

  updateChartReleases() {
    this.appService.getKubernetesConfig().subscribe(res => {
      if (!res.pool) {
        this.chartItems = {};
        this.showLoadStatus(EmptyType.first_use);
      } else {
        this.appService.getKubernetesServiceStarted().subscribe(res => {
          if (!res) {
            this.chartItems = {};
            this.showLoadStatus(EmptyType.errors);
          } else {
            this.appService.getChartReleases().subscribe(charts => {
              this.chartItems = {};
              
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
                  this.chartItems[chartObj.name] = chartObj;
                }  
              })
              
              if (this.getChartItems().length == 0) {
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
      let item = this.chartItems[name];
      if (item) {
        item.status = res[0].status;
        if (item.status === 'DEPLOYING') {
          setTimeout(() => {
            this.refreshStatus(name);
          }, 3000);
        }
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
  }

  edit(name: string, id: string) {
    const catalogApp = this.chartItems[name];
    if (catalogApp && catalogApp.chart_name != 'ix-chart') {
      const chartFormComponent = new ChartFormComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      chartFormComponent.setTitle(catalogApp.chart_name);
      this.modalService.open('slide-in-form', chartFormComponent, name);
    } else {
      const chartReleaseForm = new ChartReleaseEditComponent(this.mdDialog,this.dialogService,this.modalService,this.appService);
      this.modalService.open('slide-in-form', chartReleaseForm, name);
    }
  }

  onBulkAction(checkedItems: any[], actionName: string) {
    if (actionName === 'delete') {
      this.bulkDelete(checkedItems);      
    } else {
      checkedItems.forEach(name => {
        switch (actionName) {
          case 'start':
            this.start(name);
            break;
          case 'stop':
            this.stop(name);
            break;
        }
      });
  
      this.translate.get(helptext.bulkActions.finished).subscribe(msg => {
        this.dialogService.Info(helptext.choosePool.success, msg,
          '500px', 'info', true);
      })
    }    
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
        }
      })
    })
  }

  bulkDelete(names: string[]) {
    let name = names.join(",");
    this.translate.get(helptext.charts.delete_dialog.msg).subscribe(msg => {
      this.dialogService.confirm(helptext.charts.delete_dialog.title, msg + name + '?')
      .subscribe(res => {
        if (res) {
          this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
            helptext.charts.delete_dialog.job) }, disableClose: true});
          this.dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', names.map(item => [item])]);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((res) => {

            this.dialogService.closeAllDialogs();
            let message = "";
            for (let i = 0; i < res.result.length; i++) {
              if (res.result[i].error != null) {
                message = message + '<li>' + res.result[i].error + '</li>';
              }
            }

            if (message !== "") {
              message = '<ul>' + message + '</ul>';
              this.dialogService.errorReport(helptext.bulkActions.title, message);
            }
            this.modalService.close('slide-in-form');
            this.refreshChartReleases();

          });
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
        }
      })
    })
  }

  filerChartItems() {
    if (this.filterString) {
      this.filteredChartItems = this.getChartItems().filter((chart:any) => chart.name.toLowerCase().indexOf(this.filterString.toLocaleLowerCase()) > -1);
    } else {
      this.filteredChartItems = this.getChartItems();
    }

    this.updateTab.emit({name: 'UpdateToolbar', value: this.filteredChartItems.length > 0});
  }

  openShell(name: string) {
    this.podList = [];
    this.podDetails = {};
    this.selectedAppName = name;
    this.ws.call('chart.release.pod_console_choices', [this.selectedAppName]).subscribe(res => {
      this.podDetails = Object.assign({}, res);
      this.podList = Object.keys(this.podDetails);
      if (this.podList.length == 0) {
        this.dialogService.confirm(helptext.podConsole.nopod.title, helptext.podConsole.nopod.message, true, 'Close', false, null, null, null, null, true);
      } else {
        this.choosePod.fieldConfig[0].value = this.podList[0];
        this.choosePod.fieldConfig[0].options = this.podList.map(item => {
          return {
            label: item,
            value: item,
          }
        });
        this.choosePod.fieldConfig[1].value = this.podDetails[this.podList[0]][0];
        this.choosePod.fieldConfig[1].options = this.podDetails[this.podList[0]].map(item => {
          return {
            label: item,
            value: item,
          }
        });
        this.dialogService.dialogForm(this.choosePod, true);
      }
    })
  }

  doPodSelect(entityDialog: any) {
    const self = entityDialog.parent;
    const pod = entityDialog.formGroup.controls['pods'].value;
    const command = entityDialog.formGroup.controls['command'].value;
    self.router.navigate(new Array("/apps/shell/").concat([self.selectedAppName, pod, command]));
    self.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: any) {
    const self = entityDialog.parent;
    entityDialog.formGroup.controls['pods'].valueChanges.subscribe(value => {
      const containers = self.podDetails[value];
      const containerFC = _.find(entityDialog.fieldConfig, {'name' : 'containers'});
      containerFC.options = containers.map(item => {
        return {
          label: item,
          value: item,
        }
      });
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
    })
  }

  showChartEvents(name: string) {
    const catalogApp = this.chartItems[name];
    if (catalogApp) {
      let dialogRef = this.mdDialog.open(ChartEventsDialog, {
        width: '686px',
        maxWidth: '686px',
        data: catalogApp,
        disableClose: false,
      });
    }
  }
}
