import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { take } from 'rxjs/operators';
import { KeychainCredentialType } from 'app/enums/keychain-credential-type.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import {
  CloudsyncCredential,
  CloudsyncCredentialVerify,
  CloudsyncOneDriveDrive,
} from 'app/interfaces/cloudsync-credential.interface';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/modules/entity/entity-form/models/relation-connection.enum';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  CloudCredentialService, DialogService, WebSocketService, ReplicationService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-cloudcredentials-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [CloudCredentialService, ReplicationService],
})
export class CloudCredentialsFormComponent implements FormConfiguration {
  isEntity = true;
  addCall = 'cloudsync.credentials.create' as const;
  queryCall = 'cloudsync.credentials.query' as const;
  editCall = 'cloudsync.credentials.update' as const;
  queryCallOption: QueryFilter<CloudsyncCredential>[];
  protected formGroup: FormGroup;
  protected id: number;
  protected keyId: number;
  protected isOneColumnForm = true;
  private rowNum: number;
  title = helptext.formTitle;

  protected selectedProvider = 'S3';
  protected credentialsOauth = false;
  protected oauthUrl: string;
  hideSaveBtn = true;

  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_basic,
      label: true,
      class: 'basic',
      width: '49%',
      config: [
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
          tooltip: helptext.provider.tooltip,
          options: [],
          value: this.selectedProvider,
          required: true,
          validation: helptext.provider.validation,
        },
      ],
    },
    // show if provider support oauth
    {
      name: helptext.fieldset_oauth_authentication,
      label: true,
      class: 'oauth',
      width: '100%',
      config: [
        {
          type: 'button',
          name: 'oauth_signin_button',
          isHidden: true,
          customEventActionLabel: this.translate.instant('Log in to Provider'),
          value: '',
          customEventMethod: () => {
            this.logInToProvider();
          },
        },
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
          inputType: 'password',
          togglePw: true,
        }],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.fieldset_authentication,
      label: true,
      class: 'authentication',
      width: '49%',
      config: [
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'S3',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'S3',
              }],
            },
          ],
          togglePw: true,
        },
        {
          type: 'input',
          name: 'max_upload_parts-S3',
          placeholder: helptext.max_upload_parts_s3.placeholder,
          tooltip: helptext.max_upload_parts_s3.tooltip,
          inputType: 'number',
          validation: helptext.max_upload_parts_s3.validation,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'S3',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'B2',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'key-B2',
          placeholder: helptext.key_b2.placeholder,
          tooltip: helptext.key_b2.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'B2',
              }],
            },
          ],
        },
        // box
        {
          type: 'input',
          name: 'token-BOX',
          placeholder: helptext.token_box.placeholder,
          tooltip: helptext.token_box.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'BOX',
              }],
            },
          ],
        },
        // dropbox
        {
          type: 'input',
          name: 'token-DROPBOX',
          placeholder: helptext.token_dropbox.placeholder,
          tooltip: helptext.token_dropbox.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'DROPBOX',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'FTP',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'port-FTP',
          placeholder: helptext.port_ftp.placeholder,
          tooltip: helptext.port_ftp.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'FTP',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'FTP',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'pass-FTP',
          placeholder: helptext.pass_ftp.placeholder,
          tooltip: helptext.pass_ftp.tooltip,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          value: '',
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'FTP',
              }],
            },
          ],
        },
        // google cloud storage
        {
          type: 'textarea',
          name: 'preview-GOOGLE_CLOUD_STORAGE',
          placeholder: helptext.preview_google_cloud_storage.placeholder,
          tooltip: helptext.preview_google_cloud_storage.tooltip,
          readonly: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'GOOGLE_CLOUD_STORAGE',
              }],
            },
          ],
        },
        {
          type: 'readfile',
          name: 'service_account_credentials-GOOGLE_CLOUD_STORAGE',
          placeholder: helptext.service_account_credentials_google_cloud_storage.placeholder,
          tooltip: helptext.service_account_credentials_google_cloud_storage.tooltip,
          required: true,
          isHidden: true,
          validation: helptext.service_account_credentials_google_cloud_storage.validation,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'GOOGLE_CLOUD_STORAGE',
              }],
            },
          ],
        },
        // google drive
        {
          type: 'input',
          name: 'token-GOOGLE_DRIVE',
          placeholder: helptext.token_google_drive.placeholder,
          tooltip: helptext.token_google_drive.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'GOOGLE_DRIVE',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'GOOGLE_DRIVE',
              }],
            },
          ],
        },
        // google photos
        {
          type: 'input',
          name: 'token-GOOGLE_PHOTOS',
          placeholder: helptext.token_google_photos.placeholder,
          tooltip: helptext.token_google_photos.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'GOOGLE_PHOTOS',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'HTTP',
              }],
            },
          ],
        },
        // hubic
        {
          type: 'input',
          name: 'token-HUBIC',
          placeholder: helptext.token_hubic.placeholder,
          tooltip: helptext.token_hubic.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'HUBIC',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'MEGA',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'pass-MEGA',
          placeholder: helptext.pass_mega.placeholder,
          tooltip: helptext.pass_mega.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'MEGA',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'AZUREBLOB',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'key-AZUREBLOB',
          placeholder: helptext.key_azureblob.placeholder,
          tooltip: helptext.key_azureblob.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'AZUREBLOB',
              }],
            },
          ],
        },
        // microsoft onedrive
        {
          type: 'input',
          name: 'token-ONEDRIVE',
          placeholder: helptext.token_onedrive.placeholder,
          tooltip: helptext.token_onedrive.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'ONEDRIVE',
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'drives-ONEDRIVE',
          placeholder: helptext.drives_onedrive.placeholder,
          tooltip: helptext.drives_onedrive.tooltip,
          options: [{
            label: '---------',
            value: '',
          }],
          value: '',
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'ONEDRIVE',
              }],
            },
          ],
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
            },
          ],
          value: 'PERSONAL',
          required: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'ONEDRIVE',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'ONEDRIVE',
              }],
            },
          ],
        },
        // openstack swift
        {
          type: 'input',
          name: 'user-OPENSTACK_SWIFT',
          placeholder: helptext.user_openstack_swift.placeholder,
          tooltip: helptext.user_openstack_swift.tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'key-OPENSTACK_SWIFT',
          placeholder: helptext.key_openstack_swift.placeholder,
          tooltip: helptext.key_openstack_swift.tooltip,
          required: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'auth-OPENSTACK_SWIFT',
          placeholder: helptext.auth_openstack_swift.placeholder,
          tooltip: helptext.auth_openstack_swift.tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'auth_version-OPENSTACK_SWIFT',
          placeholder: helptext.auth_version_openstack_swift.placeholder,
          tooltip: helptext.auth_version_openstack_swift.tooltip,
          options: [
            {
              label: 'Auto(vX)',
              value: 0,
            },
            {
              label: 'v1',
              value: 1,
            },
            {
              label: 'v2',
              value: 2,
            },
            {
              label: 'v3',
              value: 3,
            },
          ],
          value: 0,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        // pcloud
        {
          type: 'input',
          name: 'token-PCLOUD',
          placeholder: helptext.token_pcloud.placeholder,
          tooltip: helptext.token_pcloud.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'PCLOUD',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'hostname-PCLOUD',
          placeholder: helptext.hostname_pcloud.placeholder,
          tooltip: helptext.hostname_pcloud.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'PCLOUD',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'SFTP',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'SFTP',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'SFTP',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'SFTP',
              }],
            },
          ],
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
            },
            {
              label: 'Generate New',
              value: 'NEW',
            },
          ],
          value: '',
          required: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'SFTP',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'WEBDAV',
              }],
            },
          ],
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
            },
          ],
          value: 'NEXTCLOUD',
          required: true,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'WEBDAV',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'WEBDAV',
              }],
            },
          ],
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
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'WEBDAV',
              }],
            },
          ],
        },
        // yandex
        {
          type: 'input',
          name: 'token-YANDEX',
          placeholder: helptext.token_yandex.placeholder,
          tooltip: helptext.token_yandex.tooltip,
          required: true,
          isHidden: true,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'YANDEX',
              }],
            },
          ],
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.fieldset_authentication_advanced,
      label: true,
      class: 'authentication_advanced',
      width: '49%',
      config: [
        {
          type: 'checkbox',
          name: 'advanced-S3',
          placeholder: this.translate.instant('Advanced Settings'),
          isHidden: true,
          value: false,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'S3',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'user_id-OPENSTACK_SWIFT',
          placeholder: helptext.user_id_openstack_swift.placeholder,
          tooltip: helptext.user_id_openstack_swift.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }, {
                name: 'auth_version-OPENSTACK_SWIFT',
                value: 3,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'domain-OPENSTACK_SWIFT',
          placeholder: helptext.domain_openstack_swift.placeholder,
          tooltip: helptext.domain_openstack_swift.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }, {
                name: 'auth_version-OPENSTACK_SWIFT',
                value: 3,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'tenant-OPENSTACK_SWIFT',
          placeholder: helptext.tenant_openstack_swift.placeholder,
          tooltip: helptext.tenant_openstack_swift.tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'tenant_id-OPENSTACK_SWIFT',
          placeholder: helptext.tenant_id_openstack_swift.placeholder,
          tooltip: helptext.tenant_id_openstack_swift.tooltip,
          required: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'tenant_domain-OPENSTACK_SWIFT',
          placeholder: helptext.tenant_domain_openstack_swift.placeholder,
          tooltip: helptext.tenant_domain_openstack_swift.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }, {
                name: 'auth_version-OPENSTACK_SWIFT',
                value: 3,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'auth_token-OPENSTACK_SWIFT',
          placeholder: helptext.auth_token_openstack_swift.placeholder,
          tooltip: helptext.auth_token_openstack_swift.tooltip,
          inputType: 'password',
          togglePw: true,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
      ],
    },
    { name: 'spacer', label: false, width: '2%' },
    {
      name: helptext.fieldset_endpoint_advanced_options,
      label: true,
      class: 'endpoint',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'endpoint-S3',
          placeholder: helptext.endpoint_s3.placeholder,
          tooltip: helptext.endpoint_s3.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'S3',
              }, {
                name: 'advanced-S3',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'region-S3',
          placeholder: helptext.region_s3.placeholder,
          tooltip: helptext.region_s3.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'S3',
              }, {
                name: 'advanced-S3',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'skip_region-S3',
          placeholder: helptext.skip_region_s3.placeholder,
          tooltip: helptext.skip_region_s3.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'S3',
              }, {
                name: 'advanced-S3',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'signatures_v2-S3',
          placeholder: helptext.signatures_v2_s3.placeholder,
          tooltip: helptext.signatures_v2_s3.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Show,
              connective: RelationConnection.And,
              when: [{
                name: 'provider',
                value: 'S3',
              }, {
                name: 'advanced-S3',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'region-OPENSTACK_SWIFT',
          placeholder: helptext.region_openstack_swift.placeholder,
          tooltip: helptext.region_openstack_swift.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'input',
          name: 'storage_url-OPENSTACK_SWIFT',
          placeholder: helptext.storage_url_openstack_swift.placeholder,
          tooltip: helptext.storage_url_openstack_swift.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'endpoint_type-OPENSTACK_SWIFT',
          placeholder: helptext.endpoint_type_openstack_swift.placeholder,
          tooltip: helptext.endpoint_type_openstack_swift.tooltip,
          options: [
            {
              label: 'Public',
              value: 'public',
            },
            {
              label: 'Internal',
              value: 'internal',
            },
            {
              label: 'Admin',
              value: 'admin',
            },
          ],
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'provider',
                value: 'OPENSTACK_SWIFT',
              }],
            },
          ],
        },
      ],
    },
  ];

  fieldConfig: FieldConfig[];

  protected providers: CloudsyncProvider[];
  protected providerField: FormSelectConfig;
  entityForm: EntityFormComponent;

  custActions = [
    {
      id: 'validCredential',
      name: this.translate.instant('Verify Credential'),
      buttonColor: 'default',
      function: () => {
        this.entityForm.loader.open();
        this.entityForm.error = '';
        const value = _.cloneDeep(this.entityForm.formGroup.value);
        this.beforeSubmit(value);
        for (const item in value) {
          if (item !== 'name' && item !== 'provider') {
            if (!this.entityForm.formGroup.controls[item].valid) {
              this.entityForm.formGroup.controls[item].markAsTouched();
            }
          }
        }
        this.prepareAttributes(value);

        if (value.attributes.private_key && value.attributes.private_key === 'NEW') {
          this.makeNewKeyPair(value);
        } else {
          this.verifyCredentials(value);
        }
      },
    }, {
      id: 'customSave',
      name: this.translate.instant('Save'),
      buttonType: 'submit',
      buttonColor: 'primary',
    },
  ];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected cloudcredentialService: CloudCredentialService,
    protected dialog: DialogService,
    protected replicationService: ReplicationService,
    private modalService: ModalService,
    protected translate: TranslateService,
  ) {
    this.modalService.getRow$
      .pipe(take(1), untilDestroyed(this))
      .subscribe((row: number) => {
        this.rowNum = row;
      });
    const basicFieldset = _.find(this.fieldSets, { class: 'basic' });
    this.providerField = _.find(basicFieldset.config, { name: 'provider' }) as FormSelectConfig;
    this.cloudcredentialService.getProviders().pipe(untilDestroyed(this)).subscribe(
      (providers) => {
        this.providers = providers;
        providers.forEach((provider) => {
          this.providerField.options.push(
            {
              label: provider.title,
              value: provider.name,
            },
          );
        });
      },
    );
    const authenticationFieldset = _.find(this.fieldSets, { class: 'authentication' });
    const privateKeySftpField = _.find(authenticationFieldset.config, { name: 'private_key-SFTP' }) as FormSelectConfig;
    this.ws.call('keychaincredential.query', [[['type', '=', KeychainCredentialType.SshKeyPair]]]).pipe(untilDestroyed(this)).subscribe(
      (credentials) => {
        credentials.forEach((credential) => {
          privateKeySftpField.options.push({ label: credential.name, value: credential.id });
        });
      },
    );
  }

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'authenticate' && !this.credentialsOauth) {
      return false;
    }
    return true;
  }

  isCustActionDisabled(actionId: string): boolean {
    if (actionId === 'validCredential' || actionId === 'customSave') {
      return this.entityForm.formGroup.invalid;
    }
    return false;
  }

  preInit(): void {
    if (this.rowNum) {
      this.queryCallOption = [['id', '=', this.rowNum]];
      this.id = this.rowNum;
    }
  }

  setFieldRequired(name: string, required: boolean, entityform: EntityFormComponent): void {
    const field = _.find(this.fieldConfig, { name });
    const controller = entityform.formGroup.controls[name];
    if (field.required !== required) {
      field.required = required;
      if (required) {
        controller.setValidators([Validators.required]);
      } else {
        controller.clearValidators();
      }
      controller.updateValueAndValidity();
    }
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    entityForm.formGroup.controls['provider'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (this.providerField.hasErrors) {
        this.providerField.hasErrors = false;
        this.providerField.errors = '';
      }

      this.selectedProvider = res;

      this.oauthUrl = _.find(this.providers, { name: res }).credentials_oauth;
      this.credentialsOauth = this.oauthUrl != null;
      entityForm.setDisabled('client_id', !this.credentialsOauth, !this.credentialsOauth);
      entityForm.setDisabled('client_secret', !this.credentialsOauth, !this.credentialsOauth);
      entityForm.setDisabled('oauth_signin_button', !this.credentialsOauth, !this.credentialsOauth);
    });
    // preview service_account_credentials
    entityForm.formGroup.controls['service_account_credentials-GOOGLE_CLOUD_STORAGE'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      entityForm.formGroup.controls['preview-GOOGLE_CLOUD_STORAGE'].setValue(value);
    });
    // Allow blank values for pass and key_file fields (but at least one should be non-blank)
    entityForm.formGroup.controls['pass-SFTP'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (res !== undefined) {
        const required = res === '';
        this.setFieldRequired('private_key-SFTP', required, entityForm);
      }
    });
    entityForm.formGroup.controls['private_key-SFTP'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: number | string) => {
      if (res !== undefined) {
        const required = res === '';
        this.setFieldRequired('pass-SFTP', required, entityForm);
      }
    });

    const driveTypeCtrl = entityForm.formGroup.controls['drive_type-ONEDRIVE'];
    const driveIdCtrl = entityForm.formGroup.controls['drive_id-ONEDRIVE'];
    entityForm.formGroup.controls['drives-ONEDRIVE'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: CloudsyncOneDriveDrive) => {
      if (res) {
        driveTypeCtrl.setValue(res.drive_type);
        driveIdCtrl.setValue(res.drive_id);
      } else {
        driveTypeCtrl.setValue('PERSONAL');
        driveIdCtrl.setValue(null);
      }
    });

    const authCtrl = entityForm.formGroup.controls['auth_version-OPENSTACK_SWIFT'];
    const tenantCtrl = entityForm.formGroup.controls['tenant-OPENSTACK_SWIFT'];
    const tenantIdCtrl = entityForm.formGroup.controls['tenant_id-OPENSTACK_SWIFT'];
    entityForm.formGroup.controls['auth_version-OPENSTACK_SWIFT'].valueChanges.pipe(untilDestroyed(this)).subscribe(
      (res: number) => {
        if (res === 1) {
          this.setFieldRequired('tenant-OPENSTACK_SWIFT', false, entityForm);
          this.setFieldRequired('tenant_id-OPENSTACK_SWIFT', false, entityForm);
        } else if ((tenantCtrl.value === undefined || tenantCtrl.value === '')
          && (tenantIdCtrl.value === undefined || tenantIdCtrl.value === '')) {
          this.setFieldRequired('tenant-OPENSTACK_SWIFT', true, entityForm);
          this.setFieldRequired('tenant_id-OPENSTACK_SWIFT', true, entityForm);
        }
      },
    );

    entityForm.formGroup.controls['tenant-OPENSTACK_SWIFT'].valueChanges.pipe(untilDestroyed(this)).subscribe(
      (res: any) => {
        if (authCtrl.value !== '1') {
          this.setFieldRequired('tenant_id-OPENSTACK_SWIFT', res === '' || res === undefined, entityForm);
        }
      },
    );
    entityForm.formGroup.controls['tenant_id-OPENSTACK_SWIFT'].valueChanges.pipe(untilDestroyed(this)).subscribe(
      (res: any) => {
        if (authCtrl.value !== '1') {
          this.setFieldRequired('tenant-OPENSTACK_SWIFT', res === '' || res === undefined, entityForm);
        }
      },
    );
  }

  verifyCredentials(value: CloudsyncCredentialVerify & { name: string }): void {
    delete value['name'];
    this.ws.call('cloudsync.credentials.verify', [value]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.entityForm.loader.close();
        if (res.valid) {
          this.dialog.info(this.translate.instant('Valid'), this.translate.instant('The Credential is valid.'), '500px', 'info');
        } else {
          this.dialog.errorReport('Error', res.excerpt, res.error);
        }
      },
      (err) => {
        this.entityForm.loader.close();
        new EntityUtils().handleWsError(this.entityForm, err, this.dialog);
      },
    );
  }

  logInToProvider(): void {
    window.open(this.oauthUrl + '?origin=' + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');
    const controls = this.entityForm.formGroup.controls;
    const dialogService = this.dialog;
    const translate = this.translate;
    const getOnedriveList = this.getOnedriveList.bind(this);

    const method = (message: OauthMessage): void => doAuth(message, this.selectedProvider);

    window.addEventListener('message', method, false);

    function doAuth(message: OauthMessage, selectedProvider: string): void {
      if ('oauth_portal' in message.data) {
        if (message.data.error) {
          dialogService.errorReport(translate.instant('Error'), message.data.error);
        } else {
          for (const prop in message.data.result) {
            let targetProp = prop;
            if (prop !== 'client_id' && prop !== 'client_secret') {
              targetProp += '-' + selectedProvider;
            }
            if (controls[targetProp]) {
              controls[targetProp].setValue(message.data.result[prop]);
            }
          }
        }
        if (selectedProvider === 'ONEDRIVE') {
          getOnedriveList(message.data);
        }

        window.removeEventListener('message', method);
      }
    }
  }

  async makeNewKeyPair(value: any, submitting?: boolean): Promise<void> {
    await this.replicationService.genSshKeypair().then(
      async (keyPair) => {
        const payload = {
          name: value['name'] + ' Key',
          type: KeychainCredentialType.SshKeyPair,
          attributes: keyPair,
        };
        await this.ws.call('keychaincredential.create', [payload]).toPromise().then(
          (sshKey) => {
            this.keyId = sshKey.id;
            const privateKeySftpField = _.find(this.fieldConfig, { name: 'private_key-SFTP' }) as FormSelectConfig;
            privateKeySftpField.options.push({ label: payload.name, value: this.keyId });
            this.entityForm.formGroup.controls['private_key-SFTP'].setValue(this.keyId);
            if (submitting) {
              value['private_key-SFTP'] = sshKey.id;
              this.finishSubmit(value);
            } else {
              value.attributes.private_key = this.keyId;
              this.verifyCredentials(value);
            }
          },
          (error) => {
            this.entityForm.loader.close();
            new EntityUtils().handleWsError(this, error, this.dialog);
          },
        );
      },
      (err) => {
        this.entityForm.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialog);
      },
    );
  }

  finishSubmit(value: any): void {
    this.entityForm.loader.open();
    this.prepareAttributes(value);

    this.entityForm.submitFunction(value).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.entityForm.loader.close();
        this.modalService.closeSlideIn();
        this.modalService.refreshTable();
      },
      (err: WebsocketError) => {
        this.entityForm.loader.close();
        this.modalService.refreshTable();
        if (err.hasOwnProperty('reason') && (err.hasOwnProperty('trace'))) {
          new EntityUtils().handleWsError(this, err, this.dialog);
        } else {
          new EntityUtils().handleError(this, err);
        }
      },
    );
  }

  beforeSubmit(value: any): void {
    if (!this.credentialsOauth) {
      delete value['client_id'];
      delete value['client_secret'];
    }
  }

  customSubmit(value: any): void {
    delete value['oauth_signin_button'];
    if (value['private_key-SFTP'] === 'NEW') {
      this.makeNewKeyPair(value, true);
    } else {
      this.finishSubmit(value);
    }
  }

  dataAttributeHandler(entityForm: EntityFormComponent): void {
    const provider = entityForm.formGroup.controls['provider'].value;
    if (provider === 'S3'
    && (entityForm.wsResponseIdx['endpoint'] || entityForm.wsResponseIdx['skip_region'] || entityForm.wsResponseIdx['signatures_v2'])) {
      entityForm.formGroup.controls['advanced-S3'].setValue(true);
    }

    for (const i in entityForm.wsResponseIdx) {
      let fieldName = i;
      if (fieldName !== 'client_id' && fieldName !== 'client_secret') {
        fieldName += '-' + provider;
      }
      if (entityForm.formGroup.controls[fieldName]) {
        entityForm.formGroup.controls[fieldName].setValue(entityForm.wsResponseIdx[i]);
      }
    }
  }

  /**
   * Mutates input.
   * TODO: Rewrite.
   */
  prepareAttributes(value: any): void {
    const allowEmptyStrings = ['pass-FTP'];
    const removedAttributes = [
      'preview-GOOGLE_CLOUD_STORAGE',
      'advanced-S3',
      'drives-ONEDRIVE',
    ];
    const attributes: any = {};
    let attrName: string;
    for (const item in value) {
      if (item === 'name' || item === 'provider') {
        continue;
      }

      if ((!removedAttributes.includes(item) && value[item] !== '') || allowEmptyStrings.includes(item)) {
        attrName = item.split('-')[0];
        attributes[attrName] = attrName === 'auth_version' ? parseInt(value[item], 10) : value[item];
      }
      delete value[item];
    }

    value['attributes'] = attributes;
  }

  getOnedriveList(data: any): void {
    if (data.error) {
      this.entityForm.setDisabled('drives-ONEDRIVE', true, true);
      return;
    }
    data = data.result;
    const drivesConfig = _.find(this.fieldConfig, { name: 'drives-ONEDRIVE' }) as FormSelectConfig;
    this.entityForm.setDisabled('drives-ONEDRIVE', false, false);
    this.ws.call('cloudsync.onedrive_list_drives', [{
      client_id: data.client_id,
      client_secret: data.client_secret,
      token: data.token,
    }]).pipe(untilDestroyed(this)).subscribe(
      (drives) => {
        drives.forEach((drive) => {
          drivesConfig.options.push({ label: drive.drive_type + ' - ' + drive.drive_id, value: drive });
        });
      },
      (err) => {
        new EntityUtils().handleWsError(this, err, this.dialog);
      },
    );
  }
}
