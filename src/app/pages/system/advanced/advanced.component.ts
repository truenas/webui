import { Component, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatDialog } from '@angular/material';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService, StorageService, ValidationService } from '../../../services/';
import {AdminLayoutComponent} from '../../../components/common/layouts/admin-layout/admin-layout.component';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { Http } from '@angular/http';

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
  public swapondrive: any;
  public swapondrive_subscription: any;
  public entityForm: any;
  protected dialogRef: any;
  public is_freenas = false;
  public custActions: Array < any > = [{
    id: 'save_debug',
    name: 'Save Debug',
    function: () => {
      this.ws.call('system.info', []).subscribe((res) => {
        let fileName = "";
        if (res) {
          const hostname = res.hostname.split('.')[0];
          const date = this.datePipe.transform(new Date(), "yyyyMMddHHmmss");
          fileName = `debug-${hostname}-${date}.tgz`;
        }
        this.dialog.confirm(helptext_system_advanced.dialog_generate_debug_title, helptext_system_advanced.dialog_generate_debug_message, true, helptext_system_advanced.dialog_button_ok).subscribe((ires) => {
          if (ires) {
            this.ws.call('core.download', ['system.debug', [], fileName]).subscribe(
              (res) => {
                const url = res[1];
                const mimetype = 'application/gzip';
                let failed = false;
                this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
                  this.storage.downloadBlob(file, fileName);
                }, err => {
                  failed = true;
                  if (this.dialogRef) {
                    this.dialogRef.close();
                  }
                  this.dialog.errorReport(helptext_system_advanced.debug_download_failed_title, helptext_system_advanced.debug_download_failed_message, err);
                });
                if (!failed) {
                  this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": T("Saving Debug") }, disableClose: true });
                  this.dialogRef.componentInstance.jobId = res[0];
                  this.dialogRef.componentInstance.wsshow();
                  this.dialogRef.componentInstance.success.subscribe((save_debug) => {
                    this.dialogRef.close();
                  });
                  this.dialogRef.componentInstance.failure.subscribe((save_debug_err) => {
                    this.dialogRef.close();
                    this.dialog.errorReport(helptext_system_advanced.debug_dialog.failure_title, 
                      helptext_system_advanced.debug_dialog.failure_msg);
                  });
                }
              },
              (err) => {
                new EntityUtils().handleWSError(this, err, this.dialog);
              });
          }
        })
      })
    } 
  }]


  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'consolemenu',
    placeholder: helptext_system_advanced.consolemenu_placeholder,
    tooltip: helptext_system_advanced.consolemenu_tooltip
  }, {
    type: 'checkbox',
    name: 'serialconsole',
    placeholder: helptext_system_advanced.serialconsole_placeholder,
    tooltip: helptext_system_advanced.serialconsole_tooltip
  }, {
    type: 'select',
    name: 'serialport',
    placeholder: helptext_system_advanced.serialport_placeholder,
    options: [],
    tooltip: helptext_system_advanced.serialport_tooltip,
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
    placeholder: helptext_system_advanced.serialspeed_placeholder,
    options: [
        { label: '9600', value: "9600" },
        { label: '19200', value: "19200" },
        { label: '38400', value: "38400" },
        { label: '57600', value: "57600" },
        { label: '115200', value: "115200" },
    ],
    tooltip: helptext_system_advanced.serialspeed_tooltip,
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
    placeholder: helptext_system_advanced.swapondrive_placeholder,
    tooltip: helptext_system_advanced.swapondrive_tooltip,
    inputType: 'number',
    validation : helptext_system_advanced.swapondrive_validation,
    required: true,
  },{
    type: 'checkbox',
    name: 'legacy_ui',
    placeholder: helptext_system_advanced.enable_legacy_placeholder,
    tooltip: helptext_system_advanced.enable_legacy_tooltip,
    isHidden: true,
    value: false
  }, {
    type: 'checkbox',
    name: 'autotune',
    placeholder: helptext_system_advanced.autotune_placeholder,
    tooltip: helptext_system_advanced.autotune_tooltip
  }, {
    type: 'checkbox',
    name: 'debugkernel',
    placeholder: helptext_system_advanced.debugkernel_placeholder,
    tooltip: helptext_system_advanced.debugkernel_tooltip
  }, {
    type: 'checkbox',
    name: 'consolemsg',
    placeholder: helptext_system_advanced.consolemsg_placeholder,
    tooltip: helptext_system_advanced.consolemsg_tooltip
  }, {
    type: 'textarea',
    name: 'motd',
    placeholder: helptext_system_advanced.motd_placeholder,
    tooltip: helptext_system_advanced.motd_tooltip
  }, {
    type: 'checkbox',
    name: 'traceback',
    placeholder: helptext_system_advanced.traceback_placeholder,
    tooltip: helptext_system_advanced.traceback_tooltip
  }, {
    type: 'checkbox',
    name: 'advancedmode',
    placeholder: helptext_system_advanced.advancedmode_placeholder,
    tooltip: helptext_system_advanced.advancedmode_tooltip
  }, {
    type: 'checkbox',
    name: 'fqdn_syslog',
    placeholder: helptext_system_advanced.fqdn_placeholder,
    tooltip: helptext_system_advanced.fqdn_tooltip
  }, {
    type: 'paragraph',
    name: 'sed_options_message',
    paraText: helptext_system_advanced.sed_options_message_paragraph,
    tooltip: helptext_system_advanced.sed_options_tooltip
  },
  {
    type: 'select',
    name: 'sed_user',
    placeholder: helptext_system_advanced.sed_user_placeholder,
    tooltip: helptext_system_advanced.sed_user_tooltip,
    options: [
      {label:'user', value:'USER'},
      {label:'master', value:'MASTER'}
              ],
    value : 'USER'
  },
  {
    type: 'input',
    name: 'sed_passwd',
    placeholder: helptext_system_advanced.sed_passwd_placeholder,
    tooltip: helptext_system_advanced.sed_passwd_tooltip,
    inputType: 'password',
    togglePw: true
  },
  {
    type: 'input',
    name: 'sed_passwd2',
    placeholder: helptext_system_advanced.sed_passwd2_placeholder,
    tooltip: helptext_system_advanced.sed_passwd2_tooltip,
    inputType: 'password',
    validation : this.validationService.matchOtherValidator('sed_passwd')
  },
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public adminLayout: AdminLayoutComponent,
    protected matDialog: MatDialog,
    public datePipe: DatePipe,
    public http: Http,
    public storage: StorageService,
    public validationService: ValidationService) {}

  ngOnDestroy() {
    this.swapondrive_subscription.unsubscribe();
  }


  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.ws.call('system.is_freenas').subscribe((res)=>{
      this.is_freenas = res;
      _.find(this.fieldConfig, { 'name': 'legacy_ui' })['isHidden'] = this.is_freenas;
      this.swapondrive = _.find(this.fieldConfig, { 'name': 'swapondrive' });
      this.swapondrive_subscription = entityEdit.formGroup.controls['swapondrive'].valueChanges.subscribe((value) => {
        if (parseInt(value) === 0) {
          this.swapondrive.warnings = helptext_system_advanced.swapondrive_warning;
        } else {
          this.swapondrive.warnings = null;
        }
      });
      setTimeout(() => {
        entityEdit.formGroup.controls['legacy_ui'].valueChanges.subscribe((value) => {
          if (value) {
            this.dialog.confirm('Warning', `${helptext_system_advanced.enable_legacy_dialog}`, true,
             'I accept the risks').subscribe((res) => {
               if (!res) {
                entityEdit.formGroup.controls['legacy_ui'].setValue(false);
               }
             })
          }
        });
      }, 50)

  
      this.ws.call(this.queryCall).subscribe((adv_values)=>{
        entityEdit.formGroup.controls['sed_passwd2'].setValue(adv_values.sed_passwd);
      })
      this.adv_serialport =
      _.find(this.fieldConfig, { 'name': 'serialport' });
      this.adv_serialspeed =
      _.find(this.fieldConfig, { 'name': 'serialspeed' });
      this.adv_serialconsole =
      entityEdit.formGroup.controls['serialconsole'];
      this.adv_serialspeed['isHidden'] = !this.adv_serialconsole.value;
      this.adv_serialport['isHidden'] = !this.adv_serialconsole.value;
      this.adv_serialconsole_subscription = this.adv_serialconsole.valueChanges.subscribe((value) => {
        this.adv_serialspeed['isHidden'] = !value;
        this.adv_serialport['isHidden'] = !value;
      });
      entityEdit.ws.call('system.advanced.serial_port_choices').subscribe((serial_port_choices)=>{
        for(const k in serial_port_choices){
          this.adv_serialport.options.push(
            {
              label: k, value: serial_port_choices[k]
            }
          )}
      });
    })
  }

  public customSubmit(body) {
    body.legacy_ui ? window.localStorage.setItem('exposeLegacyUI', body.legacy_ui) :
      window.localStorage.setItem('exposeLegacyUI', 'false');
    delete body.sed_passwd2;
    this.load.open();
    return this.ws.call('system.advanced.update', [body]).subscribe((res) => {
      this.load.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.adminLayout.onShowConsoleFooterBar(body['consolemsg']);
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
