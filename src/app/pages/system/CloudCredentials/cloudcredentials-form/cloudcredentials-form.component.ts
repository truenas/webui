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
  protected addCall = 'cloudsync.credentials.create';
  protected queryCall = 'cloudsync.credentials.query';
  protected queryCallOption: Array<any> = [['id', '=']];
  protected route_success: string[] = ['system', 'cloudcredentials'];
  protected formGroup: FormGroup;
  protected id: any;
  protected pk: any;

  protected selectedProvider: string = 'AMAZON_CLOUD_DRIVE';

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
      value: 'AMAZON_CLOUD_DRIVE',
      required: true,
      validation: [Validators.required],
    },
    // Amazon_cloud_drive
    {
      type: 'input',
      name: 'client_id-AMAZON_CLOUD_DRIVE',
      placeholder: T('Amazon Application Client ID'),
      tooltip:T('Client ID for the <a\
                 href="https://developer.amazon.com/docs/amazon-drive/ad-get-started.html"\
                 target="_blank">Amazon Drive account</a>.'),
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'AMAZON_CLOUD_DRIVE',
           }]
        }
      ]
    },
    {
      type: 'input',
      name: 'client_secret-AMAZON_CLOUD_DRIVE',
      placeholder: T('Application Client Secret'),
      tooltip: T('Client secret for the Amazon Drive account.'),
      required: true,
      isHidden: true,
      relation: [
        {
          action: 'SHOW',
          when: [{
            name: 'provider',
            value: 'AMAZON_CLOUD_DRIVE',
           }]
        }
      ]
    },
    // Amazon_s3
    {
      type: 'input',
      name: 'access_key_id-S3',
      placeholder: T('Access Key ID'),
      tooltip: T('Amazon Web Services Key ID. This is found\
                  on <a href="https://aws.amazon.com/"\
                  target="_blank">Amazon AWS</a> by going through <i>My\
                  account -> Security Credentials -> Access Keys\
                  (Access Key ID and Secret Access Key)</i>.'),
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
      placeholder: T('Secret Access Key'),
      tooltip: T('Amazon Web Services password. If the Secret Access Key\
                  cannot be found or remembered, go to <i>My Account >\
                  Security Credentials > Access Keys</i> and create a\
                  new key pair.'),
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
      type: 'input',
      name: 'endpoint-S3',
      placeholder: T('Endpoint URL'),
      tooltip: T('<a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html"\
                  target="_blank">Endpoint URL</a> for a bucket\
                  configured for website hosting. Leave blank when using \
                  AWS. Enter endpoint URL if using custom S3 API. URL \
                  general format: \
                  <i>bucket-name.s3-website.region.amazonaws.com</i>.\
                  Refer to the AWS Documentation for a list of <a\
                  href="https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints"\
                  target="_blank">Simple Storage Service Website\
                  Endpoints</a>.'),
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
      type: 'checkbox',
      name: 'skip_region-S3',
      placeholder: T('Skip Region Autodetect'),
      // tooltip: T(''),
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
      type: 'checkbox',
      name: 'signatures_v2-S3',
      placeholder: T('Use V2 Signatures'),
      // tooltip: T(''),
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
    // backblaze b2
    {
      type: 'input',
      name: 'account-B2',
      placeholder: T('Account ID or Application Key ID'),
      tooltip: T('Alphanumeric <a\
                  href="https://www.backblaze.com/b2/cloud-storage.html"\
                  target="_blank">Backblaze B2</a> ID. Find an Account ID\
                  or applicationKeyID by logging in to the account,\
                  clicking <i>Buckets</i>, and clicking\
                  <i>Show Account ID and Application Key</i>. Enter the\
                  <i>Account ID</i> to associate the entire account or\
                  generate a new <i>Application Key</i>. The <i>keyID</i>\
                  replaces the Account ID and the key string is used in\
                  place of the <i>Master Application Key</i>.'),
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
      placeholder: T('Master Application Key or Application Key'),
      tooltip: T('Backblaze B2 Application Key. Log in to\
                  the B2 account and generate a key on the Buckets\
                  page. <a\
                  href="https://help.backblaze.com/hc/en-us/articles/224991568-Where-can-I-find-my-Account-ID-and-Application-Key-"\
                  target="_blank">Generating a new Master Application Key</a>\
                  will invalidate the existing Master key and require\
                  updating this field. Using a limited permissions\
                  Application Key also requires changing the\
                  <i>Account ID</i> to the new <i>keyID</i>.'),
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
      placeholder: T('Access Token'),
      tooltip: T('A User Access Token for <a\
                  href="https://developer.box.com/"\
                  target="_blank">Box</a>. An <a\
                  href="https://developer.box.com/reference#token"\
                  target="_blank">access token</a> enables Box to verify\
                  a request belongs to an authorized session. Example\
                  token: <i>T9cE5asGnuyYCCqIZFoWjFHvNbvVqHjl</i>.'),
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
      placeholder: T('Access Token'),
      tooltip: T('Access Token for a Dropbox account. A <a\
                  href="https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/"\
                  target="_blank">token must be generated</a> in the\
                  account before adding it here.'),
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
      placeholder: T('Host'),
      tooltip: T('FTP Host to connect to. Example: <i>ftp.example.com</i>.'),
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
      placeholder: T('Port'),
      tooltip: T('FTP Port number. Leave blank to use a default port\
                  of <i>21</i>.'),
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
      placeholder: T('Username'),
      tooltip: T('A username on the FTP Host system. This user must\
                  already exist on the FTP Host.'),
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
      placeholder: T('Password'),
      tooltip: T('Password for the username.'),
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
      placeholder : T('Preview JSON Service Account Key'),
      tooltip: T('View the contents of the Service Account JSON file.'),
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
      placeholder: T('Service Account'),
      tooltip: T('Upload the Service Account JSON credential file. This <a\
                  href="https://cloud.google.com/storage/docs/authentication#generating-a-private-key"\
                  target="_blank">file must be generated</a> with the\
                  Google Cloud Platform Console and uploaded from the\
                  local system.'),
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
      placeholder: T('Access Token'),
      tooltip: T('Token created with <a\
                  href="https://developers.google.com/drive/api/v3/about-auth"\
                  target="_blank">Google Drive</a>. Access Tokens expire\
                  periodically and must be refreshed.'),
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
      placeholder: T('Team Drive ID'),
      tooltip: T('Only needed when connecting to a Team Drive. The ID of\
                  the top level folder of the Team Drive.'),
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
      placeholder: T('URL'),
      tooltip: T('URL of the HTTP host to connect to.'),
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
      placeholder: T('Access Token'),
      tooltip: T('Access Token <a\
                  href="https://api.hubic.com/sandbox/"\
                  target="_blank">generated by a Hubic account</a>.'),
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
      placeholder: T('Username'),
      tooltip: T('Username for a <a href="https://mega.nz/"\
                  target="_blank">MEGA</a> account.'),
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
      placeholder: T('Password'),
      tooltip: T('Password for the <a href="https://mega.nz/"\
                  target="_blank">MEGA</a> account.'),
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
      placeholder: T('Account Name'),
      tooltip: T('Name of a <a\
                  href="https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account"\
                  target="_blank">Microsoft Azure</a> account.'),
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
      placeholder: T('Account Key'),
      tooltip: T('Base64 encoded key for the Azure account.'),
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
      placeholder: T('Access Token'),
      tooltip: T('Microsoft Onedrive <a\
                  href="https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/authentication"\
                  target="_blank">Access Token</a>.'),
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
      placeholder: T('Drive Account Type'),
      tooltip: T('Choose a <i>Drive Account Type</i>: <i>PERSONAL, BUSINESS,</i>\
                  or <a\
                  href="https://products.office.com/en-us/sharepoint/collaboration"\
                  target="_blank">SharePoint</a> <i>DOCUMENT_LIBRARY</i>.'),
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
      placeholder: T('Drive ID'),
      tooltip: T('Choose a unique drive identifier. Open the\
                  <i>Shell</i>, enter <i>rclone config</i>,\
                  and follow the prompts to find the <i>Drive ID</i>.\
                  The rclone <a\
                  href="https://rclone.org/onedrive"\
                  target="_blank">OneDrive documentation</a> walks through\
                  the configuration process.'),
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
      placeholder: T('Access Token'),
      tooltip: T('<a\
                  href="https://docs.pcloud.com/methods/intro/authentication.html"\
                  target="_blank">pCloud Access Token</a>. These tokens\
                  can expire and require extension.'),
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
      placeholder: T('Host'),
      tooltip: T('SSH Host to connect to.'),
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
      name: 'port-SFTP',
      placeholder: T('Port'),
      tooltip: T('SSH port number. Leave empty to use the default port\
                  <i>22</i>.'),
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
      placeholder: T('Username'),
      tooltip: T('SSH Username.'),
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
      placeholder: T('Password'),
      tooltip: T('Password for the SSH Username account.'),
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
      type: 'input',
      name: 'key_file-SFTP',
      placeholder: T('PEM-encoded private key file path'),
      tooltip: T('Path to an unencrypted <a\
                  href="https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail"\
                  target="_blank">PEM-encoded</a> private key file.\
                  Example: <i>/home/$USER/.ssh/id_rsa</i>. Leave blank\
                  to use <i>ssh-agent</i>.'),
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
      placeholder: T('URL'),
      tooltip: T('URL of the HTTP host to connect to.'),
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
      placeholder: T('WebDAV service'),
      tooltip: T('Name of the WebDAV site, service, or software being\
                  used.'),
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
      placeholder: T('Username'),
      tooltip: T('WebDAV account username.'),
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
      placeholder: T('Password'),
      tooltip: T('WebDAV account password.'),
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
      placeholder: T('Access Token'),
      tooltip: T('Yandex <a\
                  href="https://tech.yandex.com/direct/doc/dg-v4/concepts/auth-token-docpage/"\
                  target="_blank">Access Token</a>.'),
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
  ];


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
    entityForm.submitFunction = this.submitFunction;

    entityForm.formGroup.controls['provider'].valueChanges.subscribe((res) => {
      this.selectedProvider = res;
    });
    // preview service_account_credentials
    entityForm.formGroup.controls['service_account_credentials-GOOGLE_CLOUD_STORAGE'].valueChanges.subscribe((value)=>{
      entityForm.formGroup.controls['preview-GOOGLE_CLOUD_STORAGE'].setValue(value);
    });
    // Allow blank values for pass and key_file fields (but at least one should be non-blank)
    entityForm.formGroup.controls['pass-SFTP'].valueChanges.subscribe((res) => {
      if (res !== undefined) {
        if (res === '') {
          this.setFieldRequired('key_file-SFTP', true, entityForm);
        } else {
          this.setFieldRequired('key_file-SFTP', false, entityForm);
        }
      }
    });
    entityForm.formGroup.controls['key_file-SFTP'].valueChanges.subscribe((res) => {
      if (res !== undefined) {
        if (res === '' ) {
          this.setFieldRequired('pass-SFTP', true, entityForm);
        } else {
          this.setFieldRequired('pass-SFTP', false, entityForm);
        }
      }
    });
  }

  submitFunction() {
    const attributes = {};
    const value = _.cloneDeep(this.formGroup.value);
    let attr_name: string;

    for (let item in value) {
      if (item != 'name' && item != 'provider') {
        if (item != 'preview-GOOGLE_CLOUD_STORAGE') {
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
    let provider = entityForm.formGroup.controls['provider'].value;
    for (let i in entityForm.wsResponseIdx) {
      let field_name = i + '-' + provider;
      entityForm.formGroup.controls[field_name].setValue(entityForm.wsResponseIdx[i]);
    }
  }
}
