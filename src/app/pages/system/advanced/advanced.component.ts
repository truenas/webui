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
import {AdminLayoutComponent} from '../../../components/common/layouts/admin-layout/admin-layout.component';
import { matchOtherValidator } from '../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../translate-marker';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector: 'app-system-advanced',
  templateUrl: 'advanced.component.html',
  styleUrls: ['advanced.component.css']
})

export class AdvancedComponent implements OnInit {
  //protected resource_name: string = 'system/advanced';
  public job: any = {};
  protected queryCall = 'system.advanced.config';
  protected adv_serialconsole: any;
  protected adv_serialconsole_subscription: any;
  public adv_serialport: any;
  public adv_serialspeed: any;
  public adv_periodic_notifyuser: any;
  public custActions: Array < any > = [{
    id: 'save_debug',
    name: 'Save Debug',
    function: () => {
      this.dialog.confirm(T("Generate Debug File"), T("This operation may take a long time, do you wish to proceed?")).subscribe((res) => {
            if (res) {
              this.load.open();
              this.ws.job('system.debug').subscribe((system_debug) => {
                this.load.close();
                if (system_debug.state === "SUCCESS") {
                  this.ws.call('core.download', ['filesystem.get', [system_debug.result], 'debug.tgz']).subscribe(
                    (system_debug_result) => {
                      this.openSnackBar(T("Redirecting to download. Make sure pop-ups are enabled in the browser."), T("Success"));
                      window.open(system_debug_result[1]);
                    },
                    (err) => {
                      this.openSnackBar(T("Please check the network connection"), T("Failed"));
                    }
                  );
                }
              }, () => {
                this.load.close();

              }, () => {
                this.load.close();
                if (this.job.state === 'SUCCESS') {} else if (this.job.state === 'FAILED') {
                  this.openSnackBar(T("Please check the network connection"), T("Failed"));
                }
              });
            } else {
              console.log("User canceled");
            }
          });        
    }
  }
];

  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'consolemenu',
    placeholder: T('Show Text Console without Password Prompt'),
    tooltip: T('Uncheck this to add a login prompt to the system before\
                the console menu is shown.')
  }, {
    type: 'checkbox',
    name: 'serialconsole',
    placeholder: T('Enable Serial Console'),
    tooltip: T('<b>Do not</b> set this if the <b>serial port</b>\
                is disabled.')
  }, {
    type: 'select',
    name: 'serialport',
    placeholder: T('Serial Port'),
    options: [
      { label: '---', value: null},
    ],
    tooltip: T('Select the serial port address in\
                hex.'),
    relation: [
    {
      action : 'DISABLE',
      when : [{
        name: 'serialconsole',
        value: false
      }]
    }
  ]
  }, {
    type: 'select',
    name: 'serialspeed',
    placeholder: T('Serial Speed'),
    options: [
        { label: '---', value: null},
        { label: '9600', value: "9600" },
        { label: '19200', value: "19200" },
        { label: '38400', value: "38400" },
        { label: '57600', value: "57600" },
        { label: '115200', value: "115200" },
    ],
    tooltip: T('Choose the speed in <i>bps</i> used by the serial port.'),
    relation: [
      {
        action : 'DISABLE',
        when : [{
          name: 'serialconsole',
          value: false
        }]
      }
    ],
  }, 
  {
    // Serves as a label to identify the swap drive input, below
    type: 'paragraph', name:'label', paraText:'Swap Size:'
  },
  {
    type: 'input',
    name: 'swapondrive',
    placeholder: T('Swap size on each drive in GiB, affects new disks\
 only. Setting this to 0 disables swap creation completely (STRONGLY\
 DISCOURAGED).'),
    tooltip: T('By default, all data disks are created with this amount\
                of swap. This setting does not affect log or cache\
                devices as they are created without swap.')
  }, {
    type: 'checkbox',
    name: 'powerdaemon',
    placeholder: T('Enable Power Saving Daemon'),
    tooltip: T('<a\
                href="https://www.freebsd.org/cgi/man.cgi?query=powerd&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                target="_blank">powerd(8)</a> monitors the system state and sets the\
                CPU frequency accordingly.')
  }, {
    type: 'checkbox',
    name: 'autotune',
    placeholder: T('Enable autotune'),
    tooltip: T('Enables the <b>autotune</b> script\
                which attempts to optimize the system depending on the\
                installed hardware. <b>Warning:</b> Autotuning is\
                only used as a temporary measure and is not a\
                permanent fix for system hardware issues. See the\
                <a href="..//docs/system.html#autotune"\
                target="_blank">Autotune section</a> of the guide for\
                more information.')
  }, {
    type: 'checkbox',
    name: 'debugkernel',
    placeholder: T('Enable Debug Kernel'),
    tooltip: T('When checked, the next system boot uses a debug version\
                of the kernel.')
  }, {
    type: 'checkbox',
    name: 'consolemsg',
    placeholder: T('Show console messages'),
    tooltip: T('Display console messages in real time\
                at the bottom of the browser.')
  }, {
    type: 'textarea',
    name: 'motd',
    placeholder: T('MOTD Banner'),
    tooltip: T('This message is shown when a user logs in with SSH.')
  }, {
    type: 'checkbox',
    name: 'traceback',
    placeholder: T('Show tracebacks in case of fatal error'),
    tooltip: T('Provides a pop-up window of diagnostic information if a\
                fatal error occurs.')
  }, {
    type: 'checkbox',
    name: 'advancedmode',
    placeholder: T('Show advanced fields by default'),
    tooltip: T('Enabling this shows additional features by default.')
  }, {
    type: 'checkbox',
    name: 'uploadcrash',
    placeholder: T('Enable automatic upload of kernel crash dumps and\
 daily telemetry'),
    tooltip: T('Report kernel crash dumps and daily performance\
                measurements to iXsystems.')
  }, {
    type: 'select',
    name: 'periodic_notifyuser',
    placeholder: T('Periodic Notification User'),
    options: [],
    tooltip: T('Choose a user to receive security output emails. This\
                output runs nightly, but only sends an email when the\
                system reboots or encounters an error.')
  }, {
    type: 'input',
    name: 'graphite',
    placeholder: T('Remote Graphite Server Hostname'),
    tooltip: T('Enter the IP address or hostname of a remote server\
                running Graphite.')
  }, {
    type: 'checkbox',
    name: 'fqdn_syslog',
    placeholder: T('Use FQDN for logging'),
    tooltip: T('Check to include the Fully-Qualified Domain Name (FQDN)\
                in logs to precisely identify systems with similar\
                hostnames.')
  }, {
    type: 'checkbox',
    name: 'cpu_in_percentage',
    placeholder: T('Report CPU usage in percentage'),
    tooltip: T('Check to display CPU usage as percentages in\
                <b>Reporting</b>.')
  },
  {
    type: 'select',
    name: 'sed_user',
    placeholder: T('ATA Security User'),
    tooltip: T('User passed to camcontrol security -u for unlocking SEDs'),
    options: [
      {label:'user', value:'USER'},
      {label:'master', value:'MASTER'}
              ],
    value : 'USER'

  },
  {
    type: 'input',
    name: 'sed_passwd',
    placeholder: T('SED Password'),
    tooltip: T('Global password to unlock SED disks.'),
    inputType: 'password',

  },
  {
    type: 'input',
    name: 'sed_passwd2',
    placeholder: T('Confirm SED Password'),
    tooltip: T(''),
    inputType: 'password',
    validation : [ matchOtherValidator('sed_passwd') ],

  },
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public adminLayout: AdminLayoutComponent,
    public snackBar: MatSnackBar) {}

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  ngOnInit() {}


  afterInit(entityEdit: any) {
     this.ws.call(this.queryCall).subscribe((adv_values)=>{
      entityEdit.formGroup.controls['sed_passwd2'].setValue(adv_values.sed_passwd);
    }) 
    this.adv_serialport =
    _.find(this.fieldConfig, { 'name': 'serialport' });
    this.adv_serialspeed =
    _.find(this.fieldConfig, { 'name': 'serialspeed' });
    this.adv_serialconsole =
    entityEdit.formGroup.controls['serialconsole'];
    this.adv_serialspeed.isHidden = !this.adv_serialconsole.value;
    this.adv_serialport.isHidden = !this.adv_serialconsole.value;
    this.adv_serialconsole_subscription = this.adv_serialconsole.valueChanges.subscribe((value) => {
      this.adv_serialspeed.isHidden = !value;
      this.adv_serialport.isHidden = !value;
    });
    entityEdit.ws.call('system.advanced.serial_port_choices').subscribe((serial_port_choices)=>{
      for(let i=0; i<serial_port_choices.length; i++){
        this.adv_serialport.options.push(
          {
            label: serial_port_choices[i], value: serial_port_choices[i]
          }
        )}
      
    });

    this.rest.get('account/users/', { limit: 0 }).subscribe((res) => {
      const adv_periodic_notifyuser =
        _.find(this.fieldConfig, { 'name': 'periodic_notifyuser' });
      res.data.forEach((item) => {
        adv_periodic_notifyuser.options.push({label: item['bsdusr_username'], value: item['bsdusr_username']});
      });
    });
  }

  public customSubmit(body) {
    delete body.sed_passwd2;
    this.load.open();


    return this.ws.call('system.advanced.update', [body]).subscribe((res) => {
      this.load.close();
      this.snackBar.open("All your settings are saved.", 'close', { duration: 5000 })
      this.adminLayout.onShowConsoleFooterBar(body['consolemsg']);
      
    }, (res) => {
      this.load.close();
      this.dialog.errorReport(T("Error saving"), res.reason, res.trace.formatted);
    });
  }


}
