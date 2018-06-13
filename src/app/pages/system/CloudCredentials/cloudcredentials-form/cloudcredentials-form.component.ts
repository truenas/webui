import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-cloudcredentials-form',
  template: `<entity-form [conf]="this"></entity-form>`
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
      options: [{
        label: 'Amazon AWS',
        value: 'AMAZON',
      }, {
        label: 'Microsoft Azure',
        value: 'AZURE',
      }, {
        label: 'Backblaze B2',
        value: 'BACKBLAZE',
      }, {
        label: 'Google Cloud',
        value: 'GCLOUD',
      }],
      value: 'AMAZON',
      required: true,
      validation: [Validators.required],
    },
    {
      type: 'textarea',
      name: 'access_key',
      placeholder: T('Access Key'),
      tooltip: T('Paste the Amazon account access key. This is found\
                  on <a href="https://aws.amazon.com/"\
                  target="_blank">Amazon AWS</a> by navigating <b>My\
                  account -> Security Credentials -> Access Keys\
                  (Access Key ID and Secret Access Key)</b>.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type: 'textarea',
      name: 'secret_key',
      placeholder: T('Secret Key'),
      tooltip: T('Enter or paste the saved <b>Secret Key</b>. Create a\
                  new key pair on the same AWS screen where the\
                  <b>Access Key</b> is generated if the Secret Key\
                  cannot be found or remembered.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type: 'input',
      name: 'endpoint',
      placeholder: T('Endpoint URL'),
      tooltip: T('Enter the entry point URL for the web service.'),
      isHidden: false,
    },
    {
      type : 'input',
      name : 'account_name',
      placeholder : T('Account Name'),
      tooltip : T('Enter the <a\
                   href="https://docs.microsoft.com/en-us/azure/storage/"\
                   target="_blank">Azure Storage</a> account name.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'account_key',
      placeholder :  T('Account Key'),
      tooltip : T('Enter or paste the <a\
                   href="https://docs.microsoft.com/en-us/azure/storage/"\
                   target="_blank">Azure Storage</a> account key.'),
       required: true,
       validation : [ Validators.required ],
       isHidden: true,
    },
    {
      type : 'textarea',
      name : 'account_id',
      placeholder :  T('Account ID'),
      tooltip : T('Enter or paste the Accound ID. See the <a\
                   href="https://www.backblaze.com/help.html"\
                   target="_blank">BACKBLAZE help page</a> for more\
                   information.'),
       required: true,
       validation : [ Validators.required ],
       isHidden: true,
    },
    {
      type : 'textarea',
      name : 'app_key',
      placeholder : T('Application Key'),
      tooltip : T('Enter the application key for your <b>Account\
                   ID</b>.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'preview',
      placeholder : T('Preview JSON Service Account Key'),
      tooltip: T('Read-only display of the selected Key file.'),
      disabled: true,
      isHidden: true,
      readonly: true,
    },
    {
      type : 'readfile',
      name : 'keyfile',
      placeholder : T('JSON Service Account Key'),
      tooltip : T('Click <i>Browse</i> to select a saved <a\
                   href="https://cloud.google.com/storage/docs/"\
                   target="_blank">Google Cloud Storage</a> key.'),
      validation : [ Validators.required ],
      isHidden: true,
    },
  ];
  protected amazonFields: Array<any> = [
    'access_key',
    'secret_key',
    'endpoint',
  ];
  protected azureFields: Array<any> = [
    'account_name',
    'account_key',
  ];
  protected balckblazeFields: Array<any> = [
    'account_id',
    'app_key',
  ];
  protected gcloudFields: Array<any> = [
    'preview',
    'keyfile',
  ];

  protected selectedProvider: string = 'AMAZON';

  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected ws: WebSocketService) {}

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(params['pk']);
        this.id = params['pk'];
      }
    });
  }

  afterInit(entityForm: any) {
    entityForm.submitFunction = this.submitFunction;

    for (let i in this.azureFields) {
      this.hideField(this.azureFields[i], true, entityForm);
    }
    for (let i in this.balckblazeFields) {
      this.hideField(this.balckblazeFields[i], true, entityForm);
    }
    for (let i in this.gcloudFields) {
      this.hideField(this.gcloudFields[i], true, entityForm);
    }
    for (let i in this.amazonFields) {
      this.hideField(this.amazonFields[i], false, entityForm);
    }

    entityForm.formGroup.controls['provider'].valueChanges.subscribe((res) => {
      this.selectedProvider = res;
      if (res == 'AMAZON') {
        for (let i in this.azureFields) {
          this.hideField(this.azureFields[i], true, entityForm);
        }
        for (let i in this.balckblazeFields) {
          this.hideField(this.balckblazeFields[i], true, entityForm);
        }
        for (let i in this.gcloudFields) {
          this.hideField(this.gcloudFields[i], true, entityForm);
        }
        for (let i in this.amazonFields) {
          this.hideField(this.amazonFields[i], false, entityForm);
        }
      } else if (res == 'AZURE') {
        for (let i in this.amazonFields) {
          this.hideField(this.amazonFields[i], true, entityForm);
        }
        for (let i in this.balckblazeFields) {
          this.hideField(this.balckblazeFields[i], true, entityForm);
        }
        for (let i in this.gcloudFields) {
          this.hideField(this.gcloudFields[i], true, entityForm);
        }
        for (let i in this.azureFields) {
          this.hideField(this.azureFields[i], false, entityForm);
        }
      } else if (res == 'BACKBLAZE') {
        for (let i in this.amazonFields) {
          this.hideField(this.amazonFields[i], true, entityForm);
        }
        for (let i in this.gcloudFields) {
          this.hideField(this.gcloudFields[i], true, entityForm);
        }
        for (let i in this.azureFields) {
          this.hideField(this.azureFields[i], true, entityForm);
        }
        for (let i in this.balckblazeFields) {
          this.hideField(this.balckblazeFields[i], false, entityForm);
        }
      } else if (res == 'GCLOUD') {
        for (let i in this.amazonFields) {
          this.hideField(this.amazonFields[i], true, entityForm);
        }
        for (let i in this.azureFields) {
          this.hideField(this.azureFields[i], true, entityForm);
        }
        for (let i in this.balckblazeFields) {
          this.hideField(this.balckblazeFields[i], true, entityForm);
        }
        for (let i in this.gcloudFields) {
          this.hideField(this.gcloudFields[i], false, entityForm);
        }
      }
    });

    entityForm.formGroup.controls['keyfile'].valueChanges.subscribe((value)=>{
      entityForm.formGroup.controls['preview'].setValue(value);
    });
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target.isHidden = show;
    entity.setDisabled(fieldName, show);
  }

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
