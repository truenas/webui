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
      // tooltip: T('Enter the Amazon Web Service account name.'),
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
      tooltip: T('Paste the Amazon account access key. This can be found\
       on the <a href="https://aws.amazon.com/" target="_blank">\
       Amazon AWS</a> website by clicking on <b>My account</b>, then\
       <b>Security Credentials</b> and\
       <b>Access Keys (Access Key ID and Secret Access Key)</b>.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type: 'textarea',
      name: 'secret_key',
      placeholder: T('Secret Key'),
      tooltip: T('After pasting the Access Key value to the FreeNAS Cloud\
       Credential Access Key field, enter the <b>Secret Key</b> value saved\
       when the pair was created. If the Secret Key value is not known, a new\
       key pair can be created on the same Amazon screen.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type: 'input',
      name: 'endpoint',
      placeholder: T('Endpoint URL'),
      isHidden: false,
    },
    {
      type : 'input',
      name : 'account_name',
      placeholder : T('Account Name'),
      tooltip : T('Enter the Azure Storage account name.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'account_key',
      placeholder :  T('Account Key'),
      tooltip : T('Paste the Azure Storage account key. Refer to the\
       <a href="https://docs.microsoft.com/en-us/azure/storage/"\
       target="_blank">Azure Storage Documentation</a> for more information.'),
       required: true,
       validation : [ Validators.required ],
       isHidden: true,
    },
    {
      type : 'textarea',
      name : 'accesskey',
      placeholder :  T('Access Key'),
      tooltip : T('Paste the account access key. For more information refer\
       to the <a href="https://www.backblaze.com/help.html" target="_blank">\
       BACKBLAZE help</a> page.'),
       required: true,
       validation : [ Validators.required ],
       isHidden: true,
    },
    {
      type : 'textarea',
      name : 'secretkey',
      placeholder : T('Secret Key'),
      tooltip : T('Enter the secret key generated.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'preview',
      placeholder : T('Preview JSON Service Account Key'),
      disabled: true,
      isHidden: true,
      readonly: true,
    },
    {
      type : 'readfile',
      name : 'keyfile',
      placeholder : T('JSON Service Account Key'),
      tooltip : T('Browse to the location of the saved Google Cloud\
       Storage key and select it. Refer to <a\
       href="https://cloud.google.com/storage/docs/" target="_blank">\
       Gcloud documentation</a> for more information.'),
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
    'accesskey',
    'secretkey',
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
