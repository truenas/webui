import { Type } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AzureProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/azure-provider-form/azure-provider-form.component';
import { BackblazeB2ProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/backblaze-b2-provider-form/backblaze-b2-provider-form.component';
import { BaseProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { FtpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/ftp-provider-form/ftp-provider-form.component';
import { GoogleCloudProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-cloud-provider-form/google-cloud-provider-form.component';
import { GoogleDriveProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-drive-provider-form/google-drive-provider-form.component';
import { GooglePhotosProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/google-photos-provider-form/google-photos-provider-form.component';
import { HttpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/http-provider-form/http-provider-form.component';
import { MegaProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/mega-provider-form/mega-provider-form.component';
import { OneDriveProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/one-drive-provider-form/one-drive-provider-form.component';
import { OpenstackSwiftProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/openstack-swift-provider-form/openstack-swift-provider-form.component';
import { PcloudProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/pcloud-provider-form/pcloud-provider-form.component';
import { S3ProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/s3-provider-form/s3-provider-form.component';
import { SftpProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/sftp-provider-form/sftp-provider-form.component';
import { StorjProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/storj-provider-form/storj-provider-form.component';
import { WebdavProviderFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/webdav-provider-form/webdav-provider-form.component';

export enum CloudsyncProviderName {
  AmazonS3 = 'S3',
  BackblazeB2 = 'B2',
  Box = 'BOX',
  Dropbox = 'DROPBOX',
  Ftp = 'FTP',
  GoogleCloudStorage = 'GOOGLE_CLOUD_STORAGE',
  GoogleDrive = 'GOOGLE_DRIVE',
  GooglePhotos = 'GOOGLE_PHOTOS',
  Http = 'HTTP',
  Hubic = 'HUBIC',
  Mega = 'MEGA',
  MicrosoftAzure = 'AZUREBLOB',
  MicrosoftOnedrive = 'ONEDRIVE',
  OpenstackSwift = 'OPENSTACK_SWIFT',
  Pcloud = 'PCLOUD',
  Sftp = 'SFTP',
  Storj = 'STORJ_IX',
  Webdav = 'WEBDAV',
  Yandex = 'YANDEX',
}

export enum OneDriveType {
  Personal = 'PERSONAL',
  Business = 'BUSINESS',
  DocumentLibrary = 'DOCUMENT_LIBRARY',
}

export const cloudsyncProviderNameMap = new Map<CloudsyncProviderName, string>([
  [CloudsyncProviderName.AmazonS3, T('Amazon S3')],
  [CloudsyncProviderName.BackblazeB2, T('Backblaze B2')],
  [CloudsyncProviderName.Box, T('Box')],
  [CloudsyncProviderName.Dropbox, T('Dropbox')],
  [CloudsyncProviderName.Ftp, T('FTP')],
  [CloudsyncProviderName.GoogleCloudStorage, T('Google Cloud Storage')],
  [CloudsyncProviderName.GoogleDrive, T('Google Drive')],
  [CloudsyncProviderName.GooglePhotos, T('Google Photos')],
  [CloudsyncProviderName.Hubic, T('Hubic')],
  [CloudsyncProviderName.Http, T('HTTP')],
  [CloudsyncProviderName.Mega, T('Mega')],
  [CloudsyncProviderName.MicrosoftAzure, T('Microsoft Azure')],
  [CloudsyncProviderName.MicrosoftOnedrive, T('Microsoft OneDrive')],
  [CloudsyncProviderName.OpenstackSwift, T('OpenStack Swift')],
  [CloudsyncProviderName.Pcloud, T('pCloud')],
  [CloudsyncProviderName.Sftp, T('SFTP')],
  [CloudsyncProviderName.Storj, T('Storj')],
  [CloudsyncProviderName.Webdav, T('WebDAV')],
  [CloudsyncProviderName.Yandex, T('Yandex')],
]);

export const cloudsyncProviderFormMap = new Map<CloudsyncProviderName, Type<BaseProviderFormComponent>>([
  [CloudsyncProviderName.MicrosoftAzure, AzureProviderFormComponent],
  [CloudsyncProviderName.BackblazeB2, BackblazeB2ProviderFormComponent],
  [CloudsyncProviderName.Ftp, FtpProviderFormComponent],
  [CloudsyncProviderName.GoogleCloudStorage, GoogleCloudProviderFormComponent],
  [CloudsyncProviderName.GoogleDrive, GoogleDriveProviderFormComponent],
  [CloudsyncProviderName.GooglePhotos, GooglePhotosProviderFormComponent],
  [CloudsyncProviderName.Http, HttpProviderFormComponent],
  [CloudsyncProviderName.Mega, MegaProviderFormComponent],
  [CloudsyncProviderName.MicrosoftOnedrive, OneDriveProviderFormComponent],
  [CloudsyncProviderName.OpenstackSwift, OpenstackSwiftProviderFormComponent],
  [CloudsyncProviderName.Pcloud, PcloudProviderFormComponent],
  [CloudsyncProviderName.AmazonS3, S3ProviderFormComponent],
  [CloudsyncProviderName.Sftp, SftpProviderFormComponent],
  [CloudsyncProviderName.Storj, StorjProviderFormComponent],
  [CloudsyncProviderName.Webdav, WebdavProviderFormComponent],
]);


export const tokenOnlyProviders = [
  CloudsyncProviderName.Box,
  CloudsyncProviderName.Dropbox,
  CloudsyncProviderName.Hubic,
  CloudsyncProviderName.Yandex,
];
