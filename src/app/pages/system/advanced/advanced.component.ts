import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Validators, ValidationErrors, FormControl } from '@angular/forms';
import { helptext_system_advanced } from 'app/helptext/system/advanced';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { AdminLayoutComponent } from '../../../components/common/layouts/admin-layout/admin-layout.component';
import { StorageService, ValidationService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import { T } from '../../../translate-marker';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';
import * as _ from 'lodash';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-system-advanced',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: ['advanced.component.css'],
  providers: [DatePipe],
})
export class AdvancedComponent implements OnDestroy {
  // protected resource_name: string = 'system/advanced';
  job: any = {};
  protected queryCall = 'system.advanced.config';
  protected adv_serialconsole: any;
  protected adv_serialconsole_subscription: any;
  adv_serialport: any;
  adv_serialspeed: any;
  swapondrive: any;
  swapondrive_subscription: any;
  entityForm: any;
  protected dialogRef: any;
  product_type: string;
  is_ha = false;
  custActions: any[] = [{
    id: 'save_debug',
    name: T('Save Debug'),
    function: () => {
      this.ws.call('system.info', []).subscribe((res) => {
        let fileName = '';
        let mimetype = 'application/gzip';
        if (res) {
          const hostname = res.hostname.split('.')[0];
          const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
          if (this.is_ha) {
            mimetype = 'application/x-tar';
            fileName = `debug-${hostname}-${date}.tar`;
          } else {
            fileName = `debug-${hostname}-${date}.tgz`;
          }
        }
        this.dialog.confirm(helptext_system_advanced.dialog_generate_debug_title, helptext_system_advanced.dialog_generate_debug_message, true, helptext_system_advanced.dialog_button_ok).subscribe((ires) => {
          if (ires) {
            this.ws.call('core.download', ['system.debug', [], fileName, true]).subscribe(
              (res) => {
                const url = res[1];
                this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Saving Debug') }, disableClose: true });
                this.dialogRef.componentInstance.jobId = res[0];
                this.dialogRef.componentInstance.wsshow();
                this.dialogRef.componentInstance.success.pipe(take(1)).subscribe((save_debug) => {
                  this.dialogRef.close();
                  this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe((file) => {
                    this.storage.downloadBlob(file, fileName);
                  }, (err) => {
                    if (this.dialogRef) {
                      this.dialogRef.close();
                    }
                    if (err instanceof HttpErrorResponse) {
                      this.dialog.errorReport(helptext_system_advanced.debug_download_failed_title, helptext_system_advanced.debug_download_failed_message, err.message);
                    } else {
                      this.dialog.errorReport(helptext_system_advanced.debug_download_failed_title, helptext_system_advanced.debug_download_failed_message, err);
                    }
                  });
                });
                this.dialogRef.componentInstance.failure.pipe(take(1)).subscribe((save_debug_err) => {
                  this.dialogRef.close();
                  new EntityUtils().handleWSError(this, save_debug_err, this.dialog);
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this, err, this.dialog);
              },
            );
          }
        });
      });
    },
  },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets = new FieldSets([
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
          tooltip: helptext_system_advanced.consolemenu_tooltip,
        },
        {
          type: 'checkbox',
          name: 'serialconsole',
          placeholder: helptext_system_advanced.serialconsole_placeholder,
          tooltip: helptext_system_advanced.serialconsole_tooltip,
        },
        {
          type: 'select',
          name: 'serialport',
          placeholder: helptext_system_advanced.serialport_placeholder,
          options: [],
          tooltip: helptext_system_advanced.serialport_tooltip,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'serialconsole',
              value: false,
            }],
          }],
        },
        {
          type: 'select',
          name: 'serialspeed',
          placeholder: helptext_system_advanced.serialspeed_placeholder,
          options: [
            { label: '9600', value: '9600' },
            { label: '19200', value: '19200' },
            { label: '38400', value: '38400' },
            { label: '57600', value: '57600' },
            { label: '115200', value: '115200' },
          ],
          tooltip: helptext_system_advanced.serialspeed_tooltip,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'serialconsole',
              value: false,
            }],
          }],
        },
        {
          type: 'textarea',
          name: 'motd',
          placeholder: helptext_system_advanced.motd_placeholder,
          tooltip: helptext_system_advanced.motd_tooltip,
        },
      ],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_advanced.fieldset_storage,
      label: true,
      class: 'storage',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'swapondrive',
          placeholder: helptext_system_advanced.swapondrive_placeholder,
          tooltip: helptext_system_advanced.swapondrive_tooltip,
          validation: [
            ...helptext_system_advanced.swapondrive_validation,
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'swapondrive');
              const errors = control.value && isNaN(this.storage.convertHumanStringToNum(control.value, false, 'g'))
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = helptext_system_advanced.overprovision.error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
          required: true,
          blurStatus: true,
          blurEvent: this.blurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'overprovision',
          placeholder: helptext_system_advanced.overprovision.placeholder,
          tooltip: helptext_system_advanced.overprovision.tooltip,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'overprovision');
              const errors = control.value && isNaN(this.storage.convertHumanStringToNum(control.value, false, 'g'))
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = helptext_system_advanced.overprovision.error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
          blurStatus: true,
          blurEvent: this.opBlurEvent,
          parent: this,
        },
      ],
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
          tooltip: helptext_system_advanced.consolemsg_tooltip,
        },
        {
          type: 'checkbox',
          name: 'traceback',
          placeholder: helptext_system_advanced.traceback_placeholder,
          tooltip: helptext_system_advanced.traceback_tooltip,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'advancedmode',
          placeholder: helptext_system_advanced.advancedmode_placeholder,
          tooltip: helptext_system_advanced.advancedmode_tooltip,
        },
      ],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_advanced.fieldset_kernel,
      label: true,
      class: 'kernel',
      width: '49%',
      config: [

        {
          type: 'checkbox',
          name: 'autotune',
          placeholder: helptext_system_advanced.autotune_placeholder,
          tooltip: helptext_system_advanced.autotune_tooltip,
        },
        {
          type: 'checkbox',
          name: 'debugkernel',
          placeholder: helptext_system_advanced.debugkernel_placeholder,
          tooltip: helptext_system_advanced.debugkernel_tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext_system_advanced.fieldset_sed,
      label: true,
      class: 'sed',
      width: '49%',
      config: [
        {
          type: 'select',
          name: 'sed_user',
          placeholder: helptext_system_advanced.sed_user_placeholder,
          tooltip: helptext_system_advanced.sed_user_tooltip,
          options: [
            { label: 'user', value: 'USER' },
            { label: 'master', value: 'MASTER' },
          ],
          value: 'USER',
        },
        {
          type: 'input',
          name: 'sed_passwd',
          placeholder: helptext_system_advanced.sed_passwd_placeholder,
          tooltip: helptext_system_advanced.sed_passwd_tooltip,
          inputType: 'password',
          togglePw: true,
        },
        {
          type: 'input',
          name: 'sed_passwd2',
          placeholder: helptext_system_advanced.sed_passwd2_placeholder,
          tooltip: helptext_system_advanced.sed_passwd2_tooltip,
          inputType: 'password',
          togglePw: true,
          validation: this.validationService.matchOtherValidator('sed_passwd'),
        },
      ],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext_system_advanced.fieldset_syslog,
      label: true,
      class: 'syslog',
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'fqdn_syslog',
          placeholder: helptext_system_advanced.fqdn_placeholder,
          tooltip: helptext_system_advanced.fqdn_tooltip,
        },
        {
          type: 'select',
          name: 'sysloglevel',
          placeholder: helptext_system_advanced.sysloglevel.placeholder,
          tooltip: helptext_system_advanced.sysloglevel.tooltip,
          options: helptext_system_advanced.sysloglevel.options,
        },
        {
          type: 'input',
          name: 'syslogserver',
          placeholder: helptext_system_advanced.syslogserver.placeholder,
          tooltip: helptext_system_advanced.syslogserver.tooltip,
        },
        {
          type: 'select',
          name: 'syslog_transport',
          placeholder: helptext_system_advanced.syslog_transport.placeholder,
          tooltip: helptext_system_advanced.syslog_transport.tooltip,
          options: helptext_system_advanced.syslog_transport.options,
        },
        {
          type: 'select',
          name: 'syslog_tls_certificate',
          placeholder: helptext_system_advanced.syslog_tls_certificate.placeholder,
          tooltip: helptext_system_advanced.syslog_tls_certificate.tooltip,
          options: [],
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'syslog_transport',
                value: 'TLS',
              }],
            },
          ],
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext_system_advanced.fieldset_replication,
      label: true,
      class: 'replication',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'max_tasks',
          placeholder: helptext_system_advanced.max_parallel_replication_tasks_placeholder,
          tooltip: helptext_system_advanced.max_parallel_replication_tasks_tooltip,
          inputType: 'number',
          validation: [Validators.min(0)],
        },
      ],
    },
    { name: 'spacer', label: false, width: '51%' },
    { name: 'divider', divider: true },
  ]);

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    public adminLayout: AdminLayoutComponent,
    protected matDialog: MatDialog,
    public datePipe: DatePipe,
    public http: HttpClient,
    public storage: StorageService,
    public validationService: ValidationService,
  ) {}

  resourceTransformIncomingRestData(data) {
    !data.swapondrive || data.swapondrive === 0
      ? data.swapondrive = '0 GiB'
      : data.swapondrive = this.storage.convertBytestoHumanReadable(data.swapondrive * 1073741824, 0);

    !data.overprovision || data.overprovision === 0
      ? data.overprovision = null
      : data.overprovision = this.storage.convertBytestoHumanReadable(data.overprovision * 1073741824, 0);
    return data;
  }

  ngOnDestroy() {
    if (this.swapondrive_subscription) {
      this.swapondrive_subscription.unsubscribe();
    }
  }
  preInit() {
    const syslog_tls_certificate_field = this.fieldSets.config('syslog_tls_certificate');
    this.ws.call('certificate.query').subscribe((certs) => {
      for (const cert of certs) {
        syslog_tls_certificate_field.options.push({ label: cert.name, value: cert.id });
      }
    });
  }
  afterInit(entityEdit: any) {
    this.ws.call('failover.licensed').subscribe((is_ha) => {
      this.is_ha = is_ha;
    });
    this.entityForm = entityEdit;
    this.ws.call('system.product_type').subscribe((res) => {
      this.product_type = res;
      if (this.product_type === 'ENTERPRISE') {
        entityEdit.setDisabled('swapondrive', true, true);
      } else {
        this.swapondrive = this.fieldSets.config('swapondrive');
        this.swapondrive_subscription = entityEdit.formGroup.controls['swapondrive'].valueChanges.subscribe((value) => {
          if (!value || value === '') {
            this.storage.humanReadable = '';
          }
          const filteredValue = value ? this.storage.convertHumanStringToNum(value.toString(), false, 'g') : undefined;
          if (filteredValue === 0) {
            this.swapondrive.warnings = helptext_system_advanced.swapondrive_warning;
          } else if (filteredValue > 99 * 1073741824) {
            this.swapondrive.warnings = helptext_system_advanced.swapondrive_max_warning;
          } else {
            this.swapondrive.warnings = null;
          }
        });
      }

      entityEdit.formGroup.controls['overprovision'].valueChanges.subscribe((value) => {
        if (!value || value === '') {
          this.storage.humanReadable = '';
        }
        const formField = this.fieldSets.config('overprovision');
        const filteredValue = value ? this.storage.convertHumanStringToNum(value, false, 'g') : undefined;
      });

      this.ws.call(this.queryCall).subscribe((adv_values) => {
        entityEdit.formGroup.controls['sed_passwd2'].setValue(adv_values.sed_passwd);
      });
      this.ws.call('replication.config.config').subscribe((rplc_values) => {
        entityEdit.formGroup.controls['max_tasks'].setValue(rplc_values.max_parallel_replication_tasks);
      });

      this.adv_serialport = this.fieldSets.config('serialport');
      this.adv_serialspeed = this.fieldSets.config('serialspeed');
      this.adv_serialconsole = entityEdit.formGroup.controls['serialconsole'];
      this.adv_serialspeed['isHidden'] = !this.adv_serialconsole.value;
      this.adv_serialport['isHidden'] = !this.adv_serialconsole.value;
      this.adv_serialconsole_subscription = this.adv_serialconsole.valueChanges.subscribe((value) => {
        this.adv_serialspeed['isHidden'] = !value;
        this.adv_serialport['isHidden'] = !value;
      });
      entityEdit.ws.call('system.advanced.serial_port_choices').subscribe((serial_port_choices) => {
        for (const k in serial_port_choices) {
          this.adv_serialport.options.push(
            {
              label: k, value: serial_port_choices[k],
            },
          );
        }
      });
    });
    setTimeout(() => {
      this.storage.humanReadable = '';
    }, 500);
  }

  customSubmit(body) {
    body.swapondrive = this.storage.convertHumanStringToNum(body.swapondrive) / 1073741824;
    body.overprovision = this.storage.convertHumanStringToNum(body.overprovision) / 1073741824;
    body.legacy_ui ? window.localStorage.setItem('exposeLegacyUI', body.legacy_ui)
      : window.localStorage.setItem('exposeLegacyUI', 'false');
    const maxTasks = body.max_tasks > 0 ? body.max_tasks : null;
    delete body.max_tasks;
    delete body.sed_passwd2;
    this.load.open();
    return this.ws.call('system.advanced.update', [body]).subscribe((res) => {
      this.ws.call('replication.config.update', [{ max_parallel_replication_tasks: maxTasks }]).subscribe(() => {
        this.load.close();
        this.entityForm.success = true;
        this.entityForm.formGroup.markAsPristine();
        this.adminLayout.onShowConsoleFooterBar(body['consolemsg']);
      }, (res) => {
        this.load.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  blurEvent(parent) {
    if (parent.entityForm) {
      if (parent.storage.humanReadable) {
        parent.entityForm.formGroup.controls['swapondrive'].setValue(parent.storage.humanReadable || '2 GiB');
      }
      parent.storage.humanReadable = '';
    }
  }

  opBlurEvent(parent) {
    if (parent.entityForm) {
      if (parent.storage.humanReadable) {
        parent.entityForm.formGroup.controls['overprovision'].setValue(parent.storage.humanReadable);
      }
      parent.storage.humanReadable = '';
    }
  }
}
