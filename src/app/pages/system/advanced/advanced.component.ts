import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Http } from '@angular/http';
import { MatDialog } from '@angular/material';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { AdminLayoutComponent } from '../../../components/common/layouts/admin-layout/admin-layout.component';
import { StorageService, ValidationService, WebSocketService } from '../../../services/';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { T } from '../../../translate-marker';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';

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
    name: T('Save Debug'),
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
  }];

  public fieldSets = new FieldSets([
    {
      name: helptext_system_advanced.fieldset_console,
      label: true,
      class: 'console',
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'consolemenu',
          placeholder: helptext_system_advanced.consolemenu_placeholder,
          tooltip: helptext_system_advanced.consolemenu_tooltip
        },
        {
          type: 'checkbox',
          name: 'serialconsole',
          placeholder: helptext_system_advanced.serialconsole_placeholder,
          tooltip: helptext_system_advanced.serialconsole_tooltip
        },
        {
          type: 'select',
          name: 'serialport',
          placeholder: helptext_system_advanced.serialport_placeholder,
          options: [],
          tooltip: helptext_system_advanced.serialport_tooltip,
          relation: [{
            action : 'DISABLE',
            when : [{
              name: 'serialconsole',
              value: false
            }]
          }]
        },
        {
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
          relation: [{
            action : 'DISABLE',
            when : [{
              name: 'serialconsole',
              value: false
            }]
          }],
        },
        {
          type: 'textarea',
          name: 'motd',
          placeholder: helptext_system_advanced.motd_placeholder,
          tooltip: helptext_system_advanced.motd_tooltip
        }
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: true,
      class: 'kernel',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'swapondrive',
          placeholder: helptext_system_advanced.swapondrive_placeholder,
          tooltip: helptext_system_advanced.swapondrive_tooltip,
          inputType: 'number',
          validation : helptext_system_advanced.swapondrive_validation,
          required: true,
        },
        {
          type: 'checkbox',
          name: 'autotune',
          placeholder: helptext_system_advanced.autotune_placeholder,
          tooltip: helptext_system_advanced.autotune_tooltip
        },
        {
          type: 'checkbox',
          name: 'debugkernel',
          placeholder: helptext_system_advanced.debugkernel_placeholder,
          tooltip: helptext_system_advanced.debugkernel_tooltip
        },
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext_system_advanced.fieldset_ui,
      label: true,
      class: 'gui',
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'consolemsg',
          placeholder: helptext_system_advanced.consolemsg_placeholder,
          tooltip: helptext_system_advanced.consolemsg_tooltip
        },
        {
          type: 'checkbox',
          name: 'traceback',
          placeholder: helptext_system_advanced.traceback_placeholder,
          tooltip: helptext_system_advanced.traceback_tooltip,
          isHidden: true
        },
        {
          type: 'checkbox',
          name: 'advancedmode',
          placeholder: helptext_system_advanced.advancedmode_placeholder,
          tooltip: helptext_system_advanced.advancedmode_tooltip
        }
      ]
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_advanced.fieldset_sed,
      label: true,
      class: 'sed',
      width: '49%',
      config: [
        {
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
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext_system_advanced.fieldset_other,
      label: true,
      class: 'other',
      config: [{
        type: 'checkbox',
        name: 'fqdn_syslog',
        placeholder: helptext_system_advanced.fqdn_placeholder,
        tooltip: helptext_system_advanced.fqdn_tooltip
      }]
    },
    { name: 'divider', divider: true }
  ]);

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public adminLayout: AdminLayoutComponent,
    protected matDialog: MatDialog,
    public datePipe: DatePipe,
    public http: Http,
    public storage: StorageService,
    public validationService: ValidationService
  ) {}

  ngOnDestroy() {
    if (this.swapondrive_subscription) {
      this.swapondrive_subscription.unsubscribe();
    }

  }


  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.ws.call('system.is_freenas').subscribe((res)=>{
      this.is_freenas = res;
      this.swapondrive = this.fieldSets.config('swapondrive');
      this.swapondrive_subscription = entityEdit.formGroup.controls['swapondrive'].valueChanges.subscribe((value) => {
        if (parseInt(value) === 0) {
          this.swapondrive.warnings = helptext_system_advanced.swapondrive_warning;
        } else {
          this.swapondrive.warnings = null;
        }
      });
  
      this.ws.call(this.queryCall).subscribe((adv_values)=>{
        entityEdit.formGroup.controls['sed_passwd2'].setValue(adv_values.sed_passwd);
      })
      this.adv_serialport = this.fieldSets.config('serialport');
      this.adv_serialspeed = this.fieldSets.config('serialspeed');
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
