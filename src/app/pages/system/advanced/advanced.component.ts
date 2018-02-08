import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar, MatDialog } from '@angular/material';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import { RestService, UserService, WebSocketService } from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector: 'app-system-advanced',
  templateUrl: 'advanced.component.html',
  styleUrls: ['advanced.component.css']
})

export class AdvancedComponent implements OnInit {
  protected resource_name: string = 'system/advanced';
  public job: any = {};

  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'adv_consolemenu',
    placeholder: 'Enable Console Menu',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_serialconsole',
    placeholder: 'Enable Serial Console',
    tooltip: ''
  }, {
    type: 'select',
    name: 'adv_serialport',
    placeholder: 'Serial Port',
    options: [
      { label: '---', value: null},
    ],
    tooltip: '',
    relation: [
      {
        action : 'DISABLE',
        when : [{
          name: 'adv_serialconsole',
          value: false
        }]
      }
    ]
  }, {
    type: 'select',
    name: 'adv_serialspeed',
    placeholder: 'Serial Speed',
    options: [
        { label: '---', value: null},
        { label: '9600', value: "9600" },
        { label: '19200', value: "19200" },
        { label: '38400', value: "38400" },
        { label: '57600', value: "57600" },
        { label: '115200', value: "115200" },
    ],
    tooltip: '',
    relation: [
      {
        action : 'DISABLE',
        when : [{
          name: 'adv_serialconsole',
          value: false
        }]
      }
    ],
  }, {
    type: 'input',
    name: 'adv_swapondrive',
    placeholder: 'Swap size on each drive in GiB, affects new disks only. Setting this to 0 disables swap creation completely (STRONGLY DISCOURAGED).',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_consolescreensaver',
    placeholder: 'Enable Console Screensaver',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_powerdaemon',
    placeholder: 'Enable Power Saving Daemon',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_autotune',
    placeholder: 'Enable autotune',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_debugkernel',
    placeholder: 'Enable Debug Kernel',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_consolemsg',
    placeholder: 'Show console messages',
    tooltip: ''
  }, {
    type: 'textarea',
    name: 'adv_motd',
    placeholder: 'MOTD Banner',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_traceback',
    placeholder: 'Show tracebacks in case',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_advancedmode',
    placeholder: 'Show advanced fields by default',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_uploadcrash',
    placeholder: 'Enable automatic upload of kernel crash dumps and daily telemetry',
    tooltip: ''
  }, {
    type: 'select',
    name: 'adv_periodic_notifyuser',
    placeholder: 'Periodic Notification User',
    options: [],
    tooltip: ''
  }, {
    type: 'input',
    name: 'adv_graphite',
    placeholder: 'Remote Graphite Server Hostname',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_fqdn_syslog',
    placeholder: 'Use FQDN for logging',
    tooltip: ''
  }, {
    type: 'checkbox',
    name: 'adv_cpu_in_percentage',
    placeholder: 'Report CPU usage in percentage',
    tooltip: ''
  }];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  ngOnInit() {}

  public adv_serialport: any;
  public adv_periodic_notifyuser: any;

  afterInit(entityEdit: any) {
    entityEdit.ws.call('device.get_info', ['SERIAL']).subscribe((res) => {
      let adv_serialport =
        _.find(this.fieldConfig, { 'name': 'adv_serialport' });
      res.forEach((item) => {
        adv_serialport.options.push({ label: item.name + ' (' + item.start + ')', value: item.start });
      });
    });

    this.rest.get('account/users/', { limit: 0 }).subscribe((res) => {
      let adv_periodic_notifyuser =
        _.find(this.fieldConfig, { 'name': 'adv_periodic_notifyuser' });
      res.data.forEach((item) => {
        adv_periodic_notifyuser.options.push({label: item['bsdusr_username'], value: item['bsdusr_username']});
      });
    });
  }
  public custActions: Array < any > = [{
      id: 'basic_mode',
      name: 'Save Debug',
      function: () => {
        this.dialog.confirm("Generating Debug File", "Run this in the background?").subscribe((res) => {
              if (res) {
                this.ws.job('system.debug').subscribe((res) => {
                  console.log(res);
                  if (res.state === "SUCCESS") {
                    this.ws.call('core.download', ['filesystem.get', [res.result], 'debug.tgz']).subscribe(
                      (res) => {
                        this.openSnackBar("Redirecting to download. Make sure pop-ups are enabled in the browser.", "Success");
                        window.open(res[1]);
                      },
                      (err) => {
                        this.openSnackBar("Please check the network connection", "Failed");
                      }
                    );
                  }
                }, () => {

                }, () => {
                  if (this.job.state == 'SUCCESS') {} else if (this.job.state == 'FAILED') {
                    this.openSnackBar("Please check the network connection", "Failed");
                  }
                });
              } else {
                console.log("User canceled");
              }
            });        
      }
    }
  ];
}
