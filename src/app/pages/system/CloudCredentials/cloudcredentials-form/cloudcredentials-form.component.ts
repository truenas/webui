import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService, CloudCredentialService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-cloudcredentials-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ CloudCredentialService ],
})
export class CloudCredentialsFormComponent {

  protected isEntity = true;
  protected addCall = 'backup.credential.create';
  protected queryCall = 'backup.credential.query';
  protected queryCallOption: Array<any> = [['id', '=']];
  protected route_success: string[] = ['system', 'cloudcredentials'];
  protected formGroup: FormGroup;
  protected id: any;
  protected pk: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: T('Name'),
      tooltip: T('Enter a name for the new credential.'),
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'select',
      name: 'provider',
      placeholder: T('Provider'),
      options: [],
      value: 'AMAZON',
      required: true,
      validation: [Validators.required],
    },
    // Amazon_cloud_drive
    {
      type: 'input',
      name: 'client_id',
      placeholder: T('Amazon Application Client ID'),
      required: true,
    },
    {
      type: 'input',
      name: 'client_secret',
      placeholder: T('Application Key'),
      required: true,
    },
    // Amazon_s3
    {
      type: 'input',
      name: 'access_key_id',
      placeholder: T('Access Key ID'),
      required: true,
    },
    {
      type: 'input',
      name: 'secret_access_key',
      placeholder: T('Secret Access Key'),
      required: true,
    },
    {
      type: 'input',
      name: 'endpoint',
      placeholder: T('Endpoint URL'),
    },
    // backblaze b2
    {
      type: 'input',
      name: 'account',
      placeholder: T('Account ID'),
      required: true,
    },
    {
      type: 'input',
      name: 'key',
      placeholder: T('Application Key'),
      required: true,
    },
    // box
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // dropbox
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // ftp
    {
      type: 'input',
      name: 'host',
      placeholder: T('Host'),
      required: true,
    },
    {
      type: 'input',
      name: 'port',
      placeholder: T('Port'),
    },
    {
      type: 'input',
      name: 'user',
      placeholder: T('Username'),
      required: true,
    },
    {
      type: 'input',
      name: 'pass',
      placeholder: T('Password'),
      required: true,
    },
    // google cloud storage
    {
      type: 'input',
      name: 'service_account_credentials',
      placeholder: T('Service Account'),
      required: true,
    },
    // google drive
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // http
    {
      type: 'input',
      name: 'url',
      placeholder: T('URL'),
      required: true,
    },
    // hubic
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // mega
    {
      type: 'input',
      name: 'user',
      placeholder: T('Username'),
      required: true,
    },
    {
      type: 'input',
      name: 'pass',
      placeholder: T('Password'),
      required: true,
    },
    // microsoft azure
    {
      type: 'input',
      name: 'account',
      placeholder: T('Account Name'),
      required: true,
    },
    {
      type: 'input',
      name: 'key',
      placeholder: T('Account Key'),
      required: true,
    },
    // microsoft onedrive
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // pcloud
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
    // sftp
    {
      type: 'input',
      name: 'host',
      placeholder: T('Host'),
      required: true,
    },
    {
      type: 'input',
      name: 'port',
      placeholder: T('Port'),
    },
    {
      type: 'input',
      name: 'user',
      placeholder: T('Username'),
      required: true,
    },
    {
      type: 'input',
      name: 'pass',
      placeholder: T('Password'),
      required: true,
    },
    {
      type: 'input',
      name: 'key_file',
      placeholder: T('PEM-encoded private key file path'),
      required: true,
    },
    // webdav
    {
      type: 'input',
      name: 'url',
      placeholder: T('URL'),
      required: true,
    },
    {
      type: 'input',
      name: 'vendor',
      placeholder: T('Name of the WebDAV site/service/software'),
      required: true,
    },
    {
      type: 'input',
      name: 'user',
      placeholder: T('Username'),
      required: true,
    },
    {
      type: 'input',
      name: 'pass',
      placeholder: T('Password'),
      required: true,
    },
    // yandex
    {
      type: 'input',
      name: 'token',
      placeholder: T('Access Token'),
      required: true,
    },
  ];

  protected selectedProvider: string = 'AMAZON';
  protected providers: Array<any>;
  protected providerField: any;

  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected ws: WebSocketService,
              protected cloudcredentialService: CloudCredentialService) {
    this.providerField = _.find(this.fieldConfig, {'name': 'provider'});
    this.cloudcredentialService.getProviders().subscribe(
      (res) => {
        this.providers = res;
        console.log(this.providers);
        for (let i in res) {
          this.providerField.options.push(
            {
              label: res[i].title,
              value: res[i].name,
            }
          );
        }
      }
    );
  }

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(params['pk']);
        this.id = params['pk'];
      }
    });
  }

  // afterInit(entityForm: any) {
  //   entityForm.submitFunction = this.submitFunction;

  //   for (let i in this.azureFields) {
  //     this.hideField(this.azureFields[i], true, entityForm);
  //   }
  //   for (let i in this.balckblazeFields) {
  //     this.hideField(this.balckblazeFields[i], true, entityForm);
  //   }
  //   for (let i in this.gcloudFields) {
  //     this.hideField(this.gcloudFields[i], true, entityForm);
  //   }
  //   for (let i in this.amazonFields) {
  //     this.hideField(this.amazonFields[i], false, entityForm);
  //   }

  //   entityForm.formGroup.controls['provider'].valueChanges.subscribe((res) => {
  //     this.selectedProvider = res;
  //     if (res == 'AMAZON') {
  //       for (let i in this.azureFields) {
  //         this.hideField(this.azureFields[i], true, entityForm);
  //       }
  //       for (let i in this.balckblazeFields) {
  //         this.hideField(this.balckblazeFields[i], true, entityForm);
  //       }
  //       for (let i in this.gcloudFields) {
  //         this.hideField(this.gcloudFields[i], true, entityForm);
  //       }
  //       for (let i in this.amazonFields) {
  //         this.hideField(this.amazonFields[i], false, entityForm);
  //       }
  //     } else if (res == 'AZURE') {
  //       for (let i in this.amazonFields) {
  //         this.hideField(this.amazonFields[i], true, entityForm);
  //       }
  //       for (let i in this.balckblazeFields) {
  //         this.hideField(this.balckblazeFields[i], true, entityForm);
  //       }
  //       for (let i in this.gcloudFields) {
  //         this.hideField(this.gcloudFields[i], true, entityForm);
  //       }
  //       for (let i in this.azureFields) {
  //         this.hideField(this.azureFields[i], false, entityForm);
  //       }
  //     } else if (res == 'BACKBLAZE') {
  //       for (let i in this.amazonFields) {
  //         this.hideField(this.amazonFields[i], true, entityForm);
  //       }
  //       for (let i in this.gcloudFields) {
  //         this.hideField(this.gcloudFields[i], true, entityForm);
  //       }
  //       for (let i in this.azureFields) {
  //         this.hideField(this.azureFields[i], true, entityForm);
  //       }
  //       for (let i in this.balckblazeFields) {
  //         this.hideField(this.balckblazeFields[i], false, entityForm);
  //       }
  //     } else if (res == 'GCLOUD') {
  //       for (let i in this.amazonFields) {
  //         this.hideField(this.amazonFields[i], true, entityForm);
  //       }
  //       for (let i in this.azureFields) {
  //         this.hideField(this.azureFields[i], true, entityForm);
  //       }
  //       for (let i in this.balckblazeFields) {
  //         this.hideField(this.balckblazeFields[i], true, entityForm);
  //       }
  //       for (let i in this.gcloudFields) {
  //         this.hideField(this.gcloudFields[i], false, entityForm);
  //       }
  //     }
  //   });

  //   entityForm.formGroup.controls['keyfile'].valueChanges.subscribe((value)=>{
  //     entityForm.formGroup.controls['preview'].setValue(value);
  //   });
  // }

  // hideField(fieldName: any, show: boolean, entity: any) {
  //   let target = _.find(this.fieldConfig, {'name' : fieldName});
  //   target.isHidden = show;
  //   entity.setDisabled(fieldName, show);
  // }

  submitFunction() {
    const attributes = {};
    const value = _.cloneDeep(this.formGroup.value);
    for (let item in value) {
      if (item != 'name' && item != 'provider') {
        if (item == 'keyfile') {
          attributes[item] =  JSON.parse(value[item]);
        } else if (item != 'preview') {
          attributes[item] = value[item];
        }
        delete value[item];
      }
    }
    value['attributes'] = attributes;
    if (!this.pk) {
      return this.ws.call('backup.credential.create', [value]);
    } else {
      return this.ws.call('backup.credential.update', [this.pk, value]);
    }
  }

  dataAttributeHandler(entityForm: any) {
    for (let i in entityForm.wsResponseIdx) {
      if (typeof entityForm.wsResponseIdx[i] === 'object') {
        entityForm.wsResponseIdx[i] = JSON.stringify(entityForm.wsResponseIdx[i]);
      }
      entityForm.formGroup.controls[i].setValue(entityForm.wsResponseIdx[i]);
    }
  }
}
