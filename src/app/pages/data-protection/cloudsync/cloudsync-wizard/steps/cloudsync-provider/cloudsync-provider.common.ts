import { Type } from 'ng-mocks';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { AzureProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';
import { BackblazeB2ProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import { BaseProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { FtpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import { GoogleCloudProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';
import { GoogleDriveProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';
import { HttpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';
import { MegaProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';
import {
  OneDriveProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';
import { OpenstackSwiftProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';
import { PcloudProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';
import { S3ProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import { SftpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { TokenProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/token-provider-form/token-provider-form.component';
import { WebdavProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';

export const cloudsyncProviderFormMap = new Map<CloudSyncProviderName, Type<BaseProviderFormComponent>>([
  [CloudSyncProviderName.MicrosoftAzure, AzureProviderFormComponent],
  [CloudSyncProviderName.BackblazeB2, BackblazeB2ProviderFormComponent],
  [CloudSyncProviderName.Ftp, FtpProviderFormComponent],
  [CloudSyncProviderName.GoogleCloudStorage, GoogleCloudProviderFormComponent],
  [CloudSyncProviderName.GoogleDrive, GoogleDriveProviderFormComponent],
  [CloudSyncProviderName.GooglePhotos, GooglePhotosProviderFormComponent],
  [CloudSyncProviderName.MicrosoftOneDrive, OneDriveProviderFormComponent],
  [CloudSyncProviderName.Http, HttpProviderFormComponent],
  [CloudSyncProviderName.Mega, MegaProviderFormComponent],
  [CloudSyncProviderName.OpenstackSwift, OpenstackSwiftProviderFormComponent],
  [CloudSyncProviderName.Pcloud, PcloudProviderFormComponent],
  [CloudSyncProviderName.AmazonS3, S3ProviderFormComponent],
  [CloudSyncProviderName.Sftp, SftpProviderFormComponent],
  [CloudSyncProviderName.Storj, StorjProviderFormComponent],
  [CloudSyncProviderName.Webdav, WebdavProviderFormComponent],
]);

export const tokenOnlyProviders = [
  CloudSyncProviderName.Box,
  CloudSyncProviderName.Dropbox,
  CloudSyncProviderName.Hubic,
  CloudSyncProviderName.Yandex,
];

export function getProviderFormClass(providerName: CloudSyncProviderName): Type<BaseProviderFormComponent> {
  if (tokenOnlyProviders.includes(providerName)) {
    return TokenProviderFormComponent;
  }

  return cloudsyncProviderFormMap.get(providerName);
}

// Will return "(1)" from "Google Photos (1)"
const incrementRegex = /\s\((\d+)\)$/;

// Will return "1" from "(1)"
const incrementInt = /\d+(?=\)$)/;

/**
 * Get an incremented name (e.g. Google Photos (2)) from a name (e.g. Google Photos),
 * based on an array of existing names.
 *
 * @param name The name to increment.
 * @param others The array of existing names.
 */
export function getName(name: string, others: string[]): string {
  const set = new Set(others);

  let result = name;

  while (set.has(result)) {
    result = incrementRegex.exec(result)?.[1]
      ? result.replace(incrementInt, (value) => (+value + 1).toString())
      : `${result} (2)`;
  }

  return result;
}
