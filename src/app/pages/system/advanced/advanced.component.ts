import { Component, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService } from '../../../services/';
import { AdminLayoutComponent } from '../../../components/common/layouts/admin-layout/admin-layout.component';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_advanced as helptext } from 'app/helptext/system/advanced';

@Component({
  selector: 'app-system-advanced',
  templateUrl: 'advanced.component.html',
  styleUrls: ['advanced.component.css'],
  providers: [DatePipe]
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
      this.ws.call('system.info', []).subscribe((res) => {
        let fileName = "";
        if (res) {
          const hostname = res.hostname.split('.')[0];
          const date = this.datePipe.transform(new Date(),"yyyyMMddHHmmss");
          fileName = `debug-${hostname}-${date}.tgz`;
        }
        this.dialog.confirm(helptext.dialog_generate_debug_title, helptext.dialog_generate_debug_message, true, helptext.dialog_button_ok).subscribe((ires) => {
          if (ires) {
            this.load.open();
            this.ws.job('system.debug').subscribe((system_debug) => {
              this.load.close();
              if (system_debug.state === "SUCCESS") {
                this.ws.call('core.download', ['filesystem.get', [system_debug.result], fileName]).subscribe(
                  (system_debug_result) => {
                    if (window.navigator.userAgent.search("Firefox")>0) {
                      window.open(system_debug_result[1]);
                  }
                    else {
                      window.location.href = system_debug_result[1];
                    }
                  },
                  (err) => {
                    this.openSnackBar(helptext.snackbar_generate_debug_message_failure, helptext.snackbar_generate_debug_action);
                  }
                );
              }
            }, () => {
              this.load.close();
            }, () => {
              this.load.close();
              if (this.job.state === 'SUCCESS') {} else if (this.job.state === 'FAILED') {
                this.openSnackBar(helptext.snackbar_network_error_message, helptext.snackbar_network_error_action);
              }
            });
          } else {
            console.log("User canceled");
          }
        });
      });
    }
  }
];

  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'consolemenu',
    placeholder: helptext.consolemenu_placeholder,
    tooltip: helptext.consolemenu_tooltip
  }, {
    type: 'checkbox',
    name: 'serialconsole',
    placeholder: helptext.serialconsole_placeholder,
    tooltip: helptext.serialconsole_tooltip
  }, {
    type: 'select',
    name: 'serialport',
    placeholder: helptext.serialport_placeholder,
    options: [
      { label: '---', value: null},
    ],
    tooltip: helptext.serialport_tooltip,
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
    placeholder: helptext.serialspeed_placeholder,
    options: [
        { label: '---', value: null},
        { label: '9600', value: "9600" },
        { label: '19200', value: "19200" },
        { label: '38400', value: "38400" },
        { label: '57600', value: "57600" },
        { label: '115200', value: "115200" },
    ],
    tooltip: helptext.serialspeed_tooltip,
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
    placeholder: helptext.swapondrive_placeholder,
    tooltip: helptext.swapondrive_tooltip,
    inputType: 'number',
    validation : helptext.swapondrive_validation,
    required: true,
  }, {
    type: 'checkbox',
    name: 'autotune',
    placeholder: helptext.autotune_placeholder,
    tooltip: helptext.autotune_tooltip
  }, {
    type: 'checkbox',
    name: 'debugkernel',
    placeholder: helptext.debugkernel_placeholder,
    tooltip: helptext.debugkernel_tooltip
  }, {
    type: 'checkbox',
    name: 'consolemsg',
    placeholder: helptext.consolemsg_placeholder,
    tooltip: helptext.consolemsg_tooltip
  }, {
    type: 'textarea',
    name: 'motd',
    placeholder: helptext.motd_placeholder,
    tooltip: helptext.motd_tooltip
  }, {
    type: 'checkbox',
    name: 'traceback',
    placeholder: helptext.traceback_placeholder,
    tooltip: helptext.traceback_tooltip
  }, {
    type: 'checkbox',
    name: 'advancedmode',
    placeholder: helptext.advancedmode_placeholder,
    tooltip: helptext.advancedmode_tooltip
  }, {
    type: 'select',
    name: 'periodic_notifyuser',
    placeholder: helptext.periodic_notifyuser_placeholder,
    options: [],
    tooltip: helptext.periodic_notifyuser_tooltip
  }, {
    type: 'input',
    name: 'graphite',
    placeholder: helptext.graphite_placeholder,
    tooltip: helptext.graphite_tooltip
  }, {
    type: 'checkbox',
    name: 'fqdn_syslog',
    placeholder: helptext.fqdn_placeholder,
    tooltip: helptext.fqdn_tooltip
  }, {
    type: 'checkbox',
    name: 'cpu_in_percentage',
    placeholder: helptext.cpu_in_percentage_placeholder,
    tooltip: helptext.cpu_in_percentage_tooltip
  },
  {
    type: 'paragraph',
    name: 'sed_options_message',
    paraText: helptext.sed_options_message_paragraph,
// This tooltip wraps to the next line when uncommented.
// Erin said it's more than likely the CSS. Commented out for now and
// linking to the user guide from the test instead.
//  tooltip: T('See the <a href="%%docurl%%/system.html%%webversion%%#self-encrypting-drives"\
//                target="_blank"> Self Encrypting Drives</a> section of\
//                the user guide for more information.'),
//
  },
  {
    type: 'select',
    name: 'sed_user',
    placeholder: helptext.sed_user_placeholder,
    tooltip: helptext.sed_user_tooltip,
    options: [
      {label:'user', value:'USER'},
      {label:'master', value:'MASTER'}
              ],
    value : 'USER'
  },
  {
    type: 'input',
    name: 'sed_passwd',
    placeholder: helptext.sed_passwd_placeholder,
    tooltip: helptext.sed_passwd_tooltip,
    inputType: 'password',
    togglePw: true,
  },
  {
    type: 'input',
    name: 'sed_passwd2',
    placeholder: helptext.sed_passwd2_placeholder,
    tooltip: helptext.sed_passwd2_tooltip,
    inputType: 'password',
    validation : helptext.sed_passwd2_validation,

  },
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public adminLayout: AdminLayoutComponent,
    public snackBar: MatSnackBar,
    public datePipe: DatePipe) {}

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
        this.swapondrive.warnings = helptext.swapondrive_warning;
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
