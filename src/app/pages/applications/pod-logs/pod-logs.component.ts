import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild,ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DialogService, ShellService, WebSocketService } from '../../../services';
import helptext from "./../../../helptext/shell/shell";
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { ApplicationsService } from '../applications.service';

@Component({
  selector: 'app-pod-logs',
  templateUrl: './pod-logs.component.html',
  styleUrls: ['./pod-logs.component.css'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class PodLogsComponent implements OnInit {
  // sets the shell prompt
  @Input() prompt = '';
  //xter container
  @ViewChild('terminal', { static: true}) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  font_name = 'Inconsolata';

  public formEvents: Subject<CoreEvent>;

  public usage_tooltip = helptext.usage_tooltip;

  protected chart_release_name: string;
  protected pod_name: string;
  protected conatiner_name: string;
  protected podDetails: any;
  protected apps: string[] = [];
  protected route_success: string[] = ['apps'];

  public choosePod: DialogFormConfiguration;

  constructor(protected core:CoreService,
    private ws: WebSocketService,
    private appService: ApplicationsService, 
    private dialogService: DialogService, 
    public translate: TranslateService,
    protected aroute: ActivatedRoute,
    protected router: Router,
    private dialog: MatDialog) {
  }

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.chart_release_name = params['rname'];
      this.pod_name = params['pname'];
      this.conatiner_name = params['cname'];

      this.appService.getChartReleaseNames().subscribe(charts => {        
        charts.forEach(chart => {
          this.apps.push(chart.name);
        });
      });

      this.ws.call('chart.release.pod_logs_choices', [this.chart_release_name]).subscribe(res => {
        this.podDetails = res;
  
        const podDetail = res[this.pod_name];
        if (!podDetail) {
          this.dialogService.confirm(helptext.podLogs.nopod.title, helptext.podLogs.nopod.message, true, 'Close', false, null, null, null, null, true);
        }
      });

      this.setupToolbarButtons();
      this.reconnect();
    });
  }

  reconnect() {
    this.ws.job('chart.release.pod_logs', [this.chart_release_name, {pod_name: this.pod_name, container_name: this.conatiner_name}]).subscribe(res => {
      console.log(res);
    }, (err) => {
      console.log(err);
    });
  }
  
  setupToolbarButtons() {
    this.formEvents = new Subject();
    this.formEvents.subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'restore') {
        this.resetDefault();
      } else if (evt.data.event_control == 'reconnect') {
        this.showChooseLogsDialog();
      } else if (evt.data.event_control == 'fontsize') {
        this.font_size = evt.data.fontsize;
      }
    });

    let controls = [];
    controls = [
      {
        name: 'fontsize',
        label: 'Set font size',
        type: 'slider',
        min: 10,
        max: 20, 
        step: 1,
        value: this.font_size,
      },
      {
        name: 'reconnect',
        label: 'Reconnect',
        type: 'button',
        color: 'secondary',
      },
      {
        name: 'restore',
        label: 'Restore default',
        type: 'button',
        color: 'primary',
      },
    ];
    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvents,
        controls: controls,
      }
    };

    this.core.emit({name:"GlobalActions", data: actionsConfig, sender: this});
  }

  resetDefault() {
    this.font_size = 14;
  }

  updateChooseLogsDialog() {

    let containerOptions = [];

    if (this.pod_name && this.podDetails[this.pod_name]) {
      containerOptions = this.podDetails[this.pod_name].map(item => {
        return {
          label: item,
          value: item,
        }
      });
    }

    this.choosePod = {
      title: helptext.podLogs.title,
      fieldConfig: [{
        type: 'select',
        name: 'apps',
        placeholder: helptext.podLogs.chooseApp.placeholder,
        required: true,
        value: this.chart_release_name,
        options: this.apps.map(item => {
          return {
            label: item,
            value: item,
          }
        })
      },{
        type: 'select',
        name: 'pods',
        placeholder: helptext.podLogs.choosePod.placeholder,
        required: true,
        value: this.pod_name,
        options: Object.keys(this.podDetails).map(item => {
          return {
            label: item,
            value: item,
          }
        })
      },{
        type: 'select',
        name: 'containers',
        placeholder: helptext.podLogs.chooseConatiner.placeholder,
        required: true,
        value: this.conatiner_name,
        options: containerOptions,
      }],
      saveButtonText: helptext.podLogs.action,
      customSubmit: this.onChooseLogs,
      afterInit: this.afterShellDialogInit,
      parent: this,
    }
  }

  showChooseLogsDialog() {
    this.updateChooseLogsDialog();
    this.dialogService.dialogForm(this.choosePod, true);
  }

  onChooseLogs(entityDialog: any) {
    const self = entityDialog.parent;
    self.chart_release_name = entityDialog.formGroup.controls['apps'].value;
    self.pod_name = entityDialog.formGroup.controls['pods'].value;
    self.conatiner_name = entityDialog.formGroup.controls['containers'].value;
    
    self.reconnect();
    self.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: any) {
    const self = entityDialog.parent;

    const podFC = _.find(entityDialog.fieldConfig, {'name' : 'pods'});
    const containerFC = _.find(entityDialog.fieldConfig, {'name' : 'containers'});

    entityDialog.formGroup.controls['apps'].valueChanges.subscribe(value => {
      podFC.options = [];
      containerFC.options = [];

      self.ws.call('chart.release.pod_logs_choices', [value]).subscribe(res => {
        self.podDetails = res;

        if (Object.keys(self.podDetails).length > 0) {
          self.pod_name = Object.keys(self.podDetails)[0];        
        } else {
          self.pod_name = null;
        }

        podFC.options = Object.keys(self.podDetails).map(item => {
          return {
            label: item,
            value: item,
          }
        });
        entityDialog.formGroup.controls['pods'].setValue(self.pod_name);
      })
    });
    
    entityDialog.formGroup.controls['pods'].valueChanges.subscribe(value => {
      if (value) {
        const containers = self.podDetails[value];
      
        containerFC.options = containers.map(item => {
          return {
            label: item,
            value: item,
          }
        });
        if (containers && containers.length > 0) {
          entityDialog.formGroup.controls['containers'].setValue(containers[0]);
        } else {
          entityDialog.formGroup.controls['containers'].setValue(null);
        }       
      }
      
    })
  }
}
