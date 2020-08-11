import { Component, Inject } from '@angular/core';
import * as _ from 'lodash';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService, DialogService, AppLoaderService } from 'app/services/';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { helptext } from 'app/helptext/system/2FA';

@Component({
  selector: 'app-two-factor',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class TwoFactorComponent {
  protected queryCall = 'auth.twofactor.config';
  private entityEdit: any;
  private TwoFactorEnabled: boolean;
  public qrInfo: string;
  private secret: string;
  public title = helptext.two_factor.formTitle;
  private digitsOnLoad: string;
  private intervalOnLoad: string;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.two_factor.title,
      width: "100%",
      label: true,
      config: [
        {
          type: "paragraph",
          name: "instructions",
          paraText: helptext.two_factor.message,
        }
      ]
    },
    { name: 'divider', divider: true },
    {
      name: helptext.two_factor.title,
      width: "48%",
      label: false,
      config: [
        {
          type: "select",
          name: "otp_digits",
          placeholder: helptext.two_factor.otp.placeholder,
          tooltip: helptext.two_factor.otp.tooltip,
          options: [
            { label: 6, value: 6 },
            { label: 7, value: 7 },
            { label: 8, value: 8 },
          ],
          required: true,
          validation: helptext.two_factor.otp.validation
        },
        {
          type: 'input',
          name: 'interval',
          inputType: 'number',
          placeholder: helptext.two_factor.interval.placeholder,
          tooltip: helptext.two_factor.interval.tooltip,
          validation: helptext.two_factor.interval.validation
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
      name: helptext.two_factor.title,
      width: "48%",
      label: false,
      config: [
        {
          type: 'input',
          name: 'window',
          inputType: 'number',
          placeholder: helptext.two_factor.window.placeholder,
          tooltip: helptext.two_factor.window.tooltip,
          validation: helptext.two_factor.window.validation
        },
        {
          type: 'checkbox',
          name: 'ssh',
          placeholder: helptext.two_factor.services.placeholder,
          tooltip: helptext.two_factor.services.tooltip,
        }
      ]
    },

    { name: 'divider', divider: true },

    {
      name: helptext.two_factor.sys,
      width: "100%",
      label: true,
      config: [
        {
          type: 'input',
          name: 'secret',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext.two_factor.secret.placeholder,
          tooltip: helptext.two_factor.secret.tooltip,
          readonly: true,
        },
        {
          type: 'input',
          name: 'uri',
          inputType: 'password',
          togglePw: true,
          placeholder: helptext.two_factor.uri.placeholder,
          tooltip: helptext.two_factor.uri.tooltip,
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
      name : helptext.two_factor.enable_button,
      function : () => {
        this.dialog.confirm(helptext.two_factor.confirm_dialog.title,
          helptext.two_factor.confirm_dialog.message, true,
          helptext.two_factor.confirm_dialog.btn).subscribe(res => {
            if (res) {
              this.loader.open();
              this.ws.call('auth.twofactor.update', [{enabled: true}] ).subscribe(() => {
                this.loader.close();
                this.TwoFactorEnabled = true;
                this.updateEnabledStatus();
                this.updateSecretAndUri();
              }, err => {
                this.loader.close();
                this.dialog.errorReport(helptext.two_factor.error,
                  err.reason, err.trace.formatted);
              })
            }
          })
      }
    },
    {
      id : 'disable_action',
      name : helptext.two_factor.disable_button,
      function : () => {
        this.loader.open();
        this.ws.call('auth.twofactor.update', [{enabled: false}] ).subscribe(() => {
          this.loader.close();
          this.TwoFactorEnabled = false;
          this.updateEnabledStatus();
        }, err => {
          this.dialog.errorReport(helptext.two_factor.error,
            err.reason, err.trace.formatted);
        })
      }
    },
    {
      id : 'show_qr',
      name : "Show QR",
      function : () => {
        this.openQRDialog();
      }
    },
    {
      id : 'renew_secret',
      name : "Renew Secret",
      function : () => {
        this.renewSecret();
      }
    }
  ];

  constructor(protected ws: WebSocketService, protected dialog: DialogService,
    protected loader: AppLoaderService,
    protected mdDialog: MatDialog) { }

  resourceTransformIncomingRestData(data) {
    data.ssh = data.services.ssh;
    this.secret = data.secret;
    this.TwoFactorEnabled = data.enabled;
    this.digitsOnLoad = data.otp_digits;
    this.intervalOnLoad = data.interval;
    this.updateEnabledStatus();
    return data;
  }

  isCustActionVisible(actionId: string) {
    if (actionId === 'enable_action' && this.TwoFactorEnabled === true) {
      return false;
    } else if (actionId === 'disable_action' && this.TwoFactorEnabled === false) {
      return false;
    }
    return true;
  }

  
  isCustActionDisabled(action_id: string) {
    // Disables the 'Enable 2F' & 'Show QR' buttons if there is no secret
    if (action_id === 'renew_secret') {
      return this.TwoFactorEnabled ? false : true;
    } else if (action_id === 'show_qr') {
      return this.secret && this.secret !== '' ? false : true;
    }
  } 

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.getURI();
    const intervalValue = _.find(this.fieldConfig, {name: 'interval'});
    entityEdit.formGroup.controls['interval'].valueChanges.subscribe(val => {
      if (parseInt(val) !== 30) {
        intervalValue.hint = helptext.two_factor.interval.hint;
      } else {
        intervalValue.hint = null;
      }
    })
  }

  getURI() {
    this.ws.call('auth.twofactor.provisioning_uri').subscribe(res => {
      this.entityEdit.formGroup.controls['uri'].setValue(res);
      this.qrInfo = (res);
    }, err => {
      this.loader.close();
      this.dialog.errorReport(helptext.two_factor.error,
        err.reason, err.trace.formatted);
    });
  }

  updateEnabledStatus() {
    const enabled = _.find(this.fieldConfig, { name: 'enabled_status' });
    this.TwoFactorEnabled ? 
      enabled.paraText = helptext.two_factor.enabled_status_true :
      enabled.paraText = helptext.two_factor.enabled_status_false;
  }

  customSubmit(data) {
    if (data.otp_digits === this.digitsOnLoad && data.interval === this.intervalOnLoad) {
      this.doSubmit(data);
    } else {
      this.dialog.confirm(helptext.two_factor.submitDialog.title,
        helptext.two_factor.submitDialog.message, true, helptext.two_factor.submitDialog.btn)
        .subscribe(res => {
          if (res) {
            this.intervalOnLoad = data.interval;
            this.digitsOnLoad = data.otp_digits;
            this.doSubmit(data, true);
          }
        })
    }
  }

  doSubmit(data, openQR = false) {
    data.enabled = this.TwoFactorEnabled;
    data.services = { ssh: data.ssh };
    const extras = ['instructions', 'enabled_status', 'secret', 'uri', 'ssh'];
    extras.map(extra => {
      delete data[extra];
    });
    this.loader.open();
    this.ws.call('auth.twofactor.update', [data]).subscribe(res => {
      this.loader.close();
      if (openQR) {
        this.openQRDialog();
      }
    }, err => {
      this.loader.close();
      this.dialog.errorReport(helptext.two_factor.error,
        err.reason, err.trace.formatted);
    })
  }

  openQRDialog(): void {
    const dialogRef = this.mdDialog.open(QRDialog, {
      width: '300px',
      data: { qrInfo: this.qrInfo }
    });
  }

  renewSecret() {
    this.dialog.confirm(helptext.two_factor.renewSecret.title,
       helptext.two_factor.renewSecret.message, true,
       helptext.two_factor.renewSecret.btn).subscribe(res => {
         if (res) {
           this.loader.open();
           this.ws.call('auth.twofactor.renew_secret').subscribe(() => {
             this.loader.close();
             this.updateSecretAndUri();
           },
           err => {
            this.loader.close();
            this.dialog.errorReport(helptext.two_factor.error,
              err.reason, err.trace.formatted);
           })
         }
       })
  }

  updateSecretAndUri() {
    this.ws.call('auth.twofactor.config').subscribe(res => {
      this.entityEdit.formGroup.controls['secret'].setValue(res.secret);
      this.secret = res.secret;
      this.getURI();
    }, err => {
      this.loader.close();
      this.dialog.errorReport(helptext.two_factor.error,
        err.reason, err.trace.formatted);
    })
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
