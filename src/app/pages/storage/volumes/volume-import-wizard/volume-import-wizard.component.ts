import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, DialogService } from '../../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { RequestOptions, Http } from '@angular/http';
import { MatSnackBar } from '@angular/material';

import { EntityUtils } from '../../../common/entity/utils';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material';
import { validateBasis } from '@angular/flex-layout';
import { T } from '../../../../translate-marker';


@Component({
  selector: 'app-volumeimport-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers : [ ]
})
export class VolumeImportWizardComponent {

  public route_success: string[] = ['storage', 'pools'];
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = "Pool Import Summary";


  protected wizardConfig: Wizard[] = [{
      label: T('Decrypt ZFS pool'),
      fieldConfig: [
        {
          type: 'radio',
          name: 'encrypted',
          placeholder: T('Are you importing an encrypted ZFS pool?'),
          tooltip: T('Select yes to decrypt the disks prior to importing\
                      or no to skip to import.'),
          options: [
            {label: 'Yes: decrypt the disks', value: true},
            {label: 'No: skip to import', value: false},
          ],
          value: false
        },
        {
          type: 'select',
          multiple: true,
          name: 'devices',
          placeholder: T('Disks'),
          validation : [ Validators.required ],
          tooltip: T('Select the disks to be decrypt.'),
          required: true,
          isHidden: true,
          options: [],
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'encrypted',
              value: false,
            }]
          }]
        },
        {
          type: 'input',
          inputType: 'file',
          name: 'key',
          placeholder: T('Encryption Key'),
          required: true,
          validation : [ Validators.required ],
          tooltip: T('Upload the encryption key needed to decrypt the disks.'),
          fileType:"binary",
          isHidden: true,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'encrypted',
              value: false,
            }]
          }]
        },
        {
          type: 'input',
          name: 'passphrase',
          placeholder: T('Passphrase'),
          tooltip: T('Enter the passphrase for decryption'),
          inputType: 'password',
          isHidden: true,
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'encrypted',
              value: false,
            }]
          }]
        }
      ]
    },
    {
      label: T('Import pool'),
      fieldConfig: [
        {
            type: 'select',
            name: 'guid',
            placeholder: T('Pool'),
            tooltip: T('Select a pool to import.'),
            options: [],
            validation : [ Validators.required ],
            required: true,
        }
      ]
    },
  ];

  public custActions: Array<any> = [
    {
      id : 'decrypt_disks',
      name: T('Decrypt Disks'),
      function: () => {
        const formData: FormData = new FormData();
        let params = [this.devices_fg.value];
        if (this.passphrase_fg.value != null) {
          console.log("null");
          params.push(this.passphrase_fg.value);
        }
        console.log(params);
        formData.append('data', JSON.stringify({
          "method": "disk.decrypt",
          "params": params
        }));
        formData.append('file', this.key_fg.value);
        let dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Decrypting Disks"}});
        dialogRef.componentInstance.wspost('/_upload?auth_token=' + this.ws.token, formData)
        dialogRef.componentInstance.success.subscribe(res=>{
          this.getImportableDisks();
          this.snackBar.open("Disks have been decrypted", 'close', { duration: 5000 });
        }),
        dialogRef.componentInstance.failure.subscribe((res) => {
          console.log(res);
          //this.dialogService.errorReport(res.status, res.statusText, res._body);
        });
        /*this.loader.open();
        this.http.post('/_upload?auth_token=' + this.ws.token, formData).subscribe(
          (data) => {
            if (data.statusText == "OK") {
              let jobId = JSON.parse(data['_body']).job_id;
            }
          console.log(data);
          this.loader.close();
          this.getImportableDisks();
          this.snackBar.open("Disks have been decrypted", 'close', { duration: 5000 });
        }, (error) => {
          console.log(error);
          this.loader.close();
          this.dialogService.errorReport(error.status, error.statusText, error._body);
        });*/
      }
    }];

  protected encrypted;
  protected encrypted_subscription;
  protected devices;
  protected devices_fg;
  protected key;
  protected key_fg;
  protected passphrase;
  protected passphrase_fg;
  protected guid;
  protected guid_subscription;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    private router: Router, protected loader: AppLoaderService, 
    protected dialog: MatDialog, protected dialogService: DialogService,
    protected http: Http, public snackBar: MatSnackBar) {

  }

  isCustActionVisible(actionId: string) {
    if (actionId == 'decrypt_disks' && !this.encrypted.value) {
      return false
    }
    return true;
  }

  getImportableDisks() {
    this.guid.options = [];
    this.ws.call('pool.import_find').subscribe((res) => {
      for (let i = 0; i < res.length; i++) {
        this.guid.options.push({label:res[i].name + ' | ' + res[i].guid, value:res[i].guid});
      }
    });
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.encrypted = ( < FormGroup > entityWizard.formArray.get([0]).get('encrypted'));
    this.devices = _.find(this.wizardConfig[0].fieldConfig, {'name': 'devices'});
    this.devices_fg = ( < FormGroup > entityWizard.formArray.get([0]).get('devices'));
    this.key = _.find(this.wizardConfig[0].fieldConfig, {'name': 'key'});
    this.key_fg = ( < FormGroup > entityWizard.formArray.get([0]).get('key'));
    this.passphrase = _.find(this.wizardConfig[0].fieldConfig, {'name': 'passphrase'});
    this.passphrase_fg = ( < FormGroup > entityWizard.formArray.get([0]).get('passphrase'));
    this.encrypted_subscription = this.encrypted.valueChanges.subscribe((res) => {
      this.devices.isHidden = !res;
      this.key.isHidden = !res;
      this.passphrase.isHidden = !res;
    });

    this.ws.call('disk.get_encrypted', [{"unused": true}]).subscribe((res)=>{
      for (let i = 0; i < res.length; i++) {
        this.devices.options.push({label:res[i].name, value:res[i].dev});
      }
    });

    this.guid = _.find(this.wizardConfig[1].fieldConfig, {'name': 'guid'});
    this.getImportableDisks();
    this.guid_subscription = 
    ( < FormGroup > entityWizard.formArray.get([1]).get('guid'))
    .valueChanges.subscribe((res) => {
      let pool = _.find(this.guid.options, {'value': res});
      this.summary[T('Pool to import')] = pool.label;
    });
    
  }

  customSubmit(value) {
    console.log(value);
    this.loader.open();
    if (value.encrypted) {
    } else {
      this.ws.call('pool.import_pool', [{'guid':value.guid}]).subscribe((res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(
          this.route_success));
      }, (res) => {
        this.loader.close();
        this.errorReport(res);
      }, () => {
        this.loader.close();
      });
    }
  }

  errorReport(res) {
    this.dialogService.errorReport(T("Error importing pool"), res.reason, res.trace.formatted);
  }

  ngOnDestroy() {
    this.encrypted_subscription.unsubscribe();
    this.guid_subscription.unsubscribe();
  }

}
