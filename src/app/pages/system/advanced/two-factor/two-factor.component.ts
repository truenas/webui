import { Component, Inject } from '@angular/core';
import * as _ from 'lodash';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services/';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { helptext_system_advanced } from 'app/helptext/system/advanced';

@Component({
  selector: 'app-two-factor',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class TwoFactorComponent {
  protected queryCall = 'auth.twofactor.config';
  private TwoFactorEnabled: boolean;
  public qrInfo: string;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_advanced.two_factor.form.title,
      width: "100%",
      label: true,
      config: [
        {
          type: "paragraph",
          name: "instructions",
          paraText: helptext_system_advanced.two_factor.form.message,
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext_system_advanced.two_factor.form.title,
      width: "48%",
      label: false,
      config: [
        {
          type: "select",
          name: "otp_digits",
          placeholder: helptext_system_advanced.two_factor.form.otp.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.otp.tooltip,
          options: [
            { label: 6, value: 6 },
            { label: 7, value: 7 },
            { label: 8, value: 8 },
          ],
          required: true,
          validation: helptext_system_advanced.two_factor.form.otp.validation
        },
        {
          type: 'input',
          name: 'interval',
          inputType: 'number',
          placeholder: helptext_system_advanced.two_factor.form.interval.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.interval.tooltip,
          validation: helptext_system_advanced.two_factor.form.interval.validation
        }
      ]
    },
    {
      name: 'vertical-spacer',
      width: "2%",
      label: false,
      config: []
    },
    {
      name: helptext_system_advanced.two_factor.form.title,
      width: "48%",
      label: false,
      config: [
        {
          type: 'input',
          name: 'window',
          inputType: 'number',
          placeholder: helptext_system_advanced.two_factor.form.window.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.window.tooltip,
          validation: helptext_system_advanced.two_factor.form.window.validation
        },
        {
          type: 'checkbox',
          name: 'ssh',
          placeholder: helptext_system_advanced.two_factor.form.services.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.services.tooltip,
        }
      ]
    },

    { name: 'divider', divider: true },

    {
      name: helptext_system_advanced.two_factor.form.sys,
      width: "100%",
      label: true,
      config: [
        {
          type: 'input',
          name: 'secret',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext_system_advanced.two_factor.form.secret.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.secret.tooltip,
          value: 'Whatevs',
          readonly: true,
        },
        {
          type: 'input',
          name: 'uri',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext_system_advanced.two_factor.form.uri.placeholder,
          tooltip: helptext_system_advanced.two_factor.form.uri.tooltip,
          readonly: true,
        },
        {
          type: "paragraph",
          name: "enabled_status",
          paraText: ''
        }
      ]
    }
  ]

  public custActions: Array<any> = [
    {
      id : 'enable_action',
      name : helptext_system_advanced.two_factor.form.enable_button,
      function : () => {
        this.dialog.confirm(helptext_system_advanced.two_factor.form.confirm_dialog.title,
          helptext_system_advanced.two_factor.form.confirm_dialog.message, true,
          helptext_system_advanced.two_factor.form.confirm_dialog.btn).subscribe(res => {
            if (res) {
              this.loader.open();
              this.ws.call('auth.twofactor.update', [{enabled: true}] ).subscribe(res => {
                this.loader.close();
                this.TwoFactorEnabled = true;
                this.updateEnabledStatus();
              }, err => {
                this.loader.close();
                this.dialog.errorReport(helptext_system_advanced.two_factor.form.error,
                  err.reason, err.trace.formatted);
              })
            }
          })
      }
    },
    {
      id : 'disable_action',
      name : helptext_system_advanced.two_factor.form.disable_button,
      function : () => {
        this.loader.open();
        this.ws.call('auth.twofactor.update', [{enabled: false}] ).subscribe(res => {
          this.loader.close();
          this.TwoFactorEnabled = false;
          this.updateEnabledStatus();
        }, err => {
          this.dialog.errorReport(helptext_system_advanced.two_factor.form.error,
            err.reason, err.trace.formatted);
        })
      }
    },
    {
      id : 'show_qr',
      name : "Show QR",
      function : () => {
        this.openDialog();
      }
    }
  ];

  constructor(protected ws: WebSocketService, protected dialog: DialogService,
    protected loader: AppLoaderService,
    protected mdDialog: MatDialog) { }

  resourceTransformIncomingRestData(data) {
    data.ssh = data.services.ssh;
    this.TwoFactorEnabled = data.enabled;
    this.updateEnabledStatus();
    return data;
  }

  afterInit(entityEdit: any) {
    this.ws.call('auth.twofactor.provisioning_uri').subscribe(res => {
      entityEdit.formGroup.controls['uri'].setValue(res);
      this.qrInfo = (res);
    });
    let enabled = _.find(this.fieldConfig, { name: 'enabled_status' });
  }

  isCustActionVisible(actionId: string) {
    if (actionId === 'enable_action' && this.TwoFactorEnabled === true) {
      return false;
    } else if (actionId === 'disable_action' && this.TwoFactorEnabled === false) {
      return false;
    }
    return true;
  }

  updateEnabledStatus() {
    let enabled = _.find(this.fieldConfig, { name: 'enabled_status' });
    this.TwoFactorEnabled ? 
    enabled.paraText = helptext_system_advanced.two_factor.form.enabled_status_true :
    enabled.paraText = helptext_system_advanced.two_factor.form.enabled_status_false;
  }

  customSubmit(data) {
    data.enabled = this.TwoFactorEnabled;
    data.services = { ssh: data.ssh };
    const extras = ['instructions', 'enabled_status', 'secret', 'uri', 'ssh'];
    extras.map(extra => {
      delete data[extra];
    });
    this.loader.open();
    this.ws.call('auth.twofactor.update', [data]).subscribe(res => {
      this.loader.close();
    }, err => {
      this.loader.close();
      this.dialog.errorReport(helptext_system_advanced.two_factor.form.error,
        err.reason, err.trace.formatted);
    })
  }

  openDialog(): void {
    const dialogRef = this.mdDialog.open(QRDialog, {
      width: '300px',
      data: { qrInfo: this.qrInfo }
    });

    // dialogRef.afterClosed().subscribe(result => {
    //   console.log('The dialog was closed');
    // });
  }

}

@Component({
  selector: 'qr-dialog',
  templateUrl: 'qr-dialog.html',
})
export class QRDialog {

constructor(
  public dialogRef: MatDialogRef<QRDialog>,
  @Inject(MAT_DIALOG_DATA) public data) {}

onNoClick(): void {
  this.dialogRef.close();
}

}
