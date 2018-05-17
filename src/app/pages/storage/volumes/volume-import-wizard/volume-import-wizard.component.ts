import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService, DialogService } from '../../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { MessageService } from '../../../common/entity/entity-form/services/message.service';
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
  public route_create: string[] = ['storage', 'pools', 'manager'];
  public summary = {};
  isLinear = true;
  firstFormGroup: FormGroup;
  protected dialogRef: any;
  objectKeys = Object.keys;
  summary_title = "Pool Import Summary";
  public subs: any;
  public saveSubmitText = T("Import");
  public entityWizard: any;

  protected wizardConfig: Wizard[] = [{
      label: T('Create or Import pool'),
      fieldConfig: [
        {
          type: 'radio',
          name: 'is_new',
          placeholder: T('Do you wish to create a new pool?'),
          tooltip: T('Select yes to create a new pool\
                      or no to import an existing pool.'),
          options: [
            {label: 'Yes: create a new pool', value: true},
            {label: 'No: import an existing pool', value: false},
          ],
          value: false
        },
      ]
    },
    {
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
          type: 'upload',
          name: 'key',
          placeholder: T('Encryption Key'),
          tooltip: T('Upload the encryption key needed to decrypt the disks.'),
          fileLocation: '',
          message: this.messageService,
          updater: this.updater,
          parent: this,
          hideButton:true,
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
      label: T('Select pool to import'),
      fieldConfig: [
        {
            type: 'select',
            name: 'guid',
            placeholder: T('Pool'),
            tooltip: T('Select the pool to import.'),
            options: [],
            validation : [ Validators.required ],
            required: true,
        }
      ]
    },
  ];

  updater(file: any, parent: any){
    const fileBrowser = file.fileInput.nativeElement;
    if (fileBrowser.files && fileBrowser.files[0]) {
      parent.subs = {"apiEndPoint":file.apiEndPoint, "file": fileBrowser.files[0]}
    }
  }

  private disks_decrypted = false;
  protected stepper;

  protected isNew = false;
  protected is_new_subscription;
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
  protected message_subscription;

  constructor(protected rest: RestService, protected ws: WebSocketService,
    private router: Router, protected loader: AppLoaderService, 
    protected dialog: MatDialog, protected dialogService: DialogService,
    protected http: Http, public snackBar: MatSnackBar, 
    public messageService: MessageService) {

  }

  customNext(stepper) {
    if (this.isNew) {
      this.router.navigate(new Array('/').concat(
        this.route_create));
    } else if (this.encrypted.value && stepper._selectedIndex === 1) {
      this.decryptDisks(stepper);
    } else {
      stepper.next();
    }
  }

  decryptDisks(stepper) {
    if (!this.subs) {
      this.dialogService.Info(T("Encryption Key Required"), T("You must select a key prior to decrypting your disks"));
    }
    const formData: FormData = new FormData();
    let params = [this.devices_fg.value];
    if (this.passphrase_fg.value != null) {
      params.push(this.passphrase_fg.value);
    }
    formData.append('data', JSON.stringify({
      "method": "disk.decrypt",
      "params": params
    }));
    formData.append('file', this.subs.file);

    let dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Decrypting Disks"}, disableClose: true});
    dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
    dialogRef.componentInstance.success.subscribe(res=>{
      dialogRef.close(false);
      this.getImportableDisks();
      stepper.next();
    }),
    dialogRef.componentInstance.failure.subscribe((res) => {
      dialogRef.close(false);
      this.dialogService.errorReport(T("Error decrypting disks"), res.error, res.exception);
    });
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
    this.entityWizard = entityWizard;
    this.is_new_subscription = 
    ( < FormGroup > entityWizard.formArray.get([0]).get('is_new'))
      .valueChanges.subscribe((isNew) => {
      this.isNew = isNew;
      if (isNew) {
        this.entityWizard.customNextText = T("Create Pool")
      } else {
        this.entityWizard.customNextText = T("Next");
      }
    });

    this.encrypted = ( < FormGroup > entityWizard.formArray.get([1]).get('encrypted'));
    this.devices = _.find(this.wizardConfig[1].fieldConfig, {'name': 'devices'});
    this.devices_fg = ( < FormGroup > entityWizard.formArray.get([1]).get('devices'));
    this.key = _.find(this.wizardConfig[1].fieldConfig, {'name': 'key'});
    this.key_fg = ( < FormGroup > entityWizard.formArray.get([1]).get('key'));
    this.passphrase = _.find(this.wizardConfig[1].fieldConfig, {'name': 'passphrase'});
    this.passphrase_fg = ( < FormGroup > entityWizard.formArray.get([1]).get('passphrase'));
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

    this.guid = _.find(this.wizardConfig[2].fieldConfig, {'name': 'guid'});
    this.getImportableDisks();
    this.guid_subscription = 
    ( < FormGroup > entityWizard.formArray.get([2]).get('guid'))
    .valueChanges.subscribe((res) => {
      let pool = _.find(this.guid.options, {'value': res});
      this.summary[T('Pool to import')] = pool.label;
    });

    this.message_subscription = this.messageService.messageSourceHasNewMessage$.subscribe((message)=>{
      this.key_fg.setValue(message);
    });
  }

  customSubmit(value) {
    if (value.encrypted) {
      const formData: FormData = new FormData();
      let params = {"guid": value.guid, 
                    "devices": value.devices, 
                    "passphrase": value.passphrase ? value.passphrase: null };
      formData.append('data', JSON.stringify({
        "method": "pool.import_pool",
        "params": [params]
      }));
      formData.append('file', this.subs.file);
      let dialogRef = this.dialog.open(EntityJobComponent, {data: {"title":"Importing Pool"}, disableClose: true});
      dialogRef.componentInstance.wspost(this.subs.apiEndPoint, formData);
      dialogRef.componentInstance.success.subscribe(res=>{
        dialogRef.close(false);
        this.router.navigate(new Array('/').concat(
          this.route_success));
      }),
      dialogRef.componentInstance.failure.subscribe((res) => {
        dialogRef.close(false);
        this.errorReport(res);
      });
    } else {
      this.loader.open();
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
    if (res.reason && res.trace) {
      this.dialogService.errorReport(T("Error importing pool"), res.reason, res.trace.formatted);
    } else if (res.error && res.exception) {
      this.dialogService.errorReport(T("Error importing pool"), res.error, res.exception)
    } else {
      console.log(res);
    }
  }

  ngOnDestroy() {
    this.encrypted_subscription.unsubscribe();
    this.guid_subscription.unsubscribe();
    this.message_subscription.unsubscribe();
    this.is_new_subscription.unsubscribe();
  }

}
