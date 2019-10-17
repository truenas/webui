import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';

import { helptext_system_cloudcredentials as helptext } from 'app/helptext/system/cloudcredentials';
import { EntityUtils } from 'app/pages/common/entity/utils';
import * as _ from 'lodash';
import { CloudCredentialService, DialogService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-cloudcredentials-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ CloudCredentialService ],
})
export class CloudCredentialsFormComponent {

  protected isEntity = true;
  protected addCall = 'cloudsync.credentials.create';
  protected queryCall = 'cloudsync.credentials.query';
  protected queryCallOption: Array<any> = [['id', '=']];
  protected route_success: string[] = ['system', 'cloudcredentials'];
  protected formGroup: FormGroup;
  protected id: any;
  protected pk: any;

  protected selectedProvider: string = 'S3';
  protected credentialsOauth = false;
  protected oauthURL: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'name',
      placeholder: helptext.name.placeholder,
      tooltip: helptext.name.tooltip,
      required: true,
      validation: helptext.name.validation,
    },
    {
      type: 'select',
      name: 'provider',
      placeholder: helptext.provider.placeholder,
      options: [],
      value: this.selectedProvider,
      required: true,
      validation: helptext.provider.validation,
    },
    // Amazon_s3
    {
      type: 'input',
      name: 'access_key_id-S3',
      placeholder: helptext.access_key_id_s3.placeholder,
      tooltip: helptext.access_key_id_s3.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'S3',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'secret_access_key-S3',
      placeholder: helptext.secret_access_key_s3.placeholder,
      tooltip: helptext.secret_access_key_s3.tooltip,
      required: true,
      isHidden: true,
      inputType: 'password',

      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'S3',
           }]
        }
      ],
      togglePw: true
    },
    {
      type: 'checkbox',
      name: 'advanced-S3',
      placeholder: T('Advanced Settings'),
      isHidden: true,
      value: false,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'S3',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'endpoint-S3',
      placeholder: helptext.endpoint_s3.placeholder,
      tooltip: helptext.endpoint_s3.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          connective: 'AND',
          when: [{
            name: 'provider',
            value: 'S3',
           }, {
            name: 'advanced-S3',
            value: true,
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'region-S3',
      placeholder: helptext.region_s3.placeholder,
      tooltip: helptext.region_s3.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          connective: 'AND',
          when: [{
            name: 'provider',
            value: 'S3',
           }, {
            name: 'advanced-S3',
            value: true,
           }]
        }
      ]
    },
    {
      type: 'checkbox',
      name: 'skip_region-S3',
      placeholder: helptext.skip_region_s3.placeholder,
      tooltip: helptext.skip_region_s3.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          connective: 'AND',
          when: [{
            name: 'provider',
            value: 'S3',
           }, {
            name: 'advanced-S3',
            value: true,
           }]
        }
      ]
    },
    {
      type: 'checkbox',
      name: 'signatures_v2-S3',
      placeholder: helptext.signatures_v2_s3.placeholder,
      tooltip: helptext.signatures_v2_s3.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          connective: 'AND',
          when: [{
            name: 'provider',
            value: 'S3',
           }, {
            name: 'advanced-S3',
            value: true,
           }]
        }
      ]
    },
    // backblaze b2
    {
      type: 'input',
      name: 'account-B2',
      placeholder: helptext.account_b2.placeholder,
      tooltip: helptext.account_b2.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'B2',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'key-B2',
      placeholder: helptext.key_b2.placeholder,
      tooltip: helptext.key_b2.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'B2',
           }]
        }
      ]
    },
    // box
    {
      type: 'input',
      name: 'token-BOX',
      placeholder: helptext.token_box.placeholder,
      tooltip: helptext.token_box.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'BOX',
           }]
        }
      ]
    },
    // dropbox
    {
      type: 'input',
      name: 'token-DROPBOX',
      placeholder: helptext.token_dropbox.placeholder,
      tooltip: helptext.token_dropbox.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'DROPBOX',
           }]
        }
      ]
    },
    // ftp
    {
      type: 'input',
      name: 'host-FTP',
      placeholder: helptext.host_ftp.placeholder,
      tooltip: helptext.host_ftp.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'FTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'port-FTP',
      placeholder: helptext.port_ftp.placeholder,
      tooltip: helptext.port_ftp.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'FTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'user-FTP',
      placeholder: helptext.user_ftp.placeholder,
      tooltip: helptext.user_ftp.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'FTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'pass-FTP',
      placeholder: helptext.pass_ftp.placeholder,
      tooltip: helptext.pass_ftp.tooltip,
      required: true,
      isHidden: true,
      inputType: 'password',
      togglePw: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'FTP',
           }]
        }
      ]
    },
    // google cloud storage
    {
      type : 'textarea',
      name : 'preview-GOOGLE_CLOUD_STORAGE',
      placeholder : helptext.preview_google_cloud_storage.placeholder,
      tooltip: helptext.preview_google_cloud_storage.tooltip,
      readonly: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'GOOGLE_CLOUD_STORAGE',
           }]
        }
      ]
    },
    {
      type: 'readfile',
      name: 'service_account_credentials-GOOGLE_CLOUD_STORAGE',
      placeholder: helptext.service_account_credentials_google_cloud_storage.placeholder,
      tooltip: helptext.service_account_credentials_google_cloud_storage.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'GOOGLE_CLOUD_STORAGE',
           }]
        }
      ]
    },
    // google drive
    {
      type: 'input',
      name: 'token-GOOGLE_DRIVE',
      placeholder: helptext.token_google_drive.placeholder,
      tooltip: helptext.token_google_drive.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'GOOGLE_DRIVE',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'team_drive-GOOGLE_DRIVE',
      placeholder: helptext.team_drive_google_drive.placeholder,
      tooltip: helptext.team_drive_google_drive.tooltip,
      required: false,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'GOOGLE_DRIVE',
           }]
        }
      ]
    },
    // http
    {
      type: 'input',
      name: 'url-HTTP',
      placeholder: helptext.url_http.placeholder,
      tooltip: helptext.url_http.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'HTTP',
           }]
        }
      ]
    },
    // hubic
    {
      type: 'input',
      name: 'token-HUBIC',
      placeholder: helptext.token_hubic.placeholder,
      tooltip: helptext.token_hubic.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'HUBIC',
           }]
        }
      ]
    },
    // mega
    {
      type: 'input',
      name: 'user-MEGA',
      placeholder: helptext.user_mega.placeholder,
      tooltip: helptext.user_mega.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'MEGA',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'pass-MEGA',
      placeholder: helptext.pass_mega.placeholder,
      tooltip: helptext.pass_mega.tooltip,
      required: true,
      isHidden: true,
      inputType: 'password',
      togglePw : true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'MEGA',
           }]
        }
      ]
    },
    // microsoft azure
    {
      type: 'input',
      name: 'account-AZUREBLOB',
      placeholder: helptext.account_azureblob.placeholder,
      tooltip: helptext.account_azureblob.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'AZUREBLOB',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'key-AZUREBLOB',
      placeholder: helptext.key_azureblob.placeholder,
      tooltip: helptext.key_azureblob.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'AZUREBLOB',
           }]
        }
      ]
    },
    // microsoft onedrive
    {
      type: 'input',
      name: 'token-ONEDRIVE',
      placeholder: helptext.token_onedrive.placeholder,
      tooltip: helptext.token_onedrive.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'ONEDRIVE',
           }]
        }
      ]
    },
    {
      type: 'select',
      name: 'drive_type-ONEDRIVE',
      placeholder: helptext.drive_type_onedrive.placeholder,
      tooltip: helptext.drive_type_onedrive.tooltip,
      options: [
        {
          label: 'PERSONAL',
          value: 'PERSONAL',
        },
        {
          label: 'BUSINESS',
          value: 'BUSINESS',
        },
        {
          label: 'DOCUMENT_LIBRARY',
          value: 'DOCUMENT_LIBRARY',
        }
      ],
      value: 'PERSONAL',
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'ONEDRIVE',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'drive_id-ONEDRIVE',
      placeholder: helptext.drive_id_onedrive.placeholder,
      tooltip: helptext.drive_id_onedrive.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'ONEDRIVE',
           }]
        }
      ]
    },
    // pcloud
    {
      type: 'input',
      name: 'token-PCLOUD',
      placeholder: helptext.token_pcloud.placeholder,
      tooltip: helptext.token_pcloud.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'PCLOUD',
           }]
        }
      ]
    },
    // sftp
    {
      type: 'input',
      name: 'host-SFTP',
      placeholder: helptext.host_sftp.placeholder,
      tooltip: helptext.host_sftp.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'SFTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'port-SFTP',
      placeholder: helptext.port_sftp.placeholder,
      tooltip: helptext.port_sftp.tooltip,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'SFTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'user-SFTP',
      placeholder: helptext.user_sftp.placeholder,
      tooltip: helptext.user_sftp.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'SFTP',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'pass-SFTP',
      placeholder: helptext.pass_sftp.placeholder,
      tooltip: helptext.pass_sftp.tooltip,
      required: true,
      isHidden: true,
      inputType: 'password',
      togglePw: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'SFTP',
           }]
        }
      ]
    },
    {
      type: 'select',
      name: 'private_key-SFTP',
      placeholder: helptext.private_key_sftp.placeholder,
      tooltip: helptext.private_key_sftp.tooltip,
      options: [
        {
          label: '---------',
          value: '',
        }
      ],
      value: '',
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'SFTP',
           }]
        }
      ]
    },
    // webdav
    {
      type: 'input',
      name: 'url-WEBDAV',
      placeholder: helptext.url_webdav.placeholder,
      tooltip: helptext.url_webdav.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'WEBDAV',
           }]
        }
      ]
    },
    {
      type: 'select',
      name: 'vendor-WEBDAV',
      placeholder: helptext.vendor_webdav.placeholder,
      tooltip: helptext.vendor_webdav.tooltip,
      options: [
        {
          label: 'NEXTCLOUD',
          value: 'NEXTCLOUD',
        },
        {
          label: 'OWNCLOUD',
          value: 'OWNCLOUD',
        },
        {
          label: 'SHAREPOINT',
          value: 'SHAREPOINT',
        },
        {
          label: 'OTHER',
          value: 'OTHER',
        }
      ],
      value: 'NEXTCLOUD',
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'WEBDAV',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'user-WEBDAV',
      placeholder: helptext.user_webdav.placeholder,
      tooltip: helptext.user_webdav.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'WEBDAV',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'pass-WEBDAV',
      placeholder: helptext.pass_webdav.placeholder,
      tooltip: helptext.pass_webdav.tooltip,
      required: true,
      isHidden: true,
      inputType: 'password',
      togglePw: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'WEBDAV',
           }]
        }
      ]
    },
    // yandex
    {
      type: 'input',
      name: 'token-YANDEX',
      placeholder: helptext.token_yandex.placeholder,
      tooltip: helptext.token_yandex.tooltip,
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'YANDEX',
           }]
        }
      ]
    },
    // show if provider support oauth
    {
      type: 'input',
      name: 'client_id',
      placeholder: helptext.client_id.placeholder,
      tooltip: helptext.client_id.tooltip,
      isHidden: true,
    },
    {
      type: 'input',
      name: 'client_secret',
      placeholder: helptext.client_secret.placeholder,
      tooltip: helptext.client_secret.tooltip,
      isHidden: true,
    },
  ];

  protected providers: Array<any>;
  protected providerField: any;
  protected entityForm: any;
  protected oauthClentIdField: any;
  protected oauthClentSecretField: any;

  public custActions: Array<any> = [
    {
      id: 'authenticate',
      name: T('LOGIN TO PROVIDER'),
      function: () => {
        window.open(this.oauthURL+ "?origin=" + encodeURIComponent(window.location.toString()), "_blank", "width=640,height=480");
        const controls = this.entityForm.formGroup.controls;
        const selectedProvider = this.selectedProvider;
        const dialogService = this.dialog;

        window.addEventListener("message", doAuth, false);

        function doAuth(message) {
          if (message.data.oauth_portal) {
            if (message.data.error) {
              dialogService.errorReport(T('Error'), message.data.error);
            } else {
              for (const prop in message.data.result) {
                let targetProp = prop;
                if (prop != 'client_id' && prop != 'client_secret') {
                  targetProp += '-' + selectedProvider;
                }
                controls[targetProp].setValue(message.data.result[prop]);
              }
            }
          }
          window.removeEventListener("message", doAuth);
        }
      }
    },
    {
      id : 'validCredential',
      name : T('Verify Credential'),
      function : () => {
        this.entityForm.loader.open();
        this.entityForm.error = '';
        const attributes = {};
        const value = _.cloneDeep(this.entityForm.formGroup.value);
        this.beforeSubmit(value);
        let attr_name: string;

        for (const item in value) {
          if (item != 'name' && item != 'provider') {
            if (!this.entityForm.formGroup.controls[item].valid) {
              this.entityForm.formGroup.controls[item].markAsTouched();
            }
            if (item !== 'preview-GOOGLE_CLOUD_STORAGE' && item !== 'advanced-S3') {
              attr_name = item.split("-")[0];
              if (value[item] != '' && value[item] != undefined) {
                attributes[attr_name] = value[item];
              }
            }
            delete value[item];
          }
        }
        delete value['name'];
        value['attributes'] = attributes;

        this.ws.call('cloudsync.credentials.verify', [value]).subscribe(
          (res) => {
            this.entityForm.loader.close();
            if (res.valid) {
              this.snackBar.open(T('The Credential is valid.'), T('Close'), { duration: 5000 });
            } else {
              this.dialog.errorReport('Error', res.excerpt, res.error);
            }
          },
          (err) => {
            this.entityForm.loader.close();
            new EntityUtils().handleWSError(this.entityForm, err, this.dialog);
          })
      }
    }
  ];

  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected ws: WebSocketService,
              protected cloudcredentialService: CloudCredentialService,
              protected dialog: DialogService,
              public snackBar: MatSnackBar) {
    this.providerField = _.find(this.fieldConfig, {'name': 'provider'});
    this.cloudcredentialService.getProviders().subscribe(
      (res) => {
        this.providers = res;
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
    const privateKeySFTPField = _.find(this.fieldConfig, {'name': 'private_key-SFTP'});
    this.ws.call('keychaincredential.query', [[["type", "=", "SSH_KEY_PAIR"]]]).subscribe(
      (res) => {
        for (let i = 0; i < res.length; i++) {
          privateKeySFTPField.options.push({ label: res[i].name, value: res[i].id});
        }
      }
    )
  }

  isCustActionVisible(actionname: string) {
    if (actionname === 'authenticate' && this.credentialsOauth === false) {
      return false;
    }
    return true;
  }

  preInit() {
    this.oauthClentIdField = _.find(this.fieldConfig, {'name': 'client_id'});
    this.oauthClentSecretField = _.find(this.fieldConfig, {'name': 'client_secret'});

    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.queryCallOption[0].push(params['pk']);
        this.id = params['pk'];
      }
    });
  }

  setFieldRequired(name: string, required: boolean, entityform: any) {
    const field = _.find(this.fieldConfig, {"name": name});
    const controller = entityform.formGroup.controls[name];
    if (field.required !== required) {
      field.required = required;
      if (required) {
        controller.setValidators([Validators.required])
      } else {
        controller.clearValidators();
      }
      controller.updateValueAndValidity();
    }
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    entityForm.submitFunction = this.submitFunction;

    const providerField = _.find(this.fieldConfig, {'name' : 'provider'});
    entityForm.formGroup.controls['provider'].valueChanges.subscribe((res) => {
      if (providerField.hasErrors) {
        providerField.hasErrors = false;
        providerField.errors = '';
      }

      this.selectedProvider = res;

      this.oauthURL = _.find(this.providers, {'name': res}).credentials_oauth;
      this.credentialsOauth = this.oauthURL == null ? false : true;
    });
    // preview service_account_credentials
    entityForm.formGroup.controls['service_account_credentials-GOOGLE_CLOUD_STORAGE'].valueChanges.subscribe((value)=>{
      entityForm.formGroup.controls['preview-GOOGLE_CLOUD_STORAGE'].setValue(value);
    });
    // Allow blank values for pass and key_file fields (but at least one should be non-blank)
    entityForm.formGroup.controls['pass-SFTP'].valueChanges.subscribe((res) => {
      if (res !== undefined) {
        const required = res === '' ? true : false;
        this.setFieldRequired('private_key-SFTP', required, entityForm);
      }
    });
    entityForm.formGroup.controls['private_key-SFTP'].valueChanges.subscribe((res) => {
      if (res !== undefined) {
        const required = res === '' ? true : false;
        this.setFieldRequired('pass-SFTP', required, entityForm);
      }
    });
  }

  beforeSubmit(value) {
    if (!this.credentialsOauth) {
      delete value['client_id'];
      delete value['client_secret'];
    }
  }

  submitFunction(value) {
    const attributes = {};
    let attr_name: string;

    for (let item in value) {
      if (item != 'name' && item != 'provider') {
        if (item != 'preview-GOOGLE_CLOUD_STORAGE' && item != 'advanced-S3' && value[item] != '') {
          attr_name = item.split("-")[0];
          attributes[attr_name] = value[item];
        }
        delete value[item];
      }
    }
    value['attributes'] = attributes;

    if (!this.pk) {
      return this.ws.call('cloudsync.credentials.create', [value]);
    } else {
      return this.ws.call('cloudsync.credentials.update', [this.pk, value]);
    }
  }

  dataAttributeHandler(entityForm: any) {
    const provider = entityForm.formGroup.controls['provider'].value;
    if (provider == 'S3' &&
    (entityForm.wsResponseIdx['endpoint'] || entityForm.wsResponseIdx['skip_region'] || entityForm.wsResponseIdx['signatures_v2'])) {
      entityForm.formGroup.controls['advanced-S3'].setValue(true);
    }

    for (let i in entityForm.wsResponseIdx) {
      let field_name = i;
      if (field_name != 'client_id' && field_name != 'client_secret') {
        field_name += '-' + provider;
      }
      entityForm.formGroup.controls[field_name].setValue(entityForm.wsResponseIdx[i]);
    }
  }
}
