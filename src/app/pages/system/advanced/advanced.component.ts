import { ApplicationRef, Component, Injector, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar, MatDialog } from '@angular/material';
import { Observable, Subject, Subscription } from 'rxjs/Rx';
import { EntityUtils } from '../../common/entity/utils';
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

export class AdvancedComponent implements OnDestroy {
  //protected resource_name: string = 'system/advanced';
  public job: any = {};
  protected queryCall = 'system.advanced.config';
  protected adv_serialconsole: any;
  protected adv_serialconsole_subscription: any;
  public adv_serialport: any;
  public adv_serialspeed: any;
  public adv_periodic_notifyuser: any;
  public swapondrive: any;
  public swapondrive_subscription: any;
  public entityForm: any;
  public custActions: Array < any > = [{
    id: 'save_debug',
    name: 'Save Debug',
    function: () => {
      this.dialog.confirm(T("Generate Debug File"), T("This operation might take a long time. Proceed?"), true, T('Proceed')).subscribe((res) => {
            if (res) {
              this.load.open();
              this.ws.job('system.debug').subscribe((system_debug) => {
                this.load.close();
                if (system_debug.state === "SUCCESS") {
                  this.ws.call('core.download', ['filesystem.get', [system_debug.result], 'debug.tgz']).subscribe(
                    (system_debug_result) => {
                      this.openSnackBar(T("Opening download window. Make sure pop-ups are enabled in the browser."), T("Success"));
                      window.open(system_debug_result[1]);
                    },
                    (err) => {
                      this.openSnackBar(T("Check the network connection."), T("Failed"));
                    }
                  );
                }
              }, () => {
                this.load.close();
              }, () => {
                this.load.close();
                if (this.job.state === 'SUCCESS') {} else if (this.job.state === 'FAILED') {
                  this.openSnackBar(T("Check the network connection."), T("Failed"));
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
    tooltip: T('Unset to add a login prompt to the system before\
                the console menu is shown.')
  }, {
    type: 'checkbox',
    name: 'serialconsole',
    placeholder: T('Enable Serial Console'),
    tooltip: T('Do not set this if the Serial Port is disabled.')
  }, {
    type: 'select',
    name: 'serialport',
    placeholder: T('Serial Port'),
    options: [
      { label: '---', value: null},
    ],
    tooltip: T('Select the serial port address in hex.'),
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
    tooltip: T('Choose the speed in bps used by the serial port.'),
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
    type: 'input',
    name: 'swapondrive',
    placeholder: T('Swap size in GiB'),
    tooltip: T('By default, all data disks are created with the amount\
                of swap specified. Changing the value does not affect\
                the amount of swap on existing disks, only disks added\
                after the change. Does not affect log or cache\
                devices as they are created without swap. Setting to\
                <i>0</i> disables swap creation completely. <b>STRONGLY\
                DISCOURAGED</b>'),
    inputType: 'number',
    validation : [ Validators.required, Validators.min(0), Validators.max(99) ],
    required: true,
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
    tooltip: T('Enables the autotune script which attempts to optimize\
                the system depending on the installed hardware.\
                <b>Warning:</b> Autotuning is only used as a temporary\
                measure and is not a permanent fix for system hardware\
                issues. See the\
                <a href="../docs/system.html#autotune"\
                target="_blank">Autotune section</a> of the guide for\
                more information.')
  }, {
    type: 'checkbox',
    name: 'debugkernel',
    placeholder: T('Enable Debug Kernel'),
    tooltip: T('Set to boot a debug kernel after the next system\
                reboot.')
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
    tooltip: T('The message to show when a user logs in with SSH.')
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
    tooltip: T('Set to always show advanced fields, when available.')
  }, {
    type: 'select',
    name: 'periodic_notifyuser',
    placeholder: T('Periodic Notification User'),
    options: [],
    tooltip: T('Select a user to receive security output emails. This\
                output runs nightly but only sends an email when the\
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
    tooltip: T('Set to include the Fully-Qualified Domain Name (FQDN)\
                in logs to precisely identify systems with similar\
                hostnames.')
  }, {
    type: 'checkbox',
    name: 'cpu_in_percentage',
    placeholder: T('Report CPU usage in percentage'),
    tooltip: T('Set to display CPU usage as percentages in Reporting.')
  },
  {
    type: 'paragraph',
    name: 'sed_options_message',
    paraText: T('<b>SED (<a href="../docs/system.html#self-encrypting-drives"\
                 target="_blank">Self-Encrypting Drives</a>) Options</b>'),
// This tooltip wraps to the next line when uncommented.
// Erin said it's more than likely the CSS. Commented out for now and
// linking to the user guide from the test instead.
//  tooltip: T('See the <a href="../docs/system.html#self-encrypting-drives"\
//                target="_blank"> Self Encrypting Drives</a> section of\
//                the user guide for more information.'),
//
  },
  {
    type: 'select',
    name: 'sed_user',
    placeholder: T('ATA Security User'),
    tooltip: T('User passed to <i>camcontrol security -u</i> to unlock\
                SEDs'),
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
    tooltip: T('Global password to unlock SEDs.'),
    inputType: 'password',
    togglePw: true,
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

  ngOnDestroy() {
    this.swapondrive_subscription.unsubscribe();
  }


  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.swapondrive = _.find(this.fieldConfig, { 'name': 'swapondrive' });
    this.swapondrive_subscription = entityEdit.formGroup.controls['swapondrive'].valueChanges.subscribe((value) => {
      if (parseInt(value) === 0) {
        this.swapondrive.warnings = T("A swap size of 0 is STRONGLY DISCOURAGED.");
      } else {
        this.swapondrive.warnings = null;
      }
    });

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
      this.snackBar.open("Settings saved.", 'close', { duration: 5000 })
      this.adminLayout.onShowConsoleFooterBar(body['consolemsg']);
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }


}
